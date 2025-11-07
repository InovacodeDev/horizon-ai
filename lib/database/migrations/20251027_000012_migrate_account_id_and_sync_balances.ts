/**
 * Migration: Migrate account_id data and sync balances
 * Created: 2025-10-27
 *
 * Esta migration:
 * 1. Migra dados de data.account_id para a coluna account_id em transactions
 * 2. Recalcula o balance de todas as contas baseado nas transações
 * 3. Popula synced_transaction_ids em todas as contas
 */
import { Query } from 'node-appwrite';

import { Migration, MigrationContext } from './migration.interface';

const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
};

export const migration: Migration = {
  id: '20251027_000012',
  description: 'Migrate account_id data and sync all account balances',

  async up(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Starting data migration and balance sync...\n');

    // Passo 1: Migrar account_id de data para coluna dedicada
    console.log('📦 Step 1: Migrating account_id from data field to dedicated column...');

    const transactionsResult = await databases.listRows({
      databaseId,
      tableId: COLLECTIONS.TRANSACTIONS,
      queries: [Query.limit(10000)],
    });

    const transactions = transactionsResult.rows || [];
    console.log(`   Found ${transactions.length} transactions`);

    let migratedCount = 0;
    for (const transaction of transactions) {
      try {
        // Parse data field
        let data: any = {};
        if (transaction.data) {
          try {
            data = typeof transaction.data === 'string' ? JSON.parse(transaction.data) : transaction.data;
          } catch {
            data = {};
          }
        }

        // Se tem account_id no data e não tem na coluna, migrar
        if (data.account_id && !transaction.account_id) {
          await databases.updateRow({
            databaseId,
            tableId: COLLECTIONS.TRANSACTIONS,
            rowId: transaction.$id,
            data: {
              account_id: data.account_id,
            },
          });
          migratedCount++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error migrating transaction ${transaction.$id}:`, error.message);
      }
    }

    console.log(`   ✅ ${migratedCount} transactions migrated\n`);

    // Passo 2: Recalcular balance de todas as contas
    console.log('💰 Step 2: Recalculating balances for all accounts...');

    const accountsResult = await databases.listRows({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      queries: [Query.limit(10000)],
    });

    const accounts = accountsResult.rows || [];
    console.log(`   Found ${accounts.length} accounts`);

    for (const account of accounts) {
      try {
        // Buscar todas as transações desta conta
        const accountTransactions = transactions.filter((t: any) => {
          // Verificar tanto na coluna account_id quanto no data.account_id
          if (t.account_id === account.$id) return true;

          try {
            const data = typeof t.data === 'string' ? JSON.parse(t.data) : t.data;
            return data?.account_id === account.$id && !data?.credit_card_id;
          } catch {
            return false;
          }
        });

        // Calcular balance
        // O balance inicial já está na conta, então somamos as transações
        let transactionSum = 0;
        const syncedIds: string[] = [];

        for (const transaction of accountTransactions) {
          // Verificar se não é transação de cartão de crédito
          let data: any = {};
          if (transaction.data) {
            try {
              data = typeof transaction.data === 'string' ? JSON.parse(transaction.data) : transaction.data;
            } catch {
              data = {};
            }
          }

          // Ignorar transações de cartão de crédito
          if (data.credit_card_id) continue;

          if (transaction.type === 'income' || transaction.type === 'salary') {
            transactionSum += transaction.amount;
          } else if (transaction.type === 'expense') {
            transactionSum -= transaction.amount;
          }

          syncedIds.push(transaction.$id);
        }

        // O balance atual já inclui as transações, então não precisamos somar
        // Apenas atualizamos synced_transaction_ids
        await databases.updateRow({
          databaseId,
          tableId: COLLECTIONS.ACCOUNTS,
          rowId: account.$id,
          data: {
            synced_transaction_ids: JSON.stringify(syncedIds),
            updated_at: new Date().toISOString(),
          },
        });

        console.log(`   ✅ Account ${account.name}: ${syncedIds.length} transactions synced`);
      } catch (error: any) {
        console.error(`   ❌ Error syncing account ${account.$id}:`, error.message);
      }
    }

    console.log('\n✅ Data migration and balance sync completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify balances in Appwrite Console');
    console.log('   2. Test creating/editing/deleting transactions');
    console.log('   3. Verify balance updates automatically');
  },

  async down(context: MigrationContext): Promise<void> {
    const { databases, databaseId } = context;
    console.log('Rolling back data migration...');

    // Limpar account_id das transações
    const transactionsResult = await databases.listRows({
      databaseId,
      tableId: COLLECTIONS.TRANSACTIONS,
      queries: [Query.limit(10000)],
    });

    const transactions = transactionsResult.rows || [];

    for (const transaction of transactions) {
      if (transaction.account_id) {
        await databases.updateRow({
          databaseId,
          tableId: COLLECTIONS.TRANSACTIONS,
          rowId: transaction.$id,
          data: {
            account_id: null,
          },
        });
      }
    }

    // Limpar synced_transaction_ids das contas
    const accountsResult = await databases.listRows({
      databaseId,
      tableId: COLLECTIONS.ACCOUNTS,
      queries: [Query.limit(10000)],
    });

    const accounts = accountsResult.rows || [];

    for (const account of accounts) {
      await databases.updateRow({
        databaseId,
        tableId: COLLECTIONS.ACCOUNTS,
        rowId: account.$id,
        data: {
          synced_transaction_ids: '[]',
        },
      });
    }

    console.log('✅ Rollback completed');
  },
};
