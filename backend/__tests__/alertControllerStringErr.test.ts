/**
 * Tests for alertController.ts — covers the String(err) branch in the catch block
 * by directly spying on genaiService.getAlertRecommendation to throw a non-Error primitive.
 *
 * retryWithBackoff wraps all errors to Error, so to hit the String(err) branch we must
 * spy on getAlertRecommendation directly instead of going through fetch mocking.
 */
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { describe, it, expect, spyOn } from 'bun:test';
import Fastify, { FastifyInstance } from 'fastify';

import errorHandlerPlugin from '../src/plugins/errorHandler';
import alertRoutes from '../src/routes/alerts';
import * as genaiService from '../src/services/genaiService';

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: ['http://localhost:3000'] });
  app.setErrorHandler(errorHandlerPlugin);
  await app.register(alertRoutes);
  await app.ready();
  return app;
}

describe('alertController — String(err) branch coverage', () => {
  it('covers String(err) when genaiService throws a non-Error primitive', async () => {
    // Spy on getAlertRecommendation to throw a string directly (bypasses retryWithBackoff wrapping)
    const spy = spyOn(genaiService, 'getAlertRecommendation').mockImplementation(() => {
      throw 'non-Error string thrown from genaiService';
    });

    const app = await buildApp();

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/alerts/evaluate',
        payload: { gate: 'C', occupancy: 88 },
      });

      // Should fall back gracefully even when a string (non-Error) is thrown
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.action).toBe('Direct fans away from this gate');
    } finally {
      spy.mockRestore();
      await app.close();
    }
  });
});
