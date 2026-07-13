import { FastifyInstance } from 'fastify';

import { translateText } from '../controllers/translateController';

async function translateRoutes(fastify: FastifyInstance, _opts: unknown) {
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
