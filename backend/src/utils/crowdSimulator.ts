export interface SimulatedGateData {
  gate: string;
  occupancy: number;
  timestamp: string;
}

/** Ordered list of gate identifiers for the simulated FIFA stadium. */
export const GATE_IDS: string[] = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Baseline occupancy percentages for each gate, calibrated to simulate
 * realistic pre-match crowd distribution at a FIFA World Cup stadium.
 * Values represent typical mid-shift readings before peak arrival.
 */
export const BASE_OCCUPANCY: Record<string, number> = { A: 35, B: 50, C: 65, D: 40, E: 55, F: 30 };

/**
 * Generates a synthetic crowd data snapshot for all gates.
 * Each reading applies bounded random noise (±10%) to the baseline occupancy
 * to simulate real sensor variance, clamped to the valid range [0, 100].
 *
 * @returns One entry per gate with current occupancy percentage and ISO timestamp.
 */
export function generateCrowdData(): SimulatedGateData[] {
  return GATE_IDS.map((id) => {
    const base = BASE_OCCUPANCY[id] || 0;
    const noise = Math.floor(Math.random() * 21) - 10; // -10 to +10
    const occupancy = Math.max(0, Math.min(100, base + noise));
    return { gate: id, occupancy, timestamp: new Date().toISOString() };
  });
}
