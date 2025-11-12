/**
 * Migration: Add Vale Account Type
 * Created: 2025-11-06
 *
 * Adds 'vale' as a new account type option for vale alimentação/flexível
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  ACCOUNTS: 'accounts',
};

export const migration: Migration = {
  id: '20251106_000025',
  description: 'Add vale account type for vale alimentação/flexível',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Updating account_type enum to include vale...');

    // Delete the existing enum column
    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'account_type',
    });

    // Recreate with the new vale option
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'account_type',
      elements: ['checking', 'savings', 'investment', 'vale', 'other'],
      required: true,
    });

    console.log('✓ Account type enum updated successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting account_type enum...');

    // Delete the column with vale
    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'account_type',
    });

    // Recreate without vale
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'account_type',
      elements: ['checking', 'savings', 'investment', 'other'],
      required: true,
    });

    console.log('✓ Account type enum reverted');
  },
};
