/**
 * Sharing Types for Joint Accounts Feature
 *
 * This module defines all types related to the joint accounts sharing system,
 * including relationships, invitations, and data transfer objects.
 */

// ============================================
// Sharing Relationship Types
// ============================================

export type SharingRelationshipStatus = 'active' | 'terminated';

/**
 * Sharing relationship between a responsible user and a member user
 */
export interface SharingRelationship {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  responsible_user_id: string;
  member_user_id: string;
  status: SharingRelationshipStatus;
  started_at: string;
  terminated_at?: string;
  terminated_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Detailed relationship information including user details
 */
export interface SharingRelationshipDetails {
  relationship: SharingRelationship;
  responsibleUser: {
    id: string;
    name: string;
    email: string;
  };
  memberUser: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================
// Invitation Types
// ============================================

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';

/**
 * Invitation to join a sharing relationship
 */
export interface SharingInvitation {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  responsible_user_id: string;
  invited_email: string;
  invited_user_id?: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Data Transfer Objects (DTOs)
// ============================================

/**
 * Request to create a new invitation
 */
export interface CreateInvitationDto {
  invitedEmail: string;
}

/**
 * Request to accept an invitation
 */
export interface AcceptInvitationDto {
  token: string;
}

/**
 * Request to reject an invitation
 */
export interface RejectInvitationDto {
  token: string;
}

/**
 * Request to terminate a relationship
 */
export interface TerminateRelationshipDto {
  relationshipId: string;
}

// ============================================
// Shared Data Context Types
// ============================================

/**
 * Context information about shared data access for a user
 */
export interface SharedDataContext {
  currentUserId: string;
  linkedUserId?: string;
  isResponsible: boolean;
  isMember: boolean;
  hasActiveRelationship: boolean;
}

// ============================================
// Ownership Types
// ============================================

/**
 * Base interface for data with ownership information
 */
export interface WithOwnership {
  ownerId: string;
  ownerName: string;
  isOwn: boolean;
}

/**
 * Account with ownership metadata
 */
export interface AccountWithOwnership extends WithOwnership {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  name: string;
  account_type: 'checking' | 'savings' | 'investment' | 'vale' | 'other';
  balance: number;
  is_manual: boolean;
  data?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Transaction with ownership metadata
 */
export interface TransactionWithOwnership extends WithOwnership {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'salary';
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  account_id?: string;
  credit_card_id?: string;
  category?: string;
  description?: string;
  data?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Credit card with ownership metadata
 */
export interface CreditCardWithOwnership extends WithOwnership {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  account_id: string;
  name: string;
  last_digits: string;
  credit_limit: number;
  used_limit: number;
  closing_day: number;
  due_day: number;
  data?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Invoice with ownership metadata
 */
export interface InvoiceWithOwnership extends WithOwnership {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  invoice_key: string;
  invoice_number: string;
  issue_date: string;
  merchant_cnpj: string;
  merchant_name: string;
  total_amount: number;
  category: 'pharmacy' | 'groceries' | 'supermarket' | 'restaurant' | 'fuel' | 'retail' | 'services' | 'other';
  data?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Response Types
// ============================================

/**
 * Response for invitation validation
 */
export interface ValidateInvitationResponse {
  invitation: SharingInvitation;
  responsibleUser: {
    name: string;
    email: string;
  };
  canAccept: boolean;
  reason?: string;
}

/**
 * Response for relationship query
 */
export interface GetRelationshipResponse {
  relationship: SharingRelationshipDetails | null;
  role: 'responsible' | 'member' | null;
}

/**
 * Response for members list
 */
export interface GetMembersResponse {
  members: SharingRelationshipDetails[];
}
