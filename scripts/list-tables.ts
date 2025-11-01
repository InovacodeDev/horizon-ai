/**
 * List all tables in the database
 */
import 'dotenv/config';
import { Client, TablesDB } from 'node-appwrite';

async function listTables() {
  try {
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const databaseId = process.env.APPWRITE_DATABASE_ID;

    if (!endpoint || !projectId || !apiKey || !databaseId) {
      throw new Error('Missing Appwrite configuration');
    }

    const client = new Client();
    client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

    const tables = new TablesDB(client);

    console.log('🔍 Listing all tables in database...\n');
    console.log(`Database ID: ${databaseId}\n`);

    const tablesList = await tables.listTables({ databaseId });

    if (tablesList.total === 0) {
      console.log('❌ No tables found in this database!');
      console.log('\n💡 Run migrations to create tables:');
      console.log('   npm run migrate:up');
    } else {
      console.log(`✅ Found ${tablesList.total} table(s):\n`);
      tablesList.tables.forEach((table: any) => {
        console.log(`   📋 ${table.name}`);
        console.log(`      ID: ${table.$id}`);
        console.log(`      Enabled: ${table.enabled}`);
        console.log(`      Row Security: ${table.rowSecurity}`);
        console.log('');
      });

      // Check for credit_card_bills
      const hasBillsTable = tablesList.tables.some((table: any) => table.$id === 'credit_card_bills');
      if (!hasBillsTable) {
        console.log('⚠️  credit_card_bills table is missing!');
        console.log('   This table should have been created by migration 20251027_000014');
        console.log('\n🔧 To fix:');
        console.log('   1. Check migration status: npm run migrate:status');
        console.log('   2. If migration shows as applied, the table may have been deleted');
        console.log('   3. You can manually create it via Appwrite Console or re-run migrations');
      } else {
        console.log('✅ credit_card_bills table exists!');
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

listTables();
