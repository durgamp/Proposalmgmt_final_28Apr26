import { dal } from '../clients/dal.client';
import { auditService } from './audit.service';
import { AuditAction } from '@biopropose/shared-types';
import { v4 as uuid } from 'uuid';
import type { CostItemEntity, ProjectStageEntity, ProjectActivityEntity } from '@biopropose/database';
import type { BulkSaveCostsDto, BulkSaveStagesDto } from '../validators/cost.validators';

export class CostService {
  // ── Cost Items ────────────────────────────────────────────────────────────

  async getCosts(proposalId: string): Promise<CostItemEntity[]> {
    return dal.getCosts(proposalId) as Promise<CostItemEntity[]>;
  }

  async saveCosts(proposalId: string, dto: BulkSaveCostsDto): Promise<CostItemEntity[]> {
    const items = dto.items.map((item, idx) => ({
      id:              item.id ?? uuid(),
      proposalId,
      category:        item.category,
      description:     item.description,
      quantity:        item.quantity,
      serviceRate:     item.serviceRate,
      materialRate:    item.materialRate,
      outsourcingRate: item.outsourcingRate,
      totalCost:       item.totalCost,
      stage:           item.stage,
      isBinding:       item.isBinding,
      isFixedRate:     item.isFixedRate,
      sortOrder:       item.sortOrder ?? idx,
      createdBy:       dto.updatedBy,
      updatedBy:       dto.updatedBy,
    }));

    const saved = await dal.saveCosts(proposalId, items) as CostItemEntity[];

    const grandTotal = saved.reduce((s, i) => s + i.totalCost, 0);
    await auditService.log({
      proposalId,
      userEmail: dto.updatedBy,
      userName:  dto.updatedBy,
      action:    AuditAction.COST_UPDATED,
      details:   `Cost breakdown updated — ${saved.length} items, total: $${grandTotal.toLocaleString()}`,
    });

    return saved;
  }

  computeSummary(items: CostItemEntity[]) {
    const stageMap = new Map<string, { service: number; material: number; outsourcing: number }>();
    for (const item of items) {
      const key   = item.stage ?? 'General';
      const entry = stageMap.get(key) ?? { service: 0, material: 0, outsourcing: 0 };
      if (item.category === 'Service')     entry.service     += item.totalCost;
      if (item.category === 'Material')    entry.material    += item.totalCost;
      if (item.category === 'Outsourcing') entry.outsourcing += item.totalCost;
      stageMap.set(key, entry);
    }

    const byStage = Array.from(stageMap.entries()).map(([stage, costs]) => ({
      stage,
      serviceCost:     costs.service,
      materialCost:    costs.material,
      outsourcingCost: costs.outsourcing,
      totalCost:       costs.service + costs.material + costs.outsourcing,
    }));

    return {
      byStage,
      grandTotal:       items.reduce((s, i) => s + i.totalCost, 0),
      serviceTotal:     items.filter((i) => i.category === 'Service').reduce((s, i) => s + i.totalCost, 0),
      materialTotal:    items.filter((i) => i.category === 'Material').reduce((s, i) => s + i.totalCost, 0),
      outsourcingTotal: items.filter((i) => i.category === 'Outsourcing').reduce((s, i) => s + i.totalCost, 0),
    };
  }

  // ── Project Stages & Activities ───────────────────────────────────────────

  async getStages(proposalId: string): Promise<ProjectStageEntity[]> {
    return dal.getStages(proposalId) as Promise<ProjectStageEntity[]>;
  }

  async getActivities(proposalId: string): Promise<ProjectActivityEntity[]> {
    return dal.getActivities(proposalId) as Promise<ProjectActivityEntity[]>;
  }

  async saveTimeline(proposalId: string, dto: BulkSaveStagesDto): Promise<{
    stages: ProjectStageEntity[];
    activities: ProjectActivityEntity[];
  }> {
    const stages = dto.stages.map((s, idx) => ({
      id:           s.id ?? uuid(),
      proposalId,
      name:         s.name,
      startDate:    s.startDate,
      endDate:      s.endDate,
      durationDays: s.durationDays,
      sortOrder:    s.sortOrder ?? idx,
      createdBy:    dto.updatedBy,
      updatedBy:    dto.updatedBy,
    }));

    const activities = dto.activities.map((a, idx) => ({
      id:           a.id ?? uuid(),
      proposalId,
      stageId:      a.stageId,
      name:         a.name,
      startDate:    a.startDate,
      endDate:      a.endDate,
      durationDays: a.durationDays,
      progress:     a.progress,
      assignee:     a.assignee,
      phase:        a.phase,
      color:        a.color,
      sortOrder:    a.sortOrder ?? idx,
      dependencies: a.dependencies,
      createdBy:    dto.updatedBy,
      updatedBy:    dto.updatedBy,
    }));

    const result = await dal.saveTimeline(proposalId, { stages, activities });

    await auditService.log({
      proposalId,
      userEmail: dto.updatedBy,
      userName:  dto.updatedBy,
      action:    AuditAction.TIMELINE_UPDATED,
      details:   `Timeline updated — ${result.stages.length} stages, ${result.activities.length} activities`,
    });

    return result as { stages: ProjectStageEntity[]; activities: ProjectActivityEntity[] };
  }
}

export const costService = new CostService();
