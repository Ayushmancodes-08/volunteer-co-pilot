import { getBriefing } from '../controllers/briefingController.js';

/**
 * Registers the AI shift briefing route.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function briefingRoutes(fastify, opts) {
  fastify.get('/api/briefing', getBriefing);
}

export default briefingRoutes;