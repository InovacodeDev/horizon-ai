/**
 * Sharing Permissions Middleware
 *
 * This module provides permission check functions for the joint accounts sharing system.
 * It verifies user ownership and access rights for shared resources.
 */
import { SharingService } from '@/lib/services/sharing.service';

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Resource types that can be shared
 */
export type SharedResourceType = 'account' | 'transaction' | 'credit_card' | 'invoice';

/**
 * Sharing Permissions Service
 * Provides methods to check user permissions for shared resources
 */
export class SharingPermissions {
  private sharingService: SharingService;

  constructor() {
    this.sharingService = new SharingService();
  }

  /**
   * Check if a user can modify a resource
   * Users can only modify their own resources, not shared ones
   *
   * @param userId - ID of the user attempting to modify
   * @param resourceOwnerId - ID of the resource owner
   * @param resourceType - Type of resource being modified
   * @returns Permission check result
   */
  async canModifyResource(
    userId: string,
    resourceOwnerId: string,
    resourceType: SharedResourceType,
  ): Promise<PermissionCheckResult> {
    // Users can only modify their own resources
    if (userId === resourceOwnerId) {
      return { allowed: true };
    }

    // Check if user has access via sharing relationship
    const hasAccess = await this.canAccessResource(userId, resourceOwnerId);

    if (hasAccess.allowed) {
      return {
        allowed: false,
        reason: `Você não pode modificar ${this.getResourceTypeName(resourceType)} de outro usuário`,
      };
    }

    return {
      allowed: false,
      reason: 'Você não tem permissão para modificar este recurso',
    };
  }

  /**
   * Check if a user can access a resource
   * Users can access their own resources and resources from linked users
   *
   * @param userId - ID of the user attempting to access
   * @param resourceOwnerId - ID of the resource owner
   * @returns Permission check result
   */
  async canAccessResource(userId: string, resourceOwnerId: string): Promise<PermissionCheckResult> {
    // Users can always access their own resources
    if (userId === resourceOwnerId) {
      return { allowed: true };
    }

    // Check if user has active sharing relationship with resource owner
    const sharedContext = await this.sharingService.getSharedDataContext(userId);

    if (sharedContext.hasActiveRelationship && sharedContext.linkedUserId === resourceOwnerId) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Você não tem permissão para acessar este recurso',
    };
  }

  /**
   * Check if a user can delete a resource
   * Users can only delete their own resources, not shared ones
   *
   * @param userId - ID of the user attempting to delete
   * @param resourceOwnerId - ID of the resource owner
   * @param resourceType - Type of resource being deleted
   * @returns Permission check result
   */
  async canDeleteResource(
    userId: string,
    resourceOwnerId: string,
    resourceType: SharedResourceType,
  ): Promise<PermissionCheckResult> {
    // Users can only delete their own resources
    if (userId === resourceOwnerId) {
      return { allowed: true };
    }

    // Check if user has access via sharing relationship
    const hasAccess = await this.canAccessResource(userId, resourceOwnerId);

    if (hasAccess.allowed) {
      return {
        allowed: false,
        reason: `Você não pode excluir ${this.getResourceTypeName(resourceType)} de outro usuário`,
      };
    }

    return {
      allowed: false,
      reason: 'Você não tem permissão para excluir este recurso',
    };
  }

  /**
   * Verify user owns a resource
   * Simple ownership check without considering sharing relationships
   *
   * @param userId - ID of the user
   * @param resourceOwnerId - ID of the resource owner
   * @returns True if user owns the resource
   */
  verifyOwnership(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
  }

  /**
   * Get user-friendly resource type name in Portuguese
   *
   * @param resourceType - Type of resource
   * @returns Localized resource type name
   */
  private getResourceTypeName(resourceType: SharedResourceType): string {
    const resourceNames: Record<SharedResourceType, string> = {
      account: 'contas',
      transaction: 'transações',
      credit_card: 'cartões de crédito',
      invoice: 'notas fiscais',
    };

    return resourceNames[resourceType] || 'recursos';
  }
}

/**
 * Singleton instance of SharingPermissions
 */
let sharingPermissionsInstance: SharingPermissions | null = null;

/**
 * Get or create the SharingPermissions singleton instance
 *
 * @returns SharingPermissions instance
 */
export function getSharingPermissions(): SharingPermissions {
  if (!sharingPermissionsInstance) {
    sharingPermissionsInstance = new SharingPermissions();
  }
  return sharingPermissionsInstance;
}

/**
 * Convenience function to check if user can modify a resource
 *
 * @param userId - ID of the user attempting to modify
 * @param resourceOwnerId - ID of the resource owner
 * @param resourceType - Type of resource being modified
 * @returns Permission check result
 */
export async function canModifyResource(
  userId: string,
  resourceOwnerId: string,
  resourceType: SharedResourceType,
): Promise<PermissionCheckResult> {
  const permissions = getSharingPermissions();
  return permissions.canModifyResource(userId, resourceOwnerId, resourceType);
}

/**
 * Convenience function to check if user can access a resource
 *
 * @param userId - ID of the user attempting to access
 * @param resourceOwnerId - ID of the resource owner
 * @returns Permission check result
 */
export async function canAccessResource(userId: string, resourceOwnerId: string): Promise<PermissionCheckResult> {
  const permissions = getSharingPermissions();
  return permissions.canAccessResource(userId, resourceOwnerId);
}

/**
 * Convenience function to check if user can delete a resource
 *
 * @param userId - ID of the user attempting to delete
 * @param resourceOwnerId - ID of the resource owner
 * @param resourceType - Type of resource being deleted
 * @returns Permission check result
 */
export async function canDeleteResource(
  userId: string,
  resourceOwnerId: string,
  resourceType: SharedResourceType,
): Promise<PermissionCheckResult> {
  const permissions = getSharingPermissions();
  return permissions.canDeleteResource(userId, resourceOwnerId, resourceType);
}

/**
 * Convenience function to verify user owns a resource
 *
 * @param userId - ID of the user
 * @param resourceOwnerId - ID of the resource owner
 * @returns True if user owns the resource
 */
export function verifyOwnership(userId: string, resourceOwnerId: string): boolean {
  const permissions = getSharingPermissions();
  return permissions.verifyOwnership(userId, resourceOwnerId);
}
