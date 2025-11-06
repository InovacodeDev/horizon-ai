/**
 * NFe Web Crawler with AI Extraction - Cache Manager
 *
 * Implements an LRU (Least Recently Used) cache for parsed invoices
 * with TTL support and size limits.
 *
 * Features:
 * - LRU eviction policy when max size (1000 invoices) is reached
 * - TTL support with default 24 hours expiration
 * - Cache hit/miss tracking and statistics
 * - Cache metadata for responses (fromCache, cachedAt)
 * - Force-refresh support via cache bypass
 *
 * Usage:
 * ```typescript
 * import { cacheManager } from './cache-manager';
 *
 * // Set data in cache
 * cacheManager.set('invoice-key-123', invoiceData);
 *
 * // Get data from cache
 * const data = cacheManager.get('invoice-key-123');
 *
 * // Get data with metadata (for API responses)
 * const { data, fromCache, cachedAt } = cacheManager.getWithMetadata('invoice-key-123');
 *
 * // Force refresh (bypass cache)
 * if (forceRefresh) {
 *   cacheManager.clear('invoice-key-123');
 * }
 *
 * // Get cache statistics
 * const stats = cacheManager.getStats();
 * console.log(`Cache hit rate: ${stats.hitRate * 100}%`);
 * ```
 */
import { CACHE_KEY_PREFIX, DEFAULT_CACHE_TTL, MAX_CACHE_SIZE } from './constants';
import { loggerService } from './logger.service';
import { CacheEntry, ICacheManager } from './types';

/**
 * LRU Cache Node for doubly linked list
 */
interface CacheNode<T> {
  key: string;
  entry: CacheEntry<T>;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

/**
 * Cache Manager with LRU eviction policy
 *
 * Features:
 * - LRU eviction when max size is reached
 * - TTL support for automatic expiration
 * - Cache statistics tracking
 * - Thread-safe operations
 */
export class CacheManager implements ICacheManager {
  private cache: Map<string, CacheNode<any>>;
  private head: CacheNode<any> | null = null;
  private tail: CacheNode<any> | null = null;
  private maxSize: number;
  private defaultTTL: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = MAX_CACHE_SIZE, defaultTTL: number = DEFAULT_CACHE_TTL) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get cached data by key
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const fullKey = this.buildKey(key);
    const node = this.cache.get(fullKey);

    if (!node) {
      this.misses++;
      loggerService.logCacheOperation('miss', key);
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(node.entry)) {
      this.remove(fullKey);
      this.misses++;
      loggerService.logCacheOperation('miss', key);
      return null;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    this.hits++;
    loggerService.logCacheOperation('hit', key);

    return node.entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const fullKey = this.buildKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // If key exists, update it
    if (this.cache.has(fullKey)) {
      const node = this.cache.get(fullKey)!;
      node.entry = entry;
      this.moveToFront(node);
      loggerService.logCacheOperation('set', key);
      return;
    }

    // Create new node
    const newNode: CacheNode<T> = {
      key: fullKey,
      entry,
      prev: null,
      next: null,
    };

    // Add to front of list
    this.addToFront(newNode);
    this.cache.set(fullKey, newNode);
    loggerService.logCacheOperation('set', key);

    // Evict LRU if over capacity
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Clear cache entry by key
   */
  clear(key: string): void {
    const fullKey = this.buildKey(key);
    this.remove(fullKey);
    loggerService.logCacheOperation('clear', key);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const fullKey = this.buildKey(key);
    const node = this.cache.get(fullKey);

    if (!node) {
      return false;
    }

    // Check expiration
    if (this.isExpired(node.entry)) {
      this.remove(fullKey);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate,
    };
  }

  /**
   * Clear all cached entries
   */
  clearAll(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys()).map((key) => key.replace(CACHE_KEY_PREFIX, ''));
  }

  /**
   * Get cache metadata for a key
   */
  getMetadata(key: string): { cachedAt: Date; expiresAt: Date } | null {
    const fullKey = this.buildKey(key);
    const node = this.cache.get(fullKey);

    if (!node || this.isExpired(node.entry)) {
      return null;
    }

    return {
      cachedAt: new Date(node.entry.timestamp),
      expiresAt: new Date(node.entry.timestamp + node.entry.ttl),
    };
  }

  /**
   * Get data with cache metadata
   * Used for building responses with cache information
   */
  getWithMetadata<T>(key: string): {
    data: T | null;
    fromCache: boolean;
    cachedAt?: Date;
  } {
    const data = this.get<T>(key);

    if (data === null) {
      return {
        data: null,
        fromCache: false,
      };
    }

    const metadata = this.getMetadata(key);

    return {
      data,
      fromCache: true,
      cachedAt: metadata?.cachedAt,
    };
  }

  /**
   * Set data and return metadata for response
   */
  setAndGetMetadata<T>(
    key: string,
    data: T,
    ttl: number = this.defaultTTL,
  ): {
    fromCache: false;
    cachedAt: Date;
  } {
    this.set(key, data, ttl);

    return {
      fromCache: false,
      cachedAt: new Date(),
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    return key.startsWith(CACHE_KEY_PREFIX) ? key : `${CACHE_KEY_PREFIX}${key}`;
  }

  /**
   * Check if cache entry has expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Remove node from linked list and cache
   */
  private remove(key: string): void {
    const node = this.cache.get(key);
    if (!node) return;

    // Remove from linked list
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    // Remove from cache
    this.cache.delete(key);
  }

  /**
   * Move node to front of list (most recently used)
   */
  private moveToFront(node: CacheNode<any>): void {
    // If already at front, do nothing
    if (node === this.head) return;

    // Remove from current position
    if (node.prev) {
      node.prev.next = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // Was tail, update tail
      this.tail = node.prev;
    }

    // Add to front
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    // If list was empty, this is also tail
    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Add new node to front of list
   */
  private addToFront(node: CacheNode<any>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    // If list was empty, this is also tail
    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Evict least recently used entry (tail)
   */
  private evictLRU(): void {
    if (!this.tail) return;

    const key = this.tail.key;
    this.remove(key);
  }
}

/**
 * Singleton instance of cache manager
 */
export const cacheManager = new CacheManager();
