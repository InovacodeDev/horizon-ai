/**
 * Migration: Create credit_card_transactions table
 * Created: 2025-10-29
 *
 * Separate table for credit card transactions to keep them independent from account transactions.
 * This table is used to:
 * - Track credit card purchases
 * - Calculate used credit limit
 * - Generate credit card bills
 * - Manage installments and recurring charges
 *
 * Account transactions (transactions table) are only affected when bills are paid.
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTION_ID = 'credit_card_transactions';

export const migration: Migration = {
  id: '20251029_000018',
  description: 'Create credit_card_transactions table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating credit_card_transactions table...');

    // Create table
    await databases.createTable({
      databaseId,
      tableId: COLLECTION_ID,
      name: 'Credit Card Transactions',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating columns...');

    // user_id - Reference to user
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'user_id',
      size: 255,
      required: true,
    });

    // credit_card_id - Reference to credit card
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'credit_card_id',
      size: 255,
      required: true,
    });

    // amount - Transaction amount
    await databases.createFloatColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'amount',
      required: true,
    });

    // date - Transaction date (bill due date for installments)
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'date',
      required: true,
    });

    // purchase_date - Original purchase date
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'purchase_date',
      required: true,
    });

    // category
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'category',
      size: 100,
      required: false,
    });

    // description
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'description',
      size: 500,
      required: false,
    });

    // merchant
    await databases.createStringColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'merchant',
      size: 255,
      required: false,
    });

    // installment - Current installment number
    await databases.createIntegerColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'installment',
      required: false,
      min: 1,
    });

    // installments - Total number of installments
    await databases.createIntegerColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'installments',
      required: false,
      min: 1,
    });

    // is_recurring - Is this a recurring subscription?
    await databases.createBooleanColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'is_recurring',
      required: false,
      default: false,
    });

    // status - Transaction status
    await databases.createEnumColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'status',
      elements: ['pending', 'completed', 'cancelled'],
      required: true,
    });

    // created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'created_at',
      required: true,
    });

    // updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index: user_id
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index: credit_card_id
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_credit_card_id',
      type: IndexType.Key,
      columns: ['credit_card_id'],
      orders: ['ASC'],
    });

    // Index: date
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_date',
      type: IndexType.Key,
      columns: ['date'],
      orders: ['DESC'],
    });

    // Index: purchase_date
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_purchase_date',
      type: IndexType.Key,
      columns: ['purchase_date'],
      orders: ['DESC'],
    });

    // Index: category
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_category',
      type: IndexType.Key,
      columns: ['category'],
    });

    // Index: status
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_status',
      type: IndexType.Key,
      columns: ['status'],
    });

    // Index: installments (for filtering installment transactions)
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_installments',
      type: IndexType.Key,
      columns: ['installments'],
      orders: ['ASC'],
    });

    // Index: is_recurring (for filtering recurring subscriptions)
    await databases.createIndex({
      databaseId,
      tableId: COLLECTION_ID,
      key: 'idx_is_recurring',
      type: IndexType.Key,
      columns: ['is_recurring'],
    });

    console.log('✅ credit_card_transactions table created successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping credit_card_transactions table...');

    await databases.deleteTable({
      databaseId,
      tableId: COLLECTION_ID,
    });

    console.log('✅ credit_card_transactions table dropped successfully');
  },
};
