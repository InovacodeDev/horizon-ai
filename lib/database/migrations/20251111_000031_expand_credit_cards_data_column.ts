/**
 * Migration: Expand Credit Cards Data Column
 * Created: 2025-11-11
 *
 * Removes the "data" JSON column and adds individual nullable columns
 * Data JSON previously stored: brand, network, color, etc.
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  CREDIT_CARDS: 'credit_cards',
};

export const migration: Migration = {
  id: '20251111_000031',
  description: 'Expand credit_cards data column into individual nullable columns',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Expanding credit_cards data column...');

    // Delete the data column
    console.log('Deleting data column...');
    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'data',
    });

    console.log('Creating individual nullable columns...');

    // Column: brand (e.g., Visa, Mastercard, Amex)
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'brand',
      size: 50,
      required: false,
    });

    // Column: network (e.g., credit, debit)
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'network',
      size: 50,
      required: false,
    });

    // Column: color (hex color for UI)
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'color',
      size: 20,
      required: false,
    });

    console.log('✅ Credit cards data column expanded successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting credit_cards data column expansion...');

    // Delete individual columns
    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'brand',
    });

    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'network',
    });

    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'color',
    });

    // Recreate the data column
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARDS,
      key: 'data',
      size: 4000,
      required: false,
    });

    console.log('✅ Credit cards data column reverted');
  },
};
