import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // DAL — Data Access Layer connection
  DAL_URL:     z.string().default('http://dal:5000'),
  DAL_API_KEY: z.string().min(8, 'DAL_API_KEY must be at least 8 characters'),

  // Database (MySQL via Docker — sqlite removed)
  DB_TYPE: z.enum(['mysql', 'postgres', 'mssql']).default('mysql'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_SSL: z.string().optional(),
  DB_POOL_MAX: z.coerce.number().default(20),
  DB_POOL_MIN: z.coerce.number().default(5),

  // AI Provider — switch between 'ollama' (local) and 'claude' (Anthropic API)
  AI_PROVIDER: z.enum(['ollama', 'claude']).default('ollama'),

  // Ollama (used when AI_PROVIDER=ollama)
  OLLAMA_BASE_URL:    z.string().default('http://localhost:11434'),
  OLLAMA_MODEL:       z.string().default('qwen3.5:4b'),
  OLLAMA_TIMEOUT:     z.coerce.number().default(120000),
  // Dedicated embedding model — nomic-embed-text produces 768-dim vectors (recommended)
  OLLAMA_EMBED_MODEL: z.string().default('nomic-embed-text'),

  // Qdrant vector database
  QDRANT_URL: z.string().default('http://localhost:32768'),

  // Claude / Anthropic API (used when AI_PROVIDER=claude)
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-6'),

  // Email
  EMAIL_TRANSPORT: z.enum(['smtp', 'sendgrid', 'ses', 'console']).default('console'),
  EMAIL_FROM: z.string().default('noreply@biopropose.com'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),

  // Storage
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  AWS_S3_BUCKET: z.string().optional(),

  // Export
  EXPORT_DIR: z.string().default('./exports'),
  PUPPETEER_HEADLESS: z.string().default('true'),
  EXPORT_TIMEOUT: z.coerce.number().default(30000),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('pretty'),

  // Error tracking (optional — disabled when not set)
  SENTRY_DSN: z.string().url().optional(),

  // Salesforce (SFDC) integration — all optional; feature disabled when CLIENT_ID is absent
  SFDC_LOGIN_URL:        z.string().url().default('https://login.salesforce.com'),
  SFDC_CLIENT_ID:        z.string().optional(),
  SFDC_CLIENT_SECRET:    z.string().optional(),
  SFDC_USERNAME:         z.string().optional(),
  SFDC_PASSWORD:         z.string().optional(),
  SFDC_API_VERSION:      z.string().default('v59.0'),
  SFDC_OPP_SEARCH_FIELD: z.string().default('Name'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[Config] Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
