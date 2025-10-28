/**
 * Migration: Create Credit Cards Table
 * Created: 2025-10-22
 *
 * Creates the credit_cards table for managing credit cards linked to accounts
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

// Note: COLLECTIONS constant will be imported from appwrite-schema when it's migrated
const COLLECTIONS = {
  CREDIT_CARDS: 'credit_cards',
};

export const migration: Migration = {
  id: '20251022_000009',
  description: 'Create credit_cards table for managing credit cards',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating credit_cards table...');

    // Create credit_cards table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      name: 'Credit Cards',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating columns...');

    // Column 1: account_id - Reference to account
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'account_id',
      size: 255,
      required: true,
    });

    // Column 2: name - Card name
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'name',
      size: 255,
      required: true,
    });

    // Column 3: last_digits - Last 4 digits
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'last_digits',
      size: 4,
      required: true,
    });

    // Column 4: credit_limit - Total credit limit
    await databases.createFloatColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'credit_limit',
      required: true,
    });

    // Column 5: used_limit - Used credit amount
    await databases.createFloatColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'used_limit',
      required: true,
    });

    // Column 6: closing_day - Day of month for closing (1-31)
    await databases.createIntegerColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'closing_day',
      required: true,
    });

    // Column 7: due_day - Day of month for payment due (1-31)
    await databases.createIntegerColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'due_day',
      required: true,
    });

    // Column 8: data - JSON string for brand, network, color, etc.
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'data',
      size: 4000,
      required: false,
    });

    // Column 9: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'created_at',
      required: true,
    });

    // Column 10: updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index 1: account_id for account queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'idx_account_id',
      type: IndexType.Key,
      columns: ['account_id'],
      orders: ['ASC'],
    });

    console.log('✓ Credit Cards table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping credit_cards table...');

    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
    });

    console.log('✓ Credit Cards table dropped');
  },
};
