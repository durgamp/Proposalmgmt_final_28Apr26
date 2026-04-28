import { z } from 'zod';

export const updateSectionSchema = z.object({
  content: z.record(z.unknown()).optional(),
  isComplete: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  updatedBy: z.string().min(1),
});

export const createCommentSchema = z.object({
  sectionKey: z.string().optional(),
  content: z.string().min(1, 'Comment cannot be empty').max(10000),
  userName: z.string().min(1),
  userEmail: z.string().email(),
  userRole: z.string().min(1),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  userEmail: z.string().email(),
});

export const deleteCommentSchema = z.object({
  userEmail: z.string().email(),
});

export type UpdateSectionDto  = z.infer<typeof updateSectionSchema>;
export type CreateCommentDto  = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto  = z.infer<typeof updateCommentSchema>;
export type DeleteCommentDto  = z.infer<typeof deleteCommentSchema>;
