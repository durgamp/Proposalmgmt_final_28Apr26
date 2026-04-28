/**
 * Qdrant vector database client — uses REST API directly (no SDK).
 * Collection: "proposals" — one point per proposal section.
 */

import { logger } from '../config/logger';

export const QDRANT_COLLECTION = 'proposals';

export interface QdrantPayload {
  proposalId:   string;
  proposalName: string;
  proposalCode: string;
  sectionKey:   string;
  client:       string;
  businessUnit: string;
  templateType: string;
  status:       string;
  plainText:    string;
  historical:   boolean;
  updatedAt:    string;
}

export interface QdrantSearchResult {
  id:      string;
  score:   number;
  payload: QdrantPayload;
}

class QdrantClient {
  private get baseUrl() {
    return process.env.QDRANT_URL ?? 'http://localhost:32768';
  }

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url  = `${this.baseUrl}${path}`;
    const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) init.body = JSON.stringify(body);

    const res  = await fetch(url, init);
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Qdrant ${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
    return data as T;
  }

  async ensureCollection(vectorSize: number): Promise<void> {
    let existingSize: number | undefined;
    try {
      const info = await this.req<{
        result: { config: { params: { vectors: { size: number } } } };
      }>('GET', `/collections/${QDRANT_COLLECTION}`);
      existingSize = info?.result?.config?.params?.vectors?.size;
    } catch {
      // Collection doesn't exist — create it
    }

    if (existingSize === vectorSize) return;

    if (existingSize !== undefined) {
      logger.warn(`[Qdrant] Recreating collection — size mismatch ${existingSize} ≠ ${vectorSize}`);
      await this.req('DELETE', `/collections/${QDRANT_COLLECTION}`);
    }

    await this.req('PUT', `/collections/${QDRANT_COLLECTION}`, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });

    // Payload indexes for efficient filtering
    await this.req('PUT', `/collections/${QDRANT_COLLECTION}/index`, {
      field_name: 'sectionKey', field_schema: 'keyword',
    }).catch(() => {});
    await this.req('PUT', `/collections/${QDRANT_COLLECTION}/index`, {
      field_name: 'proposalId', field_schema: 'keyword',
    }).catch(() => {});
    await this.req('PUT', `/collections/${QDRANT_COLLECTION}/index`, {
      field_name: 'historical', field_schema: 'bool',
    }).catch(() => {});
    await this.req('PUT', `/collections/${QDRANT_COLLECTION}/index`, {
      field_name: 'templateType', field_schema: 'keyword',
    }).catch(() => {});

    logger.info(`[Qdrant] Collection '${QDRANT_COLLECTION}' ready (dims=${vectorSize})`);
  }

  async upsert(points: Array<{ id: string; vector: number[]; payload: QdrantPayload }>): Promise<void> {
    if (points.length === 0) return;
    await this.req('PUT', `/collections/${QDRANT_COLLECTION}/points?wait=true`, { points });
  }

  async deleteByProposalId(proposalId: string): Promise<void> {
    await this.req('POST', `/collections/${QDRANT_COLLECTION}/points/delete`, {
      filter: { must: [{ key: 'proposalId', match: { value: proposalId } }] },
    });
  }

  async search(vector: number[], opts: {
    sectionKey?:        string;
    templateType?:      string;
    historical?:        boolean;
    excludeProposalId?: string;
    limit?:             number;
  } = {}): Promise<QdrantSearchResult[]> {
    const must:    unknown[] = [];
    const mustNot: unknown[] = [];

    if (opts.sectionKey   != null) must.push({ key: 'sectionKey',   match: { value: opts.sectionKey } });
    if (opts.templateType != null) must.push({ key: 'templateType', match: { value: opts.templateType } });
    if (opts.historical   != null) must.push({ key: 'historical',   match: { value: opts.historical } });
    if (opts.excludeProposalId) mustNot.push({ key: 'proposalId', match: { value: opts.excludeProposalId } });

    const body: Record<string, unknown> = { vector, limit: opts.limit ?? 10, with_payload: true };
    if (must.length || mustNot.length) {
      body['filter'] = {
        ...(must.length    && { must }),
        ...(mustNot.length && { must_not: mustNot }),
      };
    }

    const res = await this.req<{
      result: Array<{ id: string; score: number; payload: QdrantPayload }>;
    }>('POST', `/collections/${QDRANT_COLLECTION}/points/search`, body);

    return (res.result ?? []).map((r) => ({ id: String(r.id), score: r.score, payload: r.payload }));
  }

  async count(historical?: boolean): Promise<number> {
    const body: Record<string, unknown> = { exact: true };
    if (historical != null) {
      body['filter'] = { must: [{ key: 'historical', match: { value: historical } }] };
    }
    const res = await this.req<{ result: { count: number } }>(
      'POST', `/collections/${QDRANT_COLLECTION}/points/count`, body,
    );
    return res.result?.count ?? 0;
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.req('GET', '/');
      return true;
    } catch {
      return false;
    }
  }
}

export const qdrant = new QdrantClient();
