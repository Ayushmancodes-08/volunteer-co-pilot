import { FastifyInstance, RouteHandlerMethod } from 'fastify';

import { evaluateAlert, dismissAlert, getAlertHistory } from '../controllers/alertController';

async function alertRoutes(fastify: FastifyInstance, _opts: unknown) {
  fastify.post('/api/alerts/evaluate', {
    schema: {
      body: {
        type: 'object',
        required: ['gate', 'occupancy'],
        properties: {
          gate: { type: 'string' },
          occupancy: { type: 'number' },
          timestamp: { type: 'string' }
        }
      }
    }
  }, evaluateAlert);

  fastify.patch('/api/alerts/:id/dismiss', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, dismissAlert as RouteHandlerMethod);

  fastify.get('/api/alerts/history', getAlertHistory);
}

export default alertRoutes;
