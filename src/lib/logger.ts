/**
 * Structured logging utility for Horizon AI
 * Provides consistent logging with context and levels
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print in development
      const { level, message, context, error } = entry;
      const emoji = {
        debug: "🔍",
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
      }[level];

      console[level === "debug" ? "log" : level](
        `${emoji} [${entry.timestamp}] ${message}`,
        context ? "\nContext:" : "",
        context || "",
        error ? "\nError:" : "",
        error || ""
      );
    } else {
      // Structured JSON in production (for Vercel Logs, Sentry, etc.)
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog("debug")) return;
    const entry = this.formatLogEntry("debug", message, context);
    this.output(entry);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog("info")) return;
    const entry = this.formatLogEntry("info", message, context);
    this.output(entry);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog("warn")) return;
    const entry = this.formatLogEntry("warn", message, context);
    this.output(entry);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog("error")) return;
    const entry = this.formatLogEntry("error", message, context, error);
    this.output(entry);

    // In production, you would send to error tracking service
    if (!this.isDevelopment && process.env.SENTRY_DSN) {
      // Example: Sentry.captureException(error, { contexts: { custom: context } });
    }
  }

  // Convenience method for API route logging
  apiLog(
    message: string,
    context: {
      method: string;
      path: string;
      statusCode: number;
      duration: number;
      userId?: string;
    }
  ): void {
    const level: LogLevel = context.statusCode >= 500 ? "error" : "info";
    this[level](message, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export helper for creating request-scoped loggers
export function createRequestLogger(requestId: string, userId?: string) {
  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { requestId, userId, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { requestId, userId, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { requestId, userId, ...context }),
    error: (message: string, error?: Error, context?: LogContext) =>
      logger.error(message, error, { requestId, userId, ...context }),
  };
}
