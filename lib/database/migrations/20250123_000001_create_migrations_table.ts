/**
 * Migration: Create migrations tracking table
 * This table tracks which migrations have been applied
 */
import { ID, IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20250123_000001',
  description: 'Create migrations tracking table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating migrations table...');

    // Create the migrations table
    await databases.createTable({
      databaseId,
      tableId: 'migrations',
      name: 'Migrations',
      permissions: [], // empty for now, can be configured later
      rowSecurity: false, // disabled for system table
    });

    console.log('Creating columns...');

    // Create migrationId column (string, required, unique)
    await databases.createStringColumn({
      databaseId,
      tableId: 'migrations',
      key: 'migrationId',
      size: 255,
      required: true,
    });

    // Create description column (string, required)
    await databases.createStringColumn({
      databaseId,
      tableId: 'migrations',
      key: 'description',
      size: 1000,
      required: true,
    });

    // Create appliedAt column (datetime, required)
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'migrations',
      key: 'appliedAt',
      required: true,
    });

    console.log('Creating indexes...');

    // Create unique index on migrationId
    await databases.createIndex({
      databaseId,
      tableId: 'migrations',
      key: 'migrationId_unique',
      type: IndexType.Unique,
      columns: ['migrationId'],
    });

    // Create index on appliedAt for chronological queries
    await databases.createIndex({
      databaseId,
      tableId: 'migrations',
      key: 'appliedAt_index',
      type: IndexType.Key,
      columns: ['appliedAt'],
      orders: ['ASC'],
    });

    console.log('✅ Migrations table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping migrations table...');

    // Delete the entire table (indexes and columns are automatically deleted)
    await databases.deleteTable({
      databaseId,
      tableId: 'migrations',
    });

    console.log('✅ Migrations table dropped successfully');
  },
};
