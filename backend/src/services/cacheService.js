const cache = new Map();
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL, 10) || 300;

function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlSeconds = DEFAULT_TTL) {
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function clear() {
  cache.clear();
}

export { get, set, clear };