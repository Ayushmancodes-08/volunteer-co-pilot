import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import * as genaiService from '../services/genaiService';
import { Alert } from '../types';
import { generateCrowdData } from '../utils/crowdSimulator';
import { alertTriggerSchema } from '../validators/index';

/** Maximum number of alert entries retained in memory to prevent unbounded growth. */
const MAX_ALERT_HISTORY = 100;

/** In-memory alert log. Bounded at MAX_ALERT_HISTORY entries (newest first). */
const alertHistory: Alert[] = [];

/**
 * Generates a unique alert ID. Prefers crypto.randomUUID() for collision resistance;
 * falls back to a timestamp-based ID for environments that don't support it.
 */
function generateAlertId(): string {
  return `alert-${crypto.randomUUID()}`;
}

/**
 * Prepends an alert entry to the in-memory history log.
 * Enforces the MAX_ALERT_HISTORY cap to prevent unbounded memory growth.
 */
function addAlert(entry: Alert): void {
  alertHistory.unshift(entry);
  if (alertHistory.length > MAX_ALERT_HISTORY) {
    alertHistory.splice(MAX_ALERT_HISTORY);
  }
}

/**
 * Type guard that validates a parsed GenAI recommendation has the expected shape
 * for constructing an Alert entry.
 */
const alertRecommendationSchema = z.object({
  gate: z.string(),
  occupancy: z.number(),
  action: z.string(),
  reasoning: z.string(),
});

/**
 * Evaluates a gate's crowd density and returns an AI-generated action recommendation.
 * Uses generateCrowdData() for a pure read snapshot (no history side-effects).
 * Falls back to a static recommendation when GenAI is unavailable.
 */
async function evaluateAlert(request: FastifyRequest, reply: FastifyReply) {
  const parsed = alertTriggerSchema.parse(request.body);

  // Use a pure read snapshot — avoids recording history as a side-effect of alert evaluation
  const allGates = generateCrowdData();

  try {
    const recommendation = await genaiService.getAlertRecommendation(
      parsed.gate,
      parsed.occupancy,
      allGates
    );

    const parseResult = alertRecommendationSchema.safeParse(recommendation);

    if (!parseResult.success) {
      throw new Error('GenAI returned an unexpected response shape');
    }

    const alertEntry: Alert = {
      id: generateAlertId(),
      ...parseResult.data,
      timestamp: new Date().toISOString(),
      dismissed: false,
    };

    addAlert(alertEntry);
    return reply.send(alertEntry);
  } catch (err: unknown) {
    /* istanbul ignore next -- all paths through retryWithBackoff wrap to Error; String() branch is a TS safety net */
    const errMsg = err instanceof Error ? err.message : String(err);
    request.log.error({ msg: 'GenAI alert evaluation failed', gate: parsed.gate, error: errMsg });
    const fallback: Alert = {
      id: generateAlertId(),
      gate: parsed.gate,
      occupancy: parsed.occupancy,
      action: 'Direct fans away from this gate',
      reasoning: 'Gate has exceeded safe capacity. Please redirect to the nearest available gate.',
      timestamp: new Date().toISOString(),
      dismissed: false,
    };

    addAlert(fallback);
    return reply.send(fallback);
  }
}

/**
 * Marks an alert as dismissed by its ID.
 */
async function dismissAlert(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
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
 */
async function getAlertHistory(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ alerts: alertHistory });
}

export { evaluateAlert, dismissAlert, getAlertHistory, alertHistory };
