import axios from 'axios';
import type {
  Proposal, ProposalSection, AuditLog, Comment, CostItem,
  ProjectStage, ProjectActivity, Template,
} from '@biopropose/shared-types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Extract the real error message from API response bodies so toast/onError
// shows "Section is locked" rather than "Request failed with status code 403"
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg: string | undefined = err?.response?.data?.error ?? err?.response?.data?.message;
    if (msg) err.message = msg;
    return Promise.reject(err);
  },
);

// ---- Proposals ----

export interface ListProposalsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  stage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListProposalsResult {
  items: Proposal[];
  total: number;
}

export const proposalsApi = {
  list: (params?: ListProposalsParams) =>
    api.get<ListProposalsResult>('/proposals', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Proposal>(`/proposals/${id}`).then((r) => r.data),

  create: (dto: unknown) =>
    api.post<Proposal>('/proposals', dto).then((r) => r.data),

  update: (id: string, dto: unknown) =>
    api.put<Proposal>(`/proposals/${id}`, dto).then((r) => r.data),

  delete: (id: string, deletedBy: string) =>
    api.delete(`/proposals/${id}`, { data: { deletedBy } }),

  advanceStage: (id: string, dto: unknown) =>
    api.post<Proposal>(`/proposals/${id}/advance-stage`, dto).then((r) => r.data),

  createAmendment: (id: string, dto: unknown) =>
    api.post<Proposal>(`/proposals/${id}/amendment`, dto).then((r) => r.data),

  reopen: (id: string, dto: unknown) =>
    api.post<Proposal>(`/proposals/${id}/reopen`, dto).then((r) => r.data),
};

// ---- Sections ----

export const sectionsApi = {
  list: (proposalId: string) =>
    api.get<ProposalSection[]>(`/proposals/${proposalId}/sections`).then((r) => r.data),

  getOne: (proposalId: string, sectionKey: string) =>
    api.get<ProposalSection>(`/proposals/${proposalId}/sections/${sectionKey}`).then((r) => r.data),

  update: (proposalId: string, sectionKey: string, dto: unknown) =>
    api.put<ProposalSection>(`/proposals/${proposalId}/sections/${sectionKey}`, dto).then((r) => r.data),
};

// ---- Comments ----

export const commentsApi = {
  list: (proposalId: string, sectionKey: string) =>
    api.get<Comment[]>(`/proposals/${proposalId}/sections/${sectionKey}/comments`).then((r) => r.data),

  create: (proposalId: string, sectionKey: string, dto: unknown) =>
    api.post<Comment>(`/proposals/${proposalId}/sections/${sectionKey}/comments`, dto).then((r) => r.data),

  update: (proposalId: string, sectionKey: string, commentId: string, dto: unknown) =>
    api.put<Comment>(`/proposals/${proposalId}/sections/${sectionKey}/comments/${commentId}`, dto).then((r) => r.data),

  delete: (proposalId: string, sectionKey: string, commentId: string, userEmail: string) =>
    api.delete(`/proposals/${proposalId}/sections/${sectionKey}/comments/${commentId}`, { data: { userEmail } }),
};

// ---- Costs ----

export const costsApi = {
  getCosts: (proposalId: string) =>
    api.get<CostItem[]>(`/proposals/${proposalId}/costs`).then((r) => r.data),

  saveCosts: (proposalId: string, dto: unknown) =>
    api.post<CostItem[]>(`/proposals/${proposalId}/costs`, dto).then((r) => r.data),

  getSummary: (proposalId: string) =>
    api.get(`/proposals/${proposalId}/costs/summary`).then((r) => r.data),

  getTimeline: (proposalId: string) =>
    api.get<{ stages: ProjectStage[]; activities: ProjectActivity[] }>(
      `/proposals/${proposalId}/costs/timeline`,
    ).then((r) => r.data),

  saveTimeline: (proposalId: string, dto: unknown) =>
    api.post(`/proposals/${proposalId}/costs/timeline`, dto).then((r) => r.data),
};

// ---- Audit ----

export const auditApi = {
  list: (proposalId: string, page = 1, limit = 50) =>
    api.get<{ items: AuditLog[]; total: number }>(`/proposals/${proposalId}/audit`, { params: { page, limit } }).then((r) => r.data),
};

// ---- Export ----

export const exportApi = {
  list: (proposalId: string) =>
    api.get(`/proposals/${proposalId}/exports`).then((r) => r.data),

  pdf: async (proposalId: string, dto: unknown) => {
    const response = await api.post(`/proposals/${proposalId}/exports/pdf`, dto, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${proposalId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  word: async (proposalId: string, dto: unknown) => {
    const response = await api.post(`/proposals/${proposalId}/exports/word`, dto, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${proposalId}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ---- AI ----

export interface SemanticSearchResult {
  proposalId:   string;
  proposalName: string;
  proposalCode: string;
  sectionKey:   string;
  client:       string;
  businessUnit: string;
  status:       string;
  plainText:    string;
  score:        number;
  updatedAt:    string;
}

export const aiApi = {
  health: () => api.get('/ai/health').then((r) => r.data),

  search: (dto: { query: string; sectionKey?: string; limit?: number; excludeProposalId?: string }) =>
    api.post<{ results: SemanticSearchResult[]; total: number }>('/ai/search', dto).then((r) => r.data),

  syncStatus: () => api.get('/ai/sync/status').then((r) => r.data),
  triggerSync: () => api.post('/ai/sync').then((r) => r.data),

  draft: (dto: unknown) =>
    api.post<{ content: string; model: string }>('/ai/draft', dto).then((r) => r.data),

  streamDraft: (
    dto: unknown,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError?: (msg: string) => void,
    onMeta?: (meta: { historicalExamplesUsed: number; usingEmbeddings: boolean }) => void,
  ): EventSource => {
    const controller = new AbortController();
    let buffer = '';

    fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
      signal: controller.signal,
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = `API error ${res.status}`;
        try { msg = (JSON.parse(text) as { error?: string }).error ?? msg; } catch { /* keep default */ }
        onError?.(msg);
        onDone();
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Process complete lines only — a single chunk can contain many lines or
        // a line can be split across chunks, so we keep the incomplete tail in buffer.
        const newline = buffer.lastIndexOf('\n');
        if (newline === -1) continue;

        const toProcess = buffer.slice(0, newline + 1);
        buffer = buffer.slice(newline + 1);

        for (const line of toProcess.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6).trim();
          if (data === '[DONE]') { onDone(); return; }
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string; meta?: { historicalExamplesUsed: number; usingEmbeddings: boolean } };
            if (parsed.error) { onError?.(parsed.error); continue; }
            if (parsed.meta)  { onMeta?.(parsed.meta); continue; }
            if (parsed.text)  onChunk(parsed.text);
          } catch { /* malformed chunk — skip */ }
        }
      }
      onDone();
    }).catch((err: Error) => {
      if (err.name !== 'AbortError') {
        console.error('[AI Stream]', err);
        onError?.(err.message || 'Stream connection failed');
        onDone();
      }
    });

    return { close: () => controller.abort() } as unknown as EventSource;
  },
};

// ---- Analytics ----

export const analyticsApi = {
  kpis: (params?: Record<string, unknown>) =>
    api.get('/analytics/kpis', { params }).then((r) => r.data),

  stageDistribution: () =>
    api.get('/analytics/stage-distribution').then((r) => r.data),

  templateDistribution: () =>
    api.get('/analytics/template-distribution').then((r) => r.data),

  monthlyTrends: (year?: number) =>
    api.get('/analytics/monthly-trends', { params: { year } }).then((r) => r.data),

  costSummary: () =>
    api.get('/analytics/cost-summary').then((r) => r.data),

  recentActivity: (limit?: number) =>
    api.get('/analytics/recent-activity', { params: { limit } }).then((r) => r.data),
};

// ---- Templates ----

export const templatesApi = {
  list: () =>
    api.get<Template[]>('/templates').then((r) => r.data),

  getById: (id: string) =>
    api.get<Template>(`/templates/${id}`).then((r) => r.data),

  create: (body: { name: string; businessUnit: string; category: string; description?: string; sections?: object[]; createdBy: string }) =>
    api.post<Template>('/templates', body).then((r) => r.data),

  update: (id: string, body: { name?: string; businessUnit?: string; category?: string; description?: string; sections?: object[] }) =>
    api.put<Template>(`/templates/${id}`, body).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/templates/${id}`),

  uploadAndParse: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<{
      originalName: string;
      detectedSections: Array<{ sectionKey: string; title: string; sortOrder: number; defaultContent: object }>;
      sectionCount: number;
    }>('/templates/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
};

// ---- Salesforce (SFDC) ----

export interface SfdcOpportunity {
  id:          string;
  name:        string;
  description: string | null;
  accountName: string | null;
  amount:      number | null;
  closeDate:   string | null;
  stageName:   string | null;
}

export const sfdcApi = {
  /**
   * Fetches Opportunity context from Salesforce by the SFDC Opportunity Code.
   * Throws on network/server error; returns null when the opportunity is not found.
   * Returns undefined-like rejection with code SFDC_NOT_CONFIGURED when the server
   * has no SFDC credentials set up.
   */
  getOpportunity: (code: string) =>
    api.get<SfdcOpportunity>(`/sfdc/opportunity/${encodeURIComponent(code.trim())}`).then((r) => r.data),
};

export default api;
