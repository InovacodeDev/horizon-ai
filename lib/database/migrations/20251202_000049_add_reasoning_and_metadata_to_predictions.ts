/**
 * Migration: Add reasoning and metadata to spending_predictions
 *
 * Adds 'reasoning' and 'metadata' columns to store AI analysis details.
 */
import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251202_000049',
  description: 'Add reasoning and metadata to spending_predictions',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Adding reasoning and metadata columns to spending_predictions...');

    // Column: reasoning
    await databases.createStringColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'reasoning',
      size: 1000,
      required: false,
    });

    // Column: metadata (for JSON data)
    await databases.createStringColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'metadata',
      size: 4000,
      required: false,
    });

    console.log('✅ Columns added successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Removing reasoning and metadata columns from spending_predictions...');

    await databases.deleteColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'reasoning',
    });

    await databases.deleteColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'metadata',
    });

    console.log('✅ Columns removed successfully');
  },
};
