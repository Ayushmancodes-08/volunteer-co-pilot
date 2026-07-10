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

/**
 * Builds the list of allowed CORS origins from environment config.
 * In production only CORS_ORIGIN is used. In non-production, localhost
 * dev servers are also allowed to simplify local development.
 *
 * @returns {string[]}
 */
function buildCorsOrigins() {
  const origins = [CORS_ORIGIN];
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:5173');
  }
  return origins;
}

const app = Fastify({
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