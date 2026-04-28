import { Router, Request, Response } from 'express';
import { AppDataSource } from '@biopropose/database';
import { AuditLogEntity } from '@biopropose/database';

const router = Router();

// ── All audit logs (paginated) ───────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const page  = Math.max(1, parseInt((req.query.page  as string) ?? '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) ?? '50', 10)));
    const [items, total] = await AppDataSource.getRepository(AuditLogEntity).findAndCount({
      order: { timestamp: 'DESC' },
      skip:  (page - 1) * limit,
      take:  limit,
    });
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Audit logs for a proposal (paginated) ────────────────────────────────────
router.get('/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const page  = Math.max(1, parseInt((req.query.page  as string) ?? '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) ?? '50', 10)));
    const [items, total] = await AppDataSource.getRepository(AuditLogEntity).findAndCount({
      where: { proposalId: req.params.proposalId },
      order: { timestamp: 'DESC' },
      skip:  (page - 1) * limit,
      take:  limit,
    });
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Create audit log entry ────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const repo   = AppDataSource.getRepository(AuditLogEntity);
    const entry  = repo.create(req.body as Partial<AuditLogEntity>);
    const saved  = await repo.save(entry);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
