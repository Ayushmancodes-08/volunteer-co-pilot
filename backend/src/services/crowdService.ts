import { generateCrowdData } from '../utils/crowdSimulator';

export interface GateOccupancyEntry {
  occupancy: number;
  timestamp: string;
}

const GATE_OCCUPANCY_HISTORY: Record<string, GateOccupancyEntry[]> = {};

/** Maximum history entries to retain per gate to prevent unbounded growth. */
const MAX_HISTORY_PER_GATE = 50;

/**
 * Returns live crowd data for all gates and records each occupancy reading
 * into the history log so trend data is always up to date.
 */
function getCrowdData() {
  const data = generateCrowdData();

  // Record occupancy for each gate so history is populated
  return data.map((g) => {
    recordOccupancy(g.gate, g.occupancy);
    // Attach a recent history snapshot (last 8 readings) to each gate object
    const history = (GATE_OCCUPANCY_HISTORY[g.gate] || [])
      .slice(-8)
      .map((entry) => entry.occupancy);
    return {
      ...g,
      history,
    };
  });
}

/**
 * Filters gate data to return only those at or above the critical 80% threshold.
 */
function checkThresholds(gateData: Array<{ gate: string; occupancy: number }>) {
  return gateData.filter((g) => g.occupancy >= 80);
}

/**
 * Returns the full occupancy history for a specific gate.
 *
 * @param gateId - Gate identifier (e.g. 'A', 'B').
 */
function getOccupancyHistory(gateId: string): GateOccupancyEntry[] {
  return GATE_OCCUPANCY_HISTORY[gateId] || [];
}

/**
 * Records a single occupancy reading for a gate, capped at MAX_HISTORY_PER_GATE entries.
 *
 * @param gateId - Gate identifier.
 * @param occupancy - Occupancy percentage (0–100).
 */
function recordOccupancy(gateId: string, occupancy: number): void {
  if (!GATE_OCCUPANCY_HISTORY[gateId]) {
    GATE_OCCUPANCY_HISTORY[gateId] = [];
  }
  GATE_OCCUPANCY_HISTORY[gateId].push({
    occupancy,
    timestamp: new Date().toISOString(),
  });

  // Prevent unbounded memory growth per gate
  if (GATE_OCCUPANCY_HISTORY[gateId].length > MAX_HISTORY_PER_GATE) {
    GATE_OCCUPANCY_HISTORY[gateId].shift();
  }
}

export { getCrowdData, checkThresholds, getOccupancyHistory, recordOccupancy };
