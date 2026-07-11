import { translateText } from '../controllers/translateController.js';

/**
 * Registers the translation route with validation options.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} _opts
 */
async function translateRoutes(fastify, _opts) {
  fastify.post('/api/translate', {
    schema: {
      body: {
        type: 'object',
        required: ['text', 'targetLanguage'],
        properties: {
          text: { type: 'string' },
          targetLanguage: { type: 'string' },
          intent: { type: 'string' },
          urgent: { type: 'boolean' }
        }
      }
    }
  }, translateText);
}

export default translateRoutes;