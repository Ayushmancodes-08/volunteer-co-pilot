import { FastifyInstance } from 'fastify';

import { getProfile, updateProfile } from '../controllers/volunteerController';

async function volunteerRoutes(fastify: FastifyInstance, _opts: unknown) {
  fastify.get('/api/volunteer', getProfile);
  fastify.post('/api/volunteer', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'role', 'gate'],
        properties: {
          name: { type: 'string' },
          role: { type: 'string' },
          gate: { type: 'string' },
          shiftStart: { type: 'string' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'text', 'completed'],
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                completed: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, updateProfile);
}

export default volunteerRoutes;
