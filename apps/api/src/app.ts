import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middleware/requestLogger';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import proposalsRouter from './routes/proposals.routes';
import sectionsRouter from './routes/sections.routes';
import costsRouter from './routes/costs.routes';
import auditRouter from './routes/audit.routes';
import analyticsRouter from './routes/analytics.routes';
import exportRouter from './routes/export.routes';
import aiRouter from './routes/ai.routes';
import templatesRouter from './routes/templates.routes';
import sfdcRouter from './routes/sfdc.routes';

const app = express();

// Trust proxy headers (required when behind nginx / load balancer in Docker)
app.set('trust proxy', 1);

// Attach correlation ID to every request — must be first middleware
app.use(requestId);

// ------------------------------------------------------------------
// Security
// ------------------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  // Enforce HTTPS in production
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Prevent MIME-type sniffing
  noSniff: true,
  // XSS protection header for older browsers
  xssFilter: true,
}));

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl)
    if (!origin) return callback(null, true);
    // In development allow any localhost port (Vite picks an available port each run)
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

// ------------------------------------------------------------------
// Rate limiting  (scalability: protect against abuse at 1000 concurrent users)
// ------------------------------------------------------------------

// General API limit: 300 requests / minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Tighter limit on AI endpoints (expensive operations)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached, please wait before generating again.' },
});

// Tight limit on export endpoints (CPU/memory heavy)
const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Export limit reached, please wait before exporting again.' },
});

// SFDC lookup: 30 calls/min per IP (external API — protect against hammering)
const sfdcLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Salesforce lookup limit reached, please wait a moment.' },
});

app.use('/api', apiLimiter);
app.use('/api/ai', aiLimiter);

// ------------------------------------------------------------------
// Parsing & compression
// ------------------------------------------------------------------
// Skip compression for SSE endpoints (compression buffers the stream and breaks SSE)
app.use(compression({
  filter: (req, res) => {
    if (req.path.includes('/ai/stream')) return false;
    return compression.filter(req, res);
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------------
// Request logging
// ------------------------------------------------------------------
app.use(requestLogger);

// ------------------------------------------------------------------
// Request timeouts (prevents slow requests from blocking the server)
// ------------------------------------------------------------------
app.use((req, _res, next) => {
  // AI stream and exports need extended timeouts; default 30s for all others
  const timeoutMs = req.path.includes('/exports') ? 5 * 60 * 1000
    : req.path.includes('/ai/stream') ? 3 * 60 * 1000
    : 30 * 1000;
  req.setTimeout(timeoutMs);
  next();
});

// ------------------------------------------------------------------
// Health check (no rate limit, used by Docker & load balancer probes)
// ------------------------------------------------------------------
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() }),
);

// ------------------------------------------------------------------
// API routes
// ------------------------------------------------------------------
app.use('/api/proposals', proposalsRouter);
app.use('/api/proposals/:proposalId/sections', sectionsRouter);
app.use('/api/proposals/:proposalId/costs', costsRouter);
app.use('/api/proposals/:proposalId/audit', auditRouter);
app.use('/api/proposals/:proposalId/exports', exportLimiter, exportRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/sfdc', sfdcLimiter, sfdcRouter);

// ------------------------------------------------------------------
// 404 & error handler
// ------------------------------------------------------------------
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

export default app;
