import { z } from 'zod';

/** Reusable gate identifier pattern — 1–5 uppercase alphanumeric characters. */
export const GATE_PATTERN = /^[A-Za-z0-9]{1,5}$/;

/**
 * Schema for validating alert trigger payloads from gate sensors.
 * Gate must be a non-empty alphanumeric string, occupancy a percentage (0–100).
 */
export const alertTriggerSchema = z.object({
  gate: z.string().trim().min(1).max(5).regex(GATE_PATTERN, 'Gate must be alphanumeric (1-5 chars)'),
  occupancy: z.number().min(0).max(100),
  timestamp: z.string().datetime().optional(),
});

/**
 * Schema for validating translation requests.
 * Supports 7 target languages and 5 intent categories.
 * Intent and urgent default to 'general_info' and false respectively.
 */
export const translateRequestSchema = z.object({
  text: z.string().trim().min(1).max(500),
  targetLanguage: z.enum(['spanish', 'french', 'hindi', 'arabic', 'german', 'japanese', 'portuguese']),
  intent: z.enum(['redirect', 'medical_urgency', 'general_info', 'greeting', 'emergency_evacuation']).optional().default('general_info'),
  urgent: z.boolean().optional().default(false),
});

/**
 * Schema for validating volunteer profile updates.
 * Tasks default to an empty array if omitted. Each task field is length-bounded.
 */
export const volunteerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  gate: z.string().trim().min(1).max(5).regex(GATE_PATTERN, 'Gate must be alphanumeric (1-5 chars)'),
  shiftStart: z.string().optional(),
  tasks: z.array(
    z.object({
      id: z.string().min(1).max(64),
      text: z.string().min(1).max(300),
      completed: z.boolean(),
    })
  ).max(50, 'Maximum 50 tasks allowed').optional().default([]),
});
