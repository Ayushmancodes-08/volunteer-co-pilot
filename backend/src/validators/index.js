import { z } from 'zod';

const alertTriggerSchema = z.object({
  gate: z.string().min(1).max(5),
  occupancy: z.number().min(0).max(100),
  timestamp: z.string().datetime().optional(),
});

const translateRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  targetLanguage: z.enum(['spanish', 'french', 'hindi', 'arabic', 'german', 'japanese', 'portuguese']),
  intent: z.enum(['redirect', 'medical_urgency', 'general_info', 'greeting', 'emergency_evacuation']).optional().default('general_info'),
  urgent: z.boolean().optional().default(false),
});

const volunteerSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  gate: z.string().min(1).max(5),
  shiftStart: z.string().optional(),
  tasks: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean(),
    })
  ).optional().default([]),
});

export { alertTriggerSchema, translateRequestSchema, volunteerSchema };