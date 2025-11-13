/**
 * Security Audit Logger
 * Logs security-related events for import operations
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { DATABASE_ID } from '@/lib/appwrite/schema';
import { ID } from 'node-appwrite';

/**
 * Audit event types
 */
export enum AuditEventType {
  IMPORT_STARTED = 'IMPORT_STARTED',
  IMPORT_COMPLETED = 'IMPORT_COMPLETED',
  IMPORT_FAILED = 'IMPORT_FAILED',
  IMPORT_PREVIEW = 'IMPORT_PREVIEW',
  FILE_VALIDATION_FAILED = 'FILE_VALIDATION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  MALICIOUS_CONTENT_DETECTED = 'MALICIOUS_CONTENT_DETECTED',
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  eventType: AuditEventType;
  userId: string;
  timestamp: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log audit event
 * Logs security-related events to console and optionally to database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  // Always log to console for immediate visibility
  console.log('[AUDIT]', {
    type: entry.eventType,
    userId: entry.userId,
    timestamp: entry.timestamp,
    details: entry.details,
  });

  // Optionally store in database for long-term audit trail
  // Note: This requires an audit_logs collection to be created
  try {
    const dbAdapter = getAppwriteDatabases();

    // Check if audit_logs collection exists
    // For now, we'll just log to console
    // In production, you would create an audit_logs collection and store here

    // Example implementation:
    // await dbAdapter.createDocument(
    //   DATABASE_ID,
    //   'audit_logs',
    //   ID.unique(),
    //   {
    //     event_type: entry.eventType,
    //     user_id: entry.userId,
    //     timestamp: entry.timestamp,
    //     details: JSON.stringify(entry.details),
    //     ip_address: entry.ipAddress,
    //     user_agent: entry.userAgent,
    //   }
    // );
  } catch (error) {
    // Don't fail the operation if audit logging fails
    console.error('[AUDIT] Failed to store audit log:', error);
  }
}

/**
 * Log import started event
 */
export async function logImportStarted(
  userId: string,
  fileName: string,
  accountId: string,
  fileSize: number,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.IMPORT_STARTED,
    userId,
    timestamp: new Date().toISOString(),
    details: {
      fileName,
      accountId,
      fileSize,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log import completed event
 */
export async function logImportCompleted(
  userId: string,
  fileName: string,
  accountId: string,
  transactionCount: number,
  importId: string,
): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.IMPORT_COMPLETED,
    userId,
    timestamp: new Date().toISOString(),
    details: {
      fileName,
      accountId,
      transactionCount,
      importId,
    },
  });
}

/**
 * Log import failed event
 */
export async function logImportFailed(
  userId: string,
  fileName: string,
  accountId: string,
  error: string,
): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.IMPORT_FAILED,
    userId,
    timestamp: new Date().toISOString(),
    details: {
      fileName,
      accountId,
      error,
    },
  });
}

/**
 * Log import preview event
 */
export async function logImportPreview(
  userId: string,
  fileName: string,
  accountId: string,
  transactionCount: number,
): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.IMPORT_PREVIEW,
    userId,
    timestamp: new Date().toISOString(),
    details: {
      fileName,
      accountId,
      transactionCount,
    },
  });
}

/**
 * Log file validation failed event
 */
export async function logFileValidationFailed(
  userId: string,
  fileName: string,
  reason: string,
  ipAddress?: string,
): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.FILE_VALIDATION_FAILED,
    userId,
    timestamp: new Date().toISOString(),
    details: {
      fileName,
      reason,
    },
    ipAddress,
  });
}

/**
 * Log rate limit exceeded event
 */
export async function logRateLimitExceeded(userId: string, operation: string, ipAddress?: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
    userId,
    timestamp: new Date().toISOString(),
    details: {
      operation,
    },
    ipAddress,
  });
}

/**
 * Log unauthorized access event
 */
export async function logUnauthorizedAccess(userId: string, accountId: string, ipAddress?: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.UNAUTHORIZED_ACCESS,
    userId,
    timestamp: new Date().toISOString(),
    details: {
      accountId,
    },
    ipAddress,
  });
}

/**
 * Log malicious content detected event
 */
export async function logMaliciousContentDetected(userId: string, fileName: string, ipAddress?: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.MALICIOUS_CONTENT_DETECTED,
    userId,
    timestamp: new Date().toISOString(),
    details: {
      fileName,
    },
    ipAddress,
  });
}
