/**
 * Migration: Remove product_code and ncm_code from products table
 * Date: 2025-11-16
 *
 * Rationale:
 * - Products should be generic representations (e.g., "Leite Integral")
 * - product_code and ncm_code are specific to invoice_items
 * - Multiple invoice_items with different codes can map to the same product
 *
 * Example:
 * - Invoice item "Leite UHT Italac Int 1L" (code: 7896064200015) -> Product "Leite Integral"
 * - Invoice item "Leite Tirol Int 1L" (code: 7896854200019) -> Product "Leite Integral"
 */
import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251116_000043',
  description: 'Remove product_code and ncm_code from products table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    const COLLECTIONS = {
      PRODUCTS: 'products',
    };

    console.log('Removing product_code and ncm_code columns from products table...');

    try {
      // Remove product_code attribute
      console.log('Removing product_code attribute...');
      await databases.deleteColumn({
        databaseId,
        tableId: COLLECTIONS.PRODUCTS,
        key: 'product_code',
      });
      console.log('✓ product_code removed');

      // Remove ncm_code attribute
      console.log('Removing ncm_code attribute...');
      await databases.deleteColumn({
        databaseId,
        tableId: COLLECTIONS.PRODUCTS,
        key: 'ncm_code',
      });
      console.log('✓ ncm_code removed');

      // Remove indexes that used these attributes
      try {
        await databases.deleteIndex({
          databaseId,
          tableId: COLLECTIONS.PRODUCTS,
          key: 'idx_product_code',
        });
        console.log('✓ idx_product_code removed');
      } catch (error: any) {
        console.log('ℹ️  idx_product_code already removed or does not exist');
      }

      console.log('✅ Product code columns removed successfully!');
    } catch (error: any) {
      console.error('❌ Failed to remove product code columns:', error);
      throw error;
    }
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    const COLLECTIONS = {
      PRODUCTS: 'products',
    };

    console.log('Rolling back: Adding product_code and ncm_code columns back to products table...');

    try {
      // Re-add product_code attribute
      console.log('Adding product_code attribute...');
      await databases.createStringColumn({
        databaseId,
        tableId: COLLECTIONS.PRODUCTS,
        key: 'product_code',
        size: 50,
        required: false,
      });
      console.log('✓ product_code added');

      // Re-add ncm_code attribute
      console.log('Adding ncm_code attribute...');
      await databases.createStringColumn({
        databaseId,
        tableId: COLLECTIONS.PRODUCTS,
        key: 'ncm_code',
        size: 20,
        required: false,
      });
      console.log('✓ ncm_code added');

      console.log('✅ Product code columns restored successfully');
      console.log('ℹ️  Note: Indexes not re-created. You may need to recreate them manually if needed.');
    } catch (error: any) {
      console.error('❌ Failed to restore product code columns:', error);
      throw error;
    }
  },
};
