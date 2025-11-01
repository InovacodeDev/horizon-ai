/**
 * Manually recreate the credit_card_bills table
 */
import 'dotenv/config';
import { Client, IndexType, TablesDB } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

async function recreateTable() {
  try {
    const client = new Client();
    client
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new TablesDB(client);

    console.log('🔧 Recreating credit_card_bills table...\n');

    // Create credit_card_bills table
    console.log('Creating table...');
    await databases.createTable({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      name: 'Credit Card Bills',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('✅ Table created\n');
    console.log('Creating columns...');

    // Create columns
    await (databases as any).createStringColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'credit_card_id',
      size: 255,
      required: true,
    });

    await (databases as any).createStringColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'user_id',
      size: 255,
      required: true,
    });

    await (databases as any).createDatetimeColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'due_date',
      required: true,
    });

    await (databases as any).createDatetimeColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'closing_date',
      required: true,
    });

    await (databases as any).createFloatColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'total_amount',
      required: true,
    });

    await (databases as any).createFloatColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'paid_amount',
      required: true,
    });

    await (databases as any).createEnumColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'status',
      elements: ['open', 'closed', 'paid', 'overdue'],
      required: true,
    });

    await (databases as any).createDatetimeColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'created_at',
      required: true,
    });

    await (databases as any).createDatetimeColumn({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'updated_at',
      required: true,
    });

    console.log('✅ Columns created\n');
    console.log('Waiting for attributes to be available...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Creating indexes...');

    await (databases as any).createIndex({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'idx_credit_card_id',
      type: IndexType.Key,
      columns: ['credit_card_id'],
    });

    await (databases as any).createIndex({
      databaseId: DATABASE_ID,
      tableId: 'credit_card_bills',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
    });

    console.log('✅ Indexes created\n');
    console.log('🎉 credit_card_bills table successfully recreated!');
    console.log('\nYou can now use the /api/credit-cards/bills endpoint.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

recreateTable();
