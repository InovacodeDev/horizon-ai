/**
 * Migration: Remove product_code and ncm_code from products table
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
import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

import { DATABASE_ID } from '../lib/appwrite/schema';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function up() {
  console.log('🔄 Starting migration: Remove product_code and ncm_code from products...\n');

  try {
    // Remove product_code attribute
    console.log('📝 Removing product_code attribute...');
    await databases.deleteAttribute(DATABASE_ID, 'products', 'product_code');
    console.log('✅ product_code removed');

    // Remove ncm_code attribute
    console.log('📝 Removing ncm_code attribute...');
    await databases.deleteAttribute(DATABASE_ID, 'products', 'ncm_code');
    console.log('✅ ncm_code removed');

    // Remove indexes that used these attributes
    console.log('📝 Removing old indexes...');
    try {
      await databases.deleteIndex(DATABASE_ID, 'products', 'idx_product_code');
      console.log('✅ idx_product_code removed');
    } catch (error) {
      console.log('ℹ️  idx_product_code already removed or does not exist');
    }

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  console.log('🔄 Starting rollback: Add product_code and ncm_code back to products...\n');

  try {
    // Re-add product_code attribute
    console.log('📝 Adding product_code attribute...');
    await databases.createStringAttribute(DATABASE_ID, 'products', 'product_code', 50, false);
    console.log('✅ product_code added');

    // Re-add ncm_code attribute
    console.log('📝 Adding ncm_code attribute...');
    await databases.createStringAttribute(DATABASE_ID, 'products', 'ncm_code', 20, false);
    console.log('✅ ncm_code added');

    console.log('\n✨ Rollback completed successfully!');
    console.log('ℹ️  Note: Indexes not re-created. You may need to recreate them manually if needed.');
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    throw error;
  }
}

// Run migration
const command = process.argv[2];
if (command === 'down') {
  down().catch(console.error);
} else {
  up().catch(console.error);
}
