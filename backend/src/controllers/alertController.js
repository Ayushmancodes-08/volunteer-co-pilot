import * as crowdService from '../services/crowdService.js';
import * as genaiService from '../services/genaiService.js';
import { alertTriggerSchema } from '../validators/index.js';
import { generateCrowdData } from '../utils/crowdSimulator.js';

/** Maximum number of alert entries retained in memory to prevent unbounded growth. */
const MAX_ALERT_HISTORY = 100;

/** In-memory alert log. Bounded at MAX_ALERT_HISTORY entries (newest first). */
const alertHistory = [];

/**
 * Evaluates a gate's crowd density and returns an AI-generated action recommendation.
 * Uses generateCrowdData() for a pure read snapshot (no history side-effects).
 * Falls back to a static recommendation when GenAI is unavailable.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function evaluateAlert(request, reply) {
  const parsed = alertTriggerSchema.parse(request.body);

  // Use a pure read snapshot — avoids recording history as a side-effect of alert evaluation
  const allGates = generateCrowdData();

  try {
    const recommendation = await genaiService.getAlertRecommendation(
      parsed.gate,
      parsed.occupancy,
      allGates
    );

    const alertEntry = {
      id: `alert-${Date.now()}`,
      ...recommendation,
      timestamp: new Date().toISOString(),
      dismissed: false,
    };

    alertHistory.unshift(alertEntry);

    // Prevent unbounded memory growth
    if (alertHistory.length > MAX_ALERT_HISTORY) {
      alertHistory.splice(MAX_ALERT_HISTORY);
    }

    return reply.send(alertEntry);
  } catch (err) {
    request.log.error({ msg: 'GenAI alert evaluation failed', gate: parsed.gate }, err.message);
    const fallback = {
      id: `alert-${Date.now()}`,
      gate: parsed.gate,
      occupancy: parsed.occupancy,
      action: 'Direct fans away from this gate',
      reasoning: 'Gate has exceeded safe capacity. Please redirect to the nearest available gate.',
      timestamp: new Date().toISOString(),
      dismissed: false,
    };

    alertHistory.unshift(fallback);
    if (alertHistory.length > MAX_ALERT_HISTORY) {
      alertHistory.splice(MAX_ALERT_HISTORY);
    }

    return reply.send(fallback);
  }
}

/**
 * Marks an alert as dismissed by its ID.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function dismissAlert(request, reply) {
  const { id } = request.params;
  const entry = alertHistory.find((a) => a.id === id);
  if (!entry) {
    return reply.status(404).send({ error: 'Alert not found' });
  }
  entry.dismissed = true;
  return reply.send({ success: true, id });
}

/**
 * Returns the full in-memory alert history log.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function getAlertHistory(request, reply) {
  return reply.send({ alerts: alertHistory });
}

export { evaluateAlert, dismissAlert, getAlertHistory };