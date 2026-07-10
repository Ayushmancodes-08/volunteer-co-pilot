import { evaluateAlert, dismissAlert, getAlertHistory } from '../controllers/alertController.js';

/**
 * Registers alert evaluation and management routes.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function alertRoutes(fastify, opts) {
  fastify.post('/api/alerts/evaluate', evaluateAlert);
  fastify.patch('/api/alerts/:id/dismiss', dismissAlert);
  fastify.get('/api/alerts/history', getAlertHistory);
}

export default alertRoutes;