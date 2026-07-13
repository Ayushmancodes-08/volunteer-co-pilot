import { FastifyRequest, FastifyReply } from 'fastify';

import { VolunteerProfile } from '../types';
import { volunteerSchema } from '../validators/index';

/** Default volunteer profile used on first boot. */
let volunteerProfile: VolunteerProfile = {
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
 */
async function getProfile(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(volunteerProfile);
}

/**
 * Validates and merges incoming fields into the volunteer profile.
 * Only fields defined in volunteerSchema are accepted.
 */
async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  const parsed = volunteerSchema.parse(request.body);
  volunteerProfile = {
    ...volunteerProfile,
    ...parsed,
  };
  return reply.send(volunteerProfile);
}

export { getProfile, updateProfile, volunteerProfile };
