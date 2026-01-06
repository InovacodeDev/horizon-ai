import { IndexType } from 'node-appwrite';

import { COLLECTIONS, financialProjectionsSchema } from '../../appwrite/schema';
import { Migration } from './migration.interface';

export const migration: Migration = {
  id: '20251208_000051',
  description: 'Create Financial Projections table',

  async up({ databases, databaseId }) {
    console.log(`Creating table ${COLLECTIONS.FINANCIAL_PROJECTIONS}...`);

    // Create financial_projections table
    await databases.createTable({
      databaseId,
      tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
      name: financialProjectionsSchema.name,
      permissions: financialProjectionsSchema.permissions,
      rowSecurity: financialProjectionsSchema.rowSecurity,
    });

    console.log('Creating attributes...');

    // Create attributes
    await Promise.all([
      databases.createStringColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'user_id',
        size: 255,
        required: true,
      }),
      databases.createStringColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'month',
        size: 7,
        required: true,
      }),
      databases.createFloatColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'total_income',
        required: true,
      }),
      databases.createFloatColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'committed_expenses',
        required: true,
      }),
      databases.createFloatColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'variable_expenses',
        required: true,
      }),
      databases.createFloatColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'safe_to_spend',
        required: true,
      }),
      // 1MB for virtual_transactions JSON
      databases.createStringColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'virtual_transactions',
        size: 1000000,
        required: false,
      }),
      databases.createDatetimeColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'created_at',
        required: true,
      }),
      databases.createDatetimeColumn({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'updated_at',
        required: true,
      }),
    ]);

    // Wait for attributes to be processed before creating indexes (Appwrite needs time)
    console.log('Waiting for attributes to be initialized...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('Creating indexes...');

    // Create indexes
    await Promise.all([
      databases.createIndex({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'idx_user_id',
        type: IndexType.Unique,
        columns: ['user_id'],
        orders: ['ASC'],
      }),
      databases.createIndex({
        databaseId,
        tableId: COLLECTIONS.FINANCIAL_PROJECTIONS,
        key: 'idx_user_month',
        type: IndexType.Unique,
        columns: ['user_id', 'month'],
        orders: ['ASC', 'ASC'],
      }),
    ]);

    console.log(`✅ Created collection ${COLLECTIONS.FINANCIAL_PROJECTIONS} successfully`);
  },

  async down({ databases, databaseId }) {
    console.log(`Deleting collection ${COLLECTIONS.FINANCIAL_PROJECTIONS}...`);
    await databases.deleteTable({ databaseId, tableId: COLLECTIONS.FINANCIAL_PROJECTIONS });
    console.log(`✅ Deleted collection ${COLLECTIONS.FINANCIAL_PROJECTIONS}`);
  },
};
