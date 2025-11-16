/**
 * Migration: Create notifications table
 *
 * Stores user notifications for shopping lists and other events
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251114_000041',
  description: 'Create notifications table for user alerts',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating notifications table...');

    await databases.createTable({
      databaseId,
      tableId: 'notifications',
      name: 'Notifications',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating notification columns...');

    // user_id
    await databases.createStringColumn({
      databaseId,
      tableId: 'notifications',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // type
    await databases.createEnumColumn({
      databaseId,
      tableId: 'notifications',
      key: 'type',
      elements: ['shopping_list_completed', 'shopping_list_error', 'sharing_invitation', 'system'],
      required: true,
    });

    // title
    await databases.createStringColumn({
      databaseId,
      tableId: 'notifications',
      key: 'title',
      size: 255,
      required: true,
    });

    // message
    await databases.createStringColumn({
      databaseId,
      tableId: 'notifications',
      key: 'message',
      size: 1000,
      required: true,
    });

    // read
    await databases.createBooleanColumn({
      databaseId,
      tableId: 'notifications',
      key: 'read',
      required: true,
    });

    // read_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'notifications',
      key: 'read_at',
      required: false,
    });

    // action_url
    await databases.createStringColumn({
      databaseId,
      tableId: 'notifications',
      key: 'action_url',
      size: 500,
      required: false,
    });

    // related_id
    await databases.createStringColumn({
      databaseId,
      tableId: 'notifications',
      key: 'related_id',
      size: 255,
      required: false,
    });

    // metadata
    await databases.createStringColumn({
      databaseId,
      tableId: 'notifications',
      key: 'metadata',
      size: 2000,
      required: false,
    });

    // created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'notifications',
      key: 'created_at',
      required: true,
    });

    console.log('Creating notification indexes...');

    // Index for querying user's notifications
    await databases.createIndex({
      databaseId,
      tableId: 'notifications',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for read status filtering
    await databases.createIndex({
      databaseId,
      tableId: 'notifications',
      key: 'idx_read',
      type: IndexType.Key,
      columns: ['read'],
    });

    // Index for recent notifications
    await databases.createIndex({
      databaseId,
      tableId: 'notifications',
      key: 'idx_created_at',
      type: IndexType.Key,
      columns: ['created_at'],
      orders: ['DESC'],
    });

    // Compound index for unread notifications by user
    await databases.createIndex({
      databaseId,
      tableId: 'notifications',
      key: 'idx_user_read',
      type: IndexType.Key,
      columns: ['user_id', 'read'],
      orders: ['ASC', 'ASC'],
    });

    // Compound index for user's recent notifications
    await databases.createIndex({
      databaseId,
      tableId: 'notifications',
      key: 'idx_user_created',
      type: IndexType.Key,
      columns: ['user_id', 'created_at'],
      orders: ['ASC', 'DESC'],
    });

    console.log('✓ notifications table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping notifications table...');
    await databases.deleteTable({
      databaseId,
      tableId: 'notifications',
    });
    console.log('✓ notifications table dropped');
  },
};
