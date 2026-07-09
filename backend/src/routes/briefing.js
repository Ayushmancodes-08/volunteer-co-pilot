import { getBriefing } from '../controllers/briefingController.js';

async function briefingRoutes(fastify, options) {
  fastify.get('/api/briefing', getBriefing);
}

export default briefingRoutes;
