import { Router, Request, Response } from 'express';
import { getOpportunityByCode, isSfdcConfigured } from '../services/sfdc.service';
import { logger } from '../config/logger';

const router = Router();

const MAX_CODE_LEN = 255;

/**
 * GET /api/sfdc/opportunity/:code
 *
 * Fetches Opportunity context from Salesforce by the configured search field
 * (default: Opportunity.Name).  Non-blocking — returns 503 when SFDC is not
 * configured so the frontend can degrade gracefully.
 */
router.get('/opportunity/:code', async (req: Request, res: Response) => {
  if (!isSfdcConfigured()) {
    return res.status(503).json({
      error: 'Salesforce integration is not configured on this server.',
      code:  'SFDC_NOT_CONFIGURED',
    });
  }

  const raw = req.params.code?.trim() ?? '';
  if (!raw || raw.length > MAX_CODE_LEN) {
    return res.status(400).json({ error: 'Invalid opportunity code.', code: 'BAD_REQUEST' });
  }

  try {
    const opportunity = await getOpportunityByCode(raw);
    if (!opportunity) {
      return res.status(404).json({
        error: `Opportunity '${raw}' not found in Salesforce.`,
        code:  'NOT_FOUND',
      });
    }
    res.json(opportunity);
  } catch (err) {
    logger.error({ err }, '[SFDC] Opportunity lookup error');
    res.status(502).json({
      error: 'Could not reach Salesforce. Please check the connection and try again.',
      code:  'SFDC_ERROR',
    });
  }
});

export default router;
