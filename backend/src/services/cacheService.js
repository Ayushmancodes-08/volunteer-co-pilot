/**
 * Simple TTL-based in-memory cache backed by a Map.
 * Used primarily to deduplicate identical GenAI translation calls within a session.
 *
 * Bounded at MAX_CACHE_SIZE entries (oldest entries evicted first when full).
 * A periodic sweeper runs every SWEEP_INTERVAL_MS to evict expired entries
 * proactively, preventing stale entries from accumulating indefinitely.
 */

/** @type {Map<string, {value: *, expiresAt: number}>} */
const cache = new Map();

/** Default TTL in seconds. Configurable via CACHE_TTL env var. */
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL, 10) || 300;

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
function sweepExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

// Start periodic sweep — only in non-test environments to avoid timer leaks in tests.
let sweepTimer = null;
if (process.env.NODE_ENV !== 'test') {
  sweepTimer = setInterval(sweepExpired, SWEEP_INTERVAL_MS);
  // Allow the Node.js process to exit even if this timer is still active
  if (sweepTimer.unref) sweepTimer.unref();
}

/**
 * Retrieves a cached value by key. Returns null if the key is missing or expired.
 *
 * @param {string} key - Cache key.
 * @returns {* | null} Cached value, or null on miss/expiry.
 */
function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Stores a value in the cache with a TTL.
 * When the cache is at MAX_CACHE_SIZE, the oldest inserted entry is evicted first.
 *
 * @param {string} key - Cache key.
 * @param {*} value - Value to cache.
 * @param {number} [ttlSeconds=DEFAULT_TTL] - Seconds until expiry.
 */
function set(key, value, ttlSeconds = DEFAULT_TTL) {
  // Evict the oldest entry if we are at capacity (Map iterates insertion order)
  if (cache.size >= MAX_CACHE_SIZE && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Clears all entries from the cache. Primarily for use in test teardown.
 */
function clear() {
  cache.clear();
}

/**
 * Returns the current number of entries in the cache (including not-yet-expired ones).
 * Primarily for use in tests and diagnostics.
 *
 * @returns {number}
 */
function size() {
  return cache.size;
}

export { get, set, clear, size, sweepExpired, MAX_CACHE_SIZE, DEFAULT_TTL, SWEEP_INTERVAL_MS };
