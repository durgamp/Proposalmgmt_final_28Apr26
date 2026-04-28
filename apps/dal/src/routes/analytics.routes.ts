import { Router, Request, Response } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '@biopropose/database';
import { ProposalEntity, CostItemEntity, AuditLogEntity } from '@biopropose/database';
import { ProposalStatus } from '@biopropose/shared-types';

const router = Router();

const DB_TYPE = (process.env.DB_TYPE ?? 'sqlite') as string;

function yearExpr(col: string): string {
  if (DB_TYPE === 'mysql' || DB_TYPE === 'postgres' || DB_TYPE === 'mssql') return `YEAR(${col})`;
  return `STRFTIME('%Y', ${col})`;
}

function monthExpr(col: string): string {
  if (DB_TYPE === 'mysql' || DB_TYPE === 'postgres' || DB_TYPE === 'mssql') return `MONTH(${col})`;
  return `CAST(STRFTIME('%m', ${col}) AS INTEGER)`;
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
router.get('/kpis', async (req: Request, res: Response) => {
  try {
    const { year, month, templateType, proposalManager } = req.query as Record<string, string>;
    const qb = AppDataSource.getRepository(ProposalEntity).createQueryBuilder('p');
    if (year)            qb.andWhere(`${yearExpr('p.created_at')} = :year`, { year });
    if (month)           qb.andWhere(`${monthExpr('p.created_at')} = :month`, { month });
    if (templateType)    qb.andWhere('p.templateType = :templateType', { templateType });
    if (proposalManager) qb.andWhere('p.proposalManager = :pm', { pm: proposalManager });

    const proposals = await qb.getMany();
    const total     = proposals.length;
    res.json({
      totalProposals:         total,
      draftCount:             proposals.filter((p) => p.status === ProposalStatus.DRAFT).length,
      reviewCount:            proposals.filter((p) => p.status === ProposalStatus.REVIEW).length,
      sentCount:              proposals.filter((p) => p.status === ProposalStatus.SENT).length,
      closedCount:            proposals.filter((p) => p.status === ProposalStatus.CLOSED).length,
      avgCompletionPercentage: total > 0
        ? Math.round(proposals.reduce((s, p) => s + (p.completionPercentage ?? 0), 0) / total)
        : 0,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Stage distribution ────────────────────────────────────────────────────────
router.get('/stages', async (_req: Request, res: Response) => {
  try {
    const stageLabels: Record<number, string> = {
      1: 'Draft Creation', 2: 'Technical Review',
      3: 'PM Review', 4: 'Management Review', 5: 'Client Submission',
    };
    const proposals   = await AppDataSource.getRepository(ProposalEntity).find({ select: ['currentStage'] });
    const countByStage: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const p of proposals) {
      const s = Number(p.currentStage);
      if (countByStage[s] !== undefined) countByStage[s]++;
    }
    res.json(Object.entries(countByStage).map(([stage, count]) => ({
      stage: stageLabels[Number(stage)],
      stageNumber: Number(stage),
      count,
    })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Template distribution ─────────────────────────────────────────────────────
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const result = await AppDataSource.getRepository(ProposalEntity)
      .createQueryBuilder('p')
      .select('p.templateType', 'templateType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.templateType')
      .getRawMany<{ templateType: string; count: string }>();
    res.json(result.map((r) => ({ templateType: r.templateType ?? 'General', count: Number(r.count) })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Monthly trends ────────────────────────────────────────────────────────────
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const targetYear = parseInt((req.query.year as string) ?? String(new Date().getFullYear()), 10);
    const proposals  = await AppDataSource.getRepository(ProposalEntity)
      .createQueryBuilder('p')
      .where(`${yearExpr('p.created_at')} = :year`, { year: targetYear })
      .select(['p.createdAt', 'p.status'])
      .getMany();

    const months: Record<string, { created: number; sent: number }> = {};
    for (let m = 1; m <= 12; m++) months[String(m).padStart(2, '0')] = { created: 0, sent: 0 };
    for (const p of proposals) {
      const month = new Date(p.createdAt).toISOString().slice(5, 7);
      if (months[month]) {
        months[month].created++;
        if (p.status === ProposalStatus.SENT) months[month].sent++;
      }
    }
    res.json(Object.entries(months).map(([month, data]) => ({
      month: `${targetYear}-${month}`, ...data,
    })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Cost summary ──────────────────────────────────────────────────────────────
router.get('/costs', async (_req: Request, res: Response) => {
  try {
    const items          = await AppDataSource.getRepository(CostItemEntity).find();
    const totalBudget    = items.reduce((s, i) => s + i.totalCost, 0);
    const uniqueProposals = new Set(items.map((i) => i.proposalId)).size;
    const categoryMap: Record<string, number> = {};
    for (const item of items) {
      categoryMap[item.category] = (categoryMap[item.category] ?? 0) + item.totalCost;
    }
    res.json({
      totalBudget,
      avgProposalValue: uniqueProposals > 0 ? Math.round(totalBudget / uniqueProposals) : 0,
      byCategory: Object.entries(categoryMap).map(([category, total]) => ({ category, total })),
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Recent activity feed ──────────────────────────────────────────────────────
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10)));
    const logs  = await AppDataSource.getRepository(AuditLogEntity).find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
    if (!logs.length) return res.json([]);

    const proposalIds = [...new Set(logs.map((l) => l.proposalId).filter(Boolean))] as string[];
    const proposals   = proposalIds.length
      ? await AppDataSource.getRepository(ProposalEntity).find({ where: { id: In(proposalIds) } })
      : [];
    const codeMap = new Map(proposals.map((p) => [p.id, p.proposalCode]));

    res.json(logs.map((l) => ({
      id:           l.id,
      proposalId:   l.proposalId ?? '',
      proposalCode: codeMap.get(l.proposalId ?? '') ?? 'N/A',
      action:       l.action,
      userEmail:    l.userEmail,
      details:      l.details ?? '',
      createdAt:    l.timestamp,
    })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
