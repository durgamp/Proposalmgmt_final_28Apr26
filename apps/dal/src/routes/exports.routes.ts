import { Router, Request, Response } from 'express';
import { AppDataSource } from '@biopropose/database';
import { ExportedFileEntity } from '@biopropose/database';

const router = Router();

// ── List exports for a proposal ───────────────────────────────────────────────
router.get('/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const exports = await AppDataSource.getRepository(ExportedFileEntity).find({
      where: { proposalId: req.params.proposalId },
      order: { exportedAt: 'DESC' },
    });
    res.json(exports);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Record a new export ───────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const repo   = AppDataSource.getRepository(ExportedFileEntity);
    const entity = repo.create(req.body as Partial<ExportedFileEntity>);
    const saved  = await repo.save(entity);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
