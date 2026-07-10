import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';

/**
 * Registers the global rate limiter plugin on the Fastify instance.
 * Wrapped in fastify-plugin to prevent context encapsulation.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function rateLimiterPlugin(fastify, opts) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
    }),
  });
}

export default fp(rateLimiterPlugin);