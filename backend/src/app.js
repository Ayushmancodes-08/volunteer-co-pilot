import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import crowdRoutes from './routes/crowd.js';
import alertRoutes from './routes/alerts.js';
import translateRoutes from './routes/translate.js';
import briefingRoutes from './routes/briefing.js';
import volunteerRoutes from './routes/volunteer.js';
import rateLimiterPlugin from './plugins/rateLimiter.js';
import errorHandlerPlugin from './plugins/errorHandler.js';

const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Security
await app.register(helmet, { contentSecurityPolicy: false });

// CORS - explicitly scoped, no wildcard
await app.register(cors, {
  origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

// Rate limiting
await app.register(rateLimiterPlugin);

// Global error handler
app.setErrorHandler(errorHandlerPlugin);

// Routes
await app.register(crowdRoutes);
await app.register(alertRoutes);
await app.register(translateRoutes);
await app.register(briefingRoutes);
await app.register(volunteerRoutes);

// Health check
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Start
if (process.env.NODE_ENV !== 'test') {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

export default app;