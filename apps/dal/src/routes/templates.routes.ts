import { Router, Request, Response } from 'express';
import { AppDataSource } from '@biopropose/database';
import { TemplateEntity } from '@biopropose/database';

const router = Router();

// ── List templates ────────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await AppDataSource.getRepository(TemplateEntity).find({
      order: { name: 'ASC' },
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Get template by ID ────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await AppDataSource.getRepository(TemplateEntity).findOne({
      where: { id: req.params.id },
    });
    if (!template) return res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Create template ───────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const repo   = AppDataSource.getRepository(TemplateEntity);
    const body   = req.body as Partial<TemplateEntity> & { sections?: object[] };
    const entity = repo.create(body);
    if (body.sections !== undefined) entity.sections = body.sections;
    const saved  = await repo.save(entity);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Update template ───────────────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const repo     = AppDataSource.getRepository(TemplateEntity);
    const template = await repo.findOne({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' });
    const body = req.body as Partial<TemplateEntity> & { sections?: object[] };
    // Assign scalar fields first, then call the sections setter explicitly
    // to ensure sectionsJson is updated (Object.assign skips prototype setters
    // when they shadow a same-name column, so we handle it manually).
    const { sections, ...rest } = body;
    Object.assign(template, rest);
    if (sections !== undefined) template.sections = sections;
    const updated = await repo.save(template);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

// ── Delete template ───────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const repo     = AppDataSource.getRepository(TemplateEntity);
    const template = await repo.findOne({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' });
    await repo.remove(template);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, code: 'DB_ERROR' });
  }
});

export default router;
