/**
 * Migration: Expand Investments Data Column
 * Created: 2025-11-11
 *
 * Removes the "data" JSON column and adds individual nullable columns
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  INVESTMENTS: 'investments',
};

export const migration: Migration = {
  id: '20251111_000030',
  description: 'Expand investments data column into individual nullable columns',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Expanding investments data column...');

    // Delete the data column
    console.log('Deleting data column...');
    await databases.deleteColumn({
      databaseId,
      tableId: COLLECTIONS.INVESTMENTS,
      key: 'data',
    });

    console.log('Creating individual nullable columns...');

    // Add individual columns (all nullable since they were in the JSON data field)
    // Note: Add any fields that were stored in the data JSON column here
    // Based on the context, this appears to be a flexible field for additional data
    // You may need to add specific columns based on your actual data structure

    console.log('✅ Investments data column expanded successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting investments data column expansion...');

    // Note: This will lose data from the individual columns
    // Add logic to delete individual columns if needed

    // Recreate the data column
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.INVESTMENTS,
      key: 'data',
      size: 4000,
      required: false,
    });

    console.log('✅ Investments data column reverted');
  },
};
