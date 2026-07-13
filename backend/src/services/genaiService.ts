import { GeminiApiResponse, OpenAIApiResponse, AnthropicApiResponse } from '../types/index';

import * as cache from './cacheService';

const PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  GEMINI: 'gemini',
} as const;

type ProviderType = typeof PROVIDERS[keyof typeof PROVIDERS];

/** Maximum number of retry attempts for transient API errors. */
const MAX_RETRIES = 2;

/**
 * Retries an async function with exponential backoff on failure.
 * Only retries on transient errors (5xx or network failures). Does not retry
 * on client errors (4xx) since those indicate bad input, not transient failures.
 * In test environments (NODE_ENV=test), the backoff delay is 0 to prevent timeouts.
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  /** Base delay in ms — 0 in test environments to prevent test timeouts. */
  const BASE_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 200;
  let lastErr: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const errorObject = err instanceof Error ? err : new Error(String(err));
      lastErr = errorObject;
      // Don't retry on the last attempt, or on non-retryable errors
      if (attempt === maxRetries) {
        break;
      }
      const isRetryable = !errorObject.message.includes('(4');
      if (!isRetryable) {
        break;
      }
      // Exponential backoff: 200ms, 400ms, 800ms... (0 in test env)
      if (BASE_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * 2 ** attempt));
      }
    }
  }
  throw lastErr || new Error('Retry failed');
}

/**
 * Produces a compact, fixed-length cache key from a translation request tuple.
 * Uses a simple djb2-style hash of the concatenated key components so that
 * long user-supplied text strings do not bloat the Map's key memory.
 */
function buildTranslateCacheKey(
  text: string,
  targetLanguage: string,
  intent: string,
  urgent: boolean
): string {
  const raw = `${text}:${targetLanguage}:${intent}:${urgent}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash >>>= 0; // keep unsigned 32-bit
  }
  return `translate:${hash.toString(16)}`;
}

/**
 * Resolves the active GenAI provider from the GENAI_PROVIDER environment variable.
 * Defaults to 'gemini' if unset or unrecognized.
 */
function getProvider(): ProviderType {
  const env = process.env.GENAI_PROVIDER || 'gemini';
  if (env === PROVIDERS.OPENAI) { return PROVIDERS.OPENAI; }
  if (env === PROVIDERS.ANTHROPIC) { return PROVIDERS.ANTHROPIC; }
  return PROVIDERS.GEMINI;
}

/**
 * Builds the reasoning prompt for crowd alert evaluation.
 */
function buildReasoningPrompt(
  gate: string,
  occupancy: number,
  allGates: Array<{ gate: string; occupancy: number }>
): string {
  const gateSummary = allGates.map((g) => `${g.gate}: ${g.occupancy}%`).join(', ');
  return `You are a FIFA World Cup 2026 crowd management assistant. A stadium volunteer needs an immediate action.

Gate ${gate} is at ${occupancy}% capacity (critical threshold exceeded).
Current gate occupancies: ${gateSummary}.

Respond with ONLY valid JSON (no markdown, no code fences) in this exact shape:
{
  "gate": "${gate}",
  "occupancy": ${occupancy},
  "action": "short action instruction",
  "reasoning": "one-sentence plain-English justification"
}`;
}

/**
 * Builds the translation prompt for multilingual fan communication.
 */
function buildTranslationPrompt(
  text: string,
  targetLanguage: string,
  intent: string,
  urgent: boolean
): string {
  const tone = urgent ? 'URGENT and direct' : 'calm and helpful';
  const intentGuide: Record<string, string> = {
    redirect: 'directing fans to another gate or area',
    medical_urgency: 'requesting medical assistance for an injured person',
    general_info: 'providing general information to fans',
    greeting: 'greeting and welcoming fans',
    emergency_evacuation: 'instructing fans to evacuate calmly',
  };

  return `You are a FIFA World Cup 2026 multilingual assistant. Translate the following message to ${targetLanguage} with a ${tone} tone. The intent is: ${intentGuide[intent] || 'general communication'}.

Original message: "${text}"

Respond with ONLY valid JSON (no markdown, no code fences) in this exact shape:
{
  "translatedText": "translated message in ${targetLanguage}",
  "phonetic": "romanized/phonetic pronunciation guide for the translated text"
}`;
}

/**
 * Calls the Gemini API with the given prompt.
 */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { throw new Error('GEMINI_API_KEY not configured'); }
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  return retryWithBackoff(async () => {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Gemini API error (${resp.status}): ${err}`);
    }

    const data = (await resp.json()) as GeminiApiResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  });
}

/**
 * Calls the OpenAI Chat Completions API with the given prompt.
 */
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { throw new Error('OPENAI_API_KEY not configured'); }
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  return retryWithBackoff(async () => {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`OpenAI API error (${resp.status}): ${err}`);
    }

    const data = (await resp.json()) as OpenAIApiResponse;
    return data.choices?.[0]?.message?.content ?? '';
  });
}

/**
 * Calls the Anthropic Messages API with the given prompt.
 */
async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { throw new Error('ANTHROPIC_API_KEY not configured'); }
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

  return retryWithBackoff(async () => {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Anthropic API error (${resp.status}): ${err}`);
    }

    const data = (await resp.json()) as AnthropicApiResponse;
    return data.content?.[0]?.text ?? '';
  });
}

/**
 * Routes a prompt to the configured GenAI provider and returns the raw text response.
 */
async function callGenAI(prompt: string): Promise<string> {
  const provider = getProvider();

  switch (provider) {
    case PROVIDERS.OPENAI:
      return callOpenAI(prompt);
    case PROVIDERS.ANTHROPIC:
      return callAnthropic(prompt);
    default:
      return callGemini(prompt);
  }
}

/**
 * Strips optional markdown code fences from a raw LLM response and parses it as JSON.
 * Rejects responses exceeding a safe size threshold to prevent memory exhaustion
 * from unexpectedly large model outputs.
 */
function parseJSONResponse(raw: string, maxBytes = 8192): unknown {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) { cleaned = cleaned.slice(7); }
  if (cleaned.startsWith('```')) { cleaned = cleaned.slice(3); }
  if (cleaned.endsWith('```')) { cleaned = cleaned.slice(0, -3); }
  cleaned = cleaned.trim();

  if (cleaned.length > maxBytes) {
    throw new Error(`GenAI response exceeded maximum allowed size (${cleaned.length} > ${maxBytes} bytes)`);
  }

  return JSON.parse(cleaned);
}

/**
 * Requests an AI-generated crowd alert recommendation for a specific gate.
 */
async function getAlertRecommendation(
  gate: string,
  occupancy: number,
  allGates: Array<{ gate: string; occupancy: number }>
): Promise<unknown> {
  const prompt = buildReasoningPrompt(gate, occupancy, allGates);
  const raw = await callGenAI(prompt);
  return parseJSONResponse(raw);
}

/**
 * Translates a message to the target language using GenAI.
 * Results are cached by a hashed (text + language + intent + urgent) key for 5 minutes.
 * Using a hash keeps cache key memory constant regardless of input text length.
 */
async function translateText(
  text: string,
  targetLanguage: string,
  intent = 'general_info',
  urgent = false
): Promise<unknown> {
  const cacheKey = buildTranslateCacheKey(text, targetLanguage, intent, urgent);
  const cached = cache.get(cacheKey);
  if (cached) { return cached; }

  const prompt = buildTranslationPrompt(text, targetLanguage, intent, urgent);
  const raw = await callGenAI(prompt);
  const result = parseJSONResponse(raw);

  cache.set(cacheKey, result);
  return result;
}

export {
  getAlertRecommendation,
  translateText,
  callGenAI,
  parseJSONResponse,
  buildReasoningPrompt,
  buildTranslationPrompt,
  buildTranslateCacheKey,
  retryWithBackoff,
  MAX_RETRIES,
};
