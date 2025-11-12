# Joint Accounts Sharing - Database Setup

This document provides instructions for setting up the database collections required for the Joint Accounts Sharing feature.

## Overview

The Joint Accounts Sharing feature requires two new collections:

1. **sharing_relationships** - Stores active and terminated sharing relationships between users
2. **sharing_invitations** - Stores invitation records with various statuses (pending, accepted, rejected, etc.)

## Setup Methods

### Method 1: Using Appwrite Console (Recommended)

Follow the manual setup instructions in the migration file:
`lib/database/migrations/015-create-sharing-collections.ts`

The file contains detailed step-by-step instructions for creating collections, attributes, and indexes through the Appwrite Console UI.

### Method 2: Using Migration Script

If you have the Appwrite SDK configured for server-side operations:

```typescript
import { Databases } from 'node-appwrite';

import { createSharingCollections } from './lib/database/migrations/015-create-sharing-collections';

// Initialize Appwrite client and databases
const databases = new Databases(client);

// Run migration
await createSharingCollections(databases);
```

### Method 3: Using Appwrite CLI

You can also use the Appwrite CLI to create collections programmatically. Refer to the schema definitions in `lib/appwrite/schema.ts` for the exact specifications.

## Collection Details

### sharing_relationships

**Purpose**: Stores the bidirectional sharing relationships between responsible users and member users.

**Key Features**:

- Unique constraint on `member_user_id` + `status` ensures a member can only have one active relationship
- Tracks who terminated the relationship for audit purposes
- Supports both active and terminated states

**Indexes**:

- `idx_responsible_user`: Fast lookup of all members for a responsible user
- `idx_member_user_status`: Ensures uniqueness and fast lookup of active relationships
- `idx_status`: Filter by relationship status

### sharing_invitations

**Purpose**: Stores invitation records throughout their lifecycle (pending, accepted, rejected, cancelled, expired).

**Key Features**:

- Unique token for secure invitation links
- Automatic expiration after 7 days
- Tracks invited email and resolves to user ID when available
- Multiple status states for complete lifecycle tracking

**Indexes**:

- `idx_token`: Fast and unique token lookup for invitation validation
- `idx_responsible_user`: List all invitations created by a user
- `idx_invited_email`: Find pending invitations for an email
- `idx_status`: Filter by invitation status
- `idx_expires_at`: Efficient expiration queries for cron jobs

## Verification

After creating the collections, verify the setup:

1. Check that both collections exist in your Appwrite database
2. Verify all attributes are created with correct types and constraints
3. Confirm all indexes are in place
4. Test row-level security is enabled

## Next Steps

After setting up the database collections:

1. Implement the service layer (InvitationService, SharingService, DataAccessService)
2. Create API endpoints for invitation and relationship management
3. Build UI components for family management
4. Add ownership indicators to existing pages

## Troubleshooting

### Collection Already Exists

If you see errors about collections already existing, check if they were created in a previous attempt. You may need to delete them first or skip the creation step.

### Index Creation Fails

Ensure all attributes are created before creating indexes. Indexes depend on the attributes they reference.

### Permission Errors

Make sure your API key has sufficient permissions to create collections and attributes in the database.

## References

- Schema definitions: `lib/appwrite/schema.ts`
- Type definitions: `lib/types/sharing.types.ts`
- Design document: `.kiro/specs/joint-accounts-sharing/design.md`
- Requirements: `.kiro/specs/joint-accounts-sharing/requirements.md`
