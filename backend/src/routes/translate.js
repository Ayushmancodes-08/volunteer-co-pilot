import { translateText } from '../controllers/translateController.js';

async function translateRoutes(fastify, opts) {

  fastify.post('/api/translate', translateText);
}

export default translateRoutes;