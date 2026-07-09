import { describe, it, expect, mock } from 'bun:test';
import * as genaiService from '../src/services/genaiService.js';

describe('parseJSONResponse', () => {
  it('parses clean JSON', () => {
    const result = genaiService.parseJSONResponse('{"gate":"A","occupancy":85}');
    expect(result.gate).toBe('A');
    expect(result.occupancy).toBe(85);
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n{"gate":"B","occupancy":90}\n```';
    const result = genaiService.parseJSONResponse(raw);
    expect(result.gate).toBe('B');
    expect(result.occupancy).toBe(90);
  });

  it('throws on invalid JSON', () => {
    expect(() => genaiService.parseJSONResponse('not json')).toThrow();
  });
});

describe('callGenAI', () => {
  it('throws when Gemini API key is not configured (default provider)', async () => {
    const originalProvider = process.env.GENAI_PROVIDER;
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.GENAI_PROVIDER = 'gemini';

    try {
      await expect(genaiService.callGenAI('test prompt')).rejects.toThrow(
        'GEMINI_API_KEY not configured'
      );
    } finally {
      if (originalProvider) process.env.GENAI_PROVIDER = originalProvider;
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('uses default gemini provider when GENAI_PROVIDER is unset', async () => {
    const originalProvider = process.env.GENAI_PROVIDER;
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GENAI_PROVIDER;
    delete process.env.GEMINI_API_KEY;

    try {
      await expect(genaiService.callGenAI('test')).rejects.toThrow(
        'GEMINI_API_KEY not configured'
      );
    } finally {
      if (originalProvider) process.env.GENAI_PROVIDER = originalProvider;
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('throws when Anthropic key is missing and provider set to anthropic', async () => {
    const originalProvider = process.env.GENAI_PROVIDER;
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    process.env.GENAI_PROVIDER = 'anthropic';

    try {
      await expect(genaiService.callGenAI('test prompt')).rejects.toThrow(
        'ANTHROPIC_API_KEY not configured'
      );
    } finally {
      if (originalProvider) process.env.GENAI_PROVIDER = originalProvider;
      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });
});

describe('buildReasoningPrompt', () => {
  it('includes gate and occupancy data', () => {
    const prompt = genaiService.buildReasoningPrompt('C', 85, [
      { gate: 'A', occupancy: 30 },
      { gate: 'C', occupancy: 85 },
    ]);
    expect(prompt).toContain('Gate C');
    expect(prompt).toContain('85%');
    expect(prompt).toContain('A: 30%');
  });
});

describe('buildTranslationPrompt', () => {
  it('includes tone based on urgent flag', () => {
    const calm = genaiService.buildTranslationPrompt('Hello', 'spanish', 'greeting', false);
    expect(calm).toContain('calm');

    const urgent = genaiService.buildTranslationPrompt('Evacuate', 'arabic', 'emergency_evacuation', true);
    expect(urgent).toContain('URGENT');
  });
});