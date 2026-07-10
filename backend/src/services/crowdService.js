import { generateCrowdData } from '../utils/crowdSimulator.js';

/** @type {Record<string, Array<{occupancy: number, timestamp: string}>>} */
const GATE_OCCUPANCY_HISTORY = {};

/** Maximum history entries to retain per gate to prevent unbounded growth. */
const MAX_HISTORY_PER_GATE = 50;

/**
 * Returns live crowd data for all gates and records each occupancy reading
 * into the history log so trend data is always up to date.
 *
 * @returns {Array<{gate: string, occupancy: number, history: number[]}>}
 */
function getCrowdData() {
  const data = generateCrowdData();

  // Record occupancy for each gate so history is populated
  data.forEach((g) => {
    recordOccupancy(g.gate, g.occupancy);
    // Attach a recent history snapshot (last 8 readings) to each gate object
    g.history = (GATE_OCCUPANCY_HISTORY[g.gate] || [])
      .slice(-8)
      .map((entry) => entry.occupancy);
  });

  return data;
}

/**
 * Filters gate data to return only those at or above the critical 80% threshold.
 *
 * @param {Array<{gate: string, occupancy: number}>} gateData
 * @returns {Array<{gate: string, occupancy: number}>}
 */
function checkThresholds(gateData) {
  return gateData.filter((g) => g.occupancy >= 80);
}

/**
 * Returns the full occupancy history for a specific gate.
 *
 * @param {string} gateId - Gate identifier (e.g. 'A', 'B').
 * @returns {Array<{occupancy: number, timestamp: string}>}
 */
function getOccupancyHistory(gateId) {
  return GATE_OCCUPANCY_HISTORY[gateId] || [];
}

/**
 * Records a single occupancy reading for a gate, capped at MAX_HISTORY_PER_GATE entries.
 *
 * @param {string} gateId - Gate identifier.
 * @param {number} occupancy - Occupancy percentage (0–100).
 */
function recordOccupancy(gateId, occupancy) {
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