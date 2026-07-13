import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { describe, it, expect, mock, afterEach } from 'bun:test';
import Fastify from 'fastify';

import errorHandlerPlugin from '../src/plugins/errorHandler';
import briefingRoutes from '../src/routes/briefing';

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

afterEach(() => {
  global.fetch = originalFetch;
});

describe('GET /api/briefing — fallback path', () => {
  it('returns 200 with all required fields when GenAI is unavailable', async () => {
    // Force GenAI to fail so we exercise the structured fallback
    global.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service Unavailable'),
      })
    );

    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/briefing?name=Sam&role=Gate+Monitor&gate=A',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('summary');
    expect(body).toHaveProperty('weatherForecast');
    expect(body).toHaveProperty('crowdOutlook');
    expect(body).toHaveProperty('announcements');
    expect(body).toHaveProperty('suggestedActions');
    expect(Array.isArray(body.announcements)).toBe(true);
    expect(Array.isArray(body.suggestedActions)).toBe(true);
    await app.close();
  });

  it('fallback summary includes the volunteer name from query param', async () => {
    global.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service Unavailable'),
      })
    );

    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/briefing?name=Jamie&role=Crowd+Control&gate=B',
    });
    const body = JSON.parse(res.body);
    expect(body.summary).toContain('Jamie');
    await app.close();
  });

  it('uses default name when query param is missing', async () => {
    global.fetch = mock(() =>
      Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('fail') })
    );

    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/briefing' });
    const body = JSON.parse(res.body);
    expect(body.summary).toContain('Alex Morgan');
    await app.close();
  });

  it('strips prompt injection characters from name param', async () => {
    global.fetch = mock(() =>
      Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('fail') })
    );

    const app = await buildApp();
    // Inject characters that should be stripped
    const res = await app.inject({
      method: 'GET',
      url: '/api/briefing?name=%3Cscript%3Ealert(1)%3C%2Fscript%3E&role=Gate+Monitor&gate=C',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    // The script tag should be stripped; summary should not contain < or > characters
    expect(body.summary).not.toContain('<script>');
    await app.close();
  });
});

describe('GET /api/briefing — successful GenAI path', () => {
  it('returns the AI response when GenAI succeeds', async () => {
    const mockBriefing = {
      summary: 'Good morning Alex! Your shift at Gate C is starting.',
      weatherForecast: '22°C, partly cloudy.',
      crowdOutlook: 'Peak crowds expected at 17:30.',
      announcements: ['Stay hydrated.', 'Keep exits clear.'],
      suggestedActions: ['Check sensors.', 'Review scripts.', 'Radio ops channel.'],
    };

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(mockBriefing) }],
                },
              },
            ],
          }),
      })
    );
    process.env.GEMINI_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'gemini';

    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/briefing?name=Alex&role=Gate+Monitor&gate=C',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.summary).toBe(mockBriefing.summary);
    expect(body.announcements).toHaveLength(2);
    expect(body.suggestedActions).toHaveLength(3);
    await app.close();
  });
});
