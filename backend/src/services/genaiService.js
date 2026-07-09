import * as cache from './cacheService.js';

const PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  GEMINI: 'gemini',
};

function getProvider() {
  const env = process.env.GENAI_PROVIDER || 'gemini';
  if (env === PROVIDERS.OPENAI) return PROVIDERS.OPENAI;
  if (env === PROVIDERS.ANTHROPIC) return PROVIDERS.ANTHROPIC;
  return PROVIDERS.GEMINI;
}

function buildReasoningPrompt(gate, occupancy, allGates) {
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

function buildTranslationPrompt(text, targetLanguage, intent, urgent) {
  const tone = urgent ? 'URGENT and direct' : 'calm and helpful';
  const intentGuide = {
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

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

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

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

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

  const data = await resp.json();
  return data.content?.[0]?.text || '';
}

async function callGenAI(prompt) {
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

function parseJSONResponse(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim());
}

async function getAlertRecommendation(gate, occupancy, allGates) {
  const prompt = buildReasoningPrompt(gate, occupancy, allGates);
  const raw = await callGenAI(prompt);
  return parseJSONResponse(raw);
}

async function translateText(text, targetLanguage, intent = 'general_info', urgent = false) {
  const cacheKey = `translate:${text}:${targetLanguage}:${intent}:${urgent}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

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
};