import 'reflect-metadata';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSentry } from './config/sentry';
import app from './app';
import { startWsServer } from './ws/server';
import { syncAllToQdrant } from './services/vectorSync.service';
import { qdrant } from './clients/qdrant.client';

async function bootstrap() {
  await initSentry();

  try {
    // No DB initialization here — the BAL talks to the DAL over HTTP.
    // All data access goes through apps/dal via the internal Docker network.

    const httpServer = app.listen(env.PORT, () => {
      logger.info(`[API] BAL server running on port ${env.PORT}`);
      logger.info(`[API] Data access routed to DAL at ${process.env.DAL_URL ?? 'http://dal:5000'}`);
    });

    // Kick off Qdrant sync in background after server is ready (non-blocking)
    setImmediate(async () => {
      try {
        const reachable = await qdrant.isReachable();
        if (!reachable) {
          logger.warn(`[VectorSync] Qdrant unreachable at ${env.QDRANT_URL} — skipping startup sync`);
          return;
        }
        logger.info('[VectorSync] Qdrant reachable — starting startup sync');
        await syncAllToQdrant();
      } catch (err) {
        logger.warn({ err }, '[VectorSync] Startup sync failed — will retry via POST /api/ai/sync');
      }
    });

    const wsPort = env.PORT + 1;
    const wss    = startWsServer(wsPort);
    logger.info(`[WS] WebSocket server running on port ${wsPort}`);

    const shutdown = async (signal: string) => {
      logger.info(`[API] ${signal} received — shutting down gracefully`);
      const forceExit = setTimeout(() => {
        logger.warn('[API] Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 30_000);
      forceExit.unref();

      (httpServer as unknown as { closeAllConnections?: () => void }).closeAllConnections?.();
      wss.close();

      httpServer.close(() => {
        clearTimeout(forceExit);
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, '[API] Failed to start server');
    process.exit(1);
  }
}

bootstrap();
