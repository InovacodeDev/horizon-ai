/**
 * Migration: Create recurring_rules table and update transactions
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251201_000047_create_recurring_rules_table',
  description: 'Create recurring_rules table and add recurring_rule_id to transactions',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    const safeExec = async (operation: () => Promise<any>, name: string) => {
      try {
        await operation();
        console.log(`✓ ${name}`);
      } catch (error: any) {
        if (error.code === 409 || error.message?.includes('already exists')) {
          console.log(`ℹ️  ${name} (already exists)`);
        } else {
          throw error;
        }
      }
    };

    console.log('Creating recurring_rules table...');

    // Create recurring_rules table
    await safeExec(
      () =>
        databases.createTable({
          databaseId,
          tableId: 'recurring_rules',
          name: 'Recurring Rules',
          permissions: ['read("any")', 'write("any")'],
          rowSecurity: true,
        }),
      'Create table recurring_rules',
    );

    console.log('Creating columns for recurring_rules...');

    // user_id
    await safeExec(
      () =>
        databases.createStringColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'user_id',
          size: 255,
          required: true,
        }),
      'Column user_id',
    );

    // type
    await safeExec(
      () =>
        databases.createEnumColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'type',
          elements: ['income', 'expense'],
          required: true,
        }),
      'Column type',
    );

    // frequency
    await safeExec(
      () =>
        databases.createEnumColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'frequency',
          elements: ['WEEKLY', 'MONTHLY', 'YEARLY'],
          required: true,
        }),
      'Column frequency',
    );

    // interval
    await safeExec(
      () =>
        databases.createIntegerColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'interval',
          required: true,
        }),
      'Column interval',
    );

    // amount
    await safeExec(
      () =>
        databases.createFloatColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'amount',
          required: true,
        }),
      'Column amount',
    );

    // start_date
    await safeExec(
      () =>
        databases.createDatetimeColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'start_date',
          required: true,
        }),
      'Column start_date',
    );

    // end_date (nullable)
    await safeExec(
      () =>
        databases.createDatetimeColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'end_date',
          required: false,
        }),
      'Column end_date',
    );

    // category
    await safeExec(
      () =>
        databases.createStringColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'category',
          size: 100,
          required: true,
        }),
      'Column category',
    );

    // created_at
    await safeExec(
      () =>
        databases.createDatetimeColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'created_at',
          required: true,
        }),
      'Column created_at',
    );

    // updated_at
    await safeExec(
      () =>
        databases.createDatetimeColumn({
          databaseId,
          tableId: 'recurring_rules',
          key: 'updated_at',
          required: true,
        }),
      'Column updated_at',
    );

    console.log('Creating indexes for recurring_rules...');

    // idx_user_id
    await safeExec(
      () =>
        databases.createIndex({
          databaseId,
          tableId: 'recurring_rules',
          key: 'idx_user_id',
          type: IndexType.Key,
          columns: ['user_id'],
        }),
      'Index idx_user_id',
    );

    console.log('Adding recurring_rule_id to transactions...');

    // Add recurring_rule_id to transactions
    await safeExec(
      () =>
        databases.createStringColumn({
          databaseId,
          tableId: 'transactions',
          key: 'recurring_rule_id',
          size: 255,
          required: false,
        }),
      'Column recurring_rule_id in transactions',
    );

    console.log('Waiting for column to be ready...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Index for recurring_rule_id
    await safeExec(
      () =>
        databases.createIndex({
          databaseId,
          tableId: 'transactions',
          key: 'idx_recurring_rule_id',
          type: IndexType.Key,
          columns: ['recurring_rule_id'],
        }),
      'Index idx_recurring_rule_id',
    );

    console.log('✅ Recurring Rules table created and Transactions updated successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping recurring_rule_id from transactions...');

    // Remove index first
    await databases.deleteIndex({
      databaseId,
      tableId: 'transactions',
      key: 'idx_recurring_rule_id',
    });

    // Remove column
    await databases.deleteColumn({
      databaseId,
      tableId: 'transactions',
      key: 'recurring_rule_id',
    });

    console.log('Dropping recurring_rules table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'recurring_rules',
    });

    console.log('✅ Recurring Rules table dropped and Transactions reverted successfully');
  },
};
