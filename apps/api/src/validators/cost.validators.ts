import { z } from 'zod';
import { CostCategory } from '@biopropose/shared-types';

export const costItemSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.nativeEnum(CostCategory),
  description: z.string().min(1).max(500),
  quantity: z.number().positive().finite(),
  serviceRate: z.number().min(0).finite().default(0),
  materialRate: z.number().min(0).finite().default(0),
  outsourcingRate: z.number().min(0).finite().default(0),
  totalCost: z.number().min(0).finite(),
  stage: z.string().max(255).optional(),
  isBinding: z.boolean().default(true),
  isFixedRate: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const bulkSaveCostsSchema = z.object({
  items: z.array(costItemSchema),
  updatedBy: z.string().min(1),
});

export const activitySchema = z.object({
  id: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  name: z.string().min(1).max(500),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  durationDays: z.number().int().min(0).default(0),
  progress: z.number().int().min(0).max(100).default(0),
  assignee: z.string().max(255).optional(),
  phase: z.string().max(255).optional(),
  color: z.string().max(100).default('bg-blue-500'),
  sortOrder: z.number().int().min(0).default(0),
  dependencies: z.array(z.string()).default([]),
});

export const stageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  durationDays: z.number().int().min(0).default(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const bulkSaveStagesSchema = z.object({
  stages: z.array(stageSchema),
  activities: z.array(activitySchema).default([]),
  updatedBy: z.string().min(1),
});

export const exportSchema = z.object({
  format: z.enum(['pdf', 'word']).optional(),
  exportedBy: z.string().min(1),
  includeSections: z.array(z.string()).optional(),
  includeCosts: z.boolean().optional(),
});

export const aiDraftSchema = z.object({
  sectionKey:  z.string().min(1),
  // Passed by the frontend so the RAG layer can exclude the current proposal
  // from its historical search (avoids circular self-reference).
  proposalId:  z.string().uuid().optional(),
  proposalContext: z.object({
    name:         z.string().default(''),
    client:       z.string().default(''),
    // null arrives from DB when not set — coerce to undefined so prompt builder gets a clean string
    description:  z.string().nullish().transform((v) => v ?? undefined),
    templateType: z.string().nullish().transform((v) => v ?? undefined),
    businessUnit: z.string().nullish().transform((v) => v ?? undefined),
  }),
  existingContent: z.string().nullish().transform((v) => v ?? undefined),
  userInstruction: z.string().max(1000).nullish().transform((v) => v ?? undefined),
  userName:        z.string().nullish().transform((v) => v ?? undefined),
});

export type CostItemDto = z.infer<typeof costItemSchema>;
export type BulkSaveCostsDto = z.infer<typeof bulkSaveCostsSchema>;
export type ActivityDto = z.infer<typeof activitySchema>;
export type StageDto = z.infer<typeof stageSchema>;
export type BulkSaveStagesDto = z.infer<typeof bulkSaveStagesSchema>;
export type ExportDto = z.infer<typeof exportSchema>;
export type AiDraftDto = z.infer<typeof aiDraftSchema>;
