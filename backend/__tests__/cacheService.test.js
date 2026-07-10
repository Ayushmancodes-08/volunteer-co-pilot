import { describe, it, expect, beforeEach } from 'bun:test';
import * as cache from '../src/services/cacheService.js';

beforeEach(() => {
  cache.clear();
});

describe('cacheService — basic operations', () => {
  it('returns null for a key that was never set', () => {
    expect(cache.get('unknown-key')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    cache.set('my-key', { data: 'hello' });
    expect(cache.get('my-key')).toEqual({ data: 'hello' });
  });

  it('returns different values for different keys', () => {
    cache.set('key-a', 'value-a');
    cache.set('key-b', 'value-b');
    expect(cache.get('key-a')).toBe('value-a');
    expect(cache.get('key-b')).toBe('value-b');
  });

  it('returns null after value has expired (short TTL)', async () => {
    cache.set('short-lived', 'boom', 0.001); // ~1ms TTL
    await new Promise((r) => setTimeout(r, 5));
    expect(cache.get('short-lived')).toBeNull();
  });

  it('clears all entries with clear()', () => {
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    cache.clear();
    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')).toBeNull();
  });

  it('overwrites an existing key', () => {
    cache.set('update-me', 'original');
    cache.set('update-me', 'updated');
    expect(cache.get('update-me')).toBe('updated');
  });

  it('stores non-string values (objects, arrays)', () => {
    const obj = { gate: 'A', occupancy: 75 };
    cache.set('object-key', obj);
    expect(cache.get('object-key')).toEqual(obj);

    cache.set('array-key', [1, 2, 3]);
    expect(cache.get('array-key')).toEqual([1, 2, 3]);
  });
});

describe('cacheService — size()', () => {
  it('reports 0 on empty cache', () => {
    expect(cache.size()).toBe(0);
  });

  it('reports correct count after sets', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size()).toBe(2);
  });

  it('reports correct count after clear', () => {
    cache.set('a', 1);
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});

describe('cacheService — MAX_CACHE_SIZE eviction', () => {
  it('does not exceed MAX_CACHE_SIZE entries', () => {
    const { MAX_CACHE_SIZE } = cache;
    // Fill cache to the limit + 10 entries
    for (let i = 0; i < MAX_CACHE_SIZE + 10; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }
    expect(cache.size()).toBe(MAX_CACHE_SIZE);
  });

  it('evicts the oldest entry when capacity is reached', () => {
    const { MAX_CACHE_SIZE } = cache;
    // Fill exactly to limit
    for (let i = 0; i < MAX_CACHE_SIZE; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }
    // The very first key should still be present
    expect(cache.get('key-0')).toBe('value-0');
    // Adding one more should evict key-0 (oldest insertion)
    cache.set('key-overflow', 'new');
    expect(cache.get('key-0')).toBeNull();
    expect(cache.get('key-overflow')).toBe('new');
  });

  it('updating an existing key does not increase size beyond MAX_CACHE_SIZE', () => {
    const { MAX_CACHE_SIZE } = cache;
    for (let i = 0; i < MAX_CACHE_SIZE; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }
    // Overwrite existing key — should not evict anything or grow
    cache.set('key-0', 'updated');
    expect(cache.size()).toBe(MAX_CACHE_SIZE);
    expect(cache.get('key-0')).toBe('updated');
  });
});

describe('cacheService — sweepExpired()', () => {
  it('sweepExpired removes all expired entries', async () => {
    cache.set('live', 'still-here', 60);
    cache.set('dead', 'gone', 0.001);
    await new Promise((r) => setTimeout(r, 5));
    cache.sweepExpired();
    expect(cache.get('dead')).toBeNull();
    expect(cache.get('live')).toBe('still-here');
    // Size should be 1 after sweep
    expect(cache.size()).toBe(1);
  });

  it('sweepExpired is a no-op on empty cache', () => {
    expect(() => cache.sweepExpired()).not.toThrow();
    expect(cache.size()).toBe(0);
  });
});
