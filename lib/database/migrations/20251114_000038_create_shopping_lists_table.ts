/**
 * Migration: Create shopping_lists table
 *
 * Stores shopping list metadata for AI-powered and manual shopping lists
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251114_000038',
  description: 'Create shopping_lists table for AI-powered shopping lists',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating shopping_lists table...');

    // Create shopping_lists table
    await databases.createTable({
      databaseId,
      tableId: 'shopping_lists',
      name: 'Shopping Lists',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating shopping list columns...');

    // User reference
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // List title
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'title',
      size: 255,
      required: true,
    });

    // Category (matches invoice categories)
    await databases.createEnumColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'category',
      elements: ['pharmacy', 'groceries', 'supermarket', 'restaurant', 'fuel', 'retail', 'services', 'other'],
      required: true,
    });

    // AI generation flag
    await databases.createBooleanColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'generated_by_ai',
      required: true,
    });

    // Estimated total
    await databases.createFloatColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'estimated_total',
      required: false,
    });

    // Actual total (after shopping)
    await databases.createFloatColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'actual_total',
      required: false,
    });

    // Completion status
    await databases.createBooleanColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'completed',
      required: true,
    });

    // Completion timestamp
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'completed_at',
      required: false,
    });

    // Metadata (JSON string for AI generation params, best merchant, etc)
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'metadata',
      size: 4000,
      required: false,
    });

    // Timestamps
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'created_at',
      required: true,
    });

    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'shopping_lists',
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index for user queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_lists',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for date queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_lists',
      key: 'idx_created_at',
      type: IndexType.Key,
      columns: ['created_at'],
      orders: ['DESC'],
    });

    // Index for category queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_lists',
      key: 'idx_category',
      type: IndexType.Key,
      columns: ['category'],
    });

    // Index for completion status
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_lists',
      key: 'idx_completed',
      type: IndexType.Key,
      columns: ['completed'],
    });

    // Compound index for user + category queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_lists',
      key: 'idx_user_category',
      type: IndexType.Key,
      columns: ['user_id', 'category'],
      orders: ['ASC', 'ASC'],
    });

    // Compound index for user + date queries
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_lists',
      key: 'idx_user_created',
      type: IndexType.Key,
      columns: ['user_id', 'created_at'],
      orders: ['ASC', 'DESC'],
    });

    console.log('✅ Shopping lists table created successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping shopping_lists table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'shopping_lists',
    });

    console.log('✅ Shopping lists table dropped successfully');
  },
};
