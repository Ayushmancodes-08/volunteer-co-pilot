import { getCrowdData, getGateHistory } from '../controllers/crowdController.js';

/**
 * Registers crowd-related routes with validation options.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} _opts
 */
async function crowdRoutes(fastify, _opts) {
  fastify.get('/api/crowd', getCrowdData);
  fastify.get('/api/crowd/:gateId/history', {
    schema: {
      params: {
        type: 'object',
        required: ['gateId'],
        properties: {
          gateId: { type: 'string' }
        }
      }
    }
  }, getGateHistory);
}

export default crowdRoutes;