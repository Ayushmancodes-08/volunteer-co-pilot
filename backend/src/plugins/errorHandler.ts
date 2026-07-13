import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

interface FastifyErrorWithDetails extends Error {
  name: string;
  statusCode?: number;
  validation?: Array<{ instancePath: string; message?: string }>;
  errors?: Array<{ path: string[]; message: string }>;
}

function errorHandler(
  error: FastifyErrorWithDetails,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Zod validation errors or Fastify validation errors
  if (error instanceof ZodError) {
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
