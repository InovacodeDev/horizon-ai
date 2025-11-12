/**
 * Migration: Add Direction Column to Transactions
 * Created: 2025-11-11
 *
 * Adds a "direction" column to indicate if transaction is incoming (in) or outgoing (out)
 * - expense: out
 * - income, salary, transfer: in
 */
import { Migration, MigrationContext } from './migration.interface';

export const migration: Migration = {
  id: '20251111_000035',
  description: 'Add direction column to transactions table',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Adding direction column to transactions...');

    // Create direction enum column
    await databases.createEnumColumn({
      databaseId,
      tableId: 'transactions',
      key: 'direction',
      elements: ['in', 'out'],
      required: true,
    });

    console.log('✅ Direction column added successfully');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Removing direction column from transactions...');

    await databases.deleteColumn({
      databaseId,
      tableId: 'transactions',
      key: 'direction',
    });

    console.log('✅ Direction column removed successfully');
  },
};
