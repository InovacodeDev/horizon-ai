/**
 * Migration: Create shopping_list_requests table
 *
 * Stores async queue for AI shopping list generation requests
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251114_000040',
  description: 'Create shopping_list_requests table for async AI generation queue',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating shopping_list_requests table...');

    await databases.createTable({
      databaseId,
      tableId: 'shopping_list_requests',
      name: 'Shopping List Requests',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating shopping_list_request columns...');

    // user_id
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // category
    await databases.createEnumColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'category',
      elements: ['pharmacy', 'groceries', 'supermarket', 'restaurant', 'fuel', 'retail', 'services', 'other'],
      required: true,
    });

    // status
    await databases.createEnumColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'status',
      elements: ['pending', 'generating', 'completed', 'error'],
      required: true,
    });

    // historical_months
    await databases.createIntegerColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'historical_months',
      required: true,
    });

    // shopping_list_id
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'shopping_list_id',
      size: 255,
      required: false,
    });

    // error_message
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'error_message',
      size: 1000,
      required: false,
    });

    // metadata
    await databases.createStringColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'metadata',
      size: 4000,
      required: false,
    });

    // created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'created_at',
      required: true,
    });

    // updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'updated_at',
      required: true,
    });

    // completed_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'completed_at',
      required: false,
    });

    console.log('Creating shopping_list_request indexes...');

    // Index for querying user's requests
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for status filtering (critical for queue processing)
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'idx_status',
      type: IndexType.Key,
      columns: ['status'],
    });

    // Index for recent requests
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'idx_created_at',
      type: IndexType.Key,
      columns: ['created_at'],
      orders: ['DESC'],
    });

    // Compound index for user + status filtering
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'idx_user_status',
      type: IndexType.Key,
      columns: ['user_id', 'status'],
      orders: ['ASC', 'ASC'],
    });

    // Compound index for queue processing (pending requests first)
    await databases.createIndex({
      databaseId,
      tableId: 'shopping_list_requests',
      key: 'idx_status_created',
      type: IndexType.Key,
      columns: ['status', 'created_at'],
      orders: ['ASC', 'DESC'],
    });

    console.log('✓ shopping_list_requests table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping shopping_list_requests table...');
    await databases.deleteTable({
      databaseId,
      tableId: 'shopping_list_requests',
    });
    console.log('✓ shopping_list_requests table dropped');
  },
};
