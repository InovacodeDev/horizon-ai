/**
 * Verify if credit_card_bills table exists
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import 'dotenv/config';

async function verifyTable() {
  try {
    console.log('🔍 Checking if credit_card_bills table exists...\n');

    const databases = getAppwriteDatabases();

    // Try to query the credit_card_bills table
    try {
      const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARD_BILLS, []);
      console.log('✅ credit_card_bills table exists!');
      console.log(`   Found ${result.total} bills in the table`);
    } catch (error: any) {
      if (error.code === 404 && error.type === 'table_not_found') {
        console.log('❌ credit_card_bills table NOT found!');
        console.log('\n💡 The migration shows as applied but the table is missing.');
        console.log('   This can happen if:');
        console.log('   1. The migration was run against a different database');
        console.log('   2. The table was manually deleted');
        console.log('   3. The migration tracking is out of sync');
        console.log('\n🔧 To fix this:');
        console.log('   Run: npm run migrate:reset');
        console.log('   Then: npm run migrate:up');
      } else {
        console.error('❌ Error checking table:', error.message);
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyTable();
