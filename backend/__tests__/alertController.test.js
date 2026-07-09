import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import * as crowdService from '../src/services/crowdService.js';

describe('checkThresholds', () => {
  it('returns gates at or above 80%', () => {
    const data = [
      { gate: 'A', occupancy: 45 },
      { gate: 'B', occupancy: 82 },
      { gate: 'C', occupancy: 91 },
      { gate: 'D', occupancy: 60 },
    ];
    const alerts = crowdService.checkThresholds(data);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].gate).toBe('B');
    expect(alerts[1].gate).toBe('C');
  });

  it('returns empty array when no gate exceeds 80%', () => {
    const data = [
      { gate: 'A', occupancy: 45 },
      { gate: 'B', occupancy: 60 },
    ];
    expect(crowdService.checkThresholds(data)).toHaveLength(0);
  });

  it('triggers exactly at 80%', () => {
    const data = [{ gate: 'A', occupancy: 80 }];
    expect(crowdService.checkThresholds(data)).toHaveLength(1);
  });
});

describe('getCrowdData', () => {
  it('returns data for 6 gates', () => {
    const data = crowdService.getCrowdData();
    expect(data).toHaveLength(6);
    expect(data.map((g) => g.gate)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('all occupancy values are between 0 and 100', () => {
    for (let i = 0; i < 10; i++) {
      const data = crowdService.getCrowdData();
      data.forEach((g) => {
        expect(g.occupancy).toBeGreaterThanOrEqual(0);
        expect(g.occupancy).toBeLessThanOrEqual(100);
      });
    }
  });
});