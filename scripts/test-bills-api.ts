/**
 * Test the bills API endpoint logic
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import 'dotenv/config';
import { Query } from 'node-appwrite';

async function testBillsAPI() {
  try {
    console.log('🧪 Testing bills API logic...\n');

    const databases = getAppwriteDatabases();
    const queries: any[] = [Query.equal('user_id', 'test-user-id'), Query.orderDesc('due_date'), Query.limit(100)];

    console.log('Querying credit_card_bills table...');
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARD_BILLS, queries);

    console.log('✅ API logic works!');
    console.log(`Found ${response.total} bills`);
    console.log('\n🎉 The /api/credit-cards/bills endpoint should now work!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Type:', error.type);
    console.error('Code:', error.code);

    if (error.type === 'database_not_found') {
      console.log('\n⚠️  Still getting database_not_found error');
      console.log('   This might be a caching issue with the Appwrite client');
      console.log('   Try restarting your dev server');
    }
  }
}

testBillsAPI();
