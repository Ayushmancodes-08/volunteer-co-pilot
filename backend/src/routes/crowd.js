import { getCrowdData, getGateHistory } from '../controllers/crowdController.js';

/**
 * Registers crowd-related routes.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function crowdRoutes(fastify, opts) {
  fastify.get('/api/crowd', getCrowdData);
  fastify.get('/api/crowd/:gateId/history', getGateHistory);
}

export default crowdRoutes;