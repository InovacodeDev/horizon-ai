/**
 * Test Script for Expire Invitations Function
 *
 * This script helps test the function by:
 * 1. Creating test invitations with past expiration dates
 * 2. Executing the function
 * 3. Verifying invitations were expired
 *
 * Usage:
 *   ts-node test-function.ts
 *
 * Environment variables required:
 *   APPWRITE_ENDPOINT
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 *   APPWRITE_DATABASE_ID
 */
import { Client, ID, Query, TablesDB } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const COLLECTION_ID = 'sharing_invitations';

interface TestInvitation {
  responsible_user_id: string;
  invited_email: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

async function initializeClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const databases = new TablesDB(client);
  return { client, databases };
}

async function createTestInvitations(databases: TablesDB, count: number = 5): Promise<string[]> {
  console.log(`\n📝 Creating ${count} test invitations with past expiration dates...`);

  const pastDate = new Date('2024-01-01T00:00:00.000Z').toISOString();
  const invitationIds: string[] = [];

  for (let i = 1; i <= count; i++) {
    const invitation: TestInvitation = {
      responsible_user_id: 'test-user-123',
      invited_email: `test${i}@example.com`,
      token: `test-token-${String(i).padStart(3, '0')}`,
      status: 'pending',
      expires_at: pastDate,
      created_at: pastDate,
      updated_at: pastDate,
    };

    try {
      const doc = await databases.createRow({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        rowId: ID.unique(),
        data: invitation,
      });
      invitationIds.push(doc.$id);
      console.log(`  ✓ Created invitation ${i}/${count}: ${doc.$id}`);
    } catch (error: any) {
      console.error(`  ✗ Failed to create invitation ${i}:`, error.message);
    }
  }

  console.log(`✅ Created ${invitationIds.length} test invitations\n`);
  return invitationIds;
}

async function verifyInvitations(databases: TablesDB, invitationIds: string[]): Promise<void> {
  console.log(`\n🔍 Verifying invitation statuses...`);

  let expiredCount = 0;
  let pendingCount = 0;

  for (const id of invitationIds) {
    try {
      const doc = await databases.getRow({ databaseId: DATABASE_ID, tableId: COLLECTION_ID, rowId: id });
      if (doc.status === 'expired') {
        expiredCount++;
        console.log(`  ✓ Invitation ${id}: expired`);
      } else if (doc.status === 'pending') {
        pendingCount++;
        console.log(`  ⚠ Invitation ${id}: still pending`);
      } else {
        console.log(`  ? Invitation ${id}: ${doc.status}`);
      }
    } catch (error: any) {
      console.error(`  ✗ Failed to get invitation ${id}:`, error.message);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  - Expired: ${expiredCount}`);
  console.log(`  - Pending: ${pendingCount}`);
  console.log(`  - Total: ${invitationIds.length}`);

  if (expiredCount === invitationIds.length) {
    console.log(`\n✅ All invitations were successfully expired!`);
  } else if (pendingCount === invitationIds.length) {
    console.log(`\n⚠️  No invitations were expired. Did you run the function?`);
  } else {
    console.log(`\n⚠️  Some invitations were not expired.`);
  }
}

async function cleanupTestInvitations(databases: TablesDB): Promise<void> {
  console.log(`\n🧹 Cleaning up test invitations...`);

  try {
    const result = await databases.listRows({
      databaseId: DATABASE_ID,
      tableId: COLLECTION_ID,
      queries: [Query.startsWith('invited_email', 'test'), Query.limit(100)],
    });

    for (const doc of result.rows) {
      try {
        await databases.deleteRow({ databaseId: DATABASE_ID, tableId: COLLECTION_ID, rowId: doc.$id });
        console.log(`  ✓ Deleted invitation: ${doc.$id}`);
      } catch (error: any) {
        console.error(`  ✗ Failed to delete ${doc.$id}:`, error.message);
      }
    }

    console.log(`✅ Cleaned up ${result.rows.length} test invitations\n`);
  } catch (error: any) {
    console.error(`✗ Cleanup failed:`, error.message);
  }
}

async function main() {
  console.log('🚀 Expire Invitations Function - Test Script\n');
  console.log('='.repeat(50));

  // Check environment variables
  if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - APPWRITE_ENDPOINT');
    console.error('   - APPWRITE_PROJECT_ID');
    console.error('   - APPWRITE_API_KEY');
    console.error('   - APPWRITE_DATABASE_ID (optional, defaults to horizon_ai_db)');
    process.exit(1);
  }

  const { databases } = await initializeClient();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'create':
      const count = parseInt(args[1]) || 5;
      await createTestInvitations(databases, count);
      console.log('\n📝 Next steps:');
      console.log('   1. Go to Appwrite Console');
      console.log('   2. Navigate to Functions > Expire Invitations');
      console.log('   3. Click "Execute Now"');
      console.log('   4. Run: ts-node test-function.ts verify');
      break;

    case 'verify':
      console.log('\n⚠️  Note: This will verify ALL test invitations in the database');
      const allInvitations = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [Query.startsWith('invited_email', 'test'), Query.limit(100)],
      });
      const ids = allInvitations.rows.map((doc) => doc.$id);
      if (ids.length === 0) {
        console.log('\n⚠️  No test invitations found. Run: ts-node test-function.ts create');
      } else {
        await verifyInvitations(databases, ids);
      }
      break;

    case 'cleanup':
      await cleanupTestInvitations(databases);
      break;

    case 'full-test':
      console.log('\n🧪 Running full test cycle...\n');

      // Step 1: Create test invitations
      const testIds = await createTestInvitations(databases, 5);

      // Step 2: Wait for user to execute function
      console.log('⏸️  Please execute the function in Appwrite Console now.');
      console.log('   Press Enter when done...');
      await new Promise((resolve) => {
        process.stdin.once('data', resolve);
      });

      // Step 3: Verify results
      await verifyInvitations(databases, testIds);

      // Step 4: Cleanup
      console.log('\n🧹 Cleanup test data? (y/n)');
      const cleanup = await new Promise<string>((resolve) => {
        process.stdin.once('data', (data) => resolve(data.toString().trim()));
      });

      if (cleanup.toLowerCase() === 'y') {
        await cleanupTestInvitations(databases);
      }
      break;

    case 'help':
    default:
      console.log('\n📖 Usage:');
      console.log('   ts-node test-function.ts <command> [options]\n');
      console.log('Commands:');
      console.log('   create [count]  - Create test invitations (default: 5)');
      console.log('   verify          - Verify invitation statuses');
      console.log('   cleanup         - Delete all test invitations');
      console.log('   full-test       - Run complete test cycle');
      console.log('   help            - Show this help message\n');
      console.log('Examples:');
      console.log('   ts-node test-function.ts create 10');
      console.log('   ts-node test-function.ts verify');
      console.log('   ts-node test-function.ts cleanup');
      console.log('   ts-node test-function.ts full-test\n');
      break;
  }

  console.log('='.repeat(50));
  console.log('✨ Done!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
