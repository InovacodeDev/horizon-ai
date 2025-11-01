/**
 * Check migration 014 status and re-run if needed
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { DATABASE_ID } from '@/lib/appwrite/schema';
import 'dotenv/config';
import { Query } from 'node-appwrite';

async function checkMigration() {
  try {
    const databases = getAppwriteDatabases();

    console.log('🔍 Checking migration 20251027_000014 status...\n');

    // Check migrations table
    const migrations = await databases.listDocuments(DATABASE_ID, 'migrations', [
      Query.equal('migration_id', '20251027_000014'),
    ]);

    if (migrations.total > 0) {
      const migration = migrations.documents[0];
      console.log('✅ Migration 20251027_000014 is recorded as applied');
      console.log(`   Applied at: ${migration.applied_at}`);
      console.log(`   Description: ${migration.description}`);
      console.log('\n⚠️  But the tables are missing!');
      console.log('   This means the migration partially failed or tables were deleted.');
      console.log('\n🔧 Solution: Manually re-run the migration');
      console.log('   The migration needs to be re-executed to create the missing tables.');
    } else {
      console.log('❌ Migration 20251027_000014 is NOT recorded');
      console.log('   But migrate:status shows it as applied - tracking is out of sync!');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMigration();
