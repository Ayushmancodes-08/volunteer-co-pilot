import { getProfile, updateProfile } from '../controllers/volunteerController.js';

async function volunteerRoutes(fastify, options) {
  fastify.get('/api/volunteer', getProfile);
  fastify.post('/api/volunteer', updateProfile);
}

export default volunteerRoutes;
