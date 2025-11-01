/**
 * Migration Script: Add 'salary' type to transactions
 *
 * This script updates the Appwrite database schema to include
 * the new 'salary' transaction type.
 *
 * Usage:
 *   npx tsx scripts/migrate-add-salary-type.ts
 */
import * as dotenv from 'dotenv';
import { Client, Databases } from 'node-appwrite';

// Load environment variables
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'horizon_ai_db';
const COLLECTION_ID = 'transactions';

async function migrateAddSalaryType() {
  try {
    console.log('🚀 Starting migration: Add salary type to transactions');
    console.log(`📊 Database: ${DATABASE_ID}`);
    console.log(`📦 Collection: ${COLLECTION_ID}`);
    console.log('');

    // Note: Appwrite doesn't support updating enum attributes directly via SDK
    // You need to do this manually in the Appwrite Console or via CLI

    console.log('⚠️  MANUAL STEPS REQUIRED:');
    console.log('');
    console.log('1. Open Appwrite Console: https://cloud.appwrite.io/console');
    console.log(`2. Navigate to Database: ${DATABASE_ID}`);
    console.log(`3. Open Collection: ${COLLECTION_ID}`);
    console.log('4. Find the "type" attribute');
    console.log('5. Click "Update Attribute"');
    console.log('6. Add "salary" to the enum elements list');
    console.log('   Current: income, expense, transfer');
    console.log('   New: income, expense, transfer, salary');
    console.log('7. Save the changes');
    console.log('');
    console.log('OR use Appwrite CLI:');
    console.log('');
    console.log('appwrite databases updateAttribute \\');
    console.log(`  --databaseId="${DATABASE_ID}" \\`);
    console.log(`  --collectionId="${COLLECTION_ID}" \\`);
    console.log('  --key="type" \\');
    console.log('  --elements="income,expense,transfer,salary"');
    console.log('');

    // Verify the collection exists
    try {
      const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log('✅ Collection found:', collection.name);
      console.log('');

      // List attributes to verify
      const attributes = collection.attributes || [];
      const typeAttribute = attributes.find((attr: any) => attr.key === 'type');

      if (typeAttribute) {
        console.log('📋 Current "type" attribute configuration:');
        console.log('   Type:', typeAttribute.type);
        console.log('   Elements:', typeAttribute.elements || 'N/A');
        console.log('');

        if (typeAttribute.elements && typeAttribute.elements.includes('salary')) {
          console.log('✅ Migration already applied! "salary" type exists.');
        } else {
          console.log('⚠️  Migration needed. Please follow the manual steps above.');
        }
      } else {
        console.log('❌ "type" attribute not found in collection');
      }
    } catch (error: any) {
      console.error('❌ Error accessing collection:', error.message);
      console.log('');
      console.log('Please verify:');
      console.log('1. APPWRITE_API_KEY is set correctly');
      console.log('2. Database and collection IDs are correct');
      console.log('3. API key has proper permissions');
    }

    console.log('');
    console.log('📚 Documentation:');
    console.log('   See docs/SALARY_TRANSACTIONS.md for usage details');
    console.log('');
    console.log('✨ Migration script completed');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateAddSalaryType();
