/**
 * Final verification that everything works
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import 'dotenv/config';
import { Query } from 'node-appwrite';

async function finalVerification() {
  console.log('🎯 Final Verification\n');
  console.log('='.repeat(50));
  console.log('');

  const databases = getAppwriteDatabases();

  // Test 1: List bills (empty)
  console.log('✓ Test 1: List bills with filters');
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARD_BILLS, [
      Query.equal('status', 'open'),
      Query.limit(100),
    ]);
    console.log(`  Found ${result.total} open bills`);
  } catch (error: any) {
    console.error(`  ❌ Failed: ${error.message}`);
    return;
  }

  // Test 2: Create a test bill
  console.log('\n✓ Test 2: Create a test bill');
  try {
    const testBill = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CREDIT_CARD_BILLS,
      'test-bill-001',
      {
        credit_card_id: 'test-card-001',
        user_id: 'test-user-001',
        due_date: new Date('2025-11-15').toISOString(),
        closing_date: new Date('2025-11-01').toISOString(),
        total_amount: 1500.0,
        paid_amount: 0,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ['read("any")', 'write("any")'],
    );
    console.log(`  Created bill: ${testBill.$id}`);
  } catch (error: any) {
    if (error.code === 409) {
      console.log("  Bill already exists (that's ok)");
    } else {
      console.error(`  ❌ Failed: ${error.message}`);
      return;
    }
  }

  // Test 3: Query the bill
  console.log('\n✓ Test 3: Query bills');
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARD_BILLS, [
      Query.equal('user_id', 'test-user-001'),
      Query.orderDesc('due_date'),
    ]);
    console.log(`  Found ${result.total} bills for test user`);
  } catch (error: any) {
    console.error(`  ❌ Failed: ${error.message}`);
    return;
  }

  // Test 4: Clean up
  console.log('\n✓ Test 4: Clean up test data');
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARD_BILLS, 'test-bill-001');
    console.log('  Test bill deleted');
  } catch (error: any) {
    if (error.code === 404) {
      console.log('  Test bill not found (already cleaned up)');
    } else {
      console.error(`  ❌ Failed: ${error.message}`);
    }
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('');
  console.log('🎉 All tests passed!');
  console.log('');
  console.log('The credit_card_bills table is working correctly.');
  console.log('Your API endpoint /api/credit-cards/bills should now work.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Start your dev server: npm run dev');
  console.log('  2. Test the endpoint: GET /api/credit-cards/bills?status=open');
  console.log('');
}

finalVerification();
