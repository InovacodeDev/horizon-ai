/**
 * Migration: Create import_history table
 *
 * Stores history of file imports (OFX, CSV, etc.)
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251201_000046',
  description: 'Create import_history table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating import_history table...');

    // Create import_history table
    await databases.createTable({
      databaseId,
      tableId: 'import_history',
      name: 'Import History',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating import_history columns...');

    // User reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'import_history',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Account reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'import_history',
      key: 'account_id',
      size: 255,
      required: true,
    });

    // File name
    await databases.createStringColumn({
      databaseId,
      tableId: 'import_history',
      key: 'file_name',
      size: 255,
      required: true,
    });

    // File format
    await databases.createEnumColumn({
      databaseId,
      tableId: 'import_history',
      key: 'file_format',
      elements: ['ofx', 'csv', 'pdf'],
      required: true,
    });

    // Transaction count
    await databases.createIntegerColumn({
      databaseId,
      tableId: 'import_history',
      key: 'transaction_count',
      required: true,
      min: 0,
    });

    // Import date
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'import_history',
      key: 'import_date',
      required: true,
    });

    // Status
    await databases.createEnumColumn({
      databaseId,
      tableId: 'import_history',
      key: 'status',
      elements: ['completed', 'failed', 'partial'],
      required: true,
    });

    // Error message
    await databases.createStringColumn({
      databaseId,
      tableId: 'import_history',
      key: 'error_message',
      size: 1000,
      required: false,
    });

    // Metadata
    await databases.createStringColumn({
      databaseId,
      tableId: 'import_history',
      key: 'metadata',
      size: 4000,
      required: false,
    });

    // Timestamps
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'import_history',
      key: 'created_at',
      required: true,
    });

    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'import_history',
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index for user queries
    await databases.createIndex({
      databaseId,
      tableId: 'import_history',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for account queries
    await databases.createIndex({
      databaseId,
      tableId: 'import_history',
      key: 'idx_account_id',
      type: IndexType.Key,
      columns: ['account_id'],
      orders: ['ASC'],
    });

    // Index for import date
    await databases.createIndex({
      databaseId,
      tableId: 'import_history',
      key: 'idx_import_date',
      type: IndexType.Key,
      columns: ['import_date'],
      orders: ['DESC'],
    });

    // Index for status
    await databases.createIndex({
      databaseId,
      tableId: 'import_history',
      key: 'idx_status',
      type: IndexType.Key,
      columns: ['status'],
    });

    // Compound index for user + import date
    await databases.createIndex({
      databaseId,
      tableId: 'import_history',
      key: 'idx_user_import_date',
      type: IndexType.Key,
      columns: ['user_id', 'import_date'],
      orders: ['ASC', 'DESC'],
    });

    console.log('✅ Import history table created successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping import_history table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'import_history',
    });

    console.log('✅ Import history table dropped successfully');
  },
};
