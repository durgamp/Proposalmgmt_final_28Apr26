import { Router, Request, Response } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '@biopropose/database';
import { ProposalSectionEntity } from '@biopropose/database';

const router = Router();

// ── List sections for a proposal ─────────────────────────────────────────────
router.get('/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const sections = await AppDataSource.getRepository(ProposalSectionEntity).find({
      where: { proposalId: req.params.proposalId },
      order: { sortOrder: 'ASC' },
    });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Get single section ────────────────────────────────────────────────────────
router.get('/by-proposal/:proposalId/key/:sectionKey', async (req: Request, res: Response) => {
  try {
    const section = await AppDataSource.getRepository(ProposalSectionEntity).findOne({
      where: { proposalId: req.params.proposalId, sectionKey: req.params.sectionKey },
    });
    if (!section) {
      return res.status(404).json({ message: `Section '${req.params.sectionKey}' not found`, code: 'NOT_FOUND' });
    }
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Batch create sections ─────────────────────────────────────────────────────
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const repo     = AppDataSource.getRepository(ProposalSectionEntity);
    const entities = (req.body as Partial<ProposalSectionEntity>[]).map((s) => repo.create(s));
    const saved    = await repo.save(entities);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Update single section ─────────────────────────────────────────────────────
router.patch('/by-proposal/:proposalId/key/:sectionKey', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ProposalSectionEntity);
    const section = await repo.findOne({
      where: { proposalId: req.params.proposalId, sectionKey: req.params.sectionKey },
    });
    if (!section) {
      return res.status(404).json({ message: `Section '${req.params.sectionKey}' not found`, code: 'NOT_FOUND' });
    }
    const updates = JSON.parse(JSON.stringify(req.body)) as Partial<ProposalSectionEntity>;
    Object.assign(section, updates);
    const saved = await repo.save(section);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Batch update sections (used for bulk-unlock on reopen) ───────────────────
router.put('/batch', async (req: Request, res: Response) => {
  try {
    const repo    = AppDataSource.getRepository(ProposalSectionEntity);
    const updates = req.body as (Partial<ProposalSectionEntity> & { id: string })[];
    // Load each entity first so that setters (content→contentJson) are called
    const ids      = updates.map((u) => u.id).filter(Boolean);
    const existing = await repo.find({ where: { id: In(ids) } });
    const entityMap = new Map(existing.map((e) => [e.id, e]));
    const merged = updates
      .map((patch) => {
        const entity = entityMap.get(patch.id);
        if (!entity) return null;
        Object.assign(entity, patch);
        return entity;
      })
      .filter((e): e is ProposalSectionEntity => e !== null);
    const saved = await repo.save(merged);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
