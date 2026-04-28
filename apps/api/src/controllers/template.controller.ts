import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dal } from '../clients/dal.client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { parseTemplateFile } from '../services/templateUpload.service';

// ── Multer config ────────────────────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'templates');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(docx|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx and .pdf files are accepted'));
    }
  },
});

// ── Controller ───────────────────────────────────────────────────────────────
export const templateController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await dal.listTemplates();
      res.json(templates);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await dal.getTemplateById(req.params.id);
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');
      res.json(template);
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, businessUnit, category, description, sections, createdBy } = req.body;
      const saved = await dal.createTemplate({
        name,
        businessUnit,
        category: category ?? businessUnit,
        description,
        sections: sections ?? [],
        isSystem: false,
        createdBy,
      });
      res.status(201).json(saved);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await dal.getTemplateById(req.params.id);
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');
      const { name, businessUnit, category, description, sections } = req.body;
      const patch: Record<string, unknown> = {};
      if (name !== undefined)         patch.name         = name;
      if (businessUnit !== undefined) patch.businessUnit = businessUnit;
      if (category !== undefined)     patch.category     = category;
      if (description !== undefined)  patch.description  = description;
      if (sections !== undefined)     patch.sections     = sections;
      const saved = await dal.updateTemplate(req.params.id, patch);
      res.json(saved);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await dal.getTemplateById(req.params.id);
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');
      if (template.isSystem) throw new AppError(403, 'System templates cannot be deleted', 'FORBIDDEN');
      await dal.deleteTemplate(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  /**
   * POST /api/templates/upload
   * Accepts a .docx or .pdf file, parses it, and returns detected sections.
   * Does NOT save to DB — the frontend calls PUT/POST after user confirms.
   */
  uploadAndParse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, 'No file uploaded', 'BAD_REQUEST');

      const sections = await parseTemplateFile(req.file.path, req.file.mimetype);

      // Clean up temp file (best-effort — don't block the response)
      fs.promises.unlink(req.file.path).catch((e) => logger.warn({ err: e }, '[Template] Failed to delete temp file'));

      res.json({
        originalName: req.file.originalname,
        detectedSections: sections,
        sectionCount: sections.filter((s) => {
          const content = s.defaultContent as any;
          return content?.content?.some((c: any) =>
            c?.content?.some((t: any) => t?.text?.trim()),
          );
        }).length,
      });
    } catch (err) { next(err); }
  },
};
