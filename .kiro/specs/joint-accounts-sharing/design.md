# Design Document - Joint Accounts Sharing System

## Overview

The Joint Accounts Sharing System enables users to share their complete financial data with family members or partners through a hierarchical relationship model. A primary account holder (Responsible_User) can invite multiple members (Member_Users) to establish bidirectional data access, while each member can only be linked to one responsible user at a time. This design ensures data consistency, security, and a clear ownership model while providing seamless access to shared financial information.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Family Page  │  │ Settings     │  │ Dashboard    │      │
│  │              │  │ Page         │  │ Pages        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js API)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/family  │  │ /api/sharing │  │ /api/accounts│      │
│  │ /invitations │  │ /relationships│ │ (enhanced)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (TypeScript)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Sharing      │  │ Invitation   │  │ Data Access  │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer (Appwrite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ sharing_     │  │ sharing_     │  │ users,       │      │
│  │ relationships│  │ invitations  │  │ accounts,    │      │
│  │              │  │              │  │ transactions │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Invitation Flow**:
   - Responsible_User creates invitation → Invitation stored in DB → Email sent to invitee
   - Member_User clicks link → Validates invitation → Accepts/Rejects
   - On acceptance → Creates sharing_relationship → Both users gain access

2. **Data Access Flow**:
   - User requests data (e.g., accounts) → Service checks for active relationships
   - If relationship exists → Fetch user's own data + linked user's data
   - Apply ownership labels → Return merged dataset

3. **Termination Flow**:
   - Either user initiates termination → Update relationship status to 'terminated'
   - Revoke data access immediately → Send notifications to both users

## Components and Interfaces

### Database Schema

#### Collection: sharing_relationships

Stores active and terminated sharing relationships between users.

```typescript
{
  collectionId: 'sharing_relationships',
  name: 'Sharing Relationships',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'responsible_user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'member_user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'status',
      type: 'enum',
      elements: ['active', 'terminated'],
      required: true,
      array: false,
    },
    {
      key: 'started_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'terminated_at',
      type: 'datetime',
      required: false,
    },
    {
      key: 'terminated_by',
      type: 'string',
      size: 255,
      required: false,
      array: false,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_responsible_user',
      type: 'key',
      attributes: ['responsible_user_id'],
      orders: ['ASC'],
    },
    {
      key: 'idx_member_user',
      type: 'unique',
      attributes: ['member_user_id', 'status'],
    },
    {
      key: 'idx_status',
      type: 'key',
      attributes: ['status'],
    },
  ],
}
```

**Key Design Decisions**:

- `member_user_id` + `status` unique index ensures a member can only have one active relationship
- `responsible_user_id` is indexed but not unique, allowing multiple members per responsible
- `terminated_by` tracks which user initiated termination for audit purposes

#### Collection: sharing_invitations

Stores pending, accepted, rejected, and expired invitations.

```typescript
{
  collectionId: 'sharing_invitations',
  name: 'Sharing Invitations',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'responsible_user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'invited_email',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'invited_user_id',
      type: 'string',
      size: 255,
      required: false,
      array: false,
    },
    {
      key: 'token',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'status',
      type: 'enum',
      elements: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
      required: true,
      array: false,
    },
    {
      key: 'expires_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'accepted_at',
      type: 'datetime',
      required: false,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_token',
      type: 'unique',
      attributes: ['token'],
    },
    {
      key: 'idx_responsible_user',
      type: 'key',
      attributes: ['responsible_user_id'],
      orders: ['ASC'],
    },
    {
      key: 'idx_invited_email',
      type: 'key',
      attributes: ['invited_email'],
    },
    {
      key: 'idx_status',
      type: 'key',
      attributes: ['status'],
    },
    {
      key: 'idx_expires_at',
      type: 'key',
      attributes: ['expires_at'],
      orders: ['ASC'],
    },
  ],
}
```

**Key Design Decisions**:

- `token` is unique and used for secure invitation links
- `invited_user_id` is populated when the invited email matches an existing user
- `expires_at` enables automatic expiration after 7 days
- Multiple status values track the complete invitation lifecycle

### TypeScript Interfaces

```typescript
// lib/types/sharing.types.ts

export type SharingRelationshipStatus = 'active' | 'terminated';

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

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';

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

export interface CreateInvitationDto {
  invitedEmail: string;
}

export interface AcceptInvitationDto {
  token: string;
}

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

export interface SharedDataContext {
  currentUserId: string;
  linkedUserId?: string;
  isResponsible: boolean;
  isMember: boolean;
}
```

### Service Layer

#### SharingService

Manages sharing relationships and data access logic.

```typescript
// lib/services/sharing.service.ts

export class SharingService {
  /**
   * Get active sharing relationship for a user
   * Returns relationship details if user is either responsible or member
   */
  async getActiveRelationship(userId: string): Promise<SharingRelationship | null>;

  /**
   * Get all active members for a responsible user
   */
  async getActiveMembers(responsibleUserId: string): Promise<SharingRelationshipDetails[]>;

  /**
   * Check if a user has an active relationship
   */
  async hasActiveRelationship(userId: string): Promise<boolean>;

  /**
   * Get shared data context for a user
   * Returns information about linked user and relationship type
   */
  async getSharedDataContext(userId: string): Promise<SharedDataContext>;

  /**
   * Terminate a sharing relationship
   * Can be called by either responsible or member user
   */
  async terminateRelationship(relationshipId: string, terminatedBy: string): Promise<void>;

  /**
   * Get relationship details by ID
   */
  async getRelationshipDetails(relationshipId: string): Promise<SharingRelationshipDetails>;
}
```

#### InvitationService

Handles invitation creation, validation, and acceptance.

```typescript
// lib/services/invitation.service.ts

export class InvitationService {
  /**
   * Create a new invitation
   * Validates that invited user doesn't already have an active relationship
   */
  async createInvitation(responsibleUserId: string, invitedEmail: string): Promise<SharingInvitation>;

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<SharingInvitation | null>;

  /**
   * Accept an invitation
   * Creates sharing relationship and updates invitation status
   */
  async acceptInvitation(token: string, memberUserId: string): Promise<SharingRelationship>;

  /**
   * Reject an invitation
   */
  async rejectInvitation(token: string, memberUserId: string): Promise<void>;

  /**
   * Cancel a pending invitation (by responsible user)
   */
  async cancelInvitation(invitationId: string, responsibleUserId: string): Promise<void>;

  /**
   * Get all invitations for a responsible user
   */
  async getInvitationsByResponsible(responsibleUserId: string): Promise<SharingInvitation[]>;

  /**
   * Get pending invitations for an email
   */
  async getPendingInvitationsByEmail(email: string): Promise<SharingInvitation[]>;

  /**
   * Resend invitation email
   */
  async resendInvitation(invitationId: string, responsibleUserId: string): Promise<void>;

  /**
   * Expire old invitations (cron job)
   */
  async expireOldInvitations(): Promise<number>;

  /**
   * Generate secure invitation token
   */
  private generateInvitationToken(): string;

  /**
   * Send invitation email
   */
  private sendInvitationEmail(invitation: SharingInvitation, responsibleUserName: string): Promise<void>;
}
```

#### DataAccessService

Provides unified data access for shared accounts.

```typescript
// lib/services/data-access.service.ts

export class DataAccessService {
  /**
   * Get all accounts accessible by a user (own + shared)
   */
  async getAccessibleAccounts(userId: string): Promise<AccountWithOwnership[]>;

  /**
   * Get all transactions accessible by a user (own + shared)
   */
  async getAccessibleTransactions(userId: string, filters?: TransactionFilters): Promise<TransactionWithOwnership[]>;

  /**
   * Get all credit cards accessible by a user (own + shared)
   */
  async getAccessibleCreditCards(userId: string): Promise<CreditCardWithOwnership[]>;

  /**
   * Get all invoices accessible by a user (own + shared)
   */
  async getAccessibleInvoices(userId: string, filters?: InvoiceFilters): Promise<InvoiceWithOwnership[]>;

  /**
   * Calculate total balance across all accessible accounts
   */
  async getTotalAccessibleBalance(userId: string): Promise<number>;

  /**
   * Verify if user can access specific resource
   */
  async canAccessResource(userId: string, resourceOwnerId: string): Promise<boolean>;
}

interface AccountWithOwnership extends Account {
  ownerId: string;
  ownerName: string;
  isOwn: boolean;
}

interface TransactionWithOwnership extends Transaction {
  ownerId: string;
  ownerName: string;
  isOwn: boolean;
}

interface CreditCardWithOwnership extends CreditCard {
  ownerId: string;
  ownerName: string;
  isOwn: boolean;
}

interface InvoiceWithOwnership extends Invoice {
  ownerId: string;
  ownerName: string;
  isOwn: boolean;
}
```

### API Endpoints

#### POST /api/family/invitations

Create a new invitation.

**Request**:

```typescript
{
  invitedEmail: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    invitation: SharingInvitation;
  }
}
```

#### GET /api/family/invitations

Get all invitations for the current user (as responsible).

**Response**:

```typescript
{
  success: true,
  data: {
    invitations: SharingInvitation[];
  }
}
```

#### POST /api/family/invitations/[id]/cancel

Cancel a pending invitation.

**Response**:

```typescript
{
  success: true,
  message: string;
}
```

#### POST /api/family/invitations/[id]/resend

Resend invitation email.

**Response**:

```typescript
{
  success: true,
  message: string;
}
```

#### GET /api/family/invitations/validate

Validate an invitation token.

**Query Parameters**:

- `token`: string

**Response**:

```typescript
{
  success: true,
  data: {
    invitation: SharingInvitation;
    responsibleUser: {
      name: string;
      email: string;
    };
    canAccept: boolean;
    reason?: string;
  }
}
```

#### POST /api/family/invitations/accept

Accept an invitation.

**Request**:

```typescript
{
  token: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    relationship: SharingRelationship;
  }
}
```

#### POST /api/family/invitations/reject

Reject an invitation.

**Request**:

```typescript
{
  token: string;
}
```

**Response**:

```typescript
{
  success: true,
  message: string;
}
```

#### GET /api/family/relationships

Get current user's sharing relationship.

**Response**:

```typescript
{
  success: true,
  data: {
    relationship: SharingRelationshipDetails | null;
    role: 'responsible' | 'member' | null;
  }
}
```

#### GET /api/family/members

Get all members for responsible user.

**Response**:

```typescript
{
  success: true,
  data: {
    members: SharingRelationshipDetails[];
  }
}
```

#### POST /api/family/relationships/[id]/terminate

Terminate a sharing relationship.

**Response**:

```typescript
{
  success: true,
  message: string;
}
```

#### GET /api/sharing/context

Get shared data context for current user.

**Response**:

```typescript
{
  success: true,
  data: SharedDataContext;
}
```

### UI Components

#### FamilyManagementPage

Main page for managing sharing relationships.

**Features**:

- Display current relationship status
- Show list of active members (for responsible users)
- Show responsible user info (for member users)
- Create new invitations
- View pending invitations
- Cancel/resend invitations
- Terminate relationships

#### InvitationAcceptPage

Page for accepting/rejecting invitations.

**Features**:

- Display invitation details
- Show responsible user information
- Accept/reject buttons
- Validation messages
- Error handling for expired/invalid invitations

#### SharedDataIndicator

Visual component to indicate data ownership.

**Features**:

- Badge showing "Sua" (own) or owner's name
- Color coding for own vs shared data
- Tooltip with full owner information

## Data Models

### Ownership Model

All financial data maintains its original ownership:

- Accounts belong to the user who created them
- Transactions belong to the user who created them
- Credit cards belong to the account owner
- Invoices belong to the user who uploaded them

**Access Rules**:

- Users can only modify their own data
- Users can view linked user's data in read-only mode
- Deletion is restricted to data owners
- Aggregated calculations include both users' data

### Relationship Hierarchy

```
Responsible User (A)
├── Member User (B) ✓ Active
├── Member User (C) ✓ Active
└── Member User (D) ✓ Active

Member User (B)
└── Responsible User (A) ✓ Active (bidirectional)

Member User (E)
└── Cannot join A (already has relationship with F)
```

## Error Handling

### Validation Errors

1. **Invitation Creation**:
   - Email already has active relationship → "Este usuário já possui uma conta conjunta ativa"
   - Email not found → "Usuário não encontrado com este email"
   - Self-invitation → "Você não pode convidar a si mesmo"

2. **Invitation Acceptance**:
   - Token expired → "Este convite expirou"
   - Token invalid → "Convite inválido"
   - User already has relationship → "Você já possui uma conta conjunta ativa"
   - Invitation already processed → "Este convite já foi processado"

3. **Relationship Termination**:
   - Relationship not found → "Relacionamento não encontrado"
   - User not authorized → "Você não tem permissão para encerrar este relacionamento"

### Security Errors

1. **Unauthorized Access**:
   - Accessing other user's data without relationship → 403 Forbidden
   - Modifying shared data → "Você não pode modificar dados de outro usuário"
   - Deleting shared data → "Você não pode excluir dados de outro usuário"

2. **Token Security**:
   - Invalid token format → "Token inválido"
   - Token tampering detected → "Token inválido ou corrompido"

### Database Errors

1. **Constraint Violations**:
   - Duplicate active relationship → Handle gracefully with user-friendly message
   - Foreign key violations → Log and return generic error

2. **Connection Errors**:
   - Database unavailable → "Serviço temporariamente indisponível"
   - Timeout → "Operação demorou muito tempo, tente novamente"

## Testing Strategy

### Unit Tests

1. **SharingService**:
   - Test relationship creation
   - Test relationship termination
   - Test active relationship queries
   - Test shared data context generation

2. **InvitationService**:
   - Test invitation creation with validation
   - Test token generation uniqueness
   - Test invitation acceptance flow
   - Test invitation rejection
   - Test expiration logic

3. **DataAccessService**:
   - Test accessible accounts query
   - Test ownership filtering
   - Test permission checks
   - Test aggregated calculations

### Integration Tests

1. **Complete Invitation Flow**:
   - Create invitation → Send email → Accept → Verify relationship created
   - Create invitation → Reject → Verify invitation marked rejected

2. **Data Access Flow**:
   - Create relationship → Query accounts → Verify both users' data returned
   - Terminate relationship → Query accounts → Verify only own data returned

3. **Permission Enforcement**:
   - Attempt to modify shared data → Verify rejection
   - Attempt to delete shared data → Verify rejection
   - Verify read access to shared data

### End-to-End Tests

1. **User Journey - Responsible**:
   - Login → Navigate to family page → Create invitation → View pending invitations
   - Member accepts → View active members → Terminate relationship

2. **User Journey - Member**:
   - Receive email → Click link → View invitation details → Accept invitation
   - View shared data → Navigate to family page → Terminate relationship

3. **Shared Data Visibility**:
   - Create relationship → Navigate to accounts page → Verify shared accounts visible
   - Navigate to transactions page → Verify shared transactions visible
   - Verify ownership indicators displayed correctly

### Security Tests

1. **Authorization Tests**:
   - Attempt to access invitation with wrong user → Verify rejection
   - Attempt to terminate relationship as non-participant → Verify rejection
   - Attempt to access shared data after termination → Verify rejection

2. **Token Security Tests**:
   - Test expired token handling
   - Test invalid token format handling
   - Test token reuse prevention

3. **Constraint Tests**:
   - Attempt to create multiple active relationships as member → Verify rejection
   - Attempt to accept invitation while having active relationship → Verify rejection

## Performance Considerations

### Database Optimization

1. **Indexes**:
   - `member_user_id` + `status` unique index for fast active relationship lookup
   - `responsible_user_id` index for listing members
   - `token` unique index for invitation validation

2. **Query Optimization**:
   - Use single query to fetch relationship + user details (JOIN)
   - Cache active relationship status per user session
   - Batch fetch shared data instead of multiple queries

### Caching Strategy

1. **Relationship Cache**:
   - Cache active relationship status for 5 minutes
   - Invalidate on relationship creation/termination
   - Use Redis or in-memory cache

2. **User Data Cache**:
   - Cache user names and emails for ownership labels
   - Invalidate on user profile updates

### Email Delivery

1. **Async Processing**:
   - Queue invitation emails for background processing
   - Don't block API response on email delivery
   - Implement retry logic for failed deliveries

2. **Rate Limiting**:
   - Limit invitation creation to 10 per hour per user
   - Prevent spam and abuse

## Security Considerations

### Token Security

1. **Generation**:
   - Use cryptographically secure random token (32 bytes)
   - Hash token before storing in database
   - Include timestamp in token for expiration

2. **Validation**:
   - Verify token hasn't expired
   - Verify token hasn't been used
   - Verify user is authorized to use token

### Data Access Control

1. **Row-Level Security**:
   - Enable Appwrite row-level security on all collections
   - Verify user has active relationship before granting access
   - Implement middleware to check permissions on every request

2. **API Security**:
   - Require authentication for all endpoints
   - Validate user ID from JWT token
   - Verify relationship status before returning shared data

### Audit Logging

1. **Relationship Events**:
   - Log invitation creation with timestamp and user
   - Log invitation acceptance/rejection
   - Log relationship termination with initiator

2. **Data Access Events**:
   - Log access to shared data (optional, for compliance)
   - Log modification attempts on shared data
   - Log permission violations

## Migration Strategy

### Database Migration

1. **Create Collections**:
   - Create `sharing_relationships` collection
   - Create `sharing_invitations` collection
   - Set up indexes and permissions

2. **Backward Compatibility**:
   - Existing data access patterns continue to work
   - New shared data access is additive
   - No changes to existing user data

### Code Migration

1. **Service Layer**:
   - Add new services without modifying existing ones
   - Enhance existing services to support shared data access
   - Maintain backward compatibility

2. **API Layer**:
   - Add new endpoints under `/api/family` namespace
   - Enhance existing endpoints to include shared data
   - Add optional query parameter to exclude shared data

3. **UI Layer**:
   - Add new family management page
   - Add ownership indicators to existing pages
   - Add invitation acceptance flow

## Future Enhancements

1. **Permission Levels**:
   - Read-only vs read-write access
   - Selective data sharing (e.g., only accounts, not transactions)

2. **Multiple Responsible Users**:
   - Allow member to be part of multiple families
   - Implement role-based access control

3. **Shared Budgets**:
   - Create budgets that span both users' data
   - Track shared expenses and goals

4. **Activity Feed**:
   - Show recent activity from linked user
   - Notifications for significant transactions

5. **Data Export**:
   - Export combined financial reports
   - Generate joint tax documents
