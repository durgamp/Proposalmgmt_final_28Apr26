import { dal } from '../clients/dal.client';
import { AuditAction } from '@biopropose/shared-types';
import { v4 as uuid } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { auditService } from './audit.service';
import type { CreateCommentDto, UpdateCommentDto } from '../validators/section.validators';
import type { CommentEntity } from '@biopropose/database';

export class CommentService {
  async getByProposal(proposalId: string, sectionKey?: string): Promise<CommentEntity[]> {
    return dal.getComments(proposalId, sectionKey) as Promise<CommentEntity[]>;
  }

  async create(proposalId: string, dto: CreateCommentDto): Promise<CommentEntity> {
    const comment = await dal.createComment(proposalId, {
      id:          uuid(),
      proposalId,
      sectionKey:  dto.sectionKey,
      content:     dto.content,
      userName:    dto.userName,
      userEmail:   dto.userEmail,
      userRole:    dto.userRole,
    }) as CommentEntity;

    await auditService.log({
      proposalId,
      userEmail: dto.userEmail,
      userName:  dto.userName,
      action:    AuditAction.COMMENTED,
      details:   `Comment added${dto.sectionKey ? ` on section "${dto.sectionKey}"` : ''}`,
    });

    return comment;
  }

  async update(proposalId: string, commentId: string, dto: UpdateCommentDto): Promise<CommentEntity> {
    const comment = await dal.getComment(proposalId, commentId) as CommentEntity;
    if (!comment) throw new AppError(404, 'Comment not found', 'NOT_FOUND');

    if (comment.userEmail !== dto.userEmail) {
      throw new AppError(403, 'You can only edit your own comments', 'FORBIDDEN');
    }

    const updated = await dal.updateComment(proposalId, commentId, { content: dto.content }) as CommentEntity;

    await auditService.log({
      proposalId,
      userEmail: dto.userEmail,
      userName:  comment.userName,
      action:    AuditAction.COMMENT_UPDATED,
      details:   'Comment updated',
    });

    return updated;
  }

  async delete(proposalId: string, commentId: string, userEmail: string): Promise<void> {
    const comment = await dal.getComment(proposalId, commentId) as CommentEntity;
    if (!comment) throw new AppError(404, 'Comment not found', 'NOT_FOUND');

    await dal.deleteComment(proposalId, commentId);

    await auditService.log({
      proposalId,
      userEmail,
      userName: userEmail,
      action:   AuditAction.COMMENT_DELETED,
      details:  'Comment deleted',
    });
  }
}

export const commentService = new CommentService();
