/**
 * Migration: Create shopping_list_items table
 *
 * Stores individual items in shopping lists with AI confidence and reasoning
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251114_000039',
  description: 'Create shopping_list_items table for shopping list items',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating shopping_list_items table...');

    // Create shopping_list_items table
    await databases.createTable({
      databaseId,
      tableId: 'shopping_list_items',
      name: 'Shopping List Items',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating shopping list item columns...');

    // Shopping list reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'shopping_list_id',
      size: 255,
      required: true,
    });

    // User reference (for direct queries)
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Product name
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'product_name',
      size: 500,
      required: true,
    });

    // Product reference (optional, links to products table)
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'product_id',
      size: 255,
      required: false,
    });

    // Quantity
    await databases.createFloatColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'quantity',
      required: true,
    });

    // Unit (unidades, kg, L, etc)
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'unit',
      size: 50,
      required: false,
    });

    // Estimated price
    await databases.createFloatColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'estimated_price',
      required: false,
    });

    // Actual price (after shopping)
    await databases.createFloatColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'actual_price',
      required: false,
    });

    // Checked status (bought or not)
    await databases.createBooleanColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'checked',
      required: true,
    });

    // Category (Laticínios, Frutas, etc)
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'category',
      size: 100,
      required: false,
    });

    // Subcategory (Leite, Maçã, etc)
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'subcategory',
      size: 100,
      required: false,
    });

    // AI confidence score (0-1)
    await databases.createFloatColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'ai_confidence',
      required: false,
    });

    // AI reasoning for suggestion
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'ai_reasoning',
      size: 1000,
      required: false,
    });

    // Timestamp
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'created_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index for shopping list queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'idx_shopping_list_id',
      type: IndexType.Key,
      columns: ['shopping_list_id'],
      orders: ['ASC'],
    });

    // Index for user queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for product queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'idx_product_id',
      type: IndexType.Key,
      columns: ['product_id'],
      orders: ['ASC'],
    });

    // Index for checked status
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'idx_checked',
      type: IndexType.Key,
      columns: ['checked'],
    });

    // Compound index for list + checked queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_items',
      key: 'idx_list_checked',
      type: IndexType.Key,
      columns: ['shopping_list_id', 'checked'],
      orders: ['ASC', 'ASC'],
    });

    console.log('✅ Shopping list items table created successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping shopping_list_items table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'shopping_list_items',
    });

    console.log('✅ Shopping list items table dropped successfully');
  },
};
