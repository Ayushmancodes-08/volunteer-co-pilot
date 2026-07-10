import { describe, it, expect } from 'bun:test';
import { alertTriggerSchema, translateRequestSchema, volunteerSchema } from '../src/validators/index.js';

describe('alertTriggerSchema', () => {
  it('accepts valid alert data', () => {
    const result = alertTriggerSchema.parse({
      gate: 'A',
      occupancy: 85,
      timestamp: '2026-07-09T22:00:00Z',
    });
    expect(result.gate).toBe('A');
    expect(result.occupancy).toBe(85);
  });

  it('rejects negative occupancy', () => {
    expect(() =>
      alertTriggerSchema.parse({ gate: 'A', occupancy: -5 })
    ).toThrow();
  });

  it('rejects occupancy over 100', () => {
    expect(() =>
      alertTriggerSchema.parse({ gate: 'A', occupancy: 150 })
    ).toThrow();
  });

  it('rejects missing gate', () => {
    expect(() =>
      alertTriggerSchema.parse({ occupancy: 50 })
    ).toThrow();
  });

  it('rejects empty gate string', () => {
    expect(() =>
      alertTriggerSchema.parse({ gate: '', occupancy: 50 })
    ).toThrow();
  });

  it('rejects gate with special characters (non-alphanumeric)', () => {
    expect(() =>
      alertTriggerSchema.parse({ gate: 'A!', occupancy: 50 })
    ).toThrow();
  });

  it('rejects gate with underscore', () => {
    expect(() =>
      alertTriggerSchema.parse({ gate: 'A_1', occupancy: 50 })
    ).toThrow();
  });

  it('accepts multi-char alphanumeric gate (e.g. A1)', () => {
    const result = alertTriggerSchema.parse({ gate: 'A1', occupancy: 50 });
    expect(result.gate).toBe('A1');
  });
});

describe('translateRequestSchema', () => {
  const validRequest = {
    text: 'Please proceed to Gate D',
    targetLanguage: 'spanish',
    intent: 'redirect',
    urgent: false,
  };

  it('accepts valid translation request', () => {
    const result = translateRequestSchema.parse(validRequest);
    expect(result.targetLanguage).toBe('spanish');
    expect(result.intent).toBe('redirect');
  });

  it('defaults intent and urgent when omitted', () => {
    const result = translateRequestSchema.parse({
      text: 'Hello',
      targetLanguage: 'french',
    });
    expect(result.intent).toBe('general_info');
    expect(result.urgent).toBe(false);
  });

  it('rejects text over 500 chars (new tighter limit)', () => {
    expect(() =>
      translateRequestSchema.parse({
        text: 'x'.repeat(501),
        targetLanguage: 'hindi',
      })
    ).toThrow();
  });

  it('accepts text exactly at 500 chars', () => {
    const result = translateRequestSchema.parse({
      text: 'x'.repeat(500),
      targetLanguage: 'hindi',
    });
    expect(result.text.length).toBe(500);
  });

  it('rejects invalid language', () => {
    expect(() =>
      translateRequestSchema.parse({ text: 'Hello', targetLanguage: 'klingon' })
    ).toThrow();
  });

  it('rejects empty text', () => {
    expect(() =>
      translateRequestSchema.parse({ text: '', targetLanguage: 'arabic' })
    ).toThrow();
  });
});

describe('volunteerSchema', () => {
  it('accepts valid profile with tasks', () => {
    const result = volunteerSchema.parse({
      name: 'Alex Morgan',
      role: 'Gate Monitor',
      gate: 'C',
      tasks: [{ id: 't1', text: 'Check sensors', completed: false }],
    });
    expect(result.name).toBe('Alex Morgan');
    expect(result.tasks).toHaveLength(1);
  });

  it('rejects task id exceeding 64 chars', () => {
    expect(() =>
      volunteerSchema.parse({
        name: 'Alex',
        role: 'Monitor',
        gate: 'A',
        tasks: [{ id: 'x'.repeat(65), text: 'Task', completed: false }],
      })
    ).toThrow();
  });

  it('rejects task text exceeding 300 chars', () => {
    expect(() =>
      volunteerSchema.parse({
        name: 'Alex',
        role: 'Monitor',
        gate: 'A',
        tasks: [{ id: 't1', text: 'x'.repeat(301), completed: false }],
      })
    ).toThrow();
  });

  it('rejects more than 50 tasks', () => {
    const tasks = Array.from({ length: 51 }, (_, i) => ({
      id: `t${i}`,
      text: `Task ${i}`,
      completed: false,
    }));
    expect(() =>
      volunteerSchema.parse({ name: 'Alex', role: 'Monitor', gate: 'A', tasks })
    ).toThrow();
  });

  it('accepts exactly 50 tasks', () => {
    const tasks = Array.from({ length: 50 }, (_, i) => ({
      id: `t${i}`,
      text: `Task ${i}`,
      completed: false,
    }));
    const result = volunteerSchema.parse({ name: 'Alex', role: 'Monitor', gate: 'A', tasks });
    expect(result.tasks).toHaveLength(50);
  });

  it('rejects gate with special characters', () => {
    expect(() =>
      volunteerSchema.parse({ name: 'Alex', role: 'Monitor', gate: 'A!' })
    ).toThrow();
  });

  it('defaults tasks to empty array when omitted', () => {
    const result = volunteerSchema.parse({ name: 'Alex', role: 'Monitor', gate: 'B' });
    expect(result.tasks).toEqual([]);
  });
});
