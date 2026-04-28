import { Router, Request, Response } from 'express';
import { AppDataSource } from '@biopropose/database';
import {
  ProposalEntity, ProposalSectionEntity,
} from '@biopropose/database';
import { ProposalStatus, ProposalStage } from '@biopropose/shared-types';
import { FindOptionsWhere } from 'typeorm';

const router = Router();

// ── List proposals ────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ProposalEntity);
    const {
      search, status, stage,
      sortBy = 'createdAt', sortOrder = 'desc',
      page = '1', limit = '20',
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    if (search) {
      const term = search.trim().slice(0, 200);
      const qb = repo.createQueryBuilder('p');
      qb.where('(p.name LIKE :s OR p.client LIKE :s OR p.proposalCode LIKE :s)', { s: `%${term}%` });
      if (status) qb.andWhere('p.status = :status', { status });
      if (stage)  qb.andWhere('p.currentStage = :stage', { stage });
      qb.orderBy(`p.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      const [items, total] = await qb.getManyAndCount();
      return res.json({ items, total });
    }

    const where: FindOptionsWhere<ProposalEntity> = {};
    if (status) where.status       = status as unknown as ProposalStatus;
    if (stage)  where.currentStage = stage  as unknown as ProposalStage;

    const [items, total] = await repo.findAndCount({
      where,
      order: { [sortBy]: sortOrder.toUpperCase() as 'ASC' | 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Historical: sent proposals for RAG index (must be before /:id) ──────────
router.get('/historical/sent', async (_req: Request, res: Response) => {
  try {
    const proposals = await AppDataSource.getRepository(ProposalEntity).find({
      where:  { status: ProposalStatus.SENT },
      select: ['id', 'client', 'businessUnit', 'templateType'],
    });
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Historical: batch-load sections for RAG index ────────────────────────────
router.post('/historical/sections', async (req: Request, res: Response) => {
  try {
    const { proposalIds } = req.body as { proposalIds: string[] };
    if (!proposalIds?.length) return res.json([]);
    const sections = await AppDataSource.getRepository(ProposalSectionEntity)
      .createQueryBuilder('s')
      .where('s.proposalId IN (:...ids)', { ids: proposalIds })
      .getMany();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Find by proposal code (must be before /:id) ──────────────────────────────
router.get('/by-code/:code', async (req: Request, res: Response) => {
  try {
    const proposal = await AppDataSource.getRepository(ProposalEntity).findOne({
      where: { proposalCode: req.params.code },
    });
    if (!proposal) return res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Get proposal by ID (with relations) ──────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const proposal = await AppDataSource.getRepository(ProposalEntity).findOne({
      where: { id: req.params.id },
      relations: ['sections', 'exportedFiles'],
    });
    if (!proposal) return res.status(404).json({ message: `Proposal ${req.params.id} not found`, code: 'NOT_FOUND' });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Create proposal ──────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const repo   = AppDataSource.getRepository(ProposalEntity);
    const entity = repo.create(req.body as Partial<ProposalEntity>);
    const saved  = await repo.save(entity);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Partial update proposal ──────────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const repo     = AppDataSource.getRepository(ProposalEntity);
    const proposal = await repo.findOne({ where: { id: req.params.id } });
    if (!proposal) return res.status(404).json({ message: `Proposal ${req.params.id} not found`, code: 'NOT_FOUND' });
    // Sanitize via JSON round-trip to strip prototype chains before merging into the entity
    const safe = JSON.parse(JSON.stringify(req.body)) as Partial<ProposalEntity>;
    Object.assign(proposal, safe);
    const updated = await repo.save(proposal);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Reserve next amendment revision number (atomic pessimistic lock) ─────────
router.post('/:id/reserve-revision', async (req: Request, res: Response) => {
  try {
    const revisionNumber = await AppDataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(ProposalEntity);
      await txRepo.createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id: req.params.id })
        .getOne();
      const count = await txRepo.count({
        where: { parentProposalId: req.params.id, isAmendment: true },
      });
      return count + 1;
    });
    res.json({ revisionNumber });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
