/**
 * cache.js — Lightweight in-memory TTL cache
 * Production-grade replacement for external Redis in serverless/small deployments.
 * Each entry stores: { value, expiresAt }
 */

class TTLCache {
  constructor() {
    this._store = new Map();
    // Sweep expired entries every 5 minutes to prevent memory leaks
    this._sweepInterval = setInterval(() => this._sweep(), 5 * 60 * 1000);
    this._sweepInterval.unref(); // Don't prevent process exit
  }

  /**
   * Get a cached value. Returns undefined if missing or expired.
   * @param {string} key
   */
  get(key) {
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Store a value with optional TTL.
   * @param {string} key
   * @param {*} value
   * @param {number} ttlMs  — time-to-live in milliseconds (default: 5 min)
   */
  set(key, value, ttlMs = 5 * 60 * 1000) {
    this._store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Delete a specific key.
   * @param {string} key
   */
  invalidate(key) {
    this._store.delete(key);
  }

  /**
   * Invalidate all keys that start with a given prefix.
   * Useful to bust user-specific caches: invalidatePrefix(`rec:${userId}`)
   * @param {string} prefix
   */
  invalidatePrefix(prefix) {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        this._store.delete(key);
      }
    }
  }

  /** Remove all expired entries. */
  _sweep() {
    const now = Date.now();
    for (const [key, entry] of this._store.entries()) {
      if (now > entry.expiresAt) this._store.delete(key);
    }
  }

  /** Cache stats (for monitoring). */
  stats() {
    return { size: this._store.size };
  }
}

// Export a singleton — one cache instance shared across all modules
module.exports = new TTLCache();
