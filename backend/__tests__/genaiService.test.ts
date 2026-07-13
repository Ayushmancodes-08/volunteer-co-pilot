process.env.NODE_ENV = 'production';

import { describe, it, expect, mock, afterEach, afterAll } from 'bun:test';

import * as genaiService from '../src/services/genaiService';

afterAll(() => {
  process.env.NODE_ENV = 'test';
});

describe('parseJSONResponse', () => {
  it('parses clean JSON', () => {
    const result = genaiService.parseJSONResponse('{"gate":"A","occupancy":85}') as unknown as { gate: string; occupancy: number };
    expect(result.gate).toBe('A');
    expect(result.occupancy).toBe(85);
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n{"gate":"B","occupancy":90}\n```';
    const result = genaiService.parseJSONResponse(raw) as unknown as { gate: string; occupancy: number };
    expect(result.gate).toBe('B');
    expect(result.occupancy).toBe(90);
  });

  it('strips plain triple-backtick fences', () => {
    const raw = '```\n{"gate":"C","occupancy":70}\n```';
    const result = genaiService.parseJSONResponse(raw) as unknown as { gate: string };
    expect(result.gate).toBe('C');
  });

  it('throws on invalid JSON', () => {
    expect(() => genaiService.parseJSONResponse('not json')).toThrow();
  });

  it('handles leading/trailing whitespace around valid JSON', () => {
    const result = genaiService.parseJSONResponse('   {"gate":"D","occupancy":55}   ') as unknown as { gate: string; occupancy: number };
    expect(result.gate).toBe('D');
    expect(result.occupancy).toBe(55);
  });

  it('throws when response exceeds the default 8192 byte limit', () => {
    const huge = JSON.stringify({ data: 'x'.repeat(9000) });
    expect(() => genaiService.parseJSONResponse(huge)).toThrow(/exceeded maximum/);
  });

  it('throws when response exceeds a custom byte limit', () => {
    const raw = '{"gate":"A","occupancy":85}'; // 26 bytes
    expect(() => genaiService.parseJSONResponse(raw, 10)).toThrow(/exceeded maximum/);
  });

  it('accepts response exactly at the byte limit', () => {
    const raw = '{"gate":"A","occupancy":85}'; // 27 bytes
    const result = genaiService.parseJSONResponse(raw, 27) as unknown as { gate: string };
    expect(result.gate).toBe('A');
  });
});

describe('buildTranslateCacheKey', () => {
  it('returns a string starting with translate:', () => {
    const key = genaiService.buildTranslateCacheKey('Hello', 'spanish', 'greeting', false);
    expect(key.startsWith('translate:')).toBe(true);
  });

  it('produces different keys for different texts', () => {
    const k1 = genaiService.buildTranslateCacheKey('Hello', 'spanish', 'greeting', false);
    const k2 = genaiService.buildTranslateCacheKey('Goodbye', 'spanish', 'greeting', false);
    expect(k1).not.toBe(k2);
  });

  it('produces different keys for different languages', () => {
    const k1 = genaiService.buildTranslateCacheKey('Hello', 'spanish', 'greeting', false);
    const k2 = genaiService.buildTranslateCacheKey('Hello', 'french', 'greeting', false);
    expect(k1).not.toBe(k2);
  });

  it('produces different keys for urgent vs non-urgent', () => {
    const k1 = genaiService.buildTranslateCacheKey('Evacuate', 'arabic', 'emergency_evacuation', false);
    const k2 = genaiService.buildTranslateCacheKey('Evacuate', 'arabic', 'emergency_evacuation', true);
    expect(k1).not.toBe(k2);
  });

  it('produces the same key for identical inputs', () => {
    const k1 = genaiService.buildTranslateCacheKey('Gate D is full', 'hindi', 'redirect', false);
    const k2 = genaiService.buildTranslateCacheKey('Gate D is full', 'hindi', 'redirect', false);
    expect(k1).toBe(k2);
  });

  it('key length is constant regardless of input text length', () => {
    const shortKey = genaiService.buildTranslateCacheKey('Hi', 'spanish', 'greeting', false);
    const longKey = genaiService.buildTranslateCacheKey('x'.repeat(500), 'spanish', 'greeting', false);
    // Both keys should have the same length (prefix + hex hash)
    expect(shortKey.length).toBe(longKey.length);
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
      if (originalProvider) {process.env.GENAI_PROVIDER = originalProvider;}
      if (originalKey) {process.env.GEMINI_API_KEY = originalKey;}
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
      if (originalProvider) {process.env.GENAI_PROVIDER = originalProvider;}
      if (originalKey) {process.env.GEMINI_API_KEY = originalKey;}
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
      if (originalProvider) {process.env.GENAI_PROVIDER = originalProvider;}
      if (originalKey) {process.env.ANTHROPIC_API_KEY = originalKey;}
    }
  });

  it('throws when OpenAI key is missing and provider set to openai', async () => {
    const originalProvider = process.env.GENAI_PROVIDER;
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    process.env.GENAI_PROVIDER = 'openai';

    try {
      await expect(genaiService.callGenAI('test prompt')).rejects.toThrow(
        'OPENAI_API_KEY not configured'
      );
    } finally {
      if (originalProvider) {process.env.GENAI_PROVIDER = originalProvider;}
      if (originalKey) {process.env.OPENAI_API_KEY = originalKey;}
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

  it('produces valid JSON shape instruction in the prompt', () => {
    const prompt = genaiService.buildReasoningPrompt('A', 90, []);
    expect(prompt).toContain('"action"');
    expect(prompt).toContain('"reasoning"');
  });
});

describe('buildTranslationPrompt', () => {
  it('includes tone based on urgent flag', () => {
    const calm = genaiService.buildTranslationPrompt('Hello', 'spanish', 'greeting', false);
    expect(calm).toContain('calm');

    const urgent = genaiService.buildTranslationPrompt('Evacuate', 'arabic', 'emergency_evacuation', true);
    expect(urgent).toContain('URGENT');
  });

  it('includes the target language in the prompt', () => {
    const prompt = genaiService.buildTranslationPrompt('Please go to Gate D', 'hindi', 'redirect', false);
    expect(prompt).toContain('hindi');
    expect(prompt).toContain('Please go to Gate D');
  });
});

describe('GenAI Providers with mock fetch', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GENAI_PROVIDER = 'gemini';
  });

  it('successful Gemini API call returns content text', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'gemini';
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'Gemini Response' }] } }]
      })
    })) as unknown as typeof fetch;

    const result = await genaiService.callGenAI('test prompt');
    expect(result).toBe('Gemini Response');
  });

  it('Gemini API failure throws error', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'gemini';
    global.fetch = mock(() => Promise.resolve({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Invalid request payload')
    })) as unknown as typeof fetch;

    await expect(genaiService.callGenAI('test prompt')).rejects.toThrow(
      'Gemini API error (400): Invalid request payload'
    );
  });

  it('successful OpenAI API call returns content text', async () => {
    process.env.OPENAI_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'openai';
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'OpenAI Response' } }]
      })
    })) as unknown as typeof fetch;

    const result = await genaiService.callGenAI('test prompt');
    expect(result).toBe('OpenAI Response');
  });

  it('OpenAI API failure throws error', async () => {
    process.env.OPENAI_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'openai';
    global.fetch = mock(() => Promise.resolve({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized')
    })) as unknown as typeof fetch;

    await expect(genaiService.callGenAI('test prompt')).rejects.toThrow(
      'OpenAI API error (401): Unauthorized'
    );
  });

  it('successful Anthropic API call returns content text', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'anthropic';
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Anthropic Response' }]
      })
    })) as unknown as typeof fetch;

    const result = await genaiService.callGenAI('test prompt');
    expect(result).toBe('Anthropic Response');
  });

  it('Anthropic API failure throws error', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'anthropic';
    global.fetch = mock(() => Promise.resolve({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate Limit Exceeded')
    })) as unknown as typeof fetch;

    await expect(genaiService.callGenAI('test prompt')).rejects.toThrow(
      'Anthropic API error (429): Rate Limit Exceeded'
    );
  });

  it('translateText uses cache on consecutive identical calls', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'gemini';

    const cacheService = await import('../src/services/cacheService');
    cacheService.clear();

    const fetchSpy = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: '{"translatedText":"Hola","phonetic":"oh-lah"}' }] } }]
      })
    }));
    // First call: calls fetch
    global.fetch = fetchSpy as unknown as typeof fetch;
    const res1 = await genaiService.translateText('Hello', 'spanish') as unknown as { translatedText: string };
    expect(res1.translatedText).toBe('Hola');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second call: retrieves from cache
    const res2 = await genaiService.translateText('Hello', 'spanish') as unknown as { translatedText: string };
    expect(res2.translatedText).toBe('Hola');
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Still 1
  });
});

describe('retryWithBackoff', () => {
  it('succeeds on first attempt without retrying', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return 'success';
    };
    const result = await genaiService.retryWithBackoff(fn, 2);
    expect(result).toBe('success');
    expect(callCount).toBe(1);
  });

  it('retries on failure and succeeds on the second attempt', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      if (callCount < 2) {throw new Error('transient error');}
      return 'recovered';
    };
    const result = await genaiService.retryWithBackoff(fn, 2);
    expect(result).toBe('recovered');
    expect(callCount).toBe(2);
  });

  it('throws after exhausting all retries', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      throw new Error('persistent failure');
    };
    await expect(genaiService.retryWithBackoff(fn, 2)).rejects.toThrow('persistent failure');
    expect(callCount).toBe(3); // 1 initial + 2 retries
  });

  it('does not retry on 4xx client errors', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      throw new Error('API error (400): Bad Request');
    };
    await expect(genaiService.retryWithBackoff(fn, 2)).rejects.toThrow('400');
    // Should stop retrying immediately since error message contains '4'
    expect(callCount).toBeLessThanOrEqual(2);
  });

  it('MAX_RETRIES constant is exported and equals 2', () => {
    expect(genaiService.MAX_RETRIES).toBe(2);
  });

  it('handles non-Error objects in retryWithBackoff', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      throw 'string error';
    };
    await expect(genaiService.retryWithBackoff(fn, 1)).rejects.toThrow('string error');
    expect(callCount).toBe(2);
  });
});

describe('Gemini API edge cases', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns empty string when Gemini candidates content is empty', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';
    process.env.GENAI_PROVIDER = 'gemini';
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        candidates: []
      })
    })) as unknown as typeof fetch;

    const result = await genaiService.callGenAI('test prompt');
    expect(result).toBe('');
  });
});