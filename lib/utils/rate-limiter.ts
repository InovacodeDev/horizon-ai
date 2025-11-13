/**
 * Rate Limiter
 * Implements rate limiting for API endpoints
 */

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * Rate limiter class
 * Tracks requests per user and enforces limits
 */
class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60 * 1000; // Run cleanup every minute

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Check if request is allowed for user
   * Returns true if allowed, false if rate limit exceeded
   */
  checkLimit(userId: string, config: RateLimiterConfig): boolean {
    const now = Date.now();
    const entry = this.requests.get(userId);

    // No previous requests or window expired
    if (!entry || now > entry.resetAt) {
      this.requests.set(userId, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    // Within rate limit
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get remaining requests for user
   */
  getRemainingRequests(userId: string, config: RateLimiterConfig): number {
    const entry = this.requests.get(userId);

    if (!entry || Date.now() > entry.resetAt) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until rate limit resets (in seconds)
   */
  getResetTime(userId: string): number {
    const entry = this.requests.get(userId);

    if (!entry) {
      return 0;
    }

    const now = Date.now();
    if (now > entry.resetAt) {
      return 0;
    }

    return Math.ceil((entry.resetAt - now) / 1000);
  }

  /**
   * Reset rate limit for user
   */
  resetLimit(userId: string): void {
    this.requests.delete(userId);
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredUsers: string[] = [];

    for (const [userId, entry] of this.requests.entries()) {
      if (now > entry.resetAt) {
        expiredUsers.push(userId);
      }
    }

    for (const userId of expiredUsers) {
      this.requests.delete(userId);
    }

    if (expiredUsers.length > 0) {
      console.log(`Cleaned up ${expiredUsers.length} expired rate limit entries`);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL);

    // Ensure cleanup runs on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        this.stopCleanupTimer();
      });
    }
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  IMPORT: {
    maxRequests: 10, // 10 imports per hour
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  IMPORT_PREVIEW: {
    maxRequests: 20, // 20 previews per hour
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Check if import is allowed for user
 */
export function checkImportRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const allowed = rateLimiter.checkLimit(userId, RATE_LIMITS.IMPORT);
  const remaining = rateLimiter.getRemainingRequests(userId, RATE_LIMITS.IMPORT);
  const resetIn = rateLimiter.getResetTime(userId);

  return { allowed, remaining, resetIn };
}

/**
 * Check if import preview is allowed for user
 */
export function checkImportPreviewRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const allowed = rateLimiter.checkLimit(userId, RATE_LIMITS.IMPORT_PREVIEW);
  const remaining = rateLimiter.getRemainingRequests(userId, RATE_LIMITS.IMPORT_PREVIEW);
  const resetIn = rateLimiter.getResetTime(userId);

  return { allowed, remaining, resetIn };
}
