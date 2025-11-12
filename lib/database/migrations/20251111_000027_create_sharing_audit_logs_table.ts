/**
 * Migration: Create Sharing Audit Logs Table
 * Created: 2025-11-11
 *
 * Creates the sharing_audit_logs table for tracking all sharing-related events
 * (invitations, acceptances, rejections, terminations)
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  SHARING_AUDIT_LOGS: 'sharing_audit_logs',
};

export const migration: Migration = {
  id: '20251111_000027',
  description: 'Create sharing_audit_logs table for tracking sharing events',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating sharing_audit_logs table...');

    // Create sharing_audit_logs table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      name: 'Sharing Audit Logs',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating columns...');

    // Column 1: user_id - User who performed the action
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Column 2: action - Type of action performed
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'action',
      elements: [
        'invitation_created',
        'invitation_accepted',
        'invitation_rejected',
        'invitation_cancelled',
        'relationship_terminated',
      ],
      required: true,
    });

    // Column 3: resource_type - Type of resource affected
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'resource_type',
      elements: ['invitation', 'relationship'],
      required: true,
    });

    // Column 4: resource_id - ID of the affected resource
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'resource_id',
      size: 255,
      required: true,
    });

    // Column 5: details - JSON string with additional details
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'details',
      size: 4000,
      required: false,
    });

    // Column 6: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'created_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index 1: user_id for user activity queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index 2: created_at for chronological queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'idx_created_at',
      type: IndexType.Key,
      columns: ['$createdAt'],
      orders: ['DESC'],
    });

    // Index 3: action for filtering by action type
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'idx_action',
      type: IndexType.Key,
      columns: ['action'],
    });

    // Index 4: resource_type + resource_id for resource lookup
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
      key: 'idx_resource',
      type: IndexType.Key,
      columns: ['resource_type', 'resource_id'],
      orders: ['ASC', 'ASC'],
    });

    console.log('✓ Sharing audit logs table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping sharing_audit_logs table...');

    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.SHARING_AUDIT_LOGS,
    });

    console.log('✓ Sharing audit logs table dropped');
  },
};
