const GATE_IDS = ['A', 'B', 'C', 'D', 'E', 'F'];
const BASE_OCCUPANCY = { A: 35, B: 50, C: 65, D: 40, E: 55, F: 30 };

function generateCrowdData() {
  return GATE_IDS.map((id) => {
    const base = BASE_OCCUPANCY[id];
    const noise = Math.floor(Math.random() * 21) - 10; // -10 to +10
    const occupancy = Math.max(0, Math.min(100, base + noise));
    return { gate: id, occupancy, timestamp: new Date().toISOString() };
  });
}

export { generateCrowdData, GATE_IDS };