import * as crowdService from '../services/crowdService.js';

/** Regex for valid gate identifiers — 1–5 alphanumeric characters. */
const VALID_GATE_PATTERN = /^[A-Za-z0-9]{1,5}$/;

/**
 * Returns live crowd data for all gates, including the last 8 occupancy history
 * readings (as a simple number array) for sparkline rendering on the frontend.
 * History is automatically recorded by the service layer on each call.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function getCrowdData(request, reply) {
  // getCrowdData() in the service now records occupancy and attaches history
  const data = crowdService.getCrowdData();

  return reply.send({ gates: data, timestamp: new Date().toISOString() });
}

/**
 * Returns the full occupancy history for a specific gate by its ID.
 * Rejects malformed gate identifiers with a 400 to prevent path traversal or
 * injection via the gateId parameter.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function getGateHistory(request, reply) {
  const { gateId } = request.params;

  if (!VALID_GATE_PATTERN.test(gateId)) {
    return reply.status(400).send({ error: 'Invalid gate ID format' });
  }

  const history = crowdService.getOccupancyHistory(gateId.toUpperCase());
  return reply.send({ gateId: gateId.toUpperCase(), history });
}

export { getCrowdData, getGateHistory };