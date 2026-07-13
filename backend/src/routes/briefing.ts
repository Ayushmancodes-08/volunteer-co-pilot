import { FastifyInstance, RouteHandlerMethod } from 'fastify';

import { getBriefing } from '../controllers/briefingController';

async function briefingRoutes(fastify: FastifyInstance, _opts: unknown) {
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
  }, getBriefing as RouteHandlerMethod);
}

export default briefingRoutes;
