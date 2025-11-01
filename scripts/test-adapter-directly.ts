/**
 * Test the adapter directly
 */
import AppwriteDBAdapter from '@/lib/appwrite/adapter';
import 'dotenv/config';
import { Client, TablesDB } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

async function testAdapter() {
  try {
    console.log('Testing adapter...\n');
    console.log('Database ID:', DATABASE_ID);
    console.log('');

    const client = new Client();
    client
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const tablesDB = new TablesDB(client);
    const adapter = new AppwriteDBAdapter(tablesDB);

    console.log('Attempting to list documents from credit_card_bills...');
    const result = await adapter.listDocuments(DATABASE_ID, 'credit_card_bills', []);

    console.log('✅ Success!');
    console.log(`Found ${result.total} bills`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Type:', error.type);
    console.error('Code:', error.code);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testAdapter();
