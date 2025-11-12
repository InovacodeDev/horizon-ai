/**
 * Migration: Populate Direction Column
 * Created: 2025-11-11
 *
 * Updates existing transactions to set the direction field based on type:
 * - expense: out
 * - income, salary, transfer: in
 */
import { Query } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251111_000036',
  description: 'Populate direction column for existing transactions',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Populating direction column for existing transactions...');

    let hasMore = true;
    let offset = 0;
    const limit = 100;
    let totalUpdated = 0;

    while (hasMore) {
      // Fetch transactions in batches
      const response = await databases.listRows({
        databaseId,
        tableId: 'transactions',
        queries: [Query.limit(limit), Query.offset(offset)],
      });

      if (response.rows.length === 0) {
        hasMore = false;
        break;
      }

      // Update each transaction
      for (const doc of response.rows) {
        const direction = doc.type === 'expense' ? 'out' : 'in';

        await databases.updateRow({
          databaseId,
          tableId: 'transactions',
          rowId: doc.$id,
          data: {
            direction,
          },
        });

        totalUpdated++;
      }

      offset += limit;
      console.log(`Updated ${totalUpdated} transactions...`);
    }

    console.log(`✅ Direction column populated for ${totalUpdated} transactions`);
  },

  async down(context: MigrationContext): Promise<void> {
    // No need to revert data changes
    console.log('⚠️  Data migration cannot be reverted');
  },
};
