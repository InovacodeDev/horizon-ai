/**
 * Audit Log Service
 *
 * Handles logging of all sharing-related events for audit and compliance purposes.
 * Tracks invitation lifecycle and relationship changes.
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, SharingAuditLog } from '@/lib/appwrite/schema';
import { ID, Query } from 'node-appwrite';

const databases = getAppwriteDatabases();

export type AuditAction =
  | 'invitation_created'
  | 'invitation_accepted'
  | 'invitation_rejected'
  | 'invitation_cancelled'
  | 'relationship_terminated';

export type AuditResourceType = 'invitation' | 'relationship';

export interface AuditLogDetails {
  invitedEmail?: string;
  invitedUserId?: string;
  responsibleUserId?: string;
  memberUserId?: string;
  terminatedBy?: string;
  reason?: string;
  [key: string]: any;
}

export class AuditLogService {
  /**
   * Log invitation creation event
   */
  async logInvitationCreated(
    responsibleUserId: string,
    invitationId: string,
    invitedEmail: string,
  ): Promise<SharingAuditLog> {
    const details: AuditLogDetails = {
      invitedEmail,
      responsibleUserId,
    };

    return this.createAuditLog(responsibleUserId, 'invitation_created', 'invitation', invitationId, details);
  }

  /**
   * Log invitation acceptance event
   */
  async logInvitationAccepted(
    memberUserId: string,
    invitationId: string,
    responsibleUserId: string,
    relationshipId: string,
  ): Promise<SharingAuditLog> {
    const details: AuditLogDetails = {
      memberUserId,
      responsibleUserId,
      relationshipId,
    };

    return this.createAuditLog(memberUserId, 'invitation_accepted', 'invitation', invitationId, details);
  }

  /**
   * Log invitation rejection event
   */
  async logInvitationRejected(
    memberUserId: string,
    invitationId: string,
    responsibleUserId: string,
  ): Promise<SharingAuditLog> {
    const details: AuditLogDetails = {
      memberUserId,
      responsibleUserId,
    };

    return this.createAuditLog(memberUserId, 'invitation_rejected', 'invitation', invitationId, details);
  }

  /**
   * Log invitation cancellation event
   */
  async logInvitationCancelled(
    responsibleUserId: string,
    invitationId: string,
    invitedEmail: string,
  ): Promise<SharingAuditLog> {
    const details: AuditLogDetails = {
      responsibleUserId,
      invitedEmail,
    };

    return this.createAuditLog(responsibleUserId, 'invitation_cancelled', 'invitation', invitationId, details);
  }

  /**
   * Log relationship termination event
   */
  async logRelationshipTerminated(
    terminatedBy: string,
    relationshipId: string,
    responsibleUserId: string,
    memberUserId: string,
    reason?: string,
  ): Promise<SharingAuditLog> {
    const details: AuditLogDetails = {
      terminatedBy,
      responsibleUserId,
      memberUserId,
      reason,
    };

    return this.createAuditLog(terminatedBy, 'relationship_terminated', 'relationship', relationshipId, details);
  }

  /**
   * Get audit logs for a specific user
   */
  async getAuditLogsByUser(userId: string, limit: number = 50, offset: number = 0): Promise<SharingAuditLog[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_AUDIT_LOGS, [
        Query.equal('user_id', userId),
        Query.orderDesc('created_at'),
        Query.limit(limit),
        Query.offset(offset),
      ]);

      return response.documents as unknown as SharingAuditLog[];
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getAuditLogsByResource(resourceType: AuditResourceType, resourceId: string): Promise<SharingAuditLog[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_AUDIT_LOGS, [
        Query.equal('resource_type', resourceType),
        Query.equal('resource_id', resourceId),
        Query.orderDesc('created_at'),
      ]);

      return response.documents as unknown as SharingAuditLog[];
    } catch (error: any) {
      console.error('Error fetching audit logs by resource:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  /**
   * Get audit logs by action type
   */
  async getAuditLogsByAction(action: AuditAction, limit: number = 50, offset: number = 0): Promise<SharingAuditLog[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_AUDIT_LOGS, [
        Query.equal('action', action),
        Query.orderDesc('created_at'),
        Query.limit(limit),
        Query.offset(offset),
      ]);

      return response.documents as unknown as SharingAuditLog[];
    } catch (error: any) {
      console.error('Error fetching audit logs by action:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  /**
   * Create an audit log entry
   */
  private async createAuditLog(
    userId: string,
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string,
    details?: AuditLogDetails,
  ): Promise<SharingAuditLog> {
    try {
      const now = new Date().toISOString();

      const auditLog = await databases.createDocument(DATABASE_ID, COLLECTIONS.SHARING_AUDIT_LOGS, ID.unique(), {
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details ? JSON.stringify(details) : undefined,
        created_at: now,
      });

      return auditLog as unknown as SharingAuditLog;
    } catch (error: any) {
      console.error('Error creating audit log:', error);
      // Don't throw error - audit logging should not break the main flow
      // Just log the error and return a mock object
      console.warn('Audit log creation failed, continuing without logging');
      return {
        $id: 'failed',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details ? JSON.stringify(details) : undefined,
        created_at: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
