/**
 * Tests for briefingController.ts — covers the criticalGates path
 * by injecting the briefing endpoint when generateCrowdData returns high-occupancy data.
 *
 * We use a direct module import + spy pattern to exercise the map arrow on criticalGates.
 * NOTE: This is a separate file to isolate mock.module hoisting from other test files.
 */
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { describe, it, expect, mock, spyOn, afterEach } from 'bun:test';
import Fastify from 'fastify';

import errorHandlerPlugin from '../src/plugins/errorHandler';
import briefingRoutes from '../src/routes/briefing';
import * as crowdSimulatorModule from '../src/utils/crowdSimulator';

const originalFetch = global.fetch;

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: ['http://localhost:3000'] });
  app.setErrorHandler(errorHandlerPlugin);
  await app.register(briefingRoutes);
  await app.ready();
  return app;
}

describe('briefingController — criticalGates path (>= 80% occupancy)', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    // Restore any spies
    mock.restore();
  });

  it('exercises criticalGates map arrow when gates exceed 80% occupancy', async () => {
    // Spy on generateCrowdData to return deterministic data with high-occupancy gates
    spyOn(crowdSimulatorModule, 'generateCrowdData').mockImplementation(() => [
      { gate: 'A', occupancy: 90, trend: 'stable', timestamp: new Date().toISOString() },
      { gate: 'B', occupancy: 85, trend: 'rising', timestamp: new Date().toISOString() },
      { gate: 'C', occupancy: 40, trend: 'stable', timestamp: new Date().toISOString() },
      { gate: 'D', occupancy: 35, trend: 'falling', timestamp: new Date().toISOString() },
      { gate: 'E', occupancy: 20, trend: 'stable', timestamp: new Date().toISOString() },
      { gate: 'F', occupancy: 15, trend: 'stable', timestamp: new Date().toISOString() },
    ]);

    // Force GenAI to fail → fallback briefing
    global.fetch = mock(() =>
      Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('fail') })
    ) as unknown as typeof fetch;

    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/briefing?name=Alex&role=Gate+Monitor&gate=C',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.summary).toContain('Alex');
    expect(body).toHaveProperty('announcements');
    expect(Array.isArray(body.announcements)).toBe(true);

    await app.close();
  });
});
