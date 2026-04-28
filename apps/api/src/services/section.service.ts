import { dal } from '../clients/dal.client';
import { AppError } from '../middleware/errorHandler';
import { auditService } from './audit.service';
import { AuditAction } from '@biopropose/shared-types';
import { detectChanges } from '../utils/proposalDiff';
import { syncProposalToQdrant } from './vectorSync.service';
import { logger } from '../config/logger';
import type { UpdateSectionDto } from '../validators/section.validators';
import type { ProposalSectionEntity } from '@biopropose/database';

export class SectionService {
  async getByProposal(proposalId: string): Promise<ProposalSectionEntity[]> {
    return dal.getSections(proposalId) as Promise<ProposalSectionEntity[]>;
  }

  async getOne(proposalId: string, sectionKey: string): Promise<ProposalSectionEntity> {
    return dal.getSection(proposalId, sectionKey) as Promise<ProposalSectionEntity>;
  }

  async update(
    proposalId: string,
    sectionKey: string,
    dto: UpdateSectionDto,
  ): Promise<ProposalSectionEntity> {
    const section = await this.getOne(proposalId, sectionKey);

    if (section.isLocked && !dto.isLocked) {
      // Unlocking is allowed to pass through
    } else if (section.isLocked) {
      throw new AppError(403, 'This section is locked and cannot be edited', 'SECTION_LOCKED');
    }

    const oldData = { ...section } as Record<string, unknown>;
    let action = AuditAction.UPDATED;

    const updates: Partial<ProposalSectionEntity> = { updatedBy: dto.updatedBy };

    if (dto.content !== undefined) updates.content = dto.content as ProposalSectionEntity['content'];

    if (dto.isComplete !== undefined) {
      updates.isComplete = dto.isComplete;
      if (dto.isComplete) {
        updates.completedBy = dto.updatedBy;
        updates.completedAt = new Date().toISOString();
        action = AuditAction.SECTION_COMPLETED;
      } else {
        (updates as Record<string, unknown>).completedBy = null;
        (updates as Record<string, unknown>).completedAt = null;
      }
    }

    if (dto.isLocked !== undefined) {
      updates.isLocked = dto.isLocked;
      if (dto.isLocked) {
        updates.lockedBy = dto.updatedBy;
        action = AuditAction.SECTION_LOCKED;
      } else {
        (updates as Record<string, unknown>).lockedBy = null;
        action = AuditAction.SECTION_UNLOCKED;
      }
    }

    const updated = await dal.updateSection(proposalId, sectionKey, updates) as ProposalSectionEntity;

    const changes = detectChanges(oldData, updated as unknown as Record<string, unknown>);
    await auditService.log({
      proposalId,
      userEmail: dto.updatedBy,
      userName:  dto.updatedBy,
      action,
      details:   `Section "${section.title}": ${changes.join('; ')}`,
      changes:   { sectionKey, changes },
    });

    if (dto.content !== undefined) {
      syncProposalToQdrant(proposalId).catch((err) => logger.warn({ err }, '[VectorSync] Post-section-save sync failed'));
    }

    return updated;
  }
}

export const sectionService = new SectionService();
