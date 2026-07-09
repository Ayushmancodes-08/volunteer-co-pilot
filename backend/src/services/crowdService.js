import { generateCrowdData } from '../utils/crowdSimulator.js';

const GATE_OCCUPANCY_HISTORY = {};

function getCrowdData() {
  return generateCrowdData();
}

function checkThresholds(gateData) {
  return gateData.filter((g) => g.occupancy >= 80);
}

function getOccupancyHistory(gateId) {
  return GATE_OCCUPANCY_HISTORY[gateId] || [];
}

function recordOccupancy(gateId, occupancy) {
  if (!GATE_OCCUPANCY_HISTORY[gateId]) {
    GATE_OCCUPANCY_HISTORY[gateId] = [];
  }
  GATE_OCCUPANCY_HISTORY[gateId].push({
    occupancy,
    timestamp: new Date().toISOString(),
  });
}

export { getCrowdData, checkThresholds, getOccupancyHistory, recordOccupancy };