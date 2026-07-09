import * as crowdService from '../services/crowdService.js';
import * as genaiService from '../services/genaiService.js';
import { alertTriggerSchema } from '../validators/index.js';

const alertHistory = [];

async function evaluateAlert(request, reply) {
  const parsed = alertTriggerSchema.parse(request.body);

  const allGates = crowdService.getCrowdData();

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

    return reply.send(alertEntry);
  } catch (err) {
    request.log.error(err, 'GenAI alert evaluation failed');
    const fallback = {
      gate: parsed.gate,
      occupancy: parsed.occupancy,
      action: 'Direct fans away from this gate',
      reasoning: 'Gate has exceeded safe capacity. Please redirect to the nearest available gate.',
      timestamp: new Date().toISOString(),
    };
    return reply.send(fallback);
  }
}

async function dismissAlert(request, reply) {
  const { id } = request.params;
  const entry = alertHistory.find((a) => a.id === id);
  if (!entry) {
    return reply.status(404).send({ error: 'Alert not found' });
  }
  entry.dismissed = true;
  return reply.send({ success: true, id });
}

async function getAlertHistory(request, reply) {
  return reply.send({ alerts: alertHistory });
}

export { evaluateAlert, dismissAlert, getAlertHistory };