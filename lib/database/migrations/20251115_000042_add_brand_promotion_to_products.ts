/**
 * Migration: Add brand and promotion tracking to products table
 * Date: 2025-11-15
 *
 * Adds brand extraction and promotion detection fields to improve
 * price analysis and product matching.
 */
import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251115_000042',
  description: 'Add brand and promotion tracking to products table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    const COLLECTIONS = {
      PRODUCTS: 'products',
    };

    console.log('Adding brand and promotion tracking columns to products table...');

    try {
      // Add brand column (optional string)
      await databases.createStringColumn({
        databaseId,
        tableId: COLLECTIONS.PRODUCTS,
        key: 'brand',
        size: 255,
        required: false,
      });
      console.log('✓ Created brand column');

      // Add is_promotion column (optional boolean)
      await databases.createBooleanColumn({
        databaseId,
        tableId: COLLECTIONS.PRODUCTS,
        key: 'is_promotion',
        required: false,
        xdefault: false,
      });
      console.log('✓ Created is_promotion column');

      console.log('✅ Brand and promotion tracking columns added successfully!');
    } catch (error: any) {
      console.error('❌ Failed to add brand and promotion columns:', error);
      throw error;
    }
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    const COLLECTIONS = {
      PRODUCTS: 'products',
    };

    console.log('Removing brand and promotion tracking columns from products table...');

    try {
      // Delete is_promotion column
      await databases.deleteColumn({
        databaseId,
        tableId: COLLECTIONS.PRODUCTS,
        key: 'is_promotion',
      });
      console.log('✓ Deleted is_promotion column');

      // Delete brand column
      await databases.deleteColumn({
        databaseId,
        tableId: COLLECTIONS.PRODUCTS,
        key: 'brand',
      });
      console.log('✓ Deleted brand column');

      console.log('✅ Brand and promotion tracking columns removed successfully');
    } catch (error: any) {
      console.error('❌ Failed to remove brand and promotion columns:', error);
      throw error;
    }
  },
};
