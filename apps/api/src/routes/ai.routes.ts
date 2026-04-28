import { Router } from 'express';
import { validate } from '../middleware/validate';
import { aiDraftSchema } from '../validators/cost.validators';
import { aiController } from '../controllers/ai.controller';

const router = Router();

router.get('/health',       aiController.health);
router.post('/draft',       validate({ body: aiDraftSchema }), aiController.draft);
router.post('/stream',      validate({ body: aiDraftSchema }), aiController.stream);
router.post('/search',      aiController.search);
router.post('/sync',        aiController.sync);
router.get('/sync/status',  aiController.syncStatus);

export default router;
