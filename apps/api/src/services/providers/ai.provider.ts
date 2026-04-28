import type { AiDraftDto } from '../../validators/cost.validators';

export interface AiHealthResult {
  available: boolean;
  provider: string;
  model: string;
  version?: string;
}

export interface AiDraftResult {
  content: string;
  model: string;
  provider: string;
}

export interface IAiProvider {
  generateDraft(dto: AiDraftDto & { prompt: string; system?: string }): Promise<AiDraftResult>;
  streamDraft(dto: AiDraftDto & { prompt: string; system?: string }, onChunk: (text: string) => void): Promise<void>;
  checkHealth(): Promise<AiHealthResult>;
}
