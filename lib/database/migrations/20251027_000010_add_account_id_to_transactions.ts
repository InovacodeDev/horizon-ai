/**
 * Migration: Add account_id column to transactions table
 * Created: 2025-10-27
 *
 * Adiciona a coluna account_id na tabela transactions para vincular transações
 * diretamente às contas, permitindo sincronização automática do balance.
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
};

export const migration: Migration = {
  id: '20251027_000010',
  description: 'Add account_id column to transactions table for balance sync',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Adding account_id column to transactions table...');

    // Add account_id column (skip if already exists)
    try {
      await (databases as any).createStringAttribute({
        databaseId,
        collectionId: COLLECTIONS.TRANSACTIONS,
        key: 'account_id',
        size: 255,
        required: false,
      });

      console.log('Waiting for attribute to be available...');
      // Wait for Appwrite to process the attribute creation
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      if (error.type === 'attribute_already_exists') {
        console.log('   ℹ️  account_id column already exists, skipping...');
      } else {
        throw error;
      }
    }

    console.log('Creating index for account_id...');

    // Create index for account_id to optimize queries (skip if already exists)
    try {
      await (databases as any).createIndex({
        databaseId,
        collectionId: COLLECTIONS.TRANSACTIONS,
        key: 'idx_account_id',
        type: 'key',
        attributes: ['account_id'],
        orders: ['ASC'],
      });
    } catch (error: any) {
      if (error.type === 'index_already_exists') {
        console.log('   ℹ️  Index already exists, skipping...');
      } else {
        throw error;
      }
    }

    console.log('✅ account_id column added successfully to transactions table');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Removing account_id column from transactions table...');

    // Delete index first
    await (databases as any).deleteIndex({
      databaseId,
      collectionId: COLLECTIONS.TRANSACTIONS,
      key: 'idx_account_id',
    });

    // Delete attribute
    await (databases as any).deleteAttribute({
      databaseId,
      collectionId: COLLECTIONS.TRANSACTIONS,
      key: 'account_id',
    });

    console.log('✅ account_id column removed from transactions table');
  },
};
