/**
 * Migration: Create products table
 *
 * Stores normalized product catalog extracted from invoices.
 * Maintains aggregated statistics for each product across all purchases.
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251105_000023',
  description: 'Create products table for normalized product catalog',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating products table...');

    // Create products table
    await databases.createTable({
      databaseId,
      tableId: 'products',
      name: 'Products',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating product columns...');

    // User reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'products',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Normalized product name
    await databases.createStringColumn({
      databaseId,
      tableId: 'products',
      key: 'name',
      size: 255,
      required: true,
    });

    // Product code (EAN/GTIN)
    await databases.createStringColumn({
      databaseId,
      tableId: 'products',
      key: 'product_code',
      size: 50,
      required: false,
    });

    // NCM code
    await databases.createStringColumn({
      databaseId,
      tableId: 'products',
      key: 'ncm_code',
      size: 20,
      required: false,
    });

    // Category
    await databases.createStringColumn({
      databaseId,
      tableId: 'products',
      key: 'category',
      size: 100,
      required: true,
    });

    // Subcategory
    await databases.createStringColumn({
      databaseId,
      tableId: 'products',
      key: 'subcategory',
      size: 100,
      required: false,
    });

    // Total purchases count
    await databases.createIntegerColumn({
      databaseId,
      tableId: 'products',
      key: 'total_purchases',
      required: true,
      min: 0,
    });

    // Average price
    await databases.createFloatColumn({
      databaseId,
      tableId: 'products',
      key: 'average_price',
      required: true,
    });

    // Last purchase date
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'products',
      key: 'last_purchase_date',
      required: false,
    });

    // Timestamps
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'products',
      key: 'created_at',
      required: true,
    });

    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'products',
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index for user queries
    await databases.createIndex({
      databaseId,
      tableId: 'products',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for product code lookups
    await databases.createIndex({
      databaseId,
      tableId: 'products',
      key: 'idx_product_code',
      type: IndexType.Key,
      columns: ['product_code'],
    });

    // Index for category filtering
    await databases.createIndex({
      databaseId,
      tableId: 'products',
      key: 'idx_category',
      type: IndexType.Key,
      columns: ['category'],
    });

    // Index for last purchase date queries
    await databases.createIndex({
      databaseId,
      tableId: 'products',
      key: 'idx_last_purchase_date',
      type: IndexType.Key,
      columns: ['last_purchase_date'],
      orders: ['DESC'],
    });

    console.log('✅ Products table created successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping products table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'products',
    });

    console.log('✅ Products table dropped successfully');
  },
};
