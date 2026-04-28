import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { exportService } from '../services/export.service';
import { logger } from '../config/logger';
import type { ExportDto } from '../validators/cost.validators';

export const exportController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exports = await exportService.getExports(req.params.proposalId);
      res.json(exports);
    } catch (err) { next(err); }
  },

  pdf: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filePath, fileName } = await exportService.exportPdf(
        req.params.proposalId,
        req.body as ExportDto,
      );
      res.download(filePath, fileName, (err) => {
        if (err) next(err);
        fs.promises.unlink(filePath).catch((e) => logger.warn({ err: e, filePath }, '[Export] Failed to delete export file'));
      });
    } catch (err) { next(err); }
  },

  word: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filePath, fileName } = await exportService.exportWord(
        req.params.proposalId,
        req.body as ExportDto,
      );
      res.download(filePath, fileName, (err) => {
        if (err) next(err);
        fs.promises.unlink(filePath).catch((e) => logger.warn({ err: e, filePath }, '[Export] Failed to delete export file'));
      });
    } catch (err) { next(err); }
  },
};
