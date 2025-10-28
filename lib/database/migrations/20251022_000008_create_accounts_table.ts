/**
 * Migration: Create Accounts Table
 * Created: 2025-10-22
 *
 * Creates the accounts table for manual and integrated bank accounts
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

// Note: COLLECTIONS constant will be imported from appwrite-schema when it's migrated
const COLLECTIONS = {
  ACCOUNTS: 'accounts',
};

export const migration: Migration = {
  id: '20251022_000008',
  description: 'Create accounts table for manual and integrated bank accounts',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating accounts table...');

    // Create accounts table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      name: 'Accounts',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating columns...');

    // Column 1: user_id - Reference to user
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Column 2: name - Account name
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'name',
      size: 255,
      required: true,
    });

    // Column 3: account_type - checking, savings, investment, other
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'account_type',
      elements: ['checking', 'savings', 'investment', 'other'],
      required: true,
    });

    // Column 4: balance - Current balance
    await databases.createFloatColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'balance',
      required: true,
    });

    // Column 5: is_manual - Whether this is a manual account
    await databases.createBooleanColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'is_manual',
      required: true,
    });

    // Column 6: data - JSON string for bank_id, last_digits, status, etc.
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'data',
      size: 4000,
      required: false,
    });

    // Column 7: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'created_at',
      required: true,
    });

    // Column 8: updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index 1: user_id for user queries
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index 2: is_manual for filtering manual vs integrated accounts
    await databases.createIndex({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'idx_is_manual',
      type: IndexType.Key,
      columns: ['is_manual'],
    });

    console.log('✓ Accounts table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping accounts table...');

    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
    });

    console.log('✓ Accounts table dropped');
  },
};
