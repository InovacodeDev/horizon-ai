/**
 * NFe Web Crawler with AI Extraction - Logger Service
 *
 * Provides structured logging for all operations with support for:
 * - Performance metrics (response time, success rate)
 * - AI token usage and cost tracking
 * - Cache hit/miss rates
 * - Validation failures with details
 * - Error tracking with context
 *
 * Requirement 6.4: Log detailed error information for debugging
 */

// ============================================
// Types and Interfaces
// ============================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

export interface AITokenMetrics {
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  totalTokens: number;
  estimatedCost: number;
  model: string;
  timestamp: string;
}

export interface CacheMetrics {
  operation: 'hit' | 'miss' | 'set' | 'clear';
  key: string;
  timestamp: string;
}

export interface ValidationMetrics {
  invoiceKey: string;
  isValid: boolean;
  errors: string[];
  timestamp: string;
}

// ============================================
// Logger Service
// ============================================

export class LoggerService {
  private performanceMetrics: PerformanceMetrics[] = [];
  private aiTokenMetrics: AITokenMetrics[] = [];
  private cacheMetrics: CacheMetrics[] = [];
  private validationMetrics: ValidationMetrics[] = [];
  private enabled: boolean = true;

  constructor() {
    // Enable logging based on environment
    this.enabled = process.env.NODE_ENV !== 'test';
  }

  /**
   * Log a message with structured data
   */
  log(level: LogLevel, service: string, operation: string, message: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      operation,
      message,
      metadata: this.sanitizeMetadata(metadata),
    };

    // Output to console with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(this.formatLogEntry(entry));
        break;
      case LogLevel.INFO:
        console.info(this.formatLogEntry(entry));
        break;
      case LogLevel.WARN:
        console.warn(this.formatLogEntry(entry));
        break;
      case LogLevel.ERROR:
        console.error(this.formatLogEntry(entry));
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(service: string, operation: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, service, operation, message, metadata);
  }

  /**
   * Log info message
   */
  info(service: string, operation: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, service, operation, message, metadata);
  }

  /**
   * Log warning message
   */
  warn(service: string, operation: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, service, operation, message, metadata);
  }

  /**
   * Log error message
   */
  error(service: string, operation: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, service, operation, message, metadata);
  }

  /**
   * Start performance tracking for an operation
   */
  startPerformanceTracking(operation: string): number {
    const startTime = Date.now();
    this.performanceMetrics.push({
      operation,
      startTime,
      success: false,
    });
    return startTime;
  }

  /**
   * End performance tracking for an operation
   */
  endPerformanceTracking(startTime: number, success: boolean, error?: string): void {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Find and update the metric
    const metric = this.performanceMetrics.find((m) => m.startTime === startTime && !m.endTime);
    if (metric) {
      metric.endTime = endTime;
      metric.duration = duration;
      metric.success = success;
      metric.error = error;
    }

    // Log performance
    this.info('performance', metric?.operation || 'unknown', `Operation completed in ${duration}ms`, {
      duration,
      success,
      error,
    });
  }

  /**
   * Log AI token usage and costs
   * Requirement 6.4: Log AI token usage and costs
   */
  logAITokenUsage(model: string, inputTokens: number, outputTokens: number, cachedTokens?: number): void {
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = this.calculateAICost(model, inputTokens, outputTokens, cachedTokens);

    const metrics: AITokenMetrics = {
      inputTokens,
      outputTokens,
      cachedTokens,
      totalTokens,
      estimatedCost,
      model,
      timestamp: new Date().toISOString(),
    };

    this.aiTokenMetrics.push(metrics);

    this.info('ai-parser', 'token-usage', 'AI tokens consumed', {
      model,
      inputTokens,
      outputTokens,
      cachedTokens,
      totalTokens,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
      cacheSavings: cachedTokens ? `$${this.calculateCacheSavings(model, cachedTokens).toFixed(4)}` : undefined,
    });
  }

  /**
   * Log cache operation
   * Requirement 6.4: Log cache hit/miss rates
   */
  logCacheOperation(operation: 'hit' | 'miss' | 'set' | 'clear', key: string): void {
    const metrics: CacheMetrics = {
      operation,
      key,
      timestamp: new Date().toISOString(),
    };

    this.cacheMetrics.push(metrics);

    const message = operation === 'hit' ? 'Cache hit' : operation === 'miss' ? 'Cache miss' : `Cache ${operation}`;

    this.debug('cache-manager', operation, message, { key });
  }

  /**
   * Log validation result
   * Requirement 6.4: Log validation failures with details
   */
  logValidation(invoiceKey: string, isValid: boolean, errors: string[]): void {
    const metrics: ValidationMetrics = {
      invoiceKey,
      isValid,
      errors,
      timestamp: new Date().toISOString(),
    };

    this.validationMetrics.push(metrics);

    if (isValid) {
      this.info('validator', 'validate', 'Validation passed', { invoiceKey });
    } else {
      this.warn('validator', 'validate', 'Validation failed', {
        invoiceKey,
        errorCount: errors.length,
        errors,
      });
    }
  }

  /**
   * Get performance statistics
   * Requirement 6.4: Add performance metrics (response time, success rate)
   */
  getPerformanceStats(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    successRate: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    operationBreakdown: Record<string, { count: number; avgTime: number; successRate: number }>;
  } {
    const completedMetrics = this.performanceMetrics.filter((m) => m.duration !== undefined);

    if (completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        successRate: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        operationBreakdown: {},
      };
    }

    const successfulOperations = completedMetrics.filter((m) => m.success).length;
    const failedOperations = completedMetrics.length - successfulOperations;
    const successRate = successfulOperations / completedMetrics.length;

    const durations = completedMetrics.map((m) => m.duration!);
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minResponseTime = Math.min(...durations);
    const maxResponseTime = Math.max(...durations);

    // Calculate breakdown by operation
    const operationBreakdown: Record<string, { count: number; avgTime: number; successRate: number }> = {};

    for (const metric of completedMetrics) {
      if (!operationBreakdown[metric.operation]) {
        operationBreakdown[metric.operation] = {
          count: 0,
          avgTime: 0,
          successRate: 0,
        };
      }

      const breakdown = operationBreakdown[metric.operation];
      breakdown.count++;
      breakdown.avgTime = (breakdown.avgTime * (breakdown.count - 1) + metric.duration!) / breakdown.count;
      breakdown.successRate =
        (breakdown.successRate * (breakdown.count - 1) + (metric.success ? 1 : 0)) / breakdown.count;
    }

    return {
      totalOperations: completedMetrics.length,
      successfulOperations,
      failedOperations,
      successRate,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      operationBreakdown,
    };
  }

  /**
   * Get AI token usage statistics
   */
  getAITokenStats(): {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCachedTokens: number;
    totalTokens: number;
    totalCost: number;
    totalCacheSavings: number;
    averageTokensPerRequest: number;
    averageCostPerRequest: number;
  } {
    if (this.aiTokenMetrics.length === 0) {
      return {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCachedTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        totalCacheSavings: 0,
        averageTokensPerRequest: 0,
        averageCostPerRequest: 0,
      };
    }

    const totalInputTokens = this.aiTokenMetrics.reduce((sum, m) => sum + m.inputTokens, 0);
    const totalOutputTokens = this.aiTokenMetrics.reduce((sum, m) => sum + m.outputTokens, 0);
    const totalCachedTokens = this.aiTokenMetrics.reduce((sum, m) => sum + (m.cachedTokens || 0), 0);
    const totalTokens = this.aiTokenMetrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalCost = this.aiTokenMetrics.reduce((sum, m) => sum + m.estimatedCost, 0);

    // Calculate cache savings
    const totalCacheSavings = this.aiTokenMetrics.reduce((sum, m) => {
      if (m.cachedTokens) {
        return sum + this.calculateCacheSavings(m.model, m.cachedTokens);
      }
      return sum;
    }, 0);

    return {
      totalRequests: this.aiTokenMetrics.length,
      totalInputTokens,
      totalOutputTokens,
      totalCachedTokens,
      totalTokens,
      totalCost,
      totalCacheSavings,
      averageTokensPerRequest: totalTokens / this.aiTokenMetrics.length,
      averageCostPerRequest: totalCost / this.aiTokenMetrics.length,
    };
  }

  /**
   * Get cache statistics
   * Requirement 6.4: Log cache hit/miss rates
   */
  getCacheStats(): {
    totalOperations: number;
    hits: number;
    misses: number;
    sets: number;
    clears: number;
    hitRate: number;
  } {
    const hits = this.cacheMetrics.filter((m) => m.operation === 'hit').length;
    const misses = this.cacheMetrics.filter((m) => m.operation === 'miss').length;
    const sets = this.cacheMetrics.filter((m) => m.operation === 'set').length;
    const clears = this.cacheMetrics.filter((m) => m.operation === 'clear').length;

    const totalLookups = hits + misses;
    const hitRate = totalLookups > 0 ? hits / totalLookups : 0;

    return {
      totalOperations: this.cacheMetrics.length,
      hits,
      misses,
      sets,
      clears,
      hitRate,
    };
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    successRate: number;
    commonErrors: Record<string, number>;
  } {
    const successfulValidations = this.validationMetrics.filter((m) => m.isValid).length;
    const failedValidations = this.validationMetrics.length - successfulValidations;
    const successRate = this.validationMetrics.length > 0 ? successfulValidations / this.validationMetrics.length : 0;

    // Count common errors
    const commonErrors: Record<string, number> = {};
    for (const metric of this.validationMetrics) {
      for (const error of metric.errors) {
        commonErrors[error] = (commonErrors[error] || 0) + 1;
      }
    }

    return {
      totalValidations: this.validationMetrics.length,
      successfulValidations,
      failedValidations,
      successRate,
      commonErrors,
    };
  }

  /**
   * Get comprehensive statistics report
   */
  getStats(): {
    performance: ReturnType<typeof this.getPerformanceStats>;
    aiTokens: ReturnType<typeof this.getAITokenStats>;
    cache: ReturnType<typeof this.getCacheStats>;
    validation: ReturnType<typeof this.getValidationStats>;
  } {
    return {
      performance: this.getPerformanceStats(),
      aiTokens: this.getAITokenStats(),
      cache: this.getCacheStats(),
      validation: this.getValidationStats(),
    };
  }

  /**
   * Clear all metrics (useful for testing or periodic resets)
   */
  clearMetrics(): void {
    this.performanceMetrics = [];
    this.aiTokenMetrics = [];
    this.cacheMetrics = [];
    this.validationMetrics = [];
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, service, operation, message, duration, metadata } = entry;

    const parts = [`[${timestamp}]`, `[${level.toUpperCase()}]`, `[${service}]`, `[${operation}]`, message];

    if (duration !== undefined) {
      parts.push(`(${duration}ms)`);
    }

    if (metadata && Object.keys(metadata).length > 0) {
      parts.push(JSON.stringify(metadata));
    }

    return parts.join(' ');
  }

  /**
   * Sanitize metadata to remove sensitive information
   * Requirement 6.5: Don't expose sensitive information in errors
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized = { ...metadata };

    // Remove sensitive keys
    const sensitiveKeys = ['apiKey', 'api_key', 'password', 'token', 'secret', 'authorization'];

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    // Sanitize URLs
    if (sanitized.url && typeof sanitized.url === 'string') {
      sanitized.url = this.sanitizeUrl(sanitized.url);
    }

    return sanitized;
  }

  /**
   * Sanitize URL to remove sensitive query parameters
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Keep only the origin and pathname
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return '[URL]';
    }
  }

  /**
   * Calculate AI cost based on model and token usage
   * Prices as of November 2024 (approximate)
   */
  private calculateAICost(model: string, inputTokens: number, outputTokens: number, cachedTokens?: number): number {
    // Anthropic Claude pricing (per million tokens)
    const pricing: Record<string, { input: number; output: number; cachedInput: number }> = {
      'claude-3-5-sonnet-20241022': {
        input: 3.0, // $3 per million input tokens
        output: 15.0, // $15 per million output tokens
        cachedInput: 0.3, // $0.30 per million cached input tokens (90% discount)
      },
      'claude-3-5-sonnet-20240620': {
        input: 3.0,
        output: 15.0,
        cachedInput: 0.3,
      },
      'claude-3-opus-20240229': {
        input: 15.0,
        output: 75.0,
        cachedInput: 1.5,
      },
      'claude-3-sonnet-20240229': {
        input: 3.0,
        output: 15.0,
        cachedInput: 0.3,
      },
      'claude-3-haiku-20240307': {
        input: 0.25,
        output: 1.25,
        cachedInput: 0.025,
      },
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];

    // Calculate cost
    const uncachedInputTokens = cachedTokens ? inputTokens - cachedTokens : inputTokens;
    const inputCost = (uncachedInputTokens / 1_000_000) * modelPricing.input;
    const cachedCost = cachedTokens ? (cachedTokens / 1_000_000) * modelPricing.cachedInput : 0;
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

    return inputCost + cachedCost + outputCost;
  }

  /**
   * Calculate cache savings
   */
  private calculateCacheSavings(model: string, cachedTokens: number): number {
    const pricing: Record<string, { input: number; cachedInput: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3.0, cachedInput: 0.3 },
      'claude-3-5-sonnet-20240620': { input: 3.0, cachedInput: 0.3 },
      'claude-3-opus-20240229': { input: 15.0, cachedInput: 1.5 },
      'claude-3-sonnet-20240229': { input: 3.0, cachedInput: 0.3 },
      'claude-3-haiku-20240307': { input: 0.25, cachedInput: 0.025 },
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];

    // Savings = (full price - cached price) * tokens
    const fullCost = (cachedTokens / 1_000_000) * modelPricing.input;
    const cachedCost = (cachedTokens / 1_000_000) * modelPricing.cachedInput;

    return fullCost - cachedCost;
  }
}

/**
 * Singleton instance of logger service
 */
export const loggerService = new LoggerService();
