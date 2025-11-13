# Security Utilities for Bank Statement Import

This directory contains security utilities for the bank statement import feature.

## Quick Reference

### File Security (`file-security.ts`)

Validates uploaded files for security threats.

```typescript
import { generateUniqueFileName, sanitizeFileName, validateFile } from '@/lib/utils/file-security';

// Validate file (throws ImportError if invalid)
await validateFile(file);

// Sanitize file name
const safe = sanitizeFileName(userFileName);

// Generate unique file name
const unique = generateUniqueFileName(originalFileName);
```

**Checks**:

- File extension (`.ofx`, `.csv`, `.pdf`)
- MIME type validation
- File size (max 10MB)
- Malicious content patterns
- Script tags, JavaScript, event handlers
- Null byte exploits

### Rate Limiter (`rate-limiter.ts`)

Prevents abuse by limiting requests per user.

```typescript
import { checkImportRateLimit, checkImportPreviewRateLimit } from '@/lib/utils/rate-limiter';

// Check import rate limit (10/hour)
const { allowed, remaining, resetIn } = checkImportRateLimit(userId);

if (!allowed) {
  return error(`Try again in ${resetIn} seconds`);
}

// Check preview rate limit (20/hour)
const preview = checkImportPreviewRateLimit(userId);
```

**Limits**:

- Import: 10 requests per hour
- Preview: 20 requests per hour

### Audit Logger (`audit-logger.ts`)

Logs security events for monitoring and compliance.

```typescript
import {
  logFileValidationFailed,
  logImportCompleted,
  logImportFailed,
  logImportStarted,
  logRateLimitExceeded,
  logUnauthorizedAccess,
} from '@/lib/utils/audit-logger';

// Log import started
await logImportStarted(userId, fileName, accountId, fileSize, ipAddress, userAgent);

// Log import completed
await logImportCompleted(userId, fileName, accountId, transactionCount, importId);

// Log security events
await logFileValidationFailed(userId, fileName, reason, ipAddress);
await logRateLimitExceeded(userId, operation, ipAddress);
await logUnauthorizedAccess(userId, accountId, ipAddress);
```

**Events**:

- `IMPORT_STARTED`
- `IMPORT_COMPLETED`
- `IMPORT_FAILED`
- `IMPORT_PREVIEW`
- `FILE_VALIDATION_FAILED`
- `RATE_LIMIT_EXCEEDED`
- `UNAUTHORIZED_ACCESS`
- `MALICIOUS_CONTENT_DETECTED`

### Temp File Manager (`temp-file-manager.ts`)

Manages temporary file storage with automatic cleanup.

```typescript
import { deleteTempFile, getTempFile, storeTempFile } from '@/lib/utils/temp-file-manager';

// Store file (returns unique ID)
const fileId = storeTempFile(fileName, content);

// Retrieve file
const file = getTempFile(fileId);
if (file) {
  const { fileName, content } = file;
}

// Delete file
deleteTempFile(fileId);
```

**Features**:

- In-memory storage
- Auto-cleanup after 1 hour
- Unique file names
- Periodic cleanup every 5 minutes

## API Integration Example

```typescript
// app/api/transactions/import/preview/route.ts
import { getCurrentUserId } from '@/lib/auth/session';
import { logFileValidationFailed, logImportPreview } from '@/lib/utils/audit-logger';
import { validateFile } from '@/lib/utils/file-security';
import { checkImportPreviewRateLimit } from '@/lib/utils/rate-limiter';

export async function POST(request: NextRequest) {
  // 1. Authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limiting
  const rateLimit = checkImportPreviewRateLimit(userId);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: `Try again in ${rateLimit.resetIn} seconds` }, { status: 429 });
  }

  // 3. File validation
  try {
    await validateFile(file);
  } catch (error) {
    await logFileValidationFailed(userId, file.name, error.message);
    throw error;
  }

  // 4. Process import
  const result = await importService.previewImport(file, accountId, userId);

  // 5. Audit logging
  await logImportPreview(userId, file.name, accountId, result.transactions.length);

  return NextResponse.json({ success: true, data: result });
}
```

## Security Best Practices

1. **Always validate files** before processing
2. **Check rate limits** before expensive operations
3. **Log security events** for audit trail
4. **Verify authentication** on all endpoints
5. **Check authorization** before accessing resources
6. **Use HTTPS** for all file uploads
7. **Never log sensitive data** (passwords, tokens, etc.)
8. **Handle errors gracefully** without exposing internals

## Monitoring

Check console logs for security events:

```bash
# Filter audit logs
grep "\[AUDIT\]" logs/app.log

# Check rate limit events
grep "RATE_LIMIT_EXCEEDED" logs/app.log

# Check validation failures
grep "FILE_VALIDATION_FAILED" logs/app.log
```

## Configuration

Rate limits can be adjusted in `rate-limiter.ts`:

```typescript
export const RATE_LIMITS = {
  IMPORT: {
    maxRequests: 10, // Adjust as needed
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};
```

File size limit in `file-security.ts`:

```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

## Testing

```typescript
import { validateFile } from '@/lib/utils/file-security';
import { checkImportRateLimit } from '@/lib/utils/rate-limiter';

describe('File Security', () => {
  it('should reject files larger than 10MB', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv');
    await expect(validateFile(largeFile)).rejects.toThrow();
  });
});

describe('Rate Limiter', () => {
  it('should allow up to 10 imports per hour', () => {
    for (let i = 0; i < 10; i++) {
      const { allowed } = checkImportRateLimit('user123');
      expect(allowed).toBe(true);
    }

    const { allowed } = checkImportRateLimit('user123');
    expect(allowed).toBe(false);
  });
});
```

## Troubleshooting

### Rate limit not resetting

Rate limits reset automatically after the time window. Check `getResetTime()` for remaining time.

### Files not being cleaned up

Temp file manager runs cleanup every 5 minutes. Files expire after 1 hour.

### Audit logs not appearing

Check console output. Database logging is optional and requires `audit_logs` collection.

## Support

For questions or issues:

1. Check `.kiro/specs/bank-statement-import/SECURITY_IMPLEMENTATION.md`
2. Review security requirements in `requirements.md`
3. Check design document for security considerations
