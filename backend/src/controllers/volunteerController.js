import { volunteerSchema } from '../validators/index.js';

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

async function getProfile(request, reply) {
  return reply.send(volunteerProfile);
}

async function updateProfile(request, reply) {
  const parsed = volunteerSchema.parse(request.body);
  volunteerProfile = {
    ...volunteerProfile,
    ...parsed,
  };
  return reply.send(volunteerProfile);
}

export { getProfile, updateProfile };
