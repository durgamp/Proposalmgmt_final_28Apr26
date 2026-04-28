import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '@biopropose/database';
import app from './app';

const PORT = parseInt(process.env.DAL_PORT ?? '5000', 10);

async function bootstrap() {
  await AppDataSource.initialize();
  console.log(`[DAL] Database connected — type: ${process.env.DB_TYPE ?? 'sqlite'}`);

  const server = app.listen(PORT, () => {
    console.log(`[DAL] Data Access Layer running on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[DAL] ${signal} received — shutting down`);
    server.close(async () => {
      await AppDataSource.destroy();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[DAL] Failed to start:', err);
  process.exit(1);
});
