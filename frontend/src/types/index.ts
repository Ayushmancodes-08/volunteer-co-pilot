/**
 * @fileoverview Frontend view-model types.
 * These types represent the shape of data as consumed by the React UI layer.
 * They are intentionally decoupled from the backend domain types in
 * `backend/src/types/index.ts`. Do NOT import from the backend package.
 */

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

export interface ChartDataPoint {
  name: string;
  [gate: string]: string | number;
}
