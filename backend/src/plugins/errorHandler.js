function errorHandler(error, request, reply) {
  // Zod validation errors
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      error: 'Validation failed',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
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