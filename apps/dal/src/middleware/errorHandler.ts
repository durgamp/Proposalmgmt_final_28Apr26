import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[DAL] Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Internal DAL error';
  res.status(500).json({ message, code: 'INTERNAL_ERROR' });
}
