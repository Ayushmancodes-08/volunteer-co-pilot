import { translateText } from '../controllers/translateController.js';

/**
 * Registers the translation route.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function translateRoutes(fastify, opts) {
  fastify.post('/api/translate', translateText);
}

export default translateRoutes;