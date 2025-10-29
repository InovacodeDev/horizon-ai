/**
 * Migration: Add credit_card_id to transactions
 * Created: 2025-10-29
 *
 * Adds credit_card_id column to transactions table for credit card transaction tracking
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTION_ID = 'transactions';

export const migration: Migration = {
  id: '20251029_000016',
  description: 'Add credit_card_id column to transactions table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Adding credit_card_id column to transactions table...');

    // Add credit_card_id column
    console.log('Creating credit_card_id attribute...');
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'credit_card_id',
      size: 255,
      required: false,
    });

    console.log('Waiting for attribute to be available...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Create index for credit_card_id
    console.log('Creating index for credit_card_id...');
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_credit_card_id',
      type: IndexType.Key,
      columns: ['credit_card_id'],
      orders: ['ASC'],
    });

    console.log('✅ credit_card_id column added successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Removing credit_card_id column from transactions table...');

    // Delete index first
    try {
      await (databases as any).deleteIndex({
        databaseId,
        tableId: COLLECTION_ID,
        key: 'idx_credit_card_id',
      });
    } catch (err) {
      console.warn('Index may not exist:', err);
    }

    // Delete column
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'credit_card_id',
    });

    console.log('✅ credit_card_id column removed successfully');
  },
};
