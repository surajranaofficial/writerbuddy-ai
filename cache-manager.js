// cache-manager.js - Smart caching for AI responses
// Reduces API calls and provides instant results for repeated queries

class CacheManager {
  constructor(maxSize = 50, expiryMinutes = 60) {
    this.maxSize = maxSize;
    this.expiryMs = expiryMinutes * 60 * 1000;
    this.cache = new Map();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Generate cache key from action, text, and language
  _generateKey(action, text, targetLanguage = '') {
    // Normalize text (trim, lowercase for case-insensitive matching)
    const normalized = text.trim().toLowerCase();
    // Include target language in key for translation actions
    const langSuffix = targetLanguage ? `:${targetLanguage}` : '';
    return `${action}${langSuffix}:${this._hash(normalized)}`;
  }

  // Simple hash function
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Check if entry is expired
  _isExpired(entry) {
    return Date.now() - entry.timestamp > this.expiryMs;
  }

  // Get cached result
  get(action, text, targetLanguage = '') {
    const key = this._generateKey(action, text, targetLanguage);
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      Logger.debug(`Cache MISS for ${action} (total: ${this.missCount})`);
      return null;
    }

    if (this._isExpired(entry)) {
      this.cache.delete(key);
      this.missCount++;
      Logger.debug(`Cache EXPIRED for ${action}`);
      return null;
    }

    this.hitCount++;
    entry.hits++;
    entry.lastAccessed = Date.now();
    Logger.debug(`Cache HIT for ${action} (total: ${this.hitCount}, entry hits: ${entry.hits})`);
    return entry.result;
  }

  // Store result in cache
  set(action, text, result, targetLanguage = '') {
    const key = this._generateKey(action, text, targetLanguage);

    // Check cache size limit
    if (this.cache.size >= this.maxSize) {
      this._evictLRU();
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      hits: 0,
      action,
      textLength: text.length
    });

    Logger.debug(`Cached result for ${action} (cache size: ${this.cache.size}/${this.maxSize})`);
  }

  // Evict least recently used entry
  _evictLRU() {
    let oldest = null;
    let oldestKey = null;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = entry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      Logger.debug(`Evicted LRU entry: ${oldest.action}`);
    }
  }

  // Clear expired entries
  clearExpired() {
    let cleared = 0;
    for (const [key, entry] of this.cache) {
      if (this._isExpired(entry)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    if (cleared > 0) {
      Logger.debug(`Cleared ${cleared} expired cache entries`);
    }
    return cleared;
  }

  // Clear all cache
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    Logger.debug(`Cleared entire cache (${size} entries)`);
  }

  // Get cache statistics
  getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total * 100).toFixed(1) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hitCount,
      misses: this.missCount,
      total,
      hitRate: `${hitRate}%`,
      entries: Array.from(this.cache.values()).map(e => ({
        action: e.action,
        hits: e.hits,
        age: Math.floor((Date.now() - e.timestamp) / 1000 / 60) + ' min',
        textLength: e.textLength
      }))
    };
  }

  // Preload common queries (optional)
  async preload(commonQueries) {
    Logger.debug(`Preloading ${commonQueries.length} common queries...`);
    for (const { action, text, result } of commonQueries) {
      this.set(action, text, result);
    }
  }
}

// Create global cache instance
const globalCache = new CacheManager(50, 60); // 50 entries, 60 min expiry

// Auto-clear expired entries every 10 minutes
setInterval(() => {
  globalCache.clearExpired();
}, 10 * 60 * 1000);

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CacheManager, globalCache };
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.CacheManager = CacheManager;
  window.globalCache = globalCache;
}
