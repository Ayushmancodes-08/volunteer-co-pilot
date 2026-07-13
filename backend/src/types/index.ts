/**
 * @fileoverview Backend domain model and API contract types.
 * These types represent the server-side data model, Zod-validated payloads,
 * and API response shapes. Do NOT import these into the frontend package.
 */

import { z } from 'zod';

import { alertTriggerSchema, translateRequestSchema, volunteerSchema } from '../validators/index';

export type AlertTriggerPayload = z.infer<typeof alertTriggerSchema>;
export type TranslateRequestPayload = z.infer<typeof translateRequestSchema>;
export type VolunteerProfilePayload = z.infer<typeof volunteerSchema>;

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface VolunteerProfile {
  name: string;
  role: string;
  gate: string;
  tasks: Task[];
  shiftStart?: string;
}

export interface GateCrowdData {
  gate: string;
  occupancy: number;
  history: number[];
  timestamp: string;
}

export interface Alert {
  id: string;
  gate: string;
  occupancy: number;
  action: string;
  reasoning: string;
  dismissed: boolean;
  timestamp?: string;
}

export interface AIBriefingData {
  summary: string;
  weatherForecast: string;
  crowdOutlook: string;
  suggestedActions: string[];
  announcements: string[];
}

export interface TranslationResult {
  translatedText: string;
  phonetic: string;
}

export interface GeminiApiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export interface OpenAIApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface AnthropicApiResponse {
  content: Array<{ text: string }>;
}
