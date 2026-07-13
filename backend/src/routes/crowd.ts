import { FastifyInstance, RouteHandlerMethod } from 'fastify';

import { getCrowdData, getGateHistory } from '../controllers/crowdController';

async function crowdRoutes(fastify: FastifyInstance, _opts: unknown) {
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
  }, getGateHistory as RouteHandlerMethod);
}

export default crowdRoutes;
