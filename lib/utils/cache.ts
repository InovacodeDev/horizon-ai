/**
 * Cache utility for storing data with TTL (Time To Live)
 * Default TTL: 12 hours
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get data from cache if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();

/**
 * Generate cache key for different resources
 */
export const getCacheKey = {
  transactions: (userId: string) => `transactions:${userId}`,
  accounts: (userId: string) => `accounts:${userId}`,
  creditCards: (userId: string) => `creditCards:${userId}`,
  creditCardTransactions: (params: string) => `creditCardTransactions:${params}`,
  categories: () => 'categories',
  financialInsights: (userId: string) => `financialInsights:${userId}`,
};

/**
 * Invalidate related caches when data changes
 */
export const invalidateCache = {
  transactions: (userId: string) => {
    cacheManager.invalidate(getCacheKey.transactions(userId));
    cacheManager.invalidate(getCacheKey.financialInsights(userId));
  },
  accounts: (userId: string) => {
    cacheManager.invalidate(getCacheKey.accounts(userId));
  },
  creditCards: (userId: string) => {
    cacheManager.invalidate(getCacheKey.creditCards(userId));
    cacheManager.invalidatePattern(`creditCardTransactions:.*`);
  },
  creditCardTransactions: () => {
    cacheManager.invalidatePattern(`creditCardTransactions:.*`);
  },
  all: (userId: string) => {
    cacheManager.invalidatePattern(`.*:${userId}`);
  },
};
