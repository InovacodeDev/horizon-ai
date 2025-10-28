/**
 * Migration: Create Investments Table
 * Created: 2025-10-27
 *
 * Creates the investments table for tracking user investments
 */
import { IndexType } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  INVESTMENTS: 'investments',
};

export const migration: Migration = {
  id: '20251027_000013',
  description: 'Create investments table for wealth management',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Creating investments table...');

    // Create investments table
    await databases.createCollection({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      name: 'Investments',
      permissions: ['read("any")', 'write("any")'],
      documentSecurity: true,
    });

    console.log('Creating columns...');

    // Column 1: user_id
    await (databases as any).createStringAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'user_id',
      size: 255,
      required: true,
    });

    // Column 2: account_id
    await (databases as any).createStringAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'account_id',
      size: 255,
      required: true,
    });

    // Column 3: name
    await (databases as any).createStringAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'name',
      size: 255,
      required: true,
    });

    // Column 4: type
    await (databases as any).createEnumAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'type',
      elements: ['stocks', 'fiis', 'fixed_income', 'crypto', 'funds', 'etf', 'pension', 'other'],
      required: true,
    });

    // Column 5: ticker (optional)
    await (databases as any).createStringAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'ticker',
      size: 50,
      required: false,
    });

    // Column 6: quantity
    await (databases as any).createFloatAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'quantity',
      required: true,
    });

    // Column 7: purchase_price
    await (databases as any).createFloatAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'purchase_price',
      required: true,
    });

    // Column 8: purchase_date
    await (databases as any).createDatetimeAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'purchase_date',
      required: true,
    });

    // Column 9: current_price
    await (databases as any).createFloatAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'current_price',
      required: true,
    });

    // Column 10: status
    await (databases as any).createEnumAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'status',
      elements: ['active', 'sold', 'matured'],
      required: true,
    });

    // Column 11: data (JSON)
    await (databases as any).createStringAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'data',
      size: 4000,
      required: false,
    });

    // Column 12: created_at
    await (databases as any).createDatetimeAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'created_at',
      required: true,
    });

    // Column 13: updated_at
    await (databases as any).createDatetimeAttribute({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'updated_at',
      required: true,
    });

    console.log('Waiting for attributes to be available...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('Creating indexes...');

    // Index 1: user_id
    await (databases as any).createIndex({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'idx_user_id',
      type: IndexType.Key,
      attributes: ['user_id'],
      orders: ['ASC'],
    });

    // Index 2: account_id
    await (databases as any).createIndex({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'idx_account_id',
      type: IndexType.Key,
      attributes: ['account_id'],
      orders: ['ASC'],
    });

    // Index 3: type
    await (databases as any).createIndex({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'idx_type',
      type: IndexType.Key,
      attributes: ['type'],
    });

    // Index 4: status
    await (databases as any).createIndex({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
      key: 'idx_status',
      type: IndexType.Key,
      attributes: ['status'],
    });

    console.log('✅ Investments table created successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping investments table...');

    await databases.deleteCollection({
      databaseId,
      collectionId: COLLECTIONS.INVESTMENTS,
    });

    console.log('✅ Investments table dropped');
  },
};
