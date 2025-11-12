/**
 * Migration: Expand Accounts Data Column
 * Created: 2025-11-11
 *
 * Removes the "data" JSON column and adds individual nullable columns
 * Data JSON previously stored: bank_id, last_digits, status, etc.
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  ACCOUNTS: 'accounts',
};

export const migration: Migration = {
  id: '20251111_000033',
  description: 'Expand accounts data column into individual nullable columns',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Expanding accounts data column...');

    // Delete the data column
    console.log('Deleting data column...');
    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'data',
    });

    console.log('Creating individual nullable columns...');

    // Column: bank_id
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'bank_id',
      size: 255,
      required: false,
    });

    // Column: last_digits
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'last_digits',
      size: 10,
      required: false,
    });

    // Column: status
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'status',
      elements: ['active', 'inactive', 'closed', 'pending'],
      required: false,
    });

    console.log('✅ Accounts data column expanded successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting accounts data column expansion...');

    // Delete individual columns
    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'bank_id',
    });

    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'last_digits',
    });

    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'status',
    });

    // Recreate the data column
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'data',
      size: 4000,
      required: false,
    });

    console.log('✅ Accounts data column reverted');
  },
};
