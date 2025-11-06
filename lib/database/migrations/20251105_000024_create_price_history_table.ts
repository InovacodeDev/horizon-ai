/**
 * Migration: Create price_history table
 *
 * Maintains historical pricing data for products across different merchants
 * and dates, enabling price tracking and comparison features.
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251105_000024',
  description: 'Create price_history table for product price tracking',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating price_history table...');

    // Create price_history table
    await databases.createTable({
      databaseId,
      tableId: 'price_history',
      name: 'Price History',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating price history columns...');

    // User reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'price_history',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Product reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'price_history',
      key: 'product_id',
      size: 255,
      required: true,
    });

    // Invoice reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'price_history',
      key: 'invoice_id',
      size: 255,
      required: true,
    });

    // Merchant CNPJ
    await databases.createStringColumn({
      databaseId,
      tableId: 'price_history',
      key: 'merchant_cnpj',
      size: 20,
      required: true,
    });

    // Merchant name
    await databases.createStringColumn({
      databaseId,
      tableId: 'price_history',
      key: 'merchant_name',
      size: 255,
      required: true,
    });

    // Purchase date
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'price_history',
      key: 'purchase_date',
      required: true,
    });

    // Unit price
    await databases.createFloatColumn({
      databaseId,
      tableId: 'price_history',
      key: 'unit_price',
      required: true,
    });

    // Quantity purchased
    await databases.createFloatColumn({
      databaseId,
      tableId: 'price_history',
      key: 'quantity',
      required: true,
    });

    // Timestamp
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'price_history',
      key: 'created_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index for user queries
    await databases.createIndex({
      databaseId,
      tableId: 'price_history',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for product queries
    await databases.createIndex({
      databaseId,
      tableId: 'price_history',
      key: 'idx_product_id',
      type: IndexType.Key,
      columns: ['product_id'],
      orders: ['ASC'],
    });

    // Index for purchase date queries
    await databases.createIndex({
      databaseId,
      tableId: 'price_history',
      key: 'idx_purchase_date',
      type: IndexType.Key,
      columns: ['purchase_date'],
      orders: ['DESC'],
    });

    // Compound index for product + date queries (price history charts)
    await databases.createIndex({
      databaseId,
      tableId: 'price_history',
      key: 'idx_product_date',
      type: IndexType.Key,
      columns: ['product_id', 'purchase_date'],
      orders: ['ASC', 'DESC'],
    });

    console.log('✅ Price history table created successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping price_history table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'price_history',
    });

    console.log('✅ Price history table dropped successfully');
  },
};
