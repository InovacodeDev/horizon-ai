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
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'category',
      size: 100,
      required: false,
    });

    console.log('Adding description column...');
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'description',
      size: 500,
      required: false,
    });

    console.log('Adding currency column...');
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'currency',
      size: 10,
      required: false,
      default: 'BRL',
    });

    console.log('Adding source column...');
    await (databases as any).createEnumAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'source',
      elements: ['manual', 'integration', 'import'],
      required: false,
      default: 'manual',
    });

    console.log('Adding merchant column...');
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'merchant',
      size: 255,
      required: false,
    });

    console.log('Adding tags column...');
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'tags',
      size: 500,
      required: false,
    });

    console.log('Adding is_recurring column...');
    await (databases as any).createBooleanAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'is_recurring',
      required: false,
      default: false,
    });

    console.log('Waiting for attributes to be available...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Creating indexes for new columns...');

    // Index for category (most common filter)
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_category',
      type: IndexType.Key,
      attributes: ['category'],
    });

    // Index for source
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_source',
      type: IndexType.Key,
      attributes: ['source'],
    });

    // Index for merchant
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_merchant',
      type: IndexType.Key,
      attributes: ['merchant'],
    });

    console.log('✅ Transactions table expanded successfully');
    console.log('⚠️  Note: Run data migration script to move data from "data" column to new columns');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting transactions table expansion...');

    // Delete indexes first
    try {
      await (databases as any).deleteIndex({
        databaseId,
        tableId: COLLECTION_ID,
        key: 'idx_category',
      });
      await (databases as any).deleteIndex({
        databaseId,
        tableId: COLLECTION_ID,
        key: 'idx_source',
      });
      await (databases as any).deleteIndex({
        databaseId,
        tableId: COLLECTION_ID,
        key: 'idx_merchant',
      });
    } catch (err) {
      console.warn('Some indexes may not exist:', err);
    }

    // Delete columns
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'is_recurring',
    });
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'tags',
    });
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'merchant',
    });
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'source',
    });
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'currency',
    });
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'description',
    });
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'category',
    });

    console.log('✅ Transactions table reverted to original structure');
  },
};
