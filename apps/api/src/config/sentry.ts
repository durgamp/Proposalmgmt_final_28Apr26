/**
 * Sentry error-tracking integration.
 *
 * Install the SDK first:
 *   pnpm --filter api add @sentry/node
 *
 * Then add to your .env:
 *   SENTRY_DSN=https://your-key@o0.ingest.sentry.io/project-id
 *
 * If SENTRY_DSN is not set the module is a silent no-op — safe for local dev.
 */

import { env } from './env';
import { logger } from './logger';

// ── Lazy Sentry client ────────────────────────────────────────────────────────
// We import Sentry dynamically so the app boots fine even when the package
// is not installed (e.g. during local dev without the SDK).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

export async function initSentry(): Promise<void> {
  if (!env.SENTRY_DSN) {
    logger.info('[Sentry] SENTRY_DSN not configured — error tracking disabled');
    return;
  }

  try {
    // @ts-ignore — @sentry/node is optional; install via: pnpm --filter api add @sentry/node
    Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      // Sample 10 % of traces in production to limit quota usage
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Do not attach user PII to events by default (GDPR)
      sendDefaultPii: false,
    });
    logger.info('[Sentry] Error tracking initialised');
  } catch {
    logger.warn('[Sentry] @sentry/node not installed — skipping init. Run: pnpm --filter api add @sentry/node');
  }
}

/**
 * Capture an exception in Sentry (no-op when Sentry is not initialised).
 * Always include extra context such as the requestId for log correlation.
 */
export function captureException(
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  if (!Sentry) return;
  try {
    Sentry.captureException(err, { extra });
  } catch {
    // Never let Sentry crash the app
  }
}

/**
 * Capture a plain message (non-exception) in Sentry.
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'error',
  extra?: Record<string, unknown>,
): void {
  if (!Sentry) return;
  try {
    Sentry.captureMessage(message, { level, extra });
  } catch {
    // Never let Sentry crash the app
  }
}
