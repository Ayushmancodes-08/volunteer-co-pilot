import * as crowdService from '../services/crowdService.js';

async function getCrowdData(request, reply) {
  const data = crowdService.getCrowdData();
  data.forEach((g) => crowdService.recordOccupancy(g.gate, g.occupancy));
  
  const gatesWithHistory = data.map((g) => {
    const rawHistory = crowdService.getOccupancyHistory(g.gate);
    // return last 8 occupancy values as a simple array for sparklines
    const historyVals = rawHistory.slice(-8).map((h) => h.occupancy);
    return {
      ...g,
      history: historyVals.length > 0 ? historyVals : [g.occupancy],
    };
  });
  
  return reply.send({ gates: gatesWithHistory, timestamp: new Date().toISOString() });
}

async function getGateHistory(request, reply) {
  const { gateId } = request.params;
  const history = crowdService.getOccupancyHistory(gateId);
  return reply.send({ gateId, history });
}

export { getCrowdData, getGateHistory };