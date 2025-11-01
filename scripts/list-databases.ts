/**
 * List all databases in the Appwrite project
 */
import 'dotenv/config';
import { Client, TablesDB } from 'node-appwrite';

async function listDatabases() {
  try {
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!endpoint || !projectId || !apiKey) {
      throw new Error('Missing Appwrite configuration');
    }

    const client = new Client();
    client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

    const tables = new TablesDB(client);

    console.log('🔍 Listing all databases in project...\n');
    console.log(`Project ID: ${projectId}`);
    console.log(`Endpoint: ${endpoint}\n`);

    const databases = await tables.list();

    if (databases.total === 0) {
      console.log('❌ No databases found in this project!');
      console.log('\n💡 You need to create a database first.');
      console.log('   Run: npm run migrate:up');
      console.log('   This will create the database and all tables.');
    } else {
      console.log(`✅ Found ${databases.total} database(s):\n`);
      databases.databases.forEach((db: any) => {
        console.log(`   📦 ${db.name}`);
        console.log(`      ID: ${db.$id}`);
        console.log(`      Created: ${db.$createdAt}`);
        console.log(`      Updated: ${db.$updatedAt}`);
        console.log('');
      });

      const expectedDbId = process.env.APPWRITE_DATABASE_ID;
      const dbExists = databases.databases.some((db: any) => db.$id === expectedDbId);

      if (!dbExists) {
        console.log(`⚠️  Expected database ID "${expectedDbId}" not found!`);
        console.log('   Update your .env.local with one of the database IDs above,');
        console.log('   or run migrations to create a new database.');
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

listDatabases();
