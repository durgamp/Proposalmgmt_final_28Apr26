import { Router } from 'express';
import { validate } from '../middleware/validate';
import { updateSectionSchema, createCommentSchema, updateCommentSchema, deleteCommentSchema } from '../validators/section.validators';
import { sectionController } from '../controllers/section.controller';
import { commentController } from '../controllers/comment.controller';

const router = Router({ mergeParams: true });

// Section routes (nested under /proposals/:proposalId/sections)
router.get('/', sectionController.list);
router.get('/:sectionKey', sectionController.getOne);
router.put('/:sectionKey', validate({ body: updateSectionSchema }), sectionController.update);

// Comments nested under sections
router.get('/:sectionKey/comments', commentController.list);
router.post('/:sectionKey/comments', validate({ body: createCommentSchema }), commentController.create);
router.put('/:sectionKey/comments/:commentId', validate({ body: updateCommentSchema }), commentController.update);
router.delete('/:sectionKey/comments/:commentId', validate({ body: deleteCommentSchema }), commentController.remove);

export default router;
