/**
 * Debug the Appwrite client initialization
 */
import AppwriteDBAdapter from '@/lib/appwrite/adapter';
import { getAppwriteClient, getAppwriteDatabases } from '@/lib/appwrite/client';
import 'dotenv/config';
import { Client, TablesDB } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

async function debugClient() {
  console.log('🔍 Debugging Appwrite client...\n');
  console.log('Environment variables:');
  console.log('  APPWRITE_ENDPOINT:', process.env.APPWRITE_ENDPOINT);
  console.log('  APPWRITE_PROJECT_ID:', process.env.APPWRITE_PROJECT_ID);
  console.log('  APPWRITE_DATABASE_ID:', DATABASE_ID);
  console.log('');

  // Test 1: Direct TablesDB
  console.log('Test 1: Direct TablesDB creation');
  try {
    const client1 = new Client();
    client1
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const tablesDB1 = new TablesDB(client1);
    const adapter1 = new AppwriteDBAdapter(tablesDB1);

    const result1 = await adapter1.listDocuments(DATABASE_ID, 'credit_card_bills', []);
    console.log('✅ Direct TablesDB works! Found', result1.total, 'bills\n');
  } catch (error: any) {
    console.error('❌ Direct TablesDB failed:', error.message, '\n');
  }

  // Test 2: Using getAppwriteDatabases()
  console.log('Test 2: Using getAppwriteDatabases()');
  try {
    const adapter2 = getAppwriteDatabases();
    const result2 = await adapter2.listDocuments(DATABASE_ID, 'credit_card_bills', []);
    console.log('✅ getAppwriteDatabases() works! Found', result2.total, 'bills\n');
  } catch (error: any) {
    console.error('❌ getAppwriteDatabases() failed:', error.message);
    console.error('   Type:', error.type);
    console.error('   Code:', error.code, '\n');
  }

  // Test 3: Check if client is properly configured
  console.log('Test 3: Checking client configuration');
  try {
    const client3 = getAppwriteClient();
    console.log('✅ Client retrieved');
    // Try to inspect the client config (if possible)
    console.log('   Client config:', JSON.stringify((client3 as any).config, null, 2));
  } catch (error: any) {
    console.error('❌ Failed to get client:', error.message);
  }
}

debugClient();
