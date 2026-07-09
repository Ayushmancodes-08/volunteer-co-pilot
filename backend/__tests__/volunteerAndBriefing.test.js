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
    expect(body.name).toBe('Alex Morgan');
    expect(body.role).toBe('Gate Monitor');
    expect(body.gate).toBe('C');
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

  test('GET /api/briefing returns structured briefing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/briefing?name=Sam&role=Medical&gate=B',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('summary');
    expect(body).toHaveProperty('weatherForecast');
    expect(body).toHaveProperty('announcements');
    expect(body).toHaveProperty('suggestedActions');
  });
});
