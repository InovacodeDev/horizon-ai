#!/usr/bin/env tsx

/**
 * Script to delete the products table (cleanup after failed migration)
 */
import * as dotenv from 'dotenv';
import { Client, TablesDB } from 'node-appwrite';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new TablesDB(client);
const databaseId = process.env.APPWRITE_DATABASE_ID!;

async function deleteProductsTable() {
  try {
    console.log('Deleting products table...');
    await databases.deleteTable({
      databaseId,
      tableId: 'products',
    });
    console.log('✅ Products table deleted successfully');
  } catch (error: any) {
    if (error.code === 404) {
      console.log('ℹ️  Products table does not exist');
    } else {
      console.error('❌ Error deleting products table:', error.message);
      throw error;
    }
  }
}

deleteProductsTable();
