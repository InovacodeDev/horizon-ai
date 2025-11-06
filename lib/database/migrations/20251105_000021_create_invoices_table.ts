/**
 * Migration: Create invoices table (Optimized)
 *
 * Stores fiscal invoice (Nota Fiscal) information. Uses a data JSON column
 * to store less frequently queried fields within Appwrite's column limits.
 *
 * Data JSON structure:
 * {
 *   series?: string,
 *   merchant_address?: string,
 *   discount_amount?: number,
 *   tax_amount?: number,
 *   custom_category?: string,
 *   source_url?: string,
 *   qr_code_data?: string,
 *   xml_data?: string,
 *   transaction_id?: string,
 *   account_id?: string
 * }
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251105_000021',
  description: 'Create invoices table for fiscal invoice management',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating invoices table (optimized)...');

    // Create invoices table
    await databases.createTable({
      databaseId,
      tableId: 'invoices',
      name: 'Invoices',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating essential invoice columns...');

    // Column 1: user_id - Reference to user (indexed)
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Column 2: invoice_key - Chave de acesso (44 digits, unique)
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'invoice_key',
      size: 50,
      required: true,
    });

    // Column 3: invoice_number
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'invoice_number',
      size: 50,
      required: true,
    });

    // Column 4: issue_date (indexed for temporal queries)
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'invoices',
      key: 'issue_date',
      required: true,
    });

    // Column 5: merchant_cnpj (indexed for merchant queries)
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'merchant_cnpj',
      size: 20,
      required: true,
    });

    // Column 6: merchant_name
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'merchant_name',
      size: 255,
      required: true,
    });

    // Column 7: total_amount
    await databases.createFloatColumn({
      databaseId,
      tableId: 'invoices',
      key: 'total_amount',
      required: true,
    });

    // Column 8: category (indexed for filtering)
    await databases.createEnumColumn({
      databaseId,
      tableId: 'invoices',
      key: 'category',
      elements: ['pharmacy', 'groceries', 'supermarket', 'restaurant', 'fuel', 'retail', 'services', 'other'],
      required: true,
    });

    // Column 9: data - JSON string for additional fields
    // Includes: series, merchant_address, discount_amount, tax_amount,
    // custom_category, source_url, qr_code_data, xml_data,
    // transaction_id, account_id
    console.log('Creating data column (JSON) for additional fields...');
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoices',
      key: 'data',
      size: 4000,
      required: false,
    });

    // Column 10: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'invoices',
      key: 'created_at',
      required: true,
    });

    // Column 11: updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'invoices',
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index for user queries
    await databases.createIndex({
      databaseId,
      tableId: 'invoices',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Unique index for invoice key (prevent duplicates)
    await databases.createIndex({
      databaseId,
      tableId: 'invoices',
      key: 'idx_invoice_key',
      type: IndexType.Unique,
      columns: ['invoice_key'],
    });

    // Index for date queries
    await databases.createIndex({
      databaseId,
      tableId: 'invoices',
      key: 'idx_issue_date',
      type: IndexType.Key,
      columns: ['issue_date'],
      orders: ['DESC'],
    });

    // Index for category filtering
    await databases.createIndex({
      databaseId,
      tableId: 'invoices',
      key: 'idx_category',
      type: IndexType.Key,
      columns: ['category'],
    });

    // Index for merchant queries
    await databases.createIndex({
      databaseId,
      tableId: 'invoices',
      key: 'idx_merchant_cnpj',
      type: IndexType.Key,
      columns: ['merchant_cnpj'],
    });

    console.log('✅ Invoices table created successfully with 11 columns!');
    console.log('📝 Note: Additional fields stored in "data" JSON column');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping invoices table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'invoices',
    });

    console.log('✅ Invoices table dropped successfully');
  },
};
