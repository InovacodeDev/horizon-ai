/**
 * Simple in-memory rate limiter
 * In production, this should use Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a key is rate limited
 * @param key - Unique identifier (e.g., "sync:connectionId")
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded, false otherwise
 */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No entry or expired entry
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > limit) {
    return true;
  }

  return false;
}

/**
 * Get time until rate limit resets
 * @param key - Unique identifier
 * @returns milliseconds until reset, or 0 if not rate limited
 */
export function getRateLimitResetTime(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return 0;
  }

  const now = Date.now();
  const resetIn = entry.resetAt - now;

  return resetIn > 0 ? resetIn : 0;
}

/**
 * Clear rate limit for a key
 * @param key - Unique identifier
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clean up expired entries (should be called periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
