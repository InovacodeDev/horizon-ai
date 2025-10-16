import { createId } from "@paralleldrive/cuid2";
import { supabaseAdmin } from "@/lib/db/supabase";

export type AuditEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "REGISTER"
  | "UNAUTHORIZED_ACCESS"
  | "TOKEN_REFRESH"
  | "PASSWORD_CHANGE"
  | "CONNECTION_CREATED"
  | "CONNECTION_DELETED"
  | "DATA_ACCESS"
  | "RATE_LIMIT_EXCEEDED";

export interface AuditLogEntry {
  userId?: string;
  eventType: AuditEventType;
  eventDescription?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a security audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Use type assertion since audit_logs table isn't in generated types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any).from("audit_logs").insert({
      id: createId(),
      user_id: entry.userId || null,
      event_type: entry.eventType,
      event_description: entry.eventDescription || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      resource_type: entry.resourceType || null,
      resource_id: entry.resourceId || null,
      metadata: entry.metadata || null,
    });

    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (error) {
    // Don't throw errors from audit logging to avoid breaking the main flow
    console.error("Error logging audit event:", error);
  }
}

/**
 * Extract client information from request
 */
export function getClientInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  let ipAddress = "unknown";
  if (forwarded) {
    ipAddress = forwarded.split(",")[0].trim();
  } else if (realIp) {
    ipAddress = realIp;
  } else if (cfConnectingIp) {
    ipAddress = cfConnectingIp;
  }

  const userAgent = request.headers.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}

/**
 * Query audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any)
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }

  return data || [];
}

/**
 * Query audit logs by event type
 */
export async function getAuditLogsByEventType(
  eventType: AuditEventType,
  limit: number = 50,
  offset: number = 0
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any)
    .from("audit_logs")
    .select("*")
    .eq("event_type", eventType)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }

  return data || [];
}

/**
 * Query failed login attempts for security monitoring
 */
export async function getFailedLoginAttempts(
  ipAddress?: string,
  timeWindowMinutes: number = 60
) {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindowMinutes);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabaseAdmin as any)
    .from("audit_logs")
    .select("*")
    .eq("event_type", "LOGIN_FAILURE")
    .gte("created_at", cutoffTime.toISOString())
    .order("created_at", { ascending: false });

  if (ipAddress) {
    query = query.eq("ip_address", ipAddress);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching failed login attempts:", error);
    return [];
  }

  return data || [];
}
