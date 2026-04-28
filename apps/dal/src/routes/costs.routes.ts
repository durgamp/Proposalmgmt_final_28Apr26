import { Router, Request, Response } from 'express';
import { AppDataSource } from '@biopropose/database';
import { CostItemEntity, ProjectStageEntity, ProjectActivityEntity } from '@biopropose/database';

const router = Router();

// ── Cost items ────────────────────────────────────────────────────────────────

router.get('/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const items = await AppDataSource.getRepository(CostItemEntity).find({
      where: { proposalId: req.params.proposalId },
      order: { sortOrder: 'ASC' },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// Atomic delete-all + batch insert (replaces entire cost set)
router.put('/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const items = req.body as Partial<CostItemEntity>[];

    const saved = await AppDataSource.transaction(async (manager) => {
      await manager.delete(CostItemEntity, { proposalId });
      if (!items.length) return [];
      const entities = items.map((item) => manager.create(CostItemEntity, { ...item, proposalId }));
      return manager.save(CostItemEntity, entities);
    });

    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Project stages ────────────────────────────────────────────────────────────

router.get('/stages/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const stages = await AppDataSource.getRepository(ProjectStageEntity).find({
      where: { proposalId: req.params.proposalId },
      order: { sortOrder: 'ASC' },
    });
    res.json(stages);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Project activities ────────────────────────────────────────────────────────

router.get('/activities/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const activities = await AppDataSource.getRepository(ProjectActivityEntity).find({
      where: { proposalId: req.params.proposalId },
      order: { sortOrder: 'ASC' },
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Timeline: atomic replace stages + activities ──────────────────────────────
router.put('/timeline/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { stages, activities } = req.body as {
      stages: Partial<ProjectStageEntity>[];
      activities: Partial<ProjectActivityEntity>[];
    };

    const result = await AppDataSource.transaction(async (manager) => {
      // Delete activities first (FK dependency on stages)
      await manager.delete(ProjectActivityEntity, { proposalId });
      await manager.delete(ProjectStageEntity, { proposalId });

      const savedStages = await manager.save(
        ProjectStageEntity,
        stages.map((s) => manager.create(ProjectStageEntity, { ...s, proposalId })),
      );
      const savedActivities = await manager.save(
        ProjectActivityEntity,
        activities.map((a) => manager.create(ProjectActivityEntity, { ...a, proposalId })),
      );
      return { stages: savedStages, activities: savedActivities };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
