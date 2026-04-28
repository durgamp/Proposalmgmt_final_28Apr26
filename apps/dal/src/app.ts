import express from 'express';
import { requireApiKey } from './middleware/apiKey';
import { errorHandler } from './middleware/errorHandler';
import proposalsRouter from './routes/proposals.routes';
import sectionsRouter from './routes/sections.routes';
import costsRouter from './routes/costs.routes';
import commentsRouter from './routes/comments.routes';
import auditRouter from './routes/audit.routes';
import analyticsRouter from './routes/analytics.routes';
import templatesRouter from './routes/templates.routes';
import exportsRouter from './routes/exports.routes';

const app = express();

app.use(express.json({ limit: '10mb' }));

// All DAL routes require a valid internal API key
app.use(requireApiKey);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/proposals', proposalsRouter);
app.use('/sections', sectionsRouter);
app.use('/costs', costsRouter);
app.use('/comments', commentsRouter);
app.use('/audit-logs', auditRouter);
app.use('/analytics', analyticsRouter);
app.use('/templates', templatesRouter);
app.use('/exports', exportsRouter);

app.use((_req, res) => res.status(404).json({ message: 'DAL route not found', code: 'NOT_FOUND' }));
app.use(errorHandler);

export default app;
