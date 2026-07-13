import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function rateLimiterPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
    }),
  });
}

export default fp(rateLimiterPlugin);
