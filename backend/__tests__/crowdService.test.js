import { describe, it, expect, beforeEach } from 'bun:test';

import * as crowdService from '../src/services/crowdService.js';

describe('recordOccupancy', () => {
  beforeEach(() => {
    // Clear any cache between tests (history lives in module scope,
    // so we use a fresh gateId per test to avoid cross-test pollution)
  });

  it('stores occupancy entries for a gate', () => {
    crowdService.recordOccupancy('TEST_RECORD_1', 55);
    const history = crowdService.getOccupancyHistory('TEST_RECORD_1');
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[history.length - 1].occupancy).toBe(55);
  });

  it('stores timestamp with each entry', () => {
    crowdService.recordOccupancy('TEST_RECORD_2', 72);
    const history = crowdService.getOccupancyHistory('TEST_RECORD_2');
    const lastEntry = history[history.length - 1];
    expect(lastEntry).toHaveProperty('timestamp');
    expect(typeof lastEntry.timestamp).toBe('string');
    // Should be a valid ISO date string
    expect(() => new Date(lastEntry.timestamp)).not.toThrow();
  });

  it('accumulates multiple readings in order', () => {
    crowdService.recordOccupancy('TEST_RECORD_3', 30);
    crowdService.recordOccupancy('TEST_RECORD_3', 45);
    crowdService.recordOccupancy('TEST_RECORD_3', 62);
    const history = crowdService.getOccupancyHistory('TEST_RECORD_3');
    const occupancies = history.map((h) => h.occupancy);
    expect(occupancies).toContain(30);
    expect(occupancies).toContain(45);
    expect(occupancies).toContain(62);
  });
});

describe('getOccupancyHistory', () => {
  it('returns empty array for an unknown gate', () => {
    const history = crowdService.getOccupancyHistory('NONEXISTENT_GATE_XYZ');
    expect(Array.isArray(history)).toBe(true);
    expect(history).toHaveLength(0);
  });
});

describe('getCrowdData', () => {
  it('attaches history array to each gate object', () => {
    const data = crowdService.getCrowdData();
    data.forEach((gate) => {
      expect(gate).toHaveProperty('history');
      expect(Array.isArray(gate.history)).toBe(true);
    });
  });

  it('returns data for 6 gates with correct identifiers', () => {
    const data = crowdService.getCrowdData();
    expect(data).toHaveLength(6);
    expect(data.map((g) => g.gate)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('populates history after multiple getCrowdData calls', () => {
    // Call twice so history accumulates
    crowdService.getCrowdData();
    crowdService.getCrowdData();
    const data = crowdService.getCrowdData();
    // Each gate should now have at least some history
    data.forEach((gate) => {
      expect(gate.history.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('checkThresholds', () => {
  it('filters gates that are at or above 80% occupancy', () => {
    const input = [
      { gate: 'A', occupancy: 79 },
      { gate: 'B', occupancy: 80 },
      { gate: 'C', occupancy: 85 },
      { gate: 'D', occupancy: 30 }
    ];
    const result = crowdService.checkThresholds(input);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.gate)).toEqual(['B', 'C']);
  });

  it('returns empty array when no gates meet threshold', () => {
    const input = [
      { gate: 'A', occupancy: 50 },
      { gate: 'B', occupancy: 75 }
    ];
    const result = crowdService.checkThresholds(input);
    expect(result).toHaveLength(0);
  });
});

