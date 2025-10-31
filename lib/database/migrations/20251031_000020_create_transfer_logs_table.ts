/**
 * Migration: Create Transfer Logs Table
 * Created: 2025-10-31
 *
 * Creates the transfer_logs table for tracking balance transfers between accounts
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  TRANSFER_LOGS: 'transfer_logs',
};

export const migration: Migration = {
  id: '20251031_000020',
  description: 'Create transfer_logs table for tracking balance transfers between accounts',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating transfer_logs table...');

    // Create transfer_logs table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      name: 'Transfer Logs',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating columns...');

    // Column 1: user_id - Reference to user
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Column 2: from_account_id - Source account
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'from_account_id',
      size: 255,
      required: true,
    });

    // Column 3: to_account_id - Destination account
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'to_account_id',
      size: 255,
      required: true,
    });

    // Column 4: amount - Transfer amount
    await databases.createFloatColumn({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'amount',
      required: true,
    });

    // Column 5: description - Optional description
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'description',
      size: 500,
      required: false,
    });

    // Column 6: status - Transfer status
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'status',
      elements: ['completed', 'failed'],
      required: true,
    });

    // Column 7: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'created_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index 1: user_id for user queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index 2: from_account_id for source account queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'idx_from_account_id',
      type: IndexType.Key,
      columns: ['from_account_id'],
      orders: ['ASC'],
    });

    // Index 3: to_account_id for destination account queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'idx_to_account_id',
      type: IndexType.Key,
      columns: ['to_account_id'],
      orders: ['ASC'],
    });

    // Index 4: created_at for chronological queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
      key: 'idx_created_at',
      type: IndexType.Key,
      columns: ['created_at'],
      orders: ['DESC'],
    });

    console.log('✓ Transfer logs table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping transfer_logs table...');

    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.TRANSFER_LOGS,
    });

    console.log('✓ Transfer logs table dropped');
  },
};
