import { getBriefing } from '../controllers/briefingController.js';

/**
 * Registers the AI shift briefing route with validation options.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} _opts
 */
async function briefingRoutes(fastify, _opts) {
  fastify.get('/api/briefing', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string' },
          gate: { type: 'string' }
        }
      }
    }
  }, getBriefing);
}

export default briefingRoutes;