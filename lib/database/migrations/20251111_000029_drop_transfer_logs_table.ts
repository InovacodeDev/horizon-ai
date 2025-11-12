/**
 * Migration: Drop transfer_logs table
 * Created: 2025-11-11
 *
 * Removes the transfer_logs table as transfers are now handled
 * via transactions with type='transfer'
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  TRANSFER_LOGS: 'transfer_logs',
};

export const migration: Migration = {
  id: '20251111_000029',
  description: 'Drop transfer_logs table - transfers now use transaction type',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Dropping transfer_logs table...');

    try {
      await databases.deleteTable({
        databaseId,
        tableId: COLLECTIONS.TRANSFER_LOGS,
      });
      console.log('✓ transfer_logs table dropped successfully');
    } catch (error: any) {
      // Se a tabela não existir, não é um erro
      if (error.code === 404 || error.message?.includes('not found')) {
        console.log('✓ transfer_logs table does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }
  },

  async down(context: MigrationContext): Promise<void> {
    // Não vamos recriar a tabela no rollback
    // Se precisar, use a migration original 20251031_000020
    console.log('Rollback: transfer_logs table not recreated (use original migration if needed)');
  },
};
