/**
 * Migration: Add synced_transaction_ids column to accounts table
 * Created: 2025-10-27
 *
 * Adiciona a coluna synced_transaction_ids na tabela accounts para rastrear
 * quais transações já foram sincronizadas no cálculo do balance.
 * Isso evita duplicação ou erros ao editar/remover transações.
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  ACCOUNTS: 'accounts',
};

export const migration: Migration = {
  id: '20251027_000011',
  description: 'Add synced_transaction_ids column to accounts table for balance tracking',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Adding synced_transaction_ids column to accounts table...');

    // Add synced_transaction_ids column (skip if already exists)
    // This will store a JSON array of transaction IDs that have been synced
    try {
      await (databases as any).createStringAttribute({
        databaseId,
        tableId: COLLECTIONS.ACCOUNTS,
        key: 'synced_transaction_ids',
        size: 65535, // Large size to store many transaction IDs
        required: false,
        default: '[]',
      });

      console.log('Waiting for attribute to be available...');
      // Wait for Appwrite to process the attribute creation
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      if (error.type === 'attribute_already_exists') {
        console.log('   ℹ️  synced_transaction_ids column already exists, skipping...');
      } else {
        throw error;
      }
    }

    console.log('✅ synced_transaction_ids column added successfully to accounts table');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Removing synced_transaction_ids column from accounts table...');

    // Delete attribute
    await (databases as any).deleteAttribute({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      key: 'synced_transaction_ids',
    });

    console.log('✅ synced_transaction_ids column removed from accounts table');
  },
};
