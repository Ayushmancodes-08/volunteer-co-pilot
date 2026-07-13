import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import Fastify from 'fastify';

import errorHandlerPlugin from '../src/plugins/errorHandler';
import alertRoutes from '../src/routes/alerts';
import crowdRoutes from '../src/routes/crowd';
import translateRoutes from '../src/routes/translate';

let app;

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: ['http://localhost:3000'] });
  app.setErrorHandler(errorHandlerPlugin);
  await app.register(alertRoutes);
  await app.register(crowdRoutes);
  await app.register(translateRoutes);
  app.get('/api/health', async () => ({ status: 'ok' }));
  await app.ready();
  return app;
}

describe('POST /api/alerts/evaluate', () => {
  beforeEach(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    if (app) {await app.close();}
  });

  it('returns 400 for invalid body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/alerts/evaluate',
      payload: { gate: '', occupancy: -5 },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for missing gate', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/alerts/evaluate',
      payload: { occupancy: 85 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns fallback recommendation when GenAI is unavailable', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/alerts/evaluate',
      payload: { gate: 'C', occupancy: 85 },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('gate', 'C');
    expect(body).toHaveProperty('occupancy', 85);
    expect(body).toHaveProperty('action');
    expect(body).toHaveProperty('reasoning');
  });
});

describe('GET /api/crowd', () => {
  beforeEach(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    if (app) {await app.close();}
  });

  it('returns crowd data for 6 gates', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/crowd',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.gates).toHaveLength(6);
    expect(body).toHaveProperty('timestamp');
  });
});