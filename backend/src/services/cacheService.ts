const cache = new Map<string, { value: unknown; expiresAt: number }>();

/** Default TTL in seconds. Configurable via CACHE_TTL env var. */
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL || '300', 10);

/**
 * Maximum number of entries the cache will hold before evicting the oldest
 * (insertion-order) entry. Prevents unbounded memory growth under high
 * translation load.
 */
const MAX_CACHE_SIZE = 500;

/**
 * How often (in milliseconds) the sweeper runs to evict expired entries.
 * Set to half the default TTL so entries are cleaned up reasonably promptly.
 */
const SWEEP_INTERVAL_MS = (DEFAULT_TTL * 1000) / 2;

/**
 * Evicts all entries whose TTL has elapsed.
 * Called by the periodic sweeper and also on every `get()` miss.
 */
function sweepExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

// Start periodic sweep — only in non-test environments to avoid timer leaks in tests.
let sweepTimer: ReturnType<typeof setInterval> | null = null;
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
  sweepTimer = setInterval(sweepExpired, SWEEP_INTERVAL_MS);
  // Allow the Node.js process to exit even if this timer is still active
  if (sweepTimer && typeof (sweepTimer as { unref?: () => void }).unref === 'function') {
    (sweepTimer as { unref: () => void }).unref();
  }
}

/**
 * Retrieves a cached value by key. Returns null if the key is missing or expired.
 *
 * @param key - Cache key.
 * @returns Cached value, or null on miss/expiry.
 */
function get<T = unknown>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) { return null; }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

/**
 * Stores a value in the cache with a TTL.
 * When the cache is at MAX_CACHE_SIZE, the oldest inserted entry is evicted first.
 *
 * @param key - Cache key.
 * @param value - Value to cache.
 * @param ttlSeconds - Seconds until expiry.
 */
function set<T = unknown>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): void {
  // Evict the oldest entry if we are at capacity (Map iterates insertion order)
  if (cache.size >= MAX_CACHE_SIZE && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Clears all entries from the cache. Primarily for use in test teardown.
 */
function clear(): void {
  cache.clear();
}

/**
 * Returns the current number of entries in the cache (including not-yet-expired ones).
 * Primarily for use in tests and diagnostics.
 */
function size(): number {
  return cache.size;
}

export { get, set, clear, size, sweepExpired, MAX_CACHE_SIZE, DEFAULT_TTL, SWEEP_INTERVAL_MS };
