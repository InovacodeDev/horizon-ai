/**
 * Migration: Remove deprecated product statistics columns
 *
 * Removes total_purchases, average_price, and last_purchase_date columns
 * from products table as these stats are now computed on-demand from
 * price_history table for better data accuracy.
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251114_000037',
  description: 'Remove deprecated product statistics columns (total_purchases, average_price, last_purchase_date)',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Removing deprecated product statistics columns...');

    // Delete indexes that depend on these columns
    try {
      await databases.deleteIndex({
        databaseId,
        tableId: 'products',
        key: 'idx_last_purchase_date',
      });
      console.log('✓ Deleted idx_last_purchase_date index');
    } catch (err) {
      console.warn('idx_last_purchase_date index may not exist:', err);
    }

    try {
      await databases.deleteIndex({
        databaseId,
        tableId: 'products',
        key: 'idx_user_purchases',
      });
      console.log('✓ Deleted idx_user_purchases index');
    } catch (err) {
      console.warn('idx_user_purchases index may not exist:', err);
    }

    // Delete columns
    try {
      await databases.deleteColumn({
        databaseId,
        tableId: 'products',
        key: 'total_purchases',
      });
      console.log('✓ Deleted total_purchases column');
    } catch (err) {
      console.error('Failed to delete total_purchases column:', err);
    }

    try {
      await databases.deleteColumn({
        databaseId,
        tableId: 'products',
        key: 'average_price',
      });
      console.log('✓ Deleted average_price column');
    } catch (err) {
      console.error('Failed to delete average_price column:', err);
    }

    try {
      await databases.deleteColumn({
        databaseId,
        tableId: 'products',
        key: 'last_purchase_date',
      });
      console.log('✓ Deleted last_purchase_date column');
    } catch (err) {
      console.error('Failed to delete last_purchase_date column:', err);
    }

    console.log('✅ Products table statistics columns removed successfully!');
    console.log('ℹ️  Product statistics are now computed on-demand from price_history table');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Restoring product statistics columns...');

    // Recreate columns
    await databases.createIntegerColumn({
      databaseId,
      tableId: 'products',
      key: 'total_purchases',
      required: true,
      min: 0,
      xdefault: 0,
    });

    await databases.createFloatColumn({
      databaseId,
      tableId: 'products',
      key: 'average_price',
      required: true,
      xdefault: 0.0,
    });

    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'products',
      key: 'last_purchase_date',
      required: false,
    });

    // Recreate indexes
    await databases.createIndex({
      databaseId,
      tableId: 'products',
      key: 'idx_last_purchase_date',
      type: IndexType.Key,
      columns: ['last_purchase_date'],
      orders: ['DESC'],
    });

    await databases.createIndex({
      databaseId,
      tableId: 'products',
      key: 'idx_user_purchases',
      type: IndexType.Key,
      columns: ['user_id', 'total_purchases'],
      orders: ['ASC', 'DESC'],
    });

    console.log('✅ Products table statistics columns restored');
    console.log('⚠️  Note: Column data will be empty and needs recalculation');
  },
};
