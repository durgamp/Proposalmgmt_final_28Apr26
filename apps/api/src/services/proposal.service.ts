import { dal } from '../clients/dal.client';
import {
  ProposalStatus, ProposalStage, ProposalMethod,
  SectionKey, AuditAction,
} from '@biopropose/shared-types';
import { v4 as uuid } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { auditService } from './audit.service';
import {
  validateStageAdvancement, computeCompletionPercentage, getStageName,
} from '../utils/stageAdvancement';
import { detectChanges } from '../utils/proposalDiff';
import { syncProposalToQdrant } from './vectorSync.service';
import type {
  CreateProposalDto, UpdateProposalDto, AdvanceStageDto,
  AmendmentDto, ReopenDto, ListProposalsQuery,
} from '../validators/proposal.validators';
import type { ProposalEntity, ProposalSectionEntity } from '@biopropose/database';

const DEFAULT_SECTIONS = [
  { sectionKey: SectionKey.CEO_LETTER,        title: 'CEO Letter',         sortOrder: 0 },
  { sectionKey: SectionKey.EXECUTIVE_SUMMARY, title: 'Executive Summary',  sortOrder: 1 },
  { sectionKey: SectionKey.SCOPE_OF_WORK,     title: 'Scope of Work',      sortOrder: 2 },
  { sectionKey: SectionKey.FLOWCHART,         title: 'Flow Chart',         sortOrder: 3 },
  { sectionKey: SectionKey.PROJECT_DETAILS,   title: 'Project Details',    sortOrder: 4 },
  { sectionKey: SectionKey.TERMS_CONDITIONS,  title: 'Terms & Conditions', sortOrder: 5 },
];

export class ProposalService {
  // ── List ──────────────────────────────────────────────────────────────────

  async list(query: ListProposalsQuery): Promise<{ items: ProposalEntity[]; total: number }> {
    const result = await dal.listProposals({
      search:    query.search,
      status:    query.status,
      stage:     query.stage,
      sortBy:    query.sortBy,
      sortOrder: query.sortOrder,
      page:      query.page,
      limit:     query.limit,
    });
    return result as { items: ProposalEntity[]; total: number };
  }

  // ── Get by ID ─────────────────────────────────────────────────────────────

  async getById(id: string): Promise<ProposalEntity> {
    return dal.getProposalById(id) as Promise<ProposalEntity>;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateProposalDto): Promise<ProposalEntity> {
    // Enforce unique proposal code
    const existing = await dal.findProposalByCode(dto.proposalCode);
    if (existing) {
      throw new AppError(409, `Proposal code '${dto.proposalCode}' already exists`, 'DUPLICATE_CODE');
    }

    // Validate source proposal exists when cloning
    if (dto.method === ProposalMethod.CLONE && dto.sourceProposalId) {
      await dal.getProposalById(dto.sourceProposalId).catch(() => {
        throw new AppError(404, `Source proposal '${dto.sourceProposalId}' not found`, 'NOT_FOUND');
      });
    }

    const proposal = await dal.createProposal({
      id:                       uuid(),
      name:                     dto.name,
      client:                   dto.client,
      bdManager:                dto.bdManager,
      proposalManager:          dto.proposalManager,
      proposalCode:             dto.proposalCode,
      status:                   ProposalStatus.DRAFT,
      method:                   dto.method,
      businessUnit:             dto.businessUnit,
      templateType:             dto.templateType,
      description:              dto.description,
      sfdcOpportunityCode:      dto.sfdcOpportunityCode,
      currentStage:             ProposalStage.DRAFT_CREATION,
      completionPercentage:     0,
      pmReviewComplete:         false,
      managementReviewComplete: false,
      isAmendment:              false,
      createdBy:                dto.createdBy,
      updatedBy:                dto.createdBy,
      assignedStakeholders:     dto.assignedStakeholders,
    }) as ProposalEntity;

    // Build section content map from template or source clone
    const sectionContent: Record<string, object> = {};

    if (dto.method === ProposalMethod.TEMPLATE && dto.templateId) {
      const template = await dal.getTemplateById(dto.templateId);
      if (template) {
        (template.sections as Array<{ sectionKey: string; defaultContent: object }>).forEach((ts) => {
          sectionContent[ts.sectionKey] = ts.defaultContent;
        });
      }
    }

    if ((dto.method === ProposalMethod.CLONE || dto.method === ProposalMethod.AMENDMENT) && dto.sourceProposalId) {
      const sourceSections = await dal.getSections(dto.sourceProposalId);
      sourceSections.forEach((ss) => {
        sectionContent[ss.sectionKey] = ss.content as object;
      });
    }

    // Build sections (include amendment-specific section when needed)
    const sectionsToCreate = [...DEFAULT_SECTIONS];
    if (dto.method === ProposalMethod.AMENDMENT) {
      sectionsToCreate.push({ sectionKey: SectionKey.AMENDMENT_DETAILS, title: 'Amendment Details', sortOrder: 5 });
    }

    await dal.createSections(sectionsToCreate.map((s) => ({
      id:         uuid(),
      proposalId: proposal.id,
      sectionKey: s.sectionKey,
      title:      s.title,
      sortOrder:  s.sortOrder,
      isComplete: false,
      isLocked:   false,
      createdBy:  dto.createdBy,
      updatedBy:  dto.createdBy,
      content:    sectionContent[s.sectionKey] ?? {},
    })));

    auditService.log({
      proposalId: proposal.id,
      userEmail:  dto.createdBy,
      userName:   dto.createdBy,
      action:     AuditAction.CREATED,
      details:    `Proposal "${proposal.name}" created via ${dto.method} method`,
      snapshot:   { id: proposal.id, name: proposal.name, client: proposal.client },
    }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));

    syncProposalToQdrant(proposal.id).catch((err) => logger.warn({ err }, '[VectorSync] Post-create sync failed'));

    return this.getById(proposal.id);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProposalDto): Promise<ProposalEntity> {
    const proposal = await this.getById(id);
    const oldData  = { ...proposal } as Record<string, unknown>;

    const updates: Partial<ProposalEntity> = { updatedBy: dto.updatedBy };
    if (dto.name                 !== undefined) updates.name                 = dto.name;
    if (dto.client               !== undefined) updates.client               = dto.client;
    if (dto.bdManager            !== undefined) updates.bdManager            = dto.bdManager;
    if (dto.proposalManager      !== undefined) updates.proposalManager      = dto.proposalManager;
    if (dto.description          !== undefined) updates.description          = dto.description;
    if (dto.sfdcOpportunityCode  !== undefined) updates.sfdcOpportunityCode  = dto.sfdcOpportunityCode;
    if (dto.assignedStakeholders !== undefined) updates.assignedStakeholders = dto.assignedStakeholders;

    const updated = await dal.updateProposal(id, updates) as ProposalEntity;

    const changes = detectChanges(oldData, updated as unknown as Record<string, unknown>);
    auditService.log({
      proposalId: id,
      userEmail:  dto.updatedBy,
      userName:   dto.updatedBy,
      action:     AuditAction.UPDATED,
      details:    `Proposal updated: ${changes.join('; ')}`,
      changes:    { changes },
    }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));

    return updated;
  }

  // ── Advance Stage ─────────────────────────────────────────────────────────

  async advanceStage(id: string, dto: AdvanceStageDto): Promise<ProposalEntity> {
    const proposal = await this.getById(id);
    const sections = await dal.getSections(id) as ProposalSectionEntity[];

    if (dto.reviewType === 'pm') {
      await dal.updateProposal(id, { pmReviewComplete: true, updatedBy: dto.updatedBy });
      auditService.log({
        proposalId: id, userEmail: dto.updatedBy, userName: dto.updatedBy,
        action: AuditAction.PM_REVIEW_COMPLETE, details: 'PM Review marked as complete',
      }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));
      const refreshed = await this.getById(id);
      if (refreshed.managementReviewComplete) return this.advanceToStage5(refreshed, sections, dto.updatedBy);
      return refreshed;
    }

    if (dto.reviewType === 'management') {
      await dal.updateProposal(id, { managementReviewComplete: true, updatedBy: dto.updatedBy });
      auditService.log({
        proposalId: id, userEmail: dto.updatedBy, userName: dto.updatedBy,
        action: AuditAction.MANAGEMENT_REVIEW_COMPLETE, details: 'Management Review marked as complete',
      }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));
      const refreshed = await this.getById(id);
      if (refreshed.pmReviewComplete) return this.advanceToStage5(refreshed, sections, dto.updatedBy);
      return refreshed;
    }

    const validation = validateStageAdvancement({
      proposal, sections, targetStage: dto.targetStage as ProposalStage,
    });
    if (!validation.allowed) {
      throw new AppError(400, validation.reason ?? 'Stage advancement not allowed', 'STAGE_ERROR');
    }

    const prevStage            = proposal.currentStage;
    const newStatus            = dto.targetStage === ProposalStage.CLIENT_SUBMISSION
      ? ProposalStatus.SENT : ProposalStatus.REVIEW;
    const completionPercentage = computeCompletionPercentage(
      sections, dto.targetStage as ProposalStage, proposal.pmReviewComplete, proposal.managementReviewComplete,
    );

    await dal.updateProposal(id, {
      currentStage: dto.targetStage,
      status:       newStatus,
      completionPercentage,
      updatedBy:    dto.updatedBy,
    });

    auditService.log({
      proposalId: id, userEmail: dto.updatedBy, userName: dto.updatedBy,
      action: AuditAction.STAGE_ADVANCED,
      details: `Stage advanced: ${getStageName(prevStage as ProposalStage)} → ${getStageName(dto.targetStage as ProposalStage)}`,
    }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));

    return this.getById(id);
  }

  private async advanceToStage5(
    proposal: ProposalEntity,
    sections: ProposalSectionEntity[],
    updatedBy: string,
  ): Promise<ProposalEntity> {
    const completionPercentage = computeCompletionPercentage(
      sections, ProposalStage.CLIENT_SUBMISSION, true, true,
    );
    await dal.updateProposal(proposal.id, {
      currentStage: ProposalStage.CLIENT_SUBMISSION,
      status:       ProposalStatus.SENT,
      completionPercentage,
      updatedBy,
    });
    auditService.log({
      proposalId: proposal.id, userEmail: updatedBy, userName: updatedBy,
      action: AuditAction.STAGE_ADVANCED,
      details: 'Both PM and Management reviews complete — proposal advanced to Client Submission',
    }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));
    return this.getById(proposal.id);
  }

  // ── Create Amendment ──────────────────────────────────────────────────────

  async createAmendment(sourceId: string, dto: AmendmentDto): Promise<ProposalEntity> {
    const source = await this.getById(sourceId);

    if (source.currentStage !== ProposalStage.CLIENT_SUBMISSION) {
      throw new AppError(
        400,
        'Amendments can only be created from Stage 5 (Client Submission) proposals',
        'INVALID_STAGE',
      );
    }

    // Atomically lock source row and get the next revision number from the DAL
    const { revisionNumber } = await dal.reserveRevision(sourceId);

    const createDto: CreateProposalDto = {
      name:                 dto.name,
      client:               dto.client,
      bdManager:            dto.bdManager,
      proposalManager:      dto.proposalManager ?? source.proposalManager,
      proposalCode:         dto.proposalCode,
      method:               ProposalMethod.AMENDMENT,
      sourceProposalId:     sourceId,
      businessUnit:         source.businessUnit,
      templateType:         source.templateType,
      description:          dto.description ?? source.description,
      sfdcOpportunityCode:  dto.sfdcOpportunityCode ?? source.sfdcOpportunityCode,
      assignedStakeholders: dto.assignedStakeholders,
      createdBy:            dto.createdBy,
    };

    const newAmendment = await this.create(createDto);

    // Set amendment tracking fields
    await dal.updateProposal(newAmendment.id, {
      isAmendment:        true,
      parentProposalId:   sourceId,
      parentProposalCode: source.proposalCode,
      revisionNumber,
      amendmentDate:      new Date().toISOString().split('T')[0],
    });

    auditService.log({
      proposalId: sourceId, userEmail: dto.createdBy, userName: dto.createdBy,
      action: AuditAction.AMENDED, details: `Amendment created: ${newAmendment.proposalCode}`,
    }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));
    auditService.log({
      proposalId: newAmendment.id, userEmail: dto.createdBy, userName: dto.createdBy,
      action: AuditAction.CREATED, details: `Amendment of ${source.proposalCode}`,
    }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));

    return this.getById(newAmendment.id);
  }

  // ── Reopen ────────────────────────────────────────────────────────────────

  async reopen(sourceId: string, dto: ReopenDto): Promise<ProposalEntity> {
    const source = await this.getById(sourceId);

    if (dto.mode === 'revise') {
      if (source.currentStage !== ProposalStage.CLIENT_SUBMISSION) {
        throw new AppError(400, 'Revise is only allowed for Stage 5 (Client Submission) proposals', 'INVALID_STAGE');
      }

      const sections            = await dal.getSections(sourceId) as ProposalSectionEntity[];
      const completionPercentage = computeCompletionPercentage(
        sections, ProposalStage.MANAGEMENT_REVIEW, false, false,
      );

      if (sections.length > 0) {
        await dal.batchUpdateSections(
          sections.map((s) => ({ ...s, isLocked: false, updatedBy: dto.updatedBy })),
        );
      }

      await dal.updateProposal(sourceId, {
        currentStage:             ProposalStage.MANAGEMENT_REVIEW,
        status:                   ProposalStatus.REVIEW,
        pmReviewComplete:         false,
        managementReviewComplete: false,
        completionPercentage,
        updatedBy:                dto.updatedBy,
      });

      auditService.log({
        proposalId: sourceId, userEmail: dto.updatedBy, userName: dto.updatedBy,
        action: AuditAction.REVISED,
        details: 'Proposal revised — moved back to Management Review (Stage 4), all sections unlocked',
      }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));

      return this.getById(sourceId);
    }

    const createDto: CreateProposalDto = {
      name:                 dto.name ?? source.name,
      client:               dto.client ?? source.client,
      bdManager:            dto.bdManager ?? source.bdManager,
      proposalManager:      source.proposalManager,
      proposalCode:         dto.proposalCode ?? source.proposalCode,
      method:               dto.mode === 'clone' ? ProposalMethod.CLONE : ProposalMethod.SCRATCH,
      sourceProposalId:     dto.mode === 'clone' ? sourceId : undefined,
      businessUnit:         source.businessUnit,
      templateType:         source.templateType,
      description:          dto.description ?? source.description,
      sfdcOpportunityCode:  dto.sfdcOpportunityCode ?? source.sfdcOpportunityCode,
      assignedStakeholders: dto.assignedStakeholders,
      createdBy:            dto.updatedBy,
    };

    const newProposal = await this.create(createDto);

    auditService.log({
      proposalId: newProposal.id, userEmail: dto.updatedBy, userName: dto.updatedBy,
      action: AuditAction.REOPENED,
      details: `${dto.mode === 'clone' ? 'Cloned from' : 'New proposal based on'} ${source.proposalCode}`,
    }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));

    return this.getById(newProposal.id);
  }

  // ── Soft Delete ───────────────────────────────────────────────────────────

  async softDelete(id: string, deletedBy: string): Promise<void> {
    const proposal = await this.getById(id);
    await dal.updateProposal(id, { status: ProposalStatus.CLOSED, updatedBy: deletedBy });

    auditService.log({
      proposalId: id,
      userEmail:  deletedBy,
      userName:   deletedBy,
      action:     AuditAction.DELETED,
      details:    `Proposal "${proposal.name}" closed/deleted`,
      snapshot:   { id: proposal.id, name: proposal.name },
    }).catch((err) => logger.warn({ err }, '[Audit] Failed to write audit log'));
  }
}

export const proposalService = new ProposalService();
