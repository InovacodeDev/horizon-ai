/**
 * Migration: Migrate credit card transactions to new table
 * Created: 2025-10-29
 *
 * Migrates all transactions with credit_card_id from transactions table
 * to the new credit_card_transactions table, then removes credit card
 * related columns from transactions table.
 */
import { Query } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251029_000019',
  description: 'Migrate credit card transactions to new table and cleanup',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Migrating credit card transactions...');

    // Step 1: Fetch all transactions with credit_card_id
    const transactionsResult = await databases.listRows({databaseId, tableId: 'transactions', queries: [Query.limit(10000)]});

    const transactions = transactionsResult.rows;
    let migratedCount = 0;
    let skippedCount = 0;

    console.log(`Found ${transactions.length} total transactions`);

    // Step 2: Migrate transactions with credit_card_id
    for (const transaction of transactions) {
      // Skip if no credit_card_id
      if (!transaction.credit_card_id) {
        skippedCount++;
        continue;
      }

      try {
        // Create in credit_card_transactions
        await databases.createRow({
          databaseId,
          tableId: 'credit_card_transactions',
          rowId: transaction.$id, // Keep same ID
          data: {
            user_id: transaction.user_id,
            credit_card_id: transaction.credit_card_id,
            amount: transaction.amount,
            date: transaction.date,
            purchase_date: transaction.credit_card_transaction_created_at || transaction.date,
            category: transaction.category,
            description: transaction.description,
            merchant: transaction.merchant,
            installment: transaction.installment,
            installments: transaction.installments,
            is_recurring: transaction.is_recurring || false,
            status: transaction.status,
            created_at: transaction.created_at,
            updated_at: transaction.updated_at,
          },
        });

        // Delete from transactions
        await databases.deleteRow({ databaseId, tableId: 'transactions', rowId: transaction.$id });

        migratedCount++;

        if (migratedCount % 10 === 0) {
          console.log(`Migrated ${migratedCount} transactions...`);
        }
      } catch (error: any) {
        console.error(`Error migrating transaction ${transaction.$id}:`, error.message);
      }
    }

    console.log(`✅ Migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);

    // Step 3: Remove old columns from transactions table
    console.log('Removing old columns from transactions table...');

    try {
      await databases.deleteColumn({
        databaseId,
        tableId: 'transactions',
        key: 'credit_card_id',
      });
      console.log('✅ Removed credit_card_id column');
    } catch (error: any) {
      console.warn('Could not remove credit_card_id:', error.message);
    }

    try {
      await databases.deleteColumn({
        databaseId,
        tableId: 'transactions',
        key: 'installment',
      });
      console.log('✅ Removed installment column');
    } catch (error: any) {
      console.warn('Could not remove installment:', error.message);
    }

    try {
      await databases.deleteColumn({
        databaseId,
        tableId: 'transactions',
        key: 'installments',
      });
      console.log('✅ Removed installments column');
    } catch (error: any) {
      console.warn('Could not remove installments:', error.message);
    }

    try {
      await databases.deleteColumn({
        databaseId,
        tableId: 'transactions',
        key: 'credit_card_transaction_created_at',
      });
      console.log('✅ Removed credit_card_transaction_created_at column');
    } catch (error: any) {
      console.warn('Could not remove credit_card_transaction_created_at:', error.message);
    }

    // Remove indexes related to credit card
    try {
      await databases.deleteIndex({
        databaseId,
        tableId: 'transactions',
        key: 'idx_credit_card_id',
      });
      console.log('✅ Removed idx_credit_card_id index');
    } catch (error: any) {
      console.warn('Could not remove idx_credit_card_id:', error.message);
    }

    console.log('✅ Cleanup complete!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Reverting credit card transaction migration...');

    // This is a destructive migration, down migration would need to:
    // 1. Re-add columns to transactions
    // 2. Move data back from credit_card_transactions to transactions
    // 3. Delete from credit_card_transactions

    console.warn('⚠️  Down migration not fully implemented - data would need manual restoration');
    console.log('To revert, you would need to:');
    console.log('1. Re-add credit_card_id, installment, installments columns to transactions');
    console.log('2. Copy data from credit_card_transactions back to transactions');
    console.log('3. Delete records from credit_card_transactions');
  },
};
