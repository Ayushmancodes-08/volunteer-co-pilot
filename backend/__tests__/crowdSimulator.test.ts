import { describe, it, expect } from 'bun:test';

import { generateCrowdData, GATE_IDS, BASE_OCCUPANCY } from '../src/utils/crowdSimulator';

describe('generateCrowdData', () => {
  it('returns one entry per gate (6 gates total)', () => {
    const data = generateCrowdData();
    expect(data).toHaveLength(6);
  });

  it('gate identifiers match the expected set in order', () => {
    const data = generateCrowdData();
    expect(data.map((g) => g.gate)).toEqual(GATE_IDS);
  });

  it('all occupancy values are within [0, 100]', () => {
    // Run multiple times to exercise random noise range
    for (let i = 0; i < 20; i++) {
      const data = generateCrowdData();
      data.forEach((g) => {
        expect(g.occupancy).toBeGreaterThanOrEqual(0);
        expect(g.occupancy).toBeLessThanOrEqual(100);
      });
    }
  });

  it('occupancy is a whole number (no decimals)', () => {
    const data = generateCrowdData();
    data.forEach((g) => {
      expect(Number.isInteger(g.occupancy)).toBe(true);
    });
  });

  it('occupancy stays within ±10 of the baseline for each gate', () => {
    // Baseline ±10 = hard boundary used in the simulator
    for (let i = 0; i < 10; i++) {
      const data = generateCrowdData();
      data.forEach((g) => {
        const base = BASE_OCCUPANCY[g.gate];
        // After clamping: may be less than base-10 only when base is near 0
        const lowerBound = Math.max(0, base - 10);
        const upperBound = Math.min(100, base + 10);
        expect(g.occupancy).toBeGreaterThanOrEqual(lowerBound);
        expect(g.occupancy).toBeLessThanOrEqual(upperBound);
      });
    }
  });

  it('each entry includes a valid ISO timestamp string', () => {
    const data = generateCrowdData();
    data.forEach((g) => {
      expect(typeof g.timestamp).toBe('string');
      expect(() => new Date(g.timestamp)).not.toThrow();
      expect(new Date(g.timestamp).toISOString()).toBe(g.timestamp);
    });
  });

  it('GATE_IDS exports all 6 expected identifiers', () => {
    expect(GATE_IDS).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('BASE_OCCUPANCY has entries for each gate with values in [0, 100]', () => {
    GATE_IDS.forEach((id) => {
      expect(BASE_OCCUPANCY).toHaveProperty(id);
      expect(BASE_OCCUPANCY[id]).toBeGreaterThanOrEqual(0);
      expect(BASE_OCCUPANCY[id]).toBeLessThanOrEqual(100);
    });
  });
});
