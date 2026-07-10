import * as genaiService from '../services/genaiService.js';
import { generateCrowdData } from '../utils/crowdSimulator.js';

/** Maximum character length for volunteer query parameters to prevent prompt injection. */
const MAX_PARAM_LENGTH = 100;

/**
 * Sanitizes a string query parameter for safe embedding in GenAI prompts.
 * Trims whitespace, enforces max length, and strips characters that could
 * be used to inject instructions into a prompt (angle brackets, quotes, newlines).
 *
 * @param {string} value - Raw query parameter value.
 * @param {string} fallback - Default value if the param is empty after trimming.
 * @param {number} [maxLen=MAX_PARAM_LENGTH] - Maximum allowed length.
 * @returns {string} Sanitized value safe for prompt interpolation.
 */
function sanitizeParam(value, fallback, maxLen = MAX_PARAM_LENGTH) {
  if (!value || typeof value !== 'string') return fallback;
  // Strip characters that could be used for prompt injection
  const cleaned = value.replace(/[<>"'\n\r\\{}[\]]/g, '').trim().slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Generates an AI-powered shift briefing for a volunteer.
 * Falls back to a structured static briefing when GenAI is unavailable.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function getBriefing(request, reply) {
  const name = sanitizeParam(request.query.name, 'Alex Morgan');
  const role = sanitizeParam(request.query.role, 'Gate Monitor');
  const gate = sanitizeParam(request.query.gate, 'C', 5);

  // Use generateCrowdData directly — pure read with no history side-effects
  const allGates = generateCrowdData();
  const criticalGates = allGates.filter(g => g.occupancy >= 80).map(g => g.gate);

  const prompt = `You are a FIFA World Cup 2026 stadium operations coordinator. Generate a shift briefing for a volunteer.
Volunteer Details:
- Name: ${name}
- Role: ${role}
- Assigned Gate: ${gate}
- Current Gate Occupancies: ${allGates.map(g => `${g.gate}: ${g.occupancy}%`).join(', ')}
- Critical Gates (>=80%): ${criticalGates.length > 0 ? criticalGates.join(', ') : 'None'}

Stadium Status:
- Weather: 22°C (72°F), partly cloudy. Wind: 10 km/h.
- Transport status: Metro line 1 running with 3-minute intervals. Shuttle buses active.
- Upcoming match: USA vs England (Kickoff at 19:00 local time). Peak flow expected at 17:30.

Respond with ONLY valid JSON (no markdown, no code fences) in this exact shape:
{
  "summary": "a warm welcoming summary addressing the volunteer by name and advising them on their shift prep",
  "weatherForecast": "brief weather note",
  "crowdOutlook": "brief expectation about crowd arrival peaks",
  "announcements": [
    "announcement 1",
    "announcement 2"
  ],
  "suggestedActions": [
    "action 1",
    "action 2",
    "action 3"
  ]
}`;

  try {
    const raw = await genaiService.callGenAI(prompt);
    const parsed = genaiService.parseJSONResponse(raw);
    return reply.send(parsed);
  } catch (err) {
    request.log.error({ msg: 'Briefing GenAI call failed, returning fallback briefing', gate });

    // Structured mock briefing fallback
    const fallback = {
      summary: `Welcome to your shift, ${name}! As a ${role} assigned to Gate ${gate}, your primary objective is ensuring a smooth, safe flow for fans. Keep an eye on adjacent gate levels to help reroute crowds if needed.`,
      weatherForecast: "22°C (72°F), Partly Cloudy. Ideal stadium conditions, light breeze.",
      crowdOutlook: "High attendance match tonight. Peak incoming flow expected between 17:00 and 18:30. Gates B and C are anticipated to see the highest density.",
      announcements: [
        "Language support volunteers are pre-positioned at information booths.",
        "Evacuation routes are clear. Always keep emergency exits unobstructed.",
        "Metro frequency increased to 3 mins post-match to ensure rapid dispersal."
      ],
      suggestedActions: [
        `Pre-check the sensor terminals at Gate ${gate} before gates open.`,
        "Familiarize yourself with the Spanish/French scripts for crowd rerouting.",
        "Ensure your radio or communication app is fully charged and tuned to operations channel."
      ]
    };
    return reply.send(fallback);
  }
}

export { getBriefing };
