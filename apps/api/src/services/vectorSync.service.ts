/**
 * Vector Sync Service
 *
 * Syncs all proposals and their sections to Qdrant for semantic search.
 * Each section = one Qdrant point:
 *   ID      = sha256(proposalId:sectionKey) as UUID hex
 *   Vector  = nomic-embed-text embedding of the section's plain text
 *   Payload = proposal + section metadata, including historical flag
 *
 * Call syncAllToQdrant() at startup and via POST /api/ai/sync.
 * Call syncProposalToQdrant(id) after a proposal is saved/updated.
 */

import { createHash } from 'crypto';
import { dal } from '../clients/dal.client';
import { qdrant } from '../clients/qdrant.client';
import type { QdrantPayload } from '../clients/qdrant.client';
import { env } from '../config/env';
import { logger } from '../config/logger';

// ── TipTap JSON → plain text ─────────────────────────────────────────────────

interface TipTapNode { type: string; text?: string; content?: TipTapNode[]; }

export function tipTapToText(doc: unknown, depth = 0): string {
  if (!doc || typeof doc !== 'object' || depth > 20) return '';
  const node = doc as TipTapNode;
  if (node.text) return node.text;
  if (!node.content) return '';
  const sep = ['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type) ? ' ' : '';
  return node.content.map((c) => tipTapToText(c, depth + 1)).join(sep).replace(/\s+/g, ' ').trim();
}

// ── Deterministic point ID ───────────────────────────────────────────────────

function makePointId(proposalId: string, sectionKey: string): string {
  const h = createHash('sha256').update(`${proposalId}:${sectionKey}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

// ── Ollama embedding ─────────────────────────────────────────────────────────

const EMBED_TIMEOUT_MS = 30_000;
const EMBED_GAP_MS     = 50;

export async function embedText(text: string): Promise<number[] | null> {
  try {
    const model      = env.OLLAMA_EMBED_MODEL;
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

    const res = await fetch(`${env.OLLAMA_BASE_URL}/api/embeddings`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ model, prompt: text.slice(0, 2_000) }),
      signal:  controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json() as { embedding?: number[] };
    return Array.isArray(data.embedding) ? data.embedding : null;
  } catch (err) {
    logger.warn({ err }, '[VectorSync] Embedding failed');
    return null;
  }
}

// ── Sync state ───────────────────────────────────────────────────────────────

export interface SyncStatus {
  running:   boolean;
  lastRun:   Date | null;
  lastCount: number;
  lastError: string | null;
}

const syncStatus: SyncStatus = { running: false, lastRun: null, lastCount: 0, lastError: null };

export function getSyncStatus(): SyncStatus { return { ...syncStatus }; }

// ── Full sync ─────────────────────────────────────────────────────────────────

const MIN_TEXT_LEN = 40;
const BATCH_SIZE   = 20;

export async function syncAllToQdrant(): Promise<{ synced: number; skipped: number }> {
  if (syncStatus.running) {
    logger.warn('[VectorSync] Already running — skipping duplicate');
    return { synced: 0, skipped: 0 };
  }

  syncStatus.running   = true;
  syncStatus.lastError = null;
  let synced = 0, skipped = 0;

  try {
    logger.info('[VectorSync] Starting full sync to Qdrant');

    // Probe embedding dimension with a test sentence
    const probe = await embedText('biologics CRO CDMO proposal');
    if (!probe) throw new Error('Embedding model unavailable — is nomic-embed-text pulled in Ollama?');
    const vectorSize = probe.length;
    logger.info(`[VectorSync] model=${env.OLLAMA_EMBED_MODEL}, dims=${vectorSize}`);

    await qdrant.ensureCollection(vectorSize);

    // Fetch all proposals
    const { items: proposals } = await dal.listProposals({ limit: 10_000 });
    logger.info(`[VectorSync] ${proposals.length} proposals to process`);

    // Mark historical (sent/approved) proposals for RAG filtering
    const historicalIds = new Set<string>();
    try {
      (await dal.getHistoricalProposals()).forEach((p) => historicalIds.add(p.id));
    } catch { /* non-fatal */ }

    for (const proposal of proposals) {
      let sections: Awaited<ReturnType<typeof dal.getSections>>;
      try {
        sections = await dal.getSections(proposal.id);
      } catch {
        skipped++;
        continue;
      }

      const batch: Array<{ id: string; vector: number[]; payload: QdrantPayload }> = [];

      for (const section of sections) {
        const rawContent = section.content as unknown;
        const plainText  = rawContent
          ? tipTapToText(rawContent)
          : ((section as Record<string, unknown>).contentText as string | undefined) ?? '';

        if (plainText.trim().length < MIN_TEXT_LEN) { skipped++; continue; }

        const vector = await embedText(plainText);
        await new Promise<void>((r) => setTimeout(r, EMBED_GAP_MS));

        if (!vector) { skipped++; continue; }

        batch.push({
          id: makePointId(proposal.id, section.sectionKey),
          vector,
          payload: {
            proposalId:   proposal.id,
            proposalName: proposal.name,
            proposalCode: proposal.proposalCode ?? '',
            sectionKey:   section.sectionKey,
            client:       proposal.client,
            businessUnit: proposal.businessUnit ?? '',
            templateType: proposal.templateType ?? '',
            status:       proposal.status ?? '',
            plainText:    plainText.slice(0, 3_000),
            historical:   historicalIds.has(proposal.id),
            updatedAt:    proposal.updatedAt ? String(proposal.updatedAt) : new Date().toISOString(),
          },
        });

        if (batch.length >= BATCH_SIZE) {
          await qdrant.upsert(batch);
          synced += batch.length;
          batch.length = 0;
        }
      }

      if (batch.length > 0) {
        await qdrant.upsert(batch);
        synced += batch.length;
      }
    }

    syncStatus.lastCount = synced;
    syncStatus.lastRun   = new Date();
    logger.info(`[VectorSync] Complete — synced=${synced}, skipped=${skipped}`);
    return { synced, skipped };
  } catch (err) {
    syncStatus.lastError = (err as Error).message;
    logger.error({ err }, '[VectorSync] Failed');
    throw err;
  } finally {
    syncStatus.running = false;
  }
}

/** Incrementally re-index a single proposal (called after section saves). */
export async function syncProposalToQdrant(proposalId: string): Promise<void> {
  try {
    const [proposal, sections, historical] = await Promise.all([
      dal.getProposalById(proposalId),
      dal.getSections(proposalId),
      dal.getHistoricalProposals().catch(() => [] as Awaited<ReturnType<typeof dal.getHistoricalProposals>>),
    ]);

    const probe = await embedText('test');
    if (!probe) return;
    await qdrant.ensureCollection(probe.length);
    await qdrant.deleteByProposalId(proposalId);

    const isHistorical = historical.some((h) => h.id === proposalId);
    const points: Array<{ id: string; vector: number[]; payload: QdrantPayload }> = [];

    for (const section of sections) {
      const rawContent = section.content as unknown;
      const plainText  = rawContent
        ? tipTapToText(rawContent)
        : ((section as Record<string, unknown>).contentText as string | undefined) ?? '';

      if (plainText.trim().length < MIN_TEXT_LEN) continue;

      const vector = await embedText(plainText);
      if (!vector) continue;

      points.push({
        id: makePointId(proposalId, section.sectionKey),
        vector,
        payload: {
          proposalId,
          proposalName: proposal.name,
          proposalCode: proposal.proposalCode ?? '',
          sectionKey:   section.sectionKey,
          client:       proposal.client,
          businessUnit: proposal.businessUnit ?? '',
          templateType: proposal.templateType ?? '',
          status:       proposal.status ?? '',
          plainText:    plainText.slice(0, 3_000),
          historical:   isHistorical,
          updatedAt:    proposal.updatedAt ? String(proposal.updatedAt) : new Date().toISOString(),
        },
      });
    }

    if (points.length > 0) await qdrant.upsert(points);
    logger.info(`[VectorSync] Incremental sync done — proposalId=${proposalId}, points=${points.length}`);
  } catch (err) {
    logger.warn({ err, proposalId }, '[VectorSync] Incremental sync failed');
  }
}
