import { Request, Response, NextFunction } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const provided = req.headers['x-dal-api-key'];
  const expected = process.env.DAL_API_KEY;

  if (!expected) {
    console.warn('[DAL] DAL_API_KEY not set — all requests blocked');
    res.status(503).json({ error: 'DAL not configured' });
    return;
  }
  if (provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
