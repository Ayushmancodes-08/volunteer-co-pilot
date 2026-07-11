/**
 * Global Fastify error handler.
 * Normalizes Zod validation errors (400), rate limit errors (429),
 * and all other unexpected errors (500) into a consistent JSON envelope.
 *
 * @param {Error & {name?: string, statusCode?: number, errors?: Array}} error
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
function errorHandler(error, request, reply) {
  // Zod validation errors or Fastify validation errors
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      error: 'Validation failed',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Fastify native schema validation errors
  if (error.statusCode === 400 && error.validation) {
    return reply.status(400).send({
      error: 'Validation failed',
      details: error.validation.map((e) => ({
        path: e.instancePath.replace(/^\//, '').replace(/\//g, '.'),
        message: e.message,
      })),
    });
  }


  // Fastify rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: error.message,
    });
  }

  request.log.error(error);

  return reply.status(error.statusCode || 500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
  });
}

export default errorHandler;