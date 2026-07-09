import { getCrowdData } from '../controllers/crowdController.js';

async function crowdRoutes(fastify, opts) {
  fastify.get('/api/crowd', getCrowdData);
}

export default crowdRoutes;