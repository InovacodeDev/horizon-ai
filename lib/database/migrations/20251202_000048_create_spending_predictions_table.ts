/**
 * Migration: Create spending_predictions table
 *
 * Stores monthly spending predictions per category for users.
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251202_000048',
  description: 'Create spending_predictions table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Creating spending_predictions table...');

    // Create spending_predictions table
    await databases.createTable({
      databaseId,
      tableId: 'spending_predictions',
      name: 'Spending Predictions',
      permissions: ['read("any")', 'write("any")'],
      rowSecurity: true,
    });

    console.log('Creating spending_predictions columns...');

    // Column 1: user_id
    await databases.createStringColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Column 2: category
    await databases.createStringColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'category',
      size: 100,
      required: true,
    });

    // Column 3: predicted_amount
    await databases.createFloatColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'predicted_amount',
      required: true,
    });

    // Column 4: confidence
    await databases.createFloatColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'confidence',
      required: true,
    });

    // Column 5: month (YYYY-MM)
    await databases.createStringColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'month',
      size: 7,
      required: true,
    });

    // Column 6: calculated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'calculated_at',
      required: true,
    });

    // Column 7: created_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'created_at',
      required: true,
    });

    // Column 8: updated_at
    await databases.createDatetimeColumn({
      databaseId,
      tableId: 'spending_predictions',
      key: 'updated_at',
      required: true,
    });

    console.log('Creating indexes...');

    // Index for user queries
    await databases.createIndex({
      databaseId,
      tableId: 'spending_predictions',
      key: 'idx_user_id',
      type: IndexType.Key,
      columns: ['user_id'],
      orders: ['ASC'],
    });

    // Index for user + month queries
    await databases.createIndex({
      databaseId,
      tableId: 'spending_predictions',
      key: 'idx_user_month',
      type: IndexType.Key,
      columns: ['user_id', 'month'],
      orders: ['ASC', 'DESC'],
    });

    // Index for user + category queries
    await databases.createIndex({
      databaseId,
      tableId: 'spending_predictions',
      key: 'idx_user_category',
      type: IndexType.Key,
      columns: ['user_id', 'category'],
      orders: ['ASC', 'ASC'],
    });

    console.log('✅ Spending Predictions table created successfully!');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;

    console.log('Dropping spending_predictions table...');

    await databases.deleteTable({
      databaseId,
      tableId: 'spending_predictions',
    });

    console.log('✅ Spending Predictions table dropped successfully');
  },
};
