/**
 * Migration: Create transactions table (Ultra Optimized)
 *
 * Reduced to 8 columns only to work within Appwrite's strict column limits.
 * Most fields are stored in a single "data" JSON column.
 *
 * Data JSON structure:
 * {
 *   category: string,
 *   description?: string,
 *   currency: string,
 *   source: 'manual' | 'integration' | 'import',
 *   account_id?: string,
 *   merchant?: string,
 *   integration_id?: string,
 *   integration_data?: any,
 *   tags?: string[],
 *   location?: { latitude, longitude, address },
 *   receipt_url?: string,
 *   is_recurring?: boolean,
 *   recurring_pattern?: { frequency, interval, endDate }
 * }
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251022_000007',
  description: 'Create transactions table (ultra optimized - 8 columns)',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating transactions table (ultra optimized)...');

    // Create transactions table
    await databases.createTable({
      databaseId,
      tableId: 'transactions',
      name: 'Transactions',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating 8 essential columns...');

    // Column 1: user_id - Reference to user (indexed for queries)
    await databases.createStringColumn({
      databaseId,
      tableId: 'transactions',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Column 2: amount - Transaction amount
    await databases.createFloatColumn({
      databaseId,
      tableId: 'transactions',
      key: 'amount',
      required: true,
    });

    // Column 3: type - income, expense, transfer (indexed for queries)
    await databases.createEnumColumn({
      databaseId,
      tableId: 'transactions',
      key: 'type',
      elements: ['income', 'expense', 'transfer'],
      required: true,
    });

    // Column 4: date - Transaction date (indexed for queries)
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'transactions',
      key: 'date',
      required: true,
    });

    // Column 5: status - pending, completed, failed, cancelled (indexed for queries)
    await databases.createEnumColumn({
      databaseId,
      tableId: 'transactions',
      key: 'status',
      elements: ['pending', 'completed', 'failed', 'cancelled'],
      required: true,
    });

    // Column 6: data - JSON string containing ALL other fields
    // Includes: category, description, currency, source, account_id, merchant,
    // integration_id, integration_data, tags, location, receipt_url,
    // is_recurring, recurring_pattern
    console.log('Creating data column (JSON) for all other fields...');
    await databases.createStringColumn({
      databaseId,
      tableId: 'transactions',
      key: 'data',
      size: 4000, // Reduced from 16000 to work within Appwrite limits
      required: false,
    });

    // Column 7: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'transactions',
      key: 'created_at',
      required: true,
    });

    // Column 8: updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'transactions',
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index 1: user_id for fast user queries
    await databases.createIndex({
      databaseId,
      tableId: 'transactions',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index 2: date for temporal queries
    await databases.createIndex({
      databaseId,
      tableId: 'transactions',
      key: 'idx_date',
      type: IndexType.Key,
      columns: ['date'],
      orders: ['DESC'],
    });

    // Index 3: type for income/expense filtering
    await databases.createIndex({
      databaseId,
      tableId: 'transactions',
      key: 'idx_type',
      type: IndexType.Key,
      columns: ['type'],
    });

    // Index 4: status for filtering by transaction status
    await databases.createIndex({
      databaseId,
      tableId: 'transactions',
      key: 'idx_status',
      type: IndexType.Key,
      columns: ['status'],
    });

    console.log('✅ Transactions table created successfully with 8 columns!');
    console.log('📝 Note: Most fields are stored in the "data" JSON column');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping transactions table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'transactions',
    });

    console.log('✅ Transactions table dropped successfully');
  },
};
