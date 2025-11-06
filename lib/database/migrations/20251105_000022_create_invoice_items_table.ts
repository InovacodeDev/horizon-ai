/**
 * Migration: Create invoice_items table
 *
 * Stores line items from fiscal invoices, linking to both the parent invoice
 * and normalized products for tracking and analytics.
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251105_000022',
  description: 'Create invoice_items table for invoice line items',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating invoice_items table...');

    // Create invoice_items table
    await databases.createTable({
      databaseId,
      tableId: 'invoice_items',
      name: 'Invoice Items',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating invoice item columns...');

    // Invoice reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'invoice_id',
      size: 255,
      required: true,
    });

    // User reference (for direct queries)
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Product reference (normalized)
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'product_id',
      size: 255,
      required: true,
    });

    // Product code (EAN/GTIN)
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'product_code',
      size: 50,
      required: false,
    });

    // NCM code (Brazilian product classification)
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'ncm_code',
      size: 20,
      required: false,
    });

    // Product description
    await databases.createStringColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'description',
      size: 500,
      required: true,
    });

    // Quantity
    await databases.createFloatColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'quantity',
      required: true,
    });

    // Unit price
    await databases.createFloatColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'unit_price',
      required: true,
    });

    // Total price
    await databases.createFloatColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'total_price',
      required: true,
    });

    // Discount amount
    await databases.createFloatColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'discount_amount',
      required: false,
      xdefault: 0,
    });

    // Line number (order in invoice)
    await databases.createIntegerColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'line_number',
      required: true,
      min: 1,
    });

    // Timestamp
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'invoice_items',
      key: 'created_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index for invoice queries
    await databases.createIndex({
      databaseId,
      tableId: 'invoice_items',
      key: 'idx_invoice_id',
      type: IndexType.Key,
      columns: ['invoice_id'],
      orders: ['ASC'],
    });

    // Index for user queries
    await databases.createIndex({
      databaseId,
      tableId: 'invoice_items',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for product queries
    await databases.createIndex({
      databaseId,
      tableId: 'invoice_items',
      key: 'idx_product_id',
      type: IndexType.Key,
      columns: ['product_id'],
      orders: ['ASC'],
    });

    console.log('✅ Invoice items table created successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping invoice_items table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'invoice_items',
    });

    console.log('✅ Invoice items table dropped successfully');
  },
};
