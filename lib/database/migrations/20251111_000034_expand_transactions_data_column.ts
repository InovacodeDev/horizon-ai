/**
 * Migration: Expand Transactions Data Column
 * Created: 2025-11-11
 *
 * Removes the "data" JSON column and adds individual nullable columns
 * Data JSON previously stored: category, description, currency, source, account_id,
 * merchant, integration_id, integration_data, tags, location, receipt_url,
 * is_recurring, recurring_pattern
 */
import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251111_000034',
  description: 'Expand transactions data column into individual nullable columns',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Expanding transactions data column...');

    // Delete the data column
    console.log('Deleting data column...');
    await databases.deleteColumn({
      databaseId,
      tableId: 'transactions',
      key: 'data',
    });

    console.log('Creating individual nullable columns...');

    // Column: integration_id
    await databases.createStringColumn({
      databaseId,
      tableId: 'transactions',
      key: 'integration_id',
      size: 255,
      required: false,
    });

    // Column: integration_data (keeping as JSON for complex nested data)
    await databases.createStringColumn({
      databaseId,
      tableId: 'transactions',
      key: 'integration_data',
      size: 2000,
      required: false,
    });

    // Column: location (keeping as JSON for latitude, longitude, address)
    await databases.createStringColumn({
      databaseId,
      tableId: 'transactions',
      key: 'location',
      size: 1000,
      required: false,
    });

    // Column: receipt_url
    await databases.createUrlColumn({
      databaseId,
      tableId: 'transactions',
      key: 'receipt_url',
      required: false,
    });

    // Column: recurring_pattern (keeping as JSON for frequency, interval, endDate)
    await databases.createStringColumn({
      databaseId,
      tableId: 'transactions',
      key: 'recurring_pattern',
      size: 500,
      required: false,
    });

    console.log('✅ Transactions data column expanded successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting transactions data column expansion...');

    // Delete individual columns
    const columnsToDelete = [
      'category',
      'description',
      'currency',
      'source',
      'account_id',
      'merchant',
      'integration_id',
      'integration_data',
      'tags',
      'location',
      'receipt_url',
      'is_recurring',
      'recurring_pattern',
    ];

    for (const column of columnsToDelete) {
      await databases.deleteColumn({
        databaseId,
        tableId: 'transactions',
        key: column,
      });
    }

    // Recreate the data column
    await databases.createStringColumn({
      databaseId,
      tableId: 'transactions',
      key: 'data',
      size: 4000,
      required: false,
    });

    console.log('✅ Transactions data column reverted');
  },
};
