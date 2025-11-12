# Invoice API Implementation Summary

## Overview

Successfully implemented all invoice API endpoints for the Invoice Management System. The implementation follows RESTful conventions and integrates with the existing authentication and service layers.

## Implemented Endpoints

### 1. POST /api/invoices

**Purpose**: Register a new invoice from URL or QR code data

**Request Body**:

```json
{
  "invoiceUrl": "https://sat.sef.sc.gov.br/nfce/consulta?p=...",
  // OR
  "qrCodeData": "44-digit-access-key",
  // Optional fields
  "customCategory": "pharmacy",
  "transactionId": "transaction-id",
  "accountId": "account-id"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "$id": "invoice-id",
    "invoice_key": "...",
    "invoice_number": "123456",
    "merchant_name": "FARMACIA EXEMPLO",
    "total_amount": 19.4,
    "category": "pharmacy",
    "items": [...]
  }
}
```

**Error Responses**:

- 400: Invalid input, parsing error
- 401: Unauthorized
- 409: Duplicate invoice
- 500: Internal server error

### 2. GET /api/invoices

**Purpose**: List invoices with filtering and pagination

**Query Parameters**:

- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)
- `category`: Filter by category
- `merchant`: Filter by merchant name
- `minAmount`: Minimum amount filter
- `maxAmount`: Maximum amount filter
- `search`: Search in invoice number, merchant, products
- `limit`: Results per page (default: 25, max: 100)
- `offset`: Pagination offset (default: 0)

**Response** (200 OK):

```json
{
  "success": true,
  "data": [...],
  "total": 42,
  "limit": 25,
  "offset": 0
}
```

### 3. GET /api/invoices/[id]

**Purpose**: Get invoice by ID with all line items

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "$id": "invoice-id",
    "invoice_key": "...",
    "merchant_name": "...",
    "total_amount": 19.4,
    "items": [
      {
        "$id": "item-id",
        "description": "DIPIRONA 500MG",
        "quantity": 2,
        "unit_price": 5.5,
        "total_price": 11.0
      }
    ]
  }
}
```

**Error Responses**:

- 401: Unauthorized
- 404: Invoice not found
- 500: Internal server error

### 4. DELETE /api/invoices/[id]

**Purpose**: Delete invoice and cascade to invoice items

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

**Error Responses**:

- 401: Unauthorized
- 404: Invoice not found
- 500: Internal server error

### 5. GET /api/invoices/categories

**Purpose**: Get list of available invoice categories with counts

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "pharmacy",
      "name": "pharmacy",
      "count": 5
    },
    {
      "id": "supermarket",
      "name": "supermarket",
      "count": 12
    }
  ]
}
```

## Implementation Details

### Authentication

All endpoints require authentication via JWT token in cookies or Authorization header. Uses `getCurrentUserId()` from the auth session module.

### Error Handling

- Consistent error response format with `error`, `code`, and optional `details` fields
- Proper HTTP status codes for different error scenarios
- Specific error codes for invoice operations:
  - `INVOICE_INVALID_FORMAT`: Invalid URL or QR code format
  - `INVOICE_PARSE_ERROR`: Failed to parse invoice data
  - `INVOICE_DUPLICATE`: Invoice already registered
  - `INVOICE_NOT_FOUND`: Invoice doesn't exist or user doesn't have access
  - `INVALID_INPUT`: Missing or invalid request parameters
  - `UNAUTHORIZED`: Authentication required
  - `INTERNAL_ERROR`: Server error

### Service Integration

- **Invoice Parser Service**: Handles URL and QR code parsing, XML extraction
- **Invoice Service**: Manages CRUD operations, duplicate detection, product catalog updates
- **Product Normalization Service**: Normalizes product names and links similar products
- **Appwrite Database**: Stores invoices, invoice items, products, and price history

### Data Flow

1. **Invoice Registration**:
   - Parse invoice from URL/QR code
   - Validate invoice format
   - Check for duplicates
   - Create invoice document
   - Create invoice items in batch
   - Update product catalog
   - Record price history

2. **Invoice Retrieval**:
   - Fetch invoice with user ownership validation
   - Include all line items ordered by line number
   - Apply filters and pagination for list operations

3. **Invoice Deletion**:
   - Validate user ownership
   - Delete invoice and cascade to items
   - Update product statistics

## Testing

### Integration Tests

Created comprehensive integration tests in `tests/invoice-api.test.ts`:

- API endpoint structure validation
- Invoice categories verification
- Error handling validation
- Service integration checks
- Data model validation
- Request validation

**Test Results**: 16/16 tests passing (100% success rate)

### Test Coverage

- ✅ POST /api/invoices endpoint exists
- ✅ GET /api/invoices endpoint exists
- ✅ GET /api/invoices/[id] endpoint exists
- ✅ DELETE /api/invoices/[id] endpoint exists
- ✅ GET /api/invoices/categories endpoint exists
- ✅ All invoice categories defined
- ✅ Error classes properly implemented
- ✅ Services properly exported
- ✅ Request validation structure
- ✅ Data models defined

## Files Created

1. **app/api/invoices/route.ts**
   - POST and GET endpoints for invoice collection
   - Request validation and error handling
   - Integration with parser and invoice services

2. **app/api/invoices/[id]/route.ts**
   - GET and DELETE endpoints for individual invoices
   - User ownership validation
   - Cascade deletion handling

3. **app/api/invoices/categories/route.ts**
   - GET endpoint for category list with counts
   - Efficient category counting using Appwrite queries

4. **tests/invoice-api.test.ts**
   - Integration tests for all endpoints
   - Structure and contract validation
   - Error handling verification

## Next Steps

The following tasks remain in the invoice management system implementation:

1. **Task 5**: Implement analytics service (insights, predictions, anomaly detection)
2. **Task 6**: Build analytics API endpoints
3. **Task 7**: Implement price tracking service
4. **Task 8**: Build price tracking API endpoints
5. **Task 9**: Create invoice input UI components
6. **Task 10**: Build invoice list and details UI
7. **Task 11**: Create insights dashboard UI
8. **Task 12**: Build price comparison UI
9. **Task 13**: Implement export functionality
10. **Task 14**: Add navigation and integration
11. **Task 15**: Performance optimization and polish

## API Usage Examples

### Register Invoice via URL

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=..." \
  -d '{
    "invoiceUrl": "https://sat.sef.sc.gov.br/nfce/consulta?p=12345678901234567890123456789012345678901234"
  }'
```

### List Invoices with Filters

```bash
curl "http://localhost:3000/api/invoices?category=pharmacy&startDate=2024-01-01&limit=10" \
  -H "Cookie: auth_token=..."
```

### Get Invoice Details

```bash
curl "http://localhost:3000/api/invoices/invoice-id-123" \
  -H "Cookie: auth_token=..."
```

### Delete Invoice

```bash
curl -X DELETE "http://localhost:3000/api/invoices/invoice-id-123" \
  -H "Cookie: auth_token=..."
```

### Get Categories

```bash
curl "http://localhost:3000/api/invoices/categories" \
  -H "Cookie: auth_token=..."
```

## Security Considerations

- All endpoints require authentication
- User ownership validation on all operations
- Invoice keys are unique per user (prevents cross-user access)
- Input validation on all request parameters
- SQL injection prevention via Appwrite query builder
- XSS prevention via proper JSON encoding

## Performance Considerations

- Pagination support for large datasets
- Efficient database queries with proper indexes
- Batch creation of invoice items
- Async operations for non-critical updates (price history, product stats)
- Category counts cached per request

## Compliance

All endpoints follow the requirements specified in:

- Requirements 1.1-1.5 (Invoice registration)
- Requirements 3.1-3.5 (Invoice listing and details)
- Requirements 2.2, 3.2 (Categories)
- Requirements 3.4, 4.1 (Invoice details and deletion)

---

# Joint Accounts Sharing API Implementation

## Overview

The Joint Accounts Sharing API enables users to share their financial data with family members or partners through a hierarchical relationship model. A responsible user can invite multiple members, while each member can only be linked to one responsible user at a time. All endpoints require authentication and enforce strict permission checks.

## Base URL

All endpoints are prefixed with `/api/family` or `/api/sharing`

## Authentication

All endpoints require a valid JWT token in cookies or Authorization header. The token must contain a valid user ID.

## Implemented Endpoints

### Invitation Management

#### POST /api/family/invitations

**Purpose**: Create a new invitation to share data with another user

**Authentication**: Required (Responsible User)

**Request Body**:

```json
{
  "invitedEmail": "member@example.com"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "invitation": {
      "$id": "invitation-id",
      "responsible_user_id": "user-id",
      "invited_email": "member@example.com",
      "invited_user_id": "invited-user-id",
      "token": "secure-token-hash",
      "status": "pending",
      "expires_at": "2025-11-18T00:00:00.000Z",
      "created_at": "2025-11-11T00:00:00.000Z",
      "updated_at": "2025-11-11T00:00:00.000Z"
    }
  }
}
```

**Error Responses**:

- 400: Invalid email format or missing email
- 401: Unauthorized (not logged in)
- 403: Cannot invite yourself
- 404: User with email not found
- 409: Invited user already has an active relationship
- 500: Internal server error

**Error Codes**:

- `INVALID_EMAIL`: Email format is invalid
- `USER_NOT_FOUND`: No user exists with the provided email
- `SELF_INVITATION`: Cannot invite yourself
- `ALREADY_HAS_RELATIONSHIP`: Invited user already has an active relationship

---

#### GET /api/family/invitations

**Purpose**: List all invitations created by the current user (as responsible)

**Authentication**: Required (Responsible User)

**Query Parameters**: None

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "$id": "invitation-id",
        "responsible_user_id": "user-id",
        "invited_email": "member@example.com",
        "invited_user_id": "invited-user-id",
        "token": "secure-token-hash",
        "status": "pending",
        "expires_at": "2025-11-18T00:00:00.000Z",
        "created_at": "2025-11-11T00:00:00.000Z",
        "updated_at": "2025-11-11T00:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses**:

- 401: Unauthorized
- 500: Internal server error

---

#### POST /api/family/invitations/[id]/cancel

**Purpose**: Cancel a pending invitation

**Authentication**: Required (Responsible User who created the invitation)

**Path Parameters**:

- `id`: Invitation ID

**Request Body**: None

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Invitation cancelled successfully"
}
```

**Error Responses**:

- 401: Unauthorized
- 403: Not authorized to cancel this invitation
- 404: Invitation not found
- 409: Invitation is not in pending status
- 500: Internal server error

**Error Codes**:

- `INVITATION_NOT_FOUND`: Invitation doesn't exist
- `NOT_AUTHORIZED`: User is not the responsible user who created the invitation
- `INVALID_STATUS`: Invitation is not pending (already accepted/rejected/cancelled)

---

#### POST /api/family/invitations/[id]/resend

**Purpose**: Resend invitation email

**Authentication**: Required (Responsible User who created the invitation)

**Path Parameters**:

- `id`: Invitation ID

**Request Body**: None

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Invitation email resent successfully"
}
```

**Error Responses**:

- 401: Unauthorized
- 403: Not authorized to resend this invitation
- 404: Invitation not found
- 409: Invitation has expired or is not pending
- 500: Internal server error

**Error Codes**:

- `INVITATION_NOT_FOUND`: Invitation doesn't exist
- `NOT_AUTHORIZED`: User is not the responsible user
- `INVITATION_EXPIRED`: Invitation has expired
- `INVALID_STATUS`: Invitation is not pending

---

#### GET /api/family/invitations/validate

**Purpose**: Validate an invitation token and return invitation details

**Authentication**: Optional (can be called by unauthenticated users)

**Query Parameters**:

- `token` (required): Invitation token from email link

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "invitation": {
      "$id": "invitation-id",
      "responsible_user_id": "user-id",
      "invited_email": "member@example.com",
      "status": "pending",
      "expires_at": "2025-11-18T00:00:00.000Z"
    },
    "responsibleUser": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "canAccept": true,
    "reason": null
  }
}
```

**Response when cannot accept**:

```json
{
  "success": true,
  "data": {
    "invitation": {...},
    "responsibleUser": {...},
    "canAccept": false,
    "reason": "You already have an active relationship with another user"
  }
}
```

**Error Responses**:

- 400: Missing token parameter
- 404: Invalid or expired token
- 500: Internal server error

**Error Codes**:

- `INVALID_TOKEN`: Token is invalid or expired
- `INVITATION_NOT_FOUND`: No invitation found with this token

---

#### POST /api/family/invitations/accept

**Purpose**: Accept an invitation and create a sharing relationship

**Authentication**: Required (Member User)

**Request Body**:

```json
{
  "token": "invitation-token-from-email"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "relationship": {
      "$id": "relationship-id",
      "responsible_user_id": "responsible-user-id",
      "member_user_id": "current-user-id",
      "status": "active",
      "started_at": "2025-11-11T00:00:00.000Z",
      "created_at": "2025-11-11T00:00:00.000Z",
      "updated_at": "2025-11-11T00:00:00.000Z"
    }
  }
}
```

**Error Responses**:

- 400: Missing token
- 401: Unauthorized
- 403: User already has an active relationship
- 404: Invalid or expired token
- 409: Invitation already processed
- 500: Internal server error

**Error Codes**:

- `INVALID_TOKEN`: Token is invalid or expired
- `ALREADY_HAS_RELATIONSHIP`: User already has an active relationship
- `INVITATION_ALREADY_PROCESSED`: Invitation was already accepted or rejected
- `WRONG_USER`: Token is for a different email address

---

#### POST /api/family/invitations/reject

**Purpose**: Reject an invitation

**Authentication**: Required (Member User)

**Request Body**:

```json
{
  "token": "invitation-token-from-email"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Invitation rejected successfully"
}
```

**Error Responses**:

- 400: Missing token
- 401: Unauthorized
- 404: Invalid or expired token
- 409: Invitation already processed
- 500: Internal server error

**Error Codes**:

- `INVALID_TOKEN`: Token is invalid or expired
- `INVITATION_ALREADY_PROCESSED`: Invitation was already accepted or rejected
- `WRONG_USER`: Token is for a different email address

---

### Relationship Management

#### GET /api/family/relationships

**Purpose**: Get current user's active sharing relationship

**Authentication**: Required

**Query Parameters**: None

**Response** (200 OK) - Has relationship:

```json
{
  "success": true,
  "data": {
    "relationship": {
      "relationship": {
        "$id": "relationship-id",
        "responsible_user_id": "responsible-user-id",
        "member_user_id": "member-user-id",
        "status": "active",
        "started_at": "2025-11-11T00:00:00.000Z"
      },
      "responsibleUser": {
        "id": "responsible-user-id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "memberUser": {
        "id": "member-user-id",
        "name": "Jane Doe",
        "email": "jane@example.com"
      }
    },
    "role": "member"
  }
}
```

**Response** (200 OK) - No relationship:

```json
{
  "success": true,
  "data": {
    "relationship": null,
    "role": null
  }
}
```

**Error Responses**:

- 401: Unauthorized
- 500: Internal server error

---

#### GET /api/family/members

**Purpose**: Get all active members for the current user (as responsible)

**Authentication**: Required (Responsible User)

**Query Parameters**: None

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "relationship": {
          "$id": "relationship-id",
          "responsible_user_id": "current-user-id",
          "member_user_id": "member-user-id",
          "status": "active",
          "started_at": "2025-11-11T00:00:00.000Z"
        },
        "responsibleUser": {
          "id": "current-user-id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "memberUser": {
          "id": "member-user-id",
          "name": "Jane Doe",
          "email": "jane@example.com"
        }
      }
    ]
  }
}
```

**Error Responses**:

- 401: Unauthorized
- 403: User is not a responsible user
- 500: Internal server error

---

#### POST /api/family/relationships/[id]/terminate

**Purpose**: Terminate a sharing relationship

**Authentication**: Required (Either Responsible or Member User in the relationship)

**Path Parameters**:

- `id`: Relationship ID

**Request Body**: None

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Relationship terminated successfully"
}
```

**Error Responses**:

- 401: Unauthorized
- 403: Not authorized to terminate this relationship
- 404: Relationship not found
- 409: Relationship is already terminated
- 500: Internal server error

**Error Codes**:

- `RELATIONSHIP_NOT_FOUND`: Relationship doesn't exist
- `NOT_AUTHORIZED`: User is not part of this relationship
- `ALREADY_TERMINATED`: Relationship is already terminated

---

### Shared Data Access

#### GET /api/sharing/context

**Purpose**: Get shared data context for the current user

**Authentication**: Required

**Query Parameters**: None

**Response** (200 OK) - Has relationship:

```json
{
  "success": true,
  "data": {
    "currentUserId": "current-user-id",
    "linkedUserId": "linked-user-id",
    "isResponsible": true,
    "isMember": false
  }
}
```

**Response** (200 OK) - No relationship:

```json
{
  "success": true,
  "data": {
    "currentUserId": "current-user-id",
    "linkedUserId": null,
    "isResponsible": false,
    "isMember": false
  }
}
```

**Error Responses**:

- 401: Unauthorized
- 500: Internal server error

---

## Enhanced Existing Endpoints

The following existing endpoints have been enhanced to support shared data access:

### GET /api/accounts

**Enhancement**: Now includes shared accounts when user has an active relationship

**New Query Parameters**:

- `includeShared` (optional, default: true): Include shared accounts from linked user

**Response Enhancement**:

Each account now includes ownership metadata:

```json
{
  "success": true,
  "data": [
    {
      "$id": "account-id",
      "name": "Checking Account",
      "balance": 1000.0,
      "user_id": "owner-user-id",
      "ownerId": "owner-user-id",
      "ownerName": "John Doe",
      "isOwn": true
    },
    {
      "$id": "shared-account-id",
      "name": "Savings Account",
      "balance": 5000.0,
      "user_id": "linked-user-id",
      "ownerId": "linked-user-id",
      "ownerName": "Jane Doe",
      "isOwn": false
    }
  ]
}
```

---

### GET /api/transactions

**Enhancement**: Now includes shared transactions when user has an active relationship

**New Query Parameters**:

- `includeShared` (optional, default: true): Include shared transactions from linked user
- `ownOnly` (optional, default: false): Show only user's own transactions

**Response Enhancement**:

Each transaction now includes ownership metadata:

```json
{
  "success": true,
  "data": [
    {
      "$id": "transaction-id",
      "description": "Grocery Shopping",
      "amount": -50.0,
      "user_id": "owner-user-id",
      "ownerId": "owner-user-id",
      "ownerName": "John Doe",
      "isOwn": true
    }
  ]
}
```

---

### GET /api/credit-cards

**Enhancement**: Now includes shared credit cards when user has an active relationship

**New Query Parameters**:

- `includeShared` (optional, default: true): Include shared credit cards from linked user

**Response Enhancement**:

Each credit card now includes ownership metadata:

```json
{
  "success": true,
  "data": [
    {
      "$id": "card-id",
      "name": "Visa Gold",
      "limit": 10000.0,
      "account_id": "account-id",
      "ownerId": "owner-user-id",
      "ownerName": "John Doe",
      "isOwn": true
    }
  ]
}
```

---

### GET /api/invoices

**Enhancement**: Now includes shared invoices when user has an active relationship

**New Query Parameters**:

- `includeShared` (optional, default: true): Include shared invoices from linked user

**Response Enhancement**:

Each invoice now includes ownership metadata:

```json
{
  "success": true,
  "data": [
    {
      "$id": "invoice-id",
      "invoice_number": "123456",
      "merchant_name": "Store ABC",
      "total_amount": 100.0,
      "user_id": "owner-user-id",
      "ownerId": "owner-user-id",
      "ownerName": "John Doe",
      "isOwn": true
    }
  ]
}
```

---

## Permission Enforcement

All modification endpoints (PUT, PATCH, DELETE) now enforce ownership checks:

### PUT /api/accounts/[id]

**Enhancement**: Validates user owns the account before allowing updates

**Error Response** (403 Forbidden):

```json
{
  "error": "You can only modify your own accounts",
  "code": "PERMISSION_DENIED"
}
```

---

### DELETE /api/accounts/[id]

**Enhancement**: Validates user owns the account before allowing deletion

**Error Response** (403 Forbidden):

```json
{
  "error": "You can only delete your own accounts",
  "code": "PERMISSION_DENIED"
}
```

---

### PUT /api/transactions/[id]

**Enhancement**: Validates user owns the transaction before allowing updates

**Error Response** (403 Forbidden):

```json
{
  "error": "You can only modify your own transactions",
  "code": "PERMISSION_DENIED"
}
```

---

### DELETE /api/transactions/[id]

**Enhancement**: Validates user owns the transaction before allowing deletion

**Error Response** (403 Forbidden):

```json
{
  "error": "You can only delete your own transactions",
  "code": "PERMISSION_DENIED"
}
```

---

### PUT /api/credit-cards/[id]

**Enhancement**: Validates user owns the credit card before allowing updates

**Error Response** (403 Forbidden):

```json
{
  "error": "You can only modify your own credit cards",
  "code": "PERMISSION_DENIED"
}
```

---

### DELETE /api/credit-cards/[id]

**Enhancement**: Validates user owns the credit card before allowing deletion

**Error Response** (403 Forbidden):

```json
{
  "error": "You can only delete your own credit cards",
  "code": "PERMISSION_DENIED"
}
```

---

### DELETE /api/invoices/[id]

**Enhancement**: Validates user owns the invoice before allowing deletion

**Error Response** (403 Forbidden):

```json
{
  "error": "You can only delete your own invoices",
  "code": "PERMISSION_DENIED"
}
```

---

## Error Codes Reference

### Invitation Errors

- `INVALID_EMAIL`: Email format is invalid
- `USER_NOT_FOUND`: No user exists with the provided email
- `SELF_INVITATION`: Cannot invite yourself
- `ALREADY_HAS_RELATIONSHIP`: User already has an active relationship
- `INVITATION_NOT_FOUND`: Invitation doesn't exist
- `NOT_AUTHORIZED`: User is not authorized for this action
- `INVALID_STATUS`: Invitation is not in the expected status
- `INVITATION_EXPIRED`: Invitation has expired
- `INVALID_TOKEN`: Token is invalid or expired
- `INVITATION_ALREADY_PROCESSED`: Invitation was already accepted or rejected
- `WRONG_USER`: Token is for a different email address

### Relationship Errors

- `RELATIONSHIP_NOT_FOUND`: Relationship doesn't exist
- `NOT_AUTHORIZED`: User is not part of this relationship
- `ALREADY_TERMINATED`: Relationship is already terminated

### Permission Errors

- `PERMISSION_DENIED`: User doesn't have permission to perform this action
- `UNAUTHORIZED`: Authentication required

---

## API Usage Examples

### Create Invitation

```bash
curl -X POST http://localhost:3000/api/family/invitations \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=..." \
  -d '{
    "invitedEmail": "member@example.com"
  }'
```

---

### List Invitations

```bash
curl http://localhost:3000/api/family/invitations \
  -H "Cookie: auth_token=..."
```

---

### Validate Invitation

```bash
curl "http://localhost:3000/api/family/invitations/validate?token=secure-token" \
  -H "Cookie: auth_token=..."
```

---

### Accept Invitation

```bash
curl -X POST http://localhost:3000/api/family/invitations/accept \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=..." \
  -d '{
    "token": "secure-token"
  }'
```

---

### Get Current Relationship

```bash
curl http://localhost:3000/api/family/relationships \
  -H "Cookie: auth_token=..."
```

---

### List Active Members

```bash
curl http://localhost:3000/api/family/members \
  -H "Cookie: auth_token=..."
```

---

### Terminate Relationship

```bash
curl -X POST http://localhost:3000/api/family/relationships/relationship-id/terminate \
  -H "Cookie: auth_token=..."
```

---

### Get Shared Data Context

```bash
curl http://localhost:3000/api/sharing/context \
  -H "Cookie: auth_token=..."
```

---

### Get Accounts with Shared Data

```bash
curl "http://localhost:3000/api/accounts?includeShared=true" \
  -H "Cookie: auth_token=..."
```

---

### Get Only Own Transactions

```bash
curl "http://localhost:3000/api/transactions?ownOnly=true" \
  -H "Cookie: auth_token=..."
```

---

## Security Considerations

### Authentication

- All endpoints require valid JWT authentication
- User ID is extracted from authenticated session
- No user impersonation is possible

### Authorization

- Invitation creation: Only authenticated users can create invitations
- Invitation acceptance: Only the invited user can accept
- Relationship termination: Only participants can terminate
- Data modification: Only owners can modify their data
- Data access: Only users with active relationships can access shared data

### Token Security

- Invitation tokens are cryptographically secure (32 bytes)
- Tokens are hashed before storage
- Tokens expire after 7 days
- Tokens are single-use (marked as processed after acceptance/rejection)

### Data Privacy

- Row-level security enforced on all collections
- Users can only access their own data or shared data via active relationships
- Termination immediately revokes all data access
- No data is deleted on relationship termination (only access is revoked)

### Audit Logging

All relationship events are logged:

- Invitation creation
- Invitation acceptance/rejection
- Relationship termination
- Permission violations

---

## Performance Considerations

### Database Optimization

- Indexes on `member_user_id` + `status` for fast relationship lookups
- Indexes on `responsible_user_id` for listing members
- Unique index on `token` for fast invitation validation
- Composite indexes for efficient filtering

### Caching Strategy

- Active relationship status cached per user session (5 minutes)
- User names cached for ownership labels
- Invalidation on relationship changes

### Query Optimization

- Single query to fetch relationship + user details (JOIN)
- Batch fetch shared data instead of multiple queries
- Pagination support for large datasets

---

## Testing

### Integration Tests

Comprehensive integration tests cover:

- Complete invitation flow (create → send → accept → relationship created)
- Invitation rejection flow
- Relationship termination flow
- Shared data access with ownership labels
- Permission enforcement on modification attempts
- Token validation and expiration
- Concurrent operation handling

**Test Files**:

- `tests/sharing-invitation-flow.test.ts`
- `tests/sharing-data-access.test.ts`
- `tests/sharing-permissions.test.ts`
- `tests/sharing-termination.test.ts`

---

## Compliance

All endpoints follow the requirements specified in:

- Requirements 1.1-1.5 (Invitation creation and management)
- Requirements 2.1-2.5 (Invitation acceptance and rejection)
- Requirements 3.1-3.5 (Shared data access)
- Requirements 4.1-4.5 (Relationship termination)
- Requirements 5.1-5.5 (Responsible user management)
- Requirements 6.1-6.5 (Member user interface)
- Requirements 7.1-7.5 (Data ownership and permissions)
- Requirements 8.1-8.5 (Security and audit logging)

---

## Related Documentation

- [Joint Accounts Sharing User Guide](./JOINT_ACCOUNTS_SHARING.md) - End-user documentation
- [Security Verification Report](./SECURITY-VERIFICATION-REPORT.md) - Security audit details
- [Development Guide](./DEVELOPMENT-GUIDE.md) - Developer implementation guide

---

**Last Updated**: November 2025
**Version**: 1.0.0
