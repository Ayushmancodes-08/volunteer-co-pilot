import { expect, test, describe } from 'bun:test';
import app from '../src/app.js';

describe('Volunteer and Briefing API', () => {
  test('GET /api/volunteer returns default profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/volunteer',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBeDefined();
    expect(body.role).toBeDefined();
    expect(body.gate).toBeDefined();
    expect(Array.isArray(body.tasks)).toBe(true);
  });

  test('POST /api/volunteer updates and returns profile', async () => {
    const newProfile = {
      name: 'Sam Smith',
      role: 'Medical First Aid',
      gate: 'A',
      tasks: [
        { id: 't1', text: 'Prepare first aid kit', completed: false }
      ]
    };
    const res = await app.inject({
      method: 'POST',
      url: '/api/volunteer',
      payload: newProfile,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('Sam Smith');
    expect(body.role).toBe('Medical First Aid');
    expect(body.gate).toBe('A');
  });

  test('POST /api/volunteer with invalid body returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/volunteer',
      payload: { name: '', role: '', gate: '' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Validation failed');
  });

  test('POST /api/volunteer with missing required fields returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/volunteer',
      payload: { role: 'Gate Monitor' },
    });
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/briefing returns structured briefing with all required fields', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/briefing?name=Sam&role=Medical&gate=B',
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
  });

  test('GET /api/briefing uses defaults when query params are absent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/briefing',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('summary');
    // Default name should appear in the summary
    expect(body.summary).toContain('Alex Morgan');
  });
});
