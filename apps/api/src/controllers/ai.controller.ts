import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { syncAllToQdrant, getSyncStatus, embedText } from '../services/vectorSync.service';
import { qdrant } from '../clients/qdrant.client';
import type { AiDraftDto } from '../validators/cost.validators';

export const aiController = {
  health: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await aiService.checkHealth();
      res.json(status);
    } catch (err) { next(err); }
  },

  draft: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await aiService.generateDraft(req.body as AiDraftDto);
      res.json(result);
    } catch (err) { next(err); }
  },

  /** POST /api/ai/sync — trigger full re-index of all proposals to Qdrant */
  sync: async (_req: Request, res: Response, next: NextFunction) => {
    const status = getSyncStatus();
    if (status.running) {
      return res.status(202).json({ message: 'Sync already in progress', status });
    }
    // Fire-and-forget — respond immediately; sync runs in background
    syncAllToQdrant().catch((err) => {
      const { logger } = require('../config/logger') as typeof import('../config/logger');
      logger.error({ err }, '[AI] Background sync failed');
    });
    res.status(202).json({ message: 'Sync started', status: getSyncStatus() });
  },

  /** GET /api/ai/sync/status — poll sync progress */
  syncStatus: (_req: Request, res: Response) => {
    res.json(getSyncStatus());
  },

  /** POST /api/ai/search — semantic deep search across all indexed sections */
  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, sectionKey, limit = 20, excludeProposalId } = req.body as {
        query:              string;
        sectionKey?:        string;
        limit?:             number;
        excludeProposalId?: string;
      };

      if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

      const vector = await embedText(query.trim());
      if (!vector) {
        return res.status(503).json({ error: 'Embedding model unavailable', results: [] });
      }

      const raw = await qdrant.search(vector, {
        sectionKey,
        excludeProposalId,
        limit: Math.min(limit, 50) * 3, // over-fetch to deduplicate by proposal
      });

      // Deduplicate: keep best-scoring section per proposal
      const seen  = new Map<string, typeof raw[0]>();
      for (const r of raw) {
        const existing = seen.get(r.payload.proposalId);
        if (!existing || r.score > existing.score) seen.set(r.payload.proposalId, r);
      }

      const results = [...seen.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(limit, 50))
        .map((r) => ({
          proposalId:   r.payload.proposalId,
          proposalName: r.payload.proposalName,
          proposalCode: r.payload.proposalCode,
          sectionKey:   r.payload.sectionKey,
          client:       r.payload.client,
          businessUnit: r.payload.businessUnit,
          status:       r.payload.status,
          plainText:    r.payload.plainText.slice(0, 300),
          score:        Math.round(r.score * 1000) / 1000,
          updatedAt:    r.payload.updatedAt,
        }));

      res.json({ results, total: results.length });
    } catch (err) { next(err); }
  },

  stream: async (req: Request, res: Response, _next: NextFunction) => {
    const dto = req.body as AiDraftDto;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      await aiService.streamDraft(
        dto,
        (text) => { res.write(`data: ${JSON.stringify({ text })}\n\n`); },
        (meta) => { res.write(`data: ${JSON.stringify({ meta })}\n\n`); },
      );
      res.write('data: [DONE]\n\n');
    } catch (err) {
      // Headers already sent — write error as SSE event then close
      const msg = err instanceof Error ? err.message : 'AI stream failed';
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    } finally {
      res.end();
    }
  },
};
