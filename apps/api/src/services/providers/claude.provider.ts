import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { AiDraftDto } from '../../validators/cost.validators';
import type { IAiProvider, AiDraftResult, AiHealthResult } from './ai.provider';

export class ClaudeProvider implements IAiProvider {
  private readonly client: Anthropic;

  constructor() {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=claude');
    }
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async generateDraft(dto: AiDraftDto & { prompt: string; system?: string }): Promise<AiDraftResult> {
    logger.info(`[AI:Claude] Generating draft — model: ${env.CLAUDE_MODEL}`);

    const message = await this.client.messages.create({
      model:      env.CLAUDE_MODEL,
      max_tokens: 4096,
      ...(dto.system ? { system: dto.system } : {}),
      messages: [{ role: 'user', content: dto.prompt }],
    });

    const content = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    return { content: content.trim(), model: env.CLAUDE_MODEL, provider: 'claude' };
  }

  async streamDraft(dto: AiDraftDto & { prompt: string; system?: string }, onChunk: (text: string) => void): Promise<void> {
    const stream = this.client.messages.stream({
      model:      env.CLAUDE_MODEL,
      max_tokens: 4096,
      ...(dto.system ? { system: dto.system } : {}),
      messages: [{ role: 'user', content: dto.prompt }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        onChunk(chunk.delta.text);
      }
    }
  }

  async checkHealth(): Promise<AiHealthResult> {
    if (!env.ANTHROPIC_API_KEY) {
      return { available: false, provider: 'claude', model: env.CLAUDE_MODEL };
    }
    return { available: true, provider: 'claude', model: env.CLAUDE_MODEL };
  }
}
