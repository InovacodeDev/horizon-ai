#!/usr/bin/env tsx

/**
 * Script to delete the invoices table (cleanup after failed migration)
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

async function deleteInvoicesTable() {
  try {
    console.log('Deleting invoices table...');
    await databases.deleteTable({
      databaseId,
      tableId: 'invoices',
    });
    console.log('✅ Invoices table deleted successfully');
  } catch (error: any) {
    if (error.code === 404) {
      console.log('ℹ️  Invoices table does not exist');
    } else {
      console.error('❌ Error deleting invoices table:', error.message);
      throw error;
    }
  }
}

deleteInvoicesTable();
