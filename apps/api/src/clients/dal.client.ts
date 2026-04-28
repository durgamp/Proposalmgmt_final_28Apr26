/**
 * DalClient — typed HTTP client for the internal Data Access Layer.
 * All database operations in the BAL must go through this client.
 * The DAL service is only reachable on the internal Docker network.
 */

import { AppError } from '../middleware/errorHandler';
import type {
  ProposalEntity, ProposalSectionEntity, CostItemEntity,
  ProjectStageEntity, ProjectActivityEntity, CommentEntity,
  AuditLogEntity, TemplateEntity, ExportedFileEntity,
} from '@biopropose/database';
import type { AuditAction } from '@biopropose/shared-types';

// ── Payload types (plain objects sent to/from the DAL) ───────────────────────

export type ProposalRow      = Omit<ProposalEntity, never>;
export type SectionRow       = Omit<ProposalSectionEntity, never>;
export type CostItemRow      = Omit<CostItemEntity, never>;
export type StageRow         = Omit<ProjectStageEntity, never>;
export type ActivityRow      = Omit<ProjectActivityEntity, never>;
export type CommentRow       = Omit<CommentEntity, never>;
export type AuditLogRow      = Omit<AuditLogEntity, never>;
export type TemplateRow      = Omit<TemplateEntity, never>;
export type ExportedFileRow  = Omit<ExportedFileEntity, never>;

export interface ListResult<T> { items: T[]; total: number; }

export interface AuditPayload {
  proposalId?: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  details: string;
  changes?: object;
  snapshot?: object;
}

export interface HistoricalProposal {
  id: string;
  client: string;
  businessUnit: string;
  templateType: string;
}

export interface ActivityFeedItem {
  id: string;
  proposalId: string;
  proposalCode: string;
  action: string;
  userEmail: string;
  details: string;
  createdAt: Date;
}

// ── Client ────────────────────────────────────────────────────────────────────

class DalClient {
  private get baseUrl() { return process.env.DAL_URL ?? 'http://dal:5000'; }
  private get apiKey()  { return process.env.DAL_API_KEY ?? ''; }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'x-dal-api-key': this.apiKey,
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url  = `${this.baseUrl}${path}`;
    const init: RequestInit = { method, headers: this.headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      throw new AppError(503, `DAL unreachable: ${(err as Error).message}`, 'DAL_UNREACHABLE');
    }

    if (response.status === 204) return undefined as T;

    const data = await response.json().catch(() => ({ message: 'Unparseable DAL response', code: 'DAL_ERROR' }));
    if (!response.ok) {
      throw new AppError(
        response.status,
        (data as { message?: string }).message ?? 'DAL request failed',
        (data as { code?: string }).code ?? 'DAL_ERROR',
      );
    }
    return data as T;
  }

  private get<T>(path: string)                       { return this.request<T>('GET', path); }
  private post<T>(path: string, body?: unknown)      { return this.request<T>('POST', path, body); }
  private patch<T>(path: string, body: unknown)      { return this.request<T>('PATCH', path, body); }
  private put<T>(path: string, body: unknown)        { return this.request<T>('PUT', path, body); }
  private del<T = void>(path: string)                { return this.request<T>('DELETE', path); }

  // ── Proposals ──────────────────────────────────────────────────────────────

  listProposals(q: Record<string, string | number | undefined>): Promise<ListResult<ProposalRow>> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined) params.set(k, String(v));
    return this.get(`/proposals?${params}`);
  }

  getProposalById(id: string): Promise<ProposalRow> {
    return this.get(`/proposals/${id}`);
  }

  findProposalByCode(code: string): Promise<ProposalRow | null> {
    return this.get<ProposalRow>(`/proposals/by-code/${encodeURIComponent(code)}`).catch((err) => {
      if ((err as AppError).statusCode === 404) return null;
      throw err;
    });
  }

  createProposal(data: Partial<ProposalRow>): Promise<ProposalRow> {
    return this.post('/proposals', data);
  }

  updateProposal(id: string, data: Partial<ProposalRow>): Promise<ProposalRow> {
    return this.patch(`/proposals/${id}`, data);
  }

  reserveRevision(sourceId: string): Promise<{ revisionNumber: number }> {
    return this.post(`/proposals/${sourceId}/reserve-revision`);
  }

  // ── Sections ───────────────────────────────────────────────────────────────

  getSections(proposalId: string): Promise<SectionRow[]> {
    return this.get(`/sections/by-proposal/${proposalId}`);
  }

  getSection(proposalId: string, sectionKey: string): Promise<SectionRow> {
    return this.get(`/sections/by-proposal/${proposalId}/key/${sectionKey}`);
  }

  createSections(sections: Partial<SectionRow>[]): Promise<SectionRow[]> {
    return this.post('/sections/batch', sections);
  }

  updateSection(proposalId: string, sectionKey: string, data: Partial<SectionRow>): Promise<SectionRow> {
    return this.patch(`/sections/by-proposal/${proposalId}/key/${sectionKey}`, data);
  }

  batchUpdateSections(sections: Partial<SectionRow>[]): Promise<SectionRow[]> {
    return this.put('/sections/batch', sections);
  }

  // ── Costs & Timeline ───────────────────────────────────────────────────────

  getCosts(proposalId: string): Promise<CostItemRow[]> {
    return this.get(`/costs/by-proposal/${proposalId}`);
  }

  saveCosts(proposalId: string, items: Partial<CostItemRow>[]): Promise<CostItemRow[]> {
    return this.put(`/costs/by-proposal/${proposalId}`, items);
  }

  getStages(proposalId: string): Promise<StageRow[]> {
    return this.get(`/costs/stages/by-proposal/${proposalId}`);
  }

  getActivities(proposalId: string): Promise<ActivityRow[]> {
    return this.get(`/costs/activities/by-proposal/${proposalId}`);
  }

  saveTimeline(proposalId: string, data: {
    stages: Partial<StageRow>[]; activities: Partial<ActivityRow>[];
  }): Promise<{ stages: StageRow[]; activities: ActivityRow[] }> {
    return this.put(`/costs/timeline/by-proposal/${proposalId}`, data);
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  getComments(proposalId: string, sectionKey?: string): Promise<CommentRow[]> {
    const qs = sectionKey ? `?sectionKey=${encodeURIComponent(sectionKey)}` : '';
    return this.get(`/comments/by-proposal/${proposalId}${qs}`);
  }

  getComment(proposalId: string, commentId: string): Promise<CommentRow> {
    return this.get(`/comments/by-proposal/${proposalId}/${commentId}`);
  }

  createComment(proposalId: string, data: Partial<CommentRow>): Promise<CommentRow> {
    return this.post(`/comments/by-proposal/${proposalId}`, data);
  }

  updateComment(proposalId: string, commentId: string, data: Partial<CommentRow>): Promise<CommentRow> {
    return this.patch(`/comments/by-proposal/${proposalId}/${commentId}`, data);
  }

  deleteComment(proposalId: string, commentId: string): Promise<void> {
    return this.del(`/comments/by-proposal/${proposalId}/${commentId}`);
  }

  // ── Audit logs ─────────────────────────────────────────────────────────────

  logAudit(data: AuditPayload): Promise<AuditLogRow> {
    return this.post('/audit-logs', data);
  }

  getAuditLogs(proposalId: string, page = 1, limit = 50): Promise<ListResult<AuditLogRow>> {
    return this.get(`/audit-logs/by-proposal/${proposalId}?page=${page}&limit=${limit}`);
  }

  getAllAuditLogs(page = 1, limit = 50): Promise<ListResult<AuditLogRow>> {
    return this.get(`/audit-logs?page=${page}&limit=${limit}`);
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  listTemplates(): Promise<TemplateRow[]> {
    return this.get('/templates');
  }

  getTemplateById(id: string): Promise<TemplateRow | null> {
    return this.get<TemplateRow>(`/templates/${id}`).catch((err) => {
      if ((err as AppError).statusCode === 404) return null;
      throw err;
    });
  }

  createTemplate(data: Partial<TemplateRow>): Promise<TemplateRow> {
    return this.post('/templates', data);
  }

  updateTemplate(id: string, data: Partial<TemplateRow>): Promise<TemplateRow> {
    return this.put(`/templates/${id}`, data);
  }

  deleteTemplate(id: string): Promise<void> {
    return this.del(`/templates/${id}`);
  }

  // ── Exports ────────────────────────────────────────────────────────────────

  getExports(proposalId: string): Promise<ExportedFileRow[]> {
    return this.get(`/exports/by-proposal/${proposalId}`);
  }

  recordExport(data: Partial<ExportedFileRow>): Promise<ExportedFileRow> {
    return this.post('/exports', data);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  getAnalyticsKpis(filters: Record<string, string | number | undefined>): Promise<unknown> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v !== undefined) params.set(k, String(v));
    return this.get(`/analytics/kpis?${params}`);
  }

  getStageDistribution(): Promise<unknown[]> { return this.get('/analytics/stages'); }
  getTemplateDistribution(): Promise<unknown[]> { return this.get('/analytics/templates'); }
  getMonthlyTrends(year?: number): Promise<unknown[]> {
    return this.get(`/analytics/trends${year ? `?year=${year}` : ''}`);
  }
  getCostSummary(): Promise<unknown> { return this.get('/analytics/costs'); }
  getRecentActivity(limit?: number): Promise<ActivityFeedItem[]> {
    return this.get(`/analytics/activity${limit ? `?limit=${limit}` : ''}`);
  }

  // ── Historical context (for AI RAG) ───────────────────────────────────────

  getHistoricalProposals(): Promise<HistoricalProposal[]> {
    return this.get('/proposals/historical/sent');
  }

  getHistoricalSections(proposalIds: string[]): Promise<SectionRow[]> {
    return this.post('/proposals/historical/sections', { proposalIds });
  }
}

export const dal = new DalClient();
