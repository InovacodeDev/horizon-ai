/**
 * Migration: Expand Invoices Data Column
 * Created: 2025-11-11
 *
 * Removes the "data" JSON column and adds individual nullable columns
 * Data JSON previously stored: series, merchant_address, discount_amount, tax_amount,
 * custom_category, source_url, qr_code_data, xml_data, transaction_id, account_id
 */
import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251111_000032',
  description: 'Expand invoices data column into individual nullable columns',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Expanding invoices data column...');

    // Delete the data column
    console.log('Deleting data column...');
    await databases.deleteColumn({
      databaseId,
      tableId: 'invoices',
      key: 'data',
    });

    console.log('Creating individual nullable columns...');

    // Column: series
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'series',
      size: 50,
      required: false,
    });

    // Column: merchant_address
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'merchant_address',
      size: 500,
      required: false,
    });

    // Column: discount_amount
    await databases.createFloatColumn({
      databaseId,
      tableId: 'invoices',
      key: 'discount_amount',
      required: false,
    });

    // Column: tax_amount
    await databases.createFloatColumn({
      databaseId,
      tableId: 'invoices',
      key: 'tax_amount',
      required: false,
    });

    // Column: custom_category
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'custom_category',
      size: 100,
      required: false,
    });

    // Column: source_url
    await databases.createUrlColumn({
      databaseId,
      tableId: 'invoices',
      key: 'source_url',
      required: false,
    });

    // Column: qr_code_data
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'qr_code_data',
      size: 1000,
      required: false,
    });

    // Column: xml_data
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'xml_data',
      size: 4000,
      required: false,
    });

    // Column: transaction_id
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'transaction_id',
      size: 255,
      required: false,
    });

    // Column: account_id
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'account_id',
      size: 255,
      required: false,
    });

    console.log('✅ Invoices data column expanded successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting invoices data column expansion...');

    // Delete individual columns
    const columnsToDelete = [
      'series',
      'merchant_address',
      'discount_amount',
      'tax_amount',
      'custom_category',
      'source_url',
      'qr_code_data',
      'xml_data',
      'transaction_id',
      'account_id',
    ];

    for (const column of columnsToDelete) {
      await databases.deleteColumn({
        databaseId,
        tableId: 'invoices',
        key: column,
      });
    }

    // Recreate the data column
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'data',
      size: 4000,
      required: false,
    });

    console.log('✅ Invoices data column reverted');
  },
};
