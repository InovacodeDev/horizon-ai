/**
 * Migration: Create users table
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20250123_000002',
  description: 'Create users table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating users table...');

    // Create users table
    await databases.createTable({
      databaseId,
      tableId: 'users',
      name: 'Users',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true, // rowSecurity enabled
    });

    console.log('Creating columns...');

    // auth_user_id - Reference to Appwrite Auth user
    await databases.createStringColumn({
      databaseId,
      tableId: 'users',
      key: 'auth_user_id',
      size: 255,
      required: true,
    });

    // email
    await databases.createEmailColumn({
      databaseId,
      tableId: 'users',
      key: 'email',
      required: true,
    });

    // name
    await databases.createStringColumn({
      databaseId,
      tableId: 'users',
      key: 'name',
      size: 255,
      required: true,
    });

    // created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'users',
      key: 'created_at',
      required: true,
    });

    // updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'users',
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Create unique index on auth_user_id
    await databases.createIndex({
      databaseId,
      tableId: 'users',
      key: 'idx_auth_user_id',
      type: IndexType.Unique,
      columns: ['auth_user_id'],
    });

    // Create index on email
    await databases.createIndex({
      databaseId,
      tableId: 'users',
      key: 'idx_email',
      type: IndexType.Key,
      columns: ['email'],
    });

    console.log('✅ Users table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping users table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'users',
    });

    console.log('✅ Users table dropped successfully');
  },
};
