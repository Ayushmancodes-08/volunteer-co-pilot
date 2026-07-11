import { evaluateAlert, dismissAlert, getAlertHistory } from '../controllers/alertController.js';

/**
 * Registers alert evaluation and management routes with validation options.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} _opts
 */
async function alertRoutes(fastify, _opts) {
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
  }, dismissAlert);

  fastify.get('/api/alerts/history', getAlertHistory);
}

export default alertRoutes;