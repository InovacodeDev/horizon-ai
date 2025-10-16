# Structured Logger

A structured logging utility for Horizon AI that provides consistent logging with context and multiple log levels.

## Features

- **Multiple log levels**: debug, info, warn, error
- **Structured context**: Add userId, requestId, and custom context to logs
- **Environment-aware**: Pretty printing in development, JSON in production
- **Error tracking ready**: Integrates with Sentry or other error tracking services
- **Request-scoped loggers**: Create loggers with pre-filled context

## Usage

### Basic Logging

```typescript
import { logger } from "@/lib/logger";

// Info log
logger.info("User logged in successfully", {
  userId: "user_123",
  method: "email",
});

// Error log
logger.error("Failed to fetch data", error, {
  userId: "user_123",
  endpoint: "/api/dashboard",
});

// Warning log
logger.warn("Rate limit approaching", {
  userId: "user_123",
  currentCount: 95,
  limit: 100,
});

// Debug log (only in development or when LOG_LEVEL=debug)
logger.debug("Cache hit", {
  key: "dashboard:user_123",
  ttl: 300,
});
```

### Request-Scoped Logger

For API routes, create a request-scoped logger with pre-filled context:

```typescript
import { createRequestLogger } from "@/lib/logger";
import { createId } from "@paralleldrive/cuid2";

export async function GET(request: Request) {
  const requestId = createId();
  const userId = await getUserIdFromRequest(request);
  const log = createRequestLogger(requestId, userId);

  log.info("Processing dashboard request");

  try {
    const data = await fetchDashboardData(userId);
    log.info("Dashboard data fetched successfully", {
      itemCount: data.length,
    });
    return NextResponse.json(data);
  } catch (error) {
    log.error("Failed to fetch dashboard data", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### API Route Logging

Use the convenience method for API route logging:

```typescript
import { logger } from "@/lib/logger";

const startTime = Date.now();

// ... handle request ...

logger.apiLog("API request completed", {
  method: request.method,
  path: request.url,
  statusCode: 200,
  duration: Date.now() - startTime,
  userId: "user_123",
});
```

## Configuration

Set the minimum log level via environment variable:

```bash
# .env.local
LOG_LEVEL=debug  # debug | info | warn | error
```

Default is `info` in production and `debug` in development.

## Integration with Error Tracking

To integrate with Sentry or other error tracking services, set the appropriate environment variable:

```bash
# .env.local
SENTRY_DSN=your_sentry_dsn_here
```

The logger will automatically send errors to Sentry in production when configured.

## Log Format

### Development

Pretty-printed with emojis for easy reading:

```
ℹ️ [2024-10-16T10:30:00.000Z] User logged in successfully
Context: { userId: 'user_123', method: 'email' }
```

### Production

Structured JSON for log aggregation:

```json
{
  "timestamp": "2024-10-16T10:30:00.000Z",
  "level": "info",
  "message": "User logged in successfully",
  "context": {
    "userId": "user_123",
    "method": "email"
  }
}
```

## Best Practices

1. **Always include context**: Add userId, requestId, or other relevant context
2. **Use appropriate levels**:
   - `debug`: Detailed diagnostic information
   - `info`: General informational messages
   - `warn`: Warning messages for potentially harmful situations
   - `error`: Error events that might still allow the application to continue
3. **Don't log sensitive data**: Never log passwords, tokens, or PII
4. **Use request-scoped loggers**: For API routes, create a logger with requestId
5. **Log errors with context**: Always include the error object and relevant context
