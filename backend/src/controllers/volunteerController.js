import { volunteerSchema } from '../validators/index.js';

/** Default volunteer profile used on first boot. */
let volunteerProfile = {
  name: 'Alex Morgan',
  role: 'Gate Monitor',
  gate: 'C',
  shiftStart: new Date().toISOString(),
  tasks: [
    { id: 't1', text: 'Check gate sensor status', completed: true },
    { id: 't2', text: 'Pre-position translation script guides', completed: false },
    { id: 't3', text: 'Review evacuation exits route layout', completed: false },
  ]
};

/**
 * Returns the current volunteer profile.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function getProfile(request, reply) {
  return reply.send(volunteerProfile);
}

/**
 * Validates and merges incoming fields into the volunteer profile.
 * Only fields defined in volunteerSchema are accepted.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
async function updateProfile(request, reply) {
  const parsed = volunteerSchema.parse(request.body);
  volunteerProfile = {
    ...volunteerProfile,
    ...parsed,
  };
  return reply.send(volunteerProfile);
}

export { getProfile, updateProfile };
