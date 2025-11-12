/**
 * Migration: Create Sharing Invitations Table
 * Created: 2025-11-11
 *
 * Creates the sharing_invitations table for managing invitation lifecycle
 * from creation to acceptance/rejection/expiration
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  SHARING_INVITATIONS: 'sharing_invitations',
};

export const migration: Migration = {
  id: '20251111_000026',
  description: 'Create sharing_invitations table for joint account invitation management',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating sharing_invitations table...');

    // Create sharing_invitations table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      name: 'Sharing Invitations',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating columns...');

    // Column 1: responsible_user_id - The user who created the invitation
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'responsible_user_id',
      size: 255,
      required: true,
    });

    // Column 2: invited_email - Email of the invited user
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'invited_email',
      size: 255,
      required: true,
    });

    // Column 3: invited_user_id - User ID once they accept (optional)
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'invited_user_id',
      size: 255,
      required: false,
    });

    // Column 4: token - Unique invitation token
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'token',
      size: 255,
      required: true,
    });

    // Column 5: status - Invitation status
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'status',
      elements: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
      required: true,
    });

    // Column 6: expires_at - When the invitation expires
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'expires_at',
      required: true,
    });

    // Column 7: accepted_at - When the invitation was accepted
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'accepted_at',
      required: false,
    });

    // Column 8: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'created_at',
      required: true,
    });

    // Column 9: updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index 1: token for invitation lookup (unique)
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'idx_token',
      type: IndexType.Unique,
      columns: ['token'],
    });

    // Index 2: responsible_user_id for owner queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'idx_responsible_user',
      type: IndexType.Key,
      columns: ['responsible_user_id'],
      orders: ['ASC'],
    });

    // Index 3: invited_email for email lookup
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'idx_invited_email',
      type: IndexType.Key,
      columns: ['invited_email'],
    });

    // Index 4: status for filtering by invitation status
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'idx_status',
      type: IndexType.Key,
      columns: ['status'],
    });

    // Index 5: expires_at for expiration queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
      key: 'idx_expires_at',
      type: IndexType.Key,
      columns: ['expires_at'],
      orders: ['ASC'],
    });

    console.log('✓ Sharing invitations table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping sharing_invitations table...');

    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.SHARING_INVITATIONS,
    });

    console.log('✓ Sharing invitations table dropped');
  },
};
