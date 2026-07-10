import { getProfile, updateProfile } from '../controllers/volunteerController.js';

/**
 * Registers volunteer profile routes.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function volunteerRoutes(fastify, opts) {
  fastify.get('/api/volunteer', getProfile);
  fastify.post('/api/volunteer', updateProfile);
}

export default volunteerRoutes;