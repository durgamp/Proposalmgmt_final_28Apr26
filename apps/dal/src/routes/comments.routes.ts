import { Router, Request, Response } from 'express';
import { AppDataSource } from '@biopropose/database';
import { CommentEntity } from '@biopropose/database';

const router = Router();

// ── List comments for a proposal (optional ?sectionKey filter) ───────────────
router.get('/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const where: Record<string, string> = { proposalId: req.params.proposalId };
    if (req.query.sectionKey) where['sectionKey'] = req.query.sectionKey as string;
    const comments = await AppDataSource.getRepository(CommentEntity).find({
      where,
      order: { createdAt: 'ASC' },
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Get single comment ───────────────────────────────────────────────────────
router.get('/by-proposal/:proposalId/:commentId', async (req: Request, res: Response) => {
  try {
    const comment = await AppDataSource.getRepository(CommentEntity).findOne({
      where: { id: req.params.commentId, proposalId: req.params.proposalId },
    });
    if (!comment) return res.status(404).json({ message: 'Comment not found', code: 'NOT_FOUND' });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Create comment ───────────────────────────────────────────────────────────
router.post('/by-proposal/:proposalId', async (req: Request, res: Response) => {
  try {
    const repo    = AppDataSource.getRepository(CommentEntity);
    const entity  = repo.create({ ...req.body, proposalId: req.params.proposalId } as Partial<CommentEntity>);
    const saved   = await repo.save(entity);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Update comment ───────────────────────────────────────────────────────────
router.patch('/by-proposal/:proposalId/:commentId', async (req: Request, res: Response) => {
  try {
    const repo    = AppDataSource.getRepository(CommentEntity);
    const comment = await repo.findOne({
      where: { id: req.params.commentId, proposalId: req.params.proposalId },
    });
    if (!comment) return res.status(404).json({ message: 'Comment not found', code: 'NOT_FOUND' });
    const safe = JSON.parse(JSON.stringify(req.body)) as Partial<CommentEntity>;
    Object.assign(comment, safe);
    const saved = await repo.save(comment);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Delete comment ───────────────────────────────────────────────────────────
router.delete('/by-proposal/:proposalId/:commentId', async (req: Request, res: Response) => {
  try {
    const repo    = AppDataSource.getRepository(CommentEntity);
    const comment = await repo.findOne({
      where: { id: req.params.commentId, proposalId: req.params.proposalId },
    });
    if (!comment) return res.status(404).json({ message: 'Comment not found', code: 'NOT_FOUND' });
    await repo.remove(comment);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
