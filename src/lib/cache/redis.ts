import { Redis } from "@upstash/redis";

// Initialize Redis client (only if credentials are provided)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Cache key prefixes for different data types
 */
export const CACHE_KEYS = {
  DASHBOARD: (userId: string) => `dashboard:${userId}`,
  BANK_LIST: "banks:list",
  ACCOUNT: (accountId: string) => `account:${accountId}`,
  TRANSACTIONS: (userId: string, page: number) =>
    `transactions:${userId}:${page}`,
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  DASHBOARD: 5 * 60, // 5 minutes
  BANK_LIST: 24 * 60 * 60, // 24 hours
  TRANSACTIONS: 5 * 60, // 5 minutes
} as const;

/**
 * Get a value from cache
 * @param key - Cache key
 * @returns Cached value or null if not found
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null; // Cache disabled if Redis not configured
  }

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

/**
 * Set a value in cache with TTL
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  if (!redis) {
    return; // Cache disabled if Redis not configured
  }

  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

/**
 * Delete a value from cache
 * @param key - Cache key or pattern
 */
export async function deleteCached(key: string): Promise<void> {
  if (!redis) {
    return; // Cache disabled if Redis not configured
  }

  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis delete error:", error);
  }
}

/**
 * Delete multiple keys matching a pattern
 * @param pattern - Key pattern (e.g., "dashboard:*")
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  if (!redis) {
    return; // Cache disabled if Redis not configured
  }

  try {
    // Get all keys matching the pattern
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis delete pattern error:", error);
  }
}

/**
 * Invalidate all cache for a specific user
 * @param userId - User ID
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    await Promise.all([
      deleteCached(CACHE_KEYS.DASHBOARD(userId)),
      deleteCachedPattern(`transactions:${userId}:*`),
    ]);
  } catch (error) {
    console.error("Error invalidating user cache:", error);
  }
}

/**
 * Invalidate dashboard cache after sync
 * @param userId - User ID
 */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  await invalidateUserCache(userId);
}

export { redis };
