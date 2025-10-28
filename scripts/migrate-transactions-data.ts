/**
 * Script to migrate transaction data from JSON "data" column to individual columns
 *
 * Usage: tsx scripts/migrate-transactions-data.ts
 */
import { config } from 'dotenv';
import { Client, Query, TablesDB } from 'node-appwrite';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'transactions';

// Validate required environment variables
if (!DATABASE_ID) {
  console.error('❌ Missing APPWRITE_DATABASE_ID or NEXT_PUBLIC_APPWRITE_DATABASE_ID in .env.local');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  console.error('❌ Missing NEXT_PUBLIC_APPWRITE_ENDPOINT in .env.local');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  console.error('❌ Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local');
  process.exit(1);
}

if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ Missing APPWRITE_API_KEY in .env.local');
  console.error('   This is required for server-side operations.');
  console.error('   Get your API key from: https://cloud.appwrite.io/console/project-{projectId}/settings/keys');
  process.exit(1);
}

interface TransactionData {
  category?: string;
  description?: string;
  currency?: string;
  source?: 'manual' | 'integration' | 'import';
  merchant?: string;
  tags?: string[];
  is_recurring?: boolean;
  [key: string]: any;
}

async function migrateTransactions() {
  console.log('🚀 Starting transaction data migration...\n');

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const tablesDB = new TablesDB(client);

  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let totalProcessed = 0;
    let totalMigrated = 0;
    let totalErrors = 0;

    while (hasMore) {
      console.log(`📦 Fetching transactions (offset: ${offset})...`);

      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID!,
        tableId: COLLECTION_ID,
        queries: [Query.limit(limit), Query.offset(offset)],
      });

      const transactions = response.rows;

      if (transactions.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`   Found ${transactions.length} transactions to process\n`);

      for (const transaction of transactions) {
        totalProcessed++;

        try {
          // Skip if already migrated (has category or description)
          if (transaction.category || transaction.description) {
            console.log(`   ⏭️  Skipping ${transaction.$id} (already migrated)`);
            continue;
          }

          // Parse data JSON
          let data: TransactionData = {};
          if (transaction.data) {
            try {
              data = typeof transaction.data === 'string' ? JSON.parse(transaction.data) : transaction.data;
            } catch (err) {
              console.warn(`   ⚠️  Failed to parse data for ${transaction.$id}:`, err);
            }
          }

          // Prepare update payload
          const updatePayload: any = {
            category: data.category || null,
            description: data.description || null,
            currency: data.currency || 'BRL',
            source: data.source || 'manual',
            merchant: data.merchant || null,
            tags: data.tags ? data.tags.join(',') : null,
            is_recurring: data.is_recurring || false,
          };

          // Update transaction (using TablesDB API)
          await tablesDB.updateRow({
            databaseId: DATABASE_ID!,
            tableId: COLLECTION_ID,
            rowId: transaction.$id,
            data: updatePayload,
          });

          totalMigrated++;
          console.log(`   ✅ Migrated ${transaction.$id}`);
        } catch (err: any) {
          totalErrors++;
          console.error(`   ❌ Error migrating ${transaction.$id}:`, err.message);
        }
      }

      offset += limit;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Successfully migrated: ${totalMigrated}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   Skipped (already migrated): ${totalProcessed - totalMigrated - totalErrors}`);

    if (totalErrors === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review the logs above.');
    }
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateTransactions()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  });
