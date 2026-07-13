import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify, { FastifyInstance } from 'fastify';

import errorHandlerPlugin from './plugins/errorHandler';
import rateLimiterPlugin from './plugins/rateLimiter';
import alertRoutes from './routes/alerts';
import briefingRoutes from './routes/briefing';
import crowdRoutes from './routes/crowd';
import translateRoutes from './routes/translate';
import volunteerRoutes from './routes/volunteer';
const CORS_ORIGIN: string = process.env.CORS_ORIGIN || 'http://localhost:3000';

/**
 * Builds the list of allowed CORS origins from environment config.
 * In production only CORS_ORIGIN is used. In non-production, localhost
 * dev servers are also allowed to simplify local development.
 */
function buildCorsOrigins(): string[] {
  const origins = [CORS_ORIGIN];
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:5173');
  }
  return origins;
}

const app: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  // Reject request bodies larger than 256 KB to prevent memory pressure attacks
  bodyLimit: 256 * 1024,
});

// Security headers — enable CSP tailored for this SPA/API server
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'none'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Not needed for a pure API server
});

// CORS - explicitly scoped, no wildcard; dev origins excluded in production
await app.register(cors, {
  origin: buildCorsOrigins(),
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

export default app;
