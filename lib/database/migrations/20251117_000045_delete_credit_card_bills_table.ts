/**
 * Migration: Delete credit_card_bills table
 * Created: 2024-11-17
 *
 * Removes the credit_card_bills table as it's no longer needed.
 * Bill information is now calculated dynamically from credit_card_transactions
 * and stored as regular transactions with category "Cartão de Crédito".
 */
import { Migration, MigrationContext } from './migration.interface';

const COLLECTION_ID = 'credit_card_bills';

export const migration: Migration = {
  id: '20251117_000045',
  description: 'Delete credit_card_bills table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Deleting credit_card_bills table...');

    try {
      await databases.deleteTable({
        databaseId,
        tableId: COLLECTION_ID,
      });

      console.log('credit_card_bills table deleted successfully');
    } catch (error: any) {
      // If table doesn't exist, log and continue
      if (error.code === 404 || error.message?.includes('not found')) {
        console.log('credit_card_bills table does not exist, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down(context: MigrationContext): Promise<void> {
    // Cannot recreate table easily, so just log
    console.log('Cannot rollback deletion of credit_card_bills table');
    console.log('Please restore from backup if needed');
  },
};
