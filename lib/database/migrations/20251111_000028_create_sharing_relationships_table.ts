/**
 * Migration: Create Sharing Relationships Table
 * Created: 2025-11-11
 *
 * Creates the sharing_relationships table for tracking active and terminated
 * sharing relationships between responsible users and members
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  SHARING_RELATIONSHIPS: 'sharing_relationships',
};

export const migration: Migration = {
  id: '20251111_000028',
  description: 'Create sharing_relationships table for joint account sharing',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating sharing_relationships table...');

    // Create sharing_relationships table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      name: 'Sharing Relationships',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating columns...');

    // Column 1: responsible_user_id - The user who owns the accounts
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'responsible_user_id',
      size: 255,
      required: true,
    });

    // Column 2: member_user_id - The user who has access to the accounts
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'member_user_id',
      size: 255,
      required: true,
    });

    // Column 3: status - Relationship status
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'status',
      elements: ['active', 'terminated'],
      required: true,
    });

    // Column 4: started_at - When the relationship started
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'started_at',
      required: true,
    });

    // Column 5: terminated_at - When the relationship was terminated
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'terminated_at',
      required: false,
    });

    // Column 6: terminated_by - User ID who terminated the relationship
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'terminated_by',
      size: 255,
      required: false,
    });

    // Column 7: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'created_at',
      required: true,
    });

    // Column 8: updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index 1: responsible_user_id for owner queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'idx_responsible_user',
      type: IndexType.Key,
      columns: ['responsible_user_id'],
      orders: ['ASC'],
    });

    // Index 2: member_user_id + status for member queries (unique active relationship)
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'idx_member_user_status',
      type: IndexType.Unique,
      columns: ['member_user_id', 'status'],
    });

    // Index 3: status for filtering by relationship status
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
      key: 'idx_status',
      type: IndexType.Key,
      columns: ['status'],
    });

    console.log('✓ Sharing relationships table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping sharing_relationships table...');

    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.SHARING_RELATIONSHIPS,
    });

    console.log('✓ Sharing relationships table dropped');
  },
};
