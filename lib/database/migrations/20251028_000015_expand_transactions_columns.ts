/**
 * Migration: Expand transactions table columns
 * Created: 2025-10-28
 *
 * Removes the "data" JSON column and adds individual columns for better indexing and filtering:
 * - category (string, indexed)
 * - description (string)
 * - currency (string)
 * - source (enum: manual, integration, import)
 * - merchant (string)
 * - tags (string - comma-separated)
 * - is_recurring (boolean)
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTION_ID = 'transactions';

export const migration: Migration = {
  id: '20251028_000015',
  description: 'Expand transactions table - remove data column, add individual columns',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Expanding transactions table columns...');

    // Add new columns
    console.log('Adding category column...');
    await databases.createStringAttribute(databaseId, COLLECTION_ID, 'category', 100, false);

    console.log('Adding description column...');
    await databases.createStringAttribute(databaseId, COLLECTION_ID, 'description', 500, false);

    console.log('Adding currency column...');
    await databases.createStringAttribute(databaseId, COLLECTION_ID, 'currency', 10, false, 'BRL');

    console.log('Adding source column...');
    await databases.createEnumAttribute(
      databaseId,
      COLLECTION_ID,
      'source',
      ['manual', 'integration', 'import'],
      false,
      'manual',
    );

    console.log('Adding merchant column...');
    await databases.createStringAttribute(databaseId, COLLECTION_ID, 'merchant', 255, false);

    console.log('Adding tags column...');
    await databases.createStringAttribute(databaseId, COLLECTION_ID, 'tags', 500, false);

    console.log('Adding is_recurring column...');
    await databases.createBooleanAttribute(databaseId, COLLECTION_ID, 'is_recurring', false, false);

    console.log('Waiting for attributes to be available...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Creating indexes for new columns...');

    // Index for category (most common filter)
    await databases.createIndex(databaseId, COLLECTION_ID, 'idx_category', IndexType.Key, ['category']);

    // Index for source
    await databases.createIndex(databaseId, COLLECTION_ID, 'idx_source', IndexType.Key, ['source']);

    // Index for merchant
    await databases.createIndex(databaseId, COLLECTION_ID, 'idx_merchant', IndexType.Key, ['merchant']);

    console.log('✅ Transactions table expanded successfully');
    console.log('⚠️  Note: Run data migration script to move data from "data" column to new columns');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting transactions table expansion...');

    // Delete indexes first
    try {
      await databases.deleteIndex(databaseId, COLLECTION_ID, 'idx_category');
      await databases.deleteIndex(databaseId, COLLECTION_ID, 'idx_source');
      await databases.deleteIndex(databaseId, COLLECTION_ID, 'idx_merchant');
    } catch (err) {
      console.warn('Some indexes may not exist:', err);
    }

    // Delete columns
    await databases.deleteAttribute(databaseId, COLLECTION_ID, 'is_recurring');
    await databases.deleteAttribute(databaseId, COLLECTION_ID, 'tags');
    await databases.deleteAttribute(databaseId, COLLECTION_ID, 'merchant');
    await databases.deleteAttribute(databaseId, COLLECTION_ID, 'source');
    await databases.deleteAttribute(databaseId, COLLECTION_ID, 'currency');
    await databases.deleteAttribute(databaseId, COLLECTION_ID, 'description');
    await databases.deleteAttribute(databaseId, COLLECTION_ID, 'category');

    console.log('✅ Transactions table reverted to original structure');
  },
};
