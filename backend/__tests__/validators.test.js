import { describe, it, expect } from 'bun:test';
import { alertTriggerSchema, translateRequestSchema } from '../src/validators/index.js';

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

  it('rejects text over 2000 chars', () => {
    expect(() =>
      translateRequestSchema.parse({
        text: 'x'.repeat(2001),
        targetLanguage: 'hindi',
      })
    ).toThrow();
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