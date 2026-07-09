import rateLimit from '@fastify/rate-limit';

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

export default rateLimiterPlugin;