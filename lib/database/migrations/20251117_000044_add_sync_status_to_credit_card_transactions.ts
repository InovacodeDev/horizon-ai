/**
 * Migration: Add sync_status column to credit_card_transactions table
 * Created: 2024-11-17
 *
 * Adds sync_status column to track if credit card transactions have been synchronized
 * to bill transactions in the transactions table.
 *
 * Values: 'pending' | 'synced'
 * Default: 'pending'
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTION_ID = 'credit_card_transactions';

export const migration: Migration = {
  id: '20251117_000044',
  description: 'Add sync_status column to credit_card_transactions table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Adding sync_status column to credit_card_transactions...');

    try {
      // Add sync_status column with enum type
      await databases.createEnumColumn({
        databaseId,
        tableId: COLLECTION_ID,
        key: 'sync_status',
        elements: ['pending', 'synced'],
        required: true,
      });

      console.log('sync_status column added successfully');
    } catch (error: any) {
      // If column already exists, log and continue
      if (error.code === 409 || error.message?.includes('already exists')) {
        console.log('sync_status column already exists, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Removing sync_status column from credit_card_transactions...');

    try {
      await databases.deleteColumn({
        databaseId,
        tableId: COLLECTION_ID,
        key: 'sync_status',
      });

      console.log('sync_status column removed successfully');
    } catch (error: any) {
      console.error('Error removing sync_status column:', error);
      throw error;
    }
  },
};
