/**
 * Migration: Add installment columns to transactions
 * Created: 2025-10-29
 *
 * Adds columns for installment control and credit card purchase date:
 * - installment: current installment number (e.g., 1, 2, 3)
 * - installments: total number of installments (e.g., 12 for 12x)
 * - credit_card_transaction_created_at: original purchase date on credit card
 *
 * Note: The 'date' field will store the bill due date for credit card transactions
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTION_ID = 'transactions';

export const migration: Migration = {
  id: '20251029_000017',
  description: 'Add installment and credit card purchase date columns to transactions',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Adding installment columns to transactions table...');

    // Add installment column (current installment number)
    console.log('Creating installment attribute...');
    await databases.createIntegerColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'installment',
      required: false,
      min: 1,
    });

    console.log('Waiting for installment attribute to be available...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add installments column (total number of installments)
    console.log('Creating installments attribute...');
    await databases.createIntegerColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'installments',
      required: false,
      min: 1,
    });

    console.log('Waiting for installments attribute to be available...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add credit_card_transaction_created_at column (original purchase date)
    console.log('Creating credit_card_transaction_created_at attribute...');
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'credit_card_transaction_created_at',
      required: false,
    });

    console.log('Waiting for credit_card_transaction_created_at attribute to be available...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create index for installments queries
    console.log('Creating index for installments...');
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_installments',
      type: IndexType.Key,
      columns: ['installments'],
      orders: ['ASC'],
    });

    console.log('✅ Installment columns added successfully');
    console.log('📝 Note: installment = current installment (1, 2, 3...)');
    console.log('📝 Note: installments = total installments (12 for 12x)');
    console.log('📝 Note: credit_card_transaction_created_at = original purchase date');
    console.log('📝 Note: date field = bill due date for credit card transactions');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Removing installment columns from transactions table...');

    // Delete index first
    try {
      await (databases as any).deleteIndex({
        databaseId,
        tableId: COLLECTION_ID,
        key: 'idx_installments',
      });
    } catch (err) {
      console.warn('Index may not exist:', err);
    }

    // Delete columns
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'credit_card_transaction_created_at',
    });

    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'installments',
    });

    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'installment',
    });

    console.log('✅ Installment columns removed successfully');
  },
};
