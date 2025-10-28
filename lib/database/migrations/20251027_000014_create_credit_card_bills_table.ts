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
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      name: 'Credit Card Bills',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    // Create installment_plans table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      name: 'Installment Plans',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    // Create credit_card_transactions table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      name: 'Credit Card Transactions',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating credit_card_bills columns...');

    // Credit Card Bills columns
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'credit_card_id',
      size: 255,
      required: true,
    });
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'user_id',
      size: 255,
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'due_date',
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'closing_date',
      required: true,
    });
    await (databases as any).createFloatAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'total_amount',
      required: true,
    });
    await (databases as any).createFloatAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'paid_amount',
      required: true,
    });
    await (databases as any).createEnumAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'status',
      elements: ['open', 'closed', 'paid', 'overdue'],
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'created_at',
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'updated_at',
      required: true,
    });

    console.log('Creating installment_plans columns...');

    // Installment Plans columns
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'transaction_id',
      size: 255,
      required: true,
    });
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'credit_card_id',
      size: 255,
      required: true,
    });
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'user_id',
      size: 255,
      required: true,
    });
    await (databases as any).createFloatAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'total_amount',
      required: true,
    });
    await (databases as any).createIntegerAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'installments',
      required: true,
    });
    await (databases as any).createIntegerAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'current_installment',
      required: true,
    });
    await (databases as any).createFloatAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'installment_amount',
      required: true,
    });
    await (databases as any).createFloatAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'first_installment_amount',
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'start_date',
      required: true,
    });
    await (databases as any).createEnumAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'status',
      elements: ['active', 'completed', 'cancelled'],
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'created_at',
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'updated_at',
      required: true,
    });

    console.log('Creating credit_card_transactions columns...');

    // Credit Card Transactions columns
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'transaction_id',
      size: 255,
      required: true,
    });
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'credit_card_bill_id',
      size: 255,
      required: true,
    });
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'installment_plan_id',
      size: 255,
      required: false,
    });
    await (databases as any).createFloatAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'amount',
      required: true,
    });
    await (databases as any).createIntegerAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'installment_number',
      required: false,
    });
    await (databases as any).createStringAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'description',
      size: 500,
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'date',
      required: true,
    });
    await (databases as any).createDatetimeAttribute({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'created_at',
      required: true,
    });

    console.log('Waiting for attributes to be available...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Creating indexes...');

    // Credit Card Bills indexes
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'idx_credit_card_id',
      type: IndexType.Key,
      attributes: ['credit_card_id'],
    });
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
      key: 'idx_user_id',
      type: IndexType.Key,
      attributes: ['user_id'],
    });

    // Installment Plans indexes
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'idx_transaction_id',
      type: IndexType.Key,
      attributes: ['transaction_id'],
    });
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
      key: 'idx_credit_card_id',
      type: IndexType.Key,
      attributes: ['credit_card_id'],
    });

    // Credit Card Transactions indexes
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'idx_bill_id',
      type: IndexType.Key,
      attributes: ['credit_card_bill_id'],
    });
    await (databases as any).createIndex({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      key: 'idx_installment_plan_id',
      type: IndexType.Key,
      attributes: ['installment_plan_id'],
    });

    console.log('✅ Credit card bills and installments tables created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping credit card bills and installments tables...');

    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
    });
    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.INSTALLMENT_PLANS,
    });
    await databases.deleteTable({
      databaseId,
      tableId: COLLECTIONS.CREDIT_CARD_BILLS,
    });

    console.log('✅ Credit card bills and installments tables dropped');
  },
};
