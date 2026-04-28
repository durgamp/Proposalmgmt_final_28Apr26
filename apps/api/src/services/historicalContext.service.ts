/**
 * Historical Context Service — RAG layer for AI draft generation.
 *
 * Retrieves the top-K most semantically similar sections from Qdrant,
 * filtered to the SAME templateType so examples always come from the
 * same proposal category (ensuring format/structure fidelity).
 *
 * Falls back to DAL keyword search when Qdrant or Ollama is unavailable.
 */

import { qdrant } from '../clients/qdrant.client';
import { embedText } from './vectorSync.service';
import { dal } from '../clients/dal.client';
import { logger } from '../config/logger';

// ── Public types ──────────────────────────────────────────────────────────────

export interface HistoricalExample {
  proposalName: string;
  client:       string;
  businessUnit: string;
  templateType: string;
  sectionKey:   string;
  content:      string;
  similarity:   number;
}

export interface HistoricalContextResult {
  examples:        HistoricalExample[];
  totalIndexed:    number;
  usingEmbeddings: boolean;
}

// ── Keyword fallback (when Qdrant/Ollama unavailable) ────────────────────────

async function keywordFallback(opts: {
  sectionKey:         string;
  templateType?:      string;
  businessUnit?:      string;
  excludeProposalId?: string;
  topK:               number;
}): Promise<HistoricalContextResult> {
  try {
    const proposals = await dal.getHistoricalProposals();
    const eligible  = proposals.filter((p) => p.id !== opts.excludeProposalId);
    if (eligible.length === 0) return { examples: [], totalIndexed: 0, usingEmbeddings: false };

    const sections = await dal.getHistoricalSections(eligible.map((p) => p.id));
    const matching = sections.filter((s) => s.sectionKey === opts.sectionKey);

    const scored = matching.map((s) => {
      const proposal = eligible.find((p) => p.id === s.proposalId);
      let score = 0;
      if (opts.templateType && proposal?.templateType === opts.templateType) score += 0.6;
      if (opts.businessUnit && proposal?.businessUnit?.toLowerCase() === opts.businessUnit.toLowerCase()) score += 0.3;
      return { s, proposal, score };
    });
    scored.sort((a, b) => b.score - a.score);

    return {
      examples: scored.slice(0, opts.topK).map(({ s, proposal, score }) => ({
        proposalName: '',
        client:       proposal?.client ?? '',
        businessUnit: proposal?.businessUnit ?? '',
        templateType: proposal?.templateType ?? '',
        sectionKey:   s.sectionKey,
        content:      String(s.content ?? '').slice(0, 2_000),
        similarity:   score,
      })),
      totalIndexed:    sections.length,
      usingEmbeddings: false,
    };
  } catch (err) {
    logger.warn({ err }, '[HistoricalCtx] Keyword fallback also failed');
    return { examples: [], totalIndexed: 0, usingEmbeddings: false };
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getHistoricalExamples(opts: {
  sectionKey:         string;
  templateType?:      string;
  businessUnit?:      string;
  excludeProposalId?: string;
  topK?:              number;
}): Promise<HistoricalContextResult> {
  const topK = opts.topK ?? 5;

  try {
    // Query vector: sectionKey gives semantic direction; templateType narrows the filter
    const queryText = [opts.templateType, opts.sectionKey, opts.businessUnit]
      .filter(Boolean)
      .join(' ');

    const queryVec = await embedText(queryText);
    if (!queryVec) {
      logger.warn('[HistoricalCtx] Embedding unavailable — using keyword fallback');
      return keywordFallback({ ...opts, topK });
    }

    // Primary search: same templateType + same sectionKey (all statuses — not just historical)
    const results = await qdrant.search(queryVec, {
      sectionKey:        opts.sectionKey,
      templateType:      opts.templateType,
      excludeProposalId: opts.excludeProposalId,
      limit:             topK,
    });

    const totalIndexed = await qdrant.count().catch(() => 0);

    if (results.length === 0) {
      // No same-template hits — try without templateType filter as a wider fallback
      const wider = await qdrant.search(queryVec, {
        sectionKey:        opts.sectionKey,
        excludeProposalId: opts.excludeProposalId,
        limit:             topK,
      });

      if (wider.length === 0) {
        const kwFallback = await keywordFallback({ ...opts, topK });
        return { ...kwFallback, totalIndexed };
      }

      return {
        examples: wider.map((r) => ({
          proposalName: r.payload.proposalName,
          client:       r.payload.client,
          businessUnit: r.payload.businessUnit,
          templateType: r.payload.templateType,
          sectionKey:   r.payload.sectionKey,
          content:      r.payload.plainText,
          similarity:   Math.round(r.score * 100) / 100,
        })),
        totalIndexed,
        usingEmbeddings: true,
      };
    }

    return {
      examples: results.map((r) => ({
        proposalName: r.payload.proposalName,
        client:       r.payload.client,
        businessUnit: r.payload.businessUnit,
        templateType: r.payload.templateType,
        sectionKey:   r.payload.sectionKey,
        content:      r.payload.plainText,
        similarity:   Math.round(r.score * 100) / 100,
      })),
      totalIndexed,
      usingEmbeddings: true,
    };
  } catch (err) {
    logger.warn({ err }, '[HistoricalCtx] Qdrant search failed — falling back to keyword');
    return keywordFallback({ ...opts, topK });
  }
}

/** @deprecated No-op — index now lives in Qdrant, not memory. */
export function invalidateHistoricalIndex(): void { /* noop */ }
