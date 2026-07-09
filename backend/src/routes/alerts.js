import { evaluateAlert, dismissAlert, getAlertHistory } from '../controllers/alertController.js';

async function alertRoutes(fastify, opts) {

  fastify.post('/api/alerts/evaluate', evaluateAlert);
  fastify.patch('/api/alerts/:id/dismiss', dismissAlert);
  fastify.get('/api/alerts/history', getAlertHistory);
}

export default alertRoutes;