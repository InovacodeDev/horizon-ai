/**
 * Migration: Create Credit Card Bills and Installments Tables
 * Created: 2025-10-27
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  CREDIT_CARD_BILLS: 'credit_card_bills',
  INSTALLMENT_PLANS: 'installment_plans',
  CREDIT_CARD_TRANSACTIONS: 'credit_card_transactions',
};

export const migration: Migration = {
  id: '20251027_000014',
  description: 'Create credit card bills and installments tables',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating credit card bills and installments tables...');

    // Create credit_card_bills table
    await databases.createCollection(
      databaseId,
      COLLECTIONS.CREDIT_CARD_BILLS,
      'Credit Card Bills',
      ['read("any")', 'write("any")'],
      true,
    );

    // Create installment_plans table
    await databases.createCollection(
      databaseId,
      COLLECTIONS.INSTALLMENT_PLANS,
      'Installment Plans',
      ['read("any")', 'write("any")'],
      true,
    );

    // Create credit_card_transactions table
    await databases.createCollection(
      databaseId,
      COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      'Credit Card Transactions',
      ['read("any")', 'write("any")'],
      true,
    );

    console.log('Creating credit_card_bills columns...');

    // Credit Card Bills columns
    await databases.createStringAttribute(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'credit_card_id', 255, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'user_id', 255, true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'due_date', true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'closing_date', true);
    await databases.createFloatAttribute(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'total_amount', true);
    await databases.createFloatAttribute(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'paid_amount', true);
    await databases.createEnumAttribute(
      databaseId,
      COLLECTIONS.CREDIT_CARD_BILLS,
      'status',
      ['open', 'closed', 'paid', 'overdue'],
      true,
    );
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'created_at', true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'updated_at', true);

    console.log('Creating installment_plans columns...');

    // Installment Plans columns
    await databases.createStringAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'transaction_id', 255, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'credit_card_id', 255, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'user_id', 255, true);
    await databases.createFloatAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'total_amount', true);
    await databases.createIntegerAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'installments', true);
    await databases.createIntegerAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'current_installment', true);
    await databases.createFloatAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'installment_amount', true);
    await databases.createFloatAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'first_installment_amount', true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'start_date', true);
    await databases.createEnumAttribute(
      databaseId,
      COLLECTIONS.INSTALLMENT_PLANS,
      'status',
      ['active', 'completed', 'cancelled'],
      true,
    );
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'created_at', true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'updated_at', true);

    console.log('Creating credit_card_transactions columns...');

    // Credit Card Transactions columns
    await databases.createStringAttribute(
      databaseId,
      COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      'transaction_id',
      255,
      true,
    );
    await databases.createStringAttribute(
      databaseId,
      COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      'credit_card_bill_id',
      255,
      true,
    );
    await databases.createStringAttribute(
      databaseId,
      COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      'installment_plan_id',
      255,
      false,
    );
    await databases.createFloatAttribute(databaseId, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, 'amount', true);
    await databases.createIntegerAttribute(
      databaseId,
      COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      'installment_number',
      false,
    );
    await databases.createStringAttribute(databaseId, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, 'description', 500, true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, 'date', true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, 'created_at', true);

    console.log('Waiting for attributes to be available...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Creating indexes...');

    // Credit Card Bills indexes
    await databases.createIndex(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'idx_credit_card_id', IndexType.Key, [
      'credit_card_id',
    ]);
    await databases.createIndex(databaseId, COLLECTIONS.CREDIT_CARD_BILLS, 'idx_user_id', IndexType.Key, ['user_id']);

    // Installment Plans indexes
    await databases.createIndex(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'idx_transaction_id', IndexType.Key, [
      'transaction_id',
    ]);
    await databases.createIndex(databaseId, COLLECTIONS.INSTALLMENT_PLANS, 'idx_credit_card_id', IndexType.Key, [
      'credit_card_id',
    ]);

    // Credit Card Transactions indexes
    await databases.createIndex(databaseId, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, 'idx_bill_id', IndexType.Key, [
      'credit_card_bill_id',
    ]);
    await databases.createIndex(
      databaseId,
      COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      'idx_installment_plan_id',
      IndexType.Key,
      ['installment_plan_id'],
    );

    console.log('✅ Credit card bills and installments tables created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping credit card bills and installments tables...');

    await databases.deleteCollection(databaseId, COLLECTIONS.CREDIT_CARD_TRANSACTIONS);
    await databases.deleteCollection(databaseId, COLLECTIONS.INSTALLMENT_PLANS);
    await databases.deleteCollection(databaseId, COLLECTIONS.CREDIT_CARD_BILLS);

    console.log('✅ Credit card bills and installments tables dropped');
  },
};
