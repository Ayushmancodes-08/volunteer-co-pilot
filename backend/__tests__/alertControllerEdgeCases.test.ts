import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { describe, it, expect, mock, afterAll, beforeAll } from 'bun:test';
import Fastify, { FastifyInstance } from 'fastify';

import { alertHistory } from '../src/controllers/alertController';
import errorHandlerPlugin from '../src/plugins/errorHandler';
import alertRoutes from '../src/routes/alerts';

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: ['http://localhost:3000'] });
  app.setErrorHandler(errorHandlerPlugin);
  await app.register(alertRoutes);
  await app.ready();
  return app;
}

describe('alertController Edge Cases', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('handles non-object response from GenAI (null)', async () => {
    const originalFetch = global.fetch;
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(null),
    })) as unknown as typeof fetch;

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/alerts/evaluate',
        payload: { gate: 'B', occupancy: 95 },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.action).toBe('Direct fans away from this gate');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('handles non-object response from GenAI (string)', async () => {
    const originalFetch = global.fetch;
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve('not-an-object'),
    })) as unknown as typeof fetch;

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/alerts/evaluate',
        payload: { gate: 'B', occupancy: 95 },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.action).toBe('Direct fans away from this gate');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('returns 404 for dismissing non-existent alert ID', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/alerts/non-existent-alert-id/dismiss',
    });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Alert not found');
  });

  it('handles non-Error objects thrown during alert evaluation', async () => {
    const originalJSONParse = JSON.parse;
    JSON.parse = (text: string, reviver?: Parameters<typeof JSON.parse>[1]) => {
      if (text === '{}') {
        throw 'String error during evaluate';
      }
      return originalJSONParse(text, reviver);
    };

    const originalFetch = global.fetch;
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })) as unknown as typeof fetch;

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/alerts/evaluate',
        payload: { gate: 'B', occupancy: 95 },
      });
      expect(res.statusCode).toBe(200);
      const resBody = originalJSONParse(res.body);
      expect(resBody.action).toBe('Direct fans away from this gate');
    } finally {
      JSON.parse = originalJSONParse;
      global.fetch = originalFetch;
    }
  });

  it('enforces MAX_ALERT_HISTORY cap by evicting oldest entries when over 100 alerts', async () => {
    // Clear any residual history from previous tests, then fill to exactly 100 entries
    alertHistory.splice(0);
    for (let i = 0; i < 100; i++) {
      alertHistory.push({
        id: `filler-${i}`,
        gate: 'Z',
        occupancy: 0,
        action: 'filler',
        reasoning: 'filler',
        timestamp: new Date().toISOString(),
        dismissed: false,
      });
    }
    expect(alertHistory.length).toBe(100);

    // Inject one more alert — addAlert unshifts → length becomes 101 → splice(100) fires
    const originalFetch = global.fetch;
    global.fetch = mock(() => Promise.resolve({
      ok: false,
      status: 503,
      text: () => Promise.resolve('unavailable'),
    })) as unknown as typeof fetch;

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/alerts/evaluate',
        payload: { gate: 'A', occupancy: 99 },
      });
      expect(res.statusCode).toBe(200);
      // History should be capped at exactly 100
      expect(alertHistory.length).toBe(100);
      // The newest (fallback) alert is prepended at index 0
      expect(alertHistory[0].gate).toBe('A');
    } finally {
      global.fetch = originalFetch;
      // Clean up: remove filler entries
      alertHistory.splice(0);
    }
  });
});

