import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { Query } from 'node-appwrite';

/**
 * Balance Sync Service
 *
 * Gerencia a sincronização automática do balance das contas baseado nas transações.
 * O balance é calculado como: initial_balance + sum(transactions)
 *
 * Usa a coluna synced_transaction_ids para rastrear quais transações já foram
 * contabilizadas, evitando duplicação ou erros no cálculo.
 */
export class BalanceSyncService {
  private dbAdapter: any;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  /**
   * Sincroniza o balance de uma conta após criar/editar/remover transação
   */
  async syncAccountBalance(accountId: string): Promise<number> {
    try {
      // Buscar a conta
      const account = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);

      console.log(`[BalanceSync] Syncing account ${accountId} (${account.name}, type: ${account.account_type})`);

      // Parse synced transaction IDs
      let syncedIds: string[] = [];
      if (account.synced_transaction_ids) {
        try {
          syncedIds = JSON.parse(account.synced_transaction_ids);
        } catch {
          syncedIds = [];
        }
      }

      // Buscar todas as transações desta conta
      const transactionsResult = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
        Query.equal('account_id', accountId),
        Query.limit(10000),
      ]);

      const transactions = transactionsResult.documents || [];

      // Identificar transações novas, editadas e removidas
      const currentTransactionIds = new Set(transactions.map((t: any) => t.$id));
      const previousSyncedIds = new Set(syncedIds);

      // Transações removidas (estavam sincronizadas mas não existem mais)
      const removedIds = syncedIds.filter((id) => !currentTransactionIds.has(id));

      // Transações novas ou editadas
      const newOrEditedTransactions = transactions.filter((t: any) => {
        // Nova transação
        if (!previousSyncedIds.has(t.$id)) return true;

        // Transação editada (verificar se updated_at mudou)
        // Para simplificar, vamos recalcular todas sempre
        return false;
      });

      // Recalcular balance do zero baseado apenas nas transações
      // O balance sempre começa em 0 e é calculado pela soma das transações
      let newBalance = 0;

      console.log(`[BalanceSync] Found ${transactions.length} transactions for account ${accountId}`);

      // Somar/subtrair todas as transações
      for (const transaction of transactions) {
        // Ignorar transações de cartão de crédito
        // Verifica tanto a coluna dedicada quanto o campo no JSON (para compatibilidade)
        if (transaction.credit_card_id) continue;

        let data: any = {};
        if (transaction.data) {
          try {
            data = typeof transaction.data === 'string' ? JSON.parse(transaction.data) : transaction.data;
          } catch {
            data = {};
          }
        }

        if (data.credit_card_id) continue;

        if (transaction.type === 'income' || transaction.type === 'salary') {
          newBalance += transaction.amount;
          console.log(`[BalanceSync] Added income/salary: +${transaction.amount}, new balance: ${newBalance}`);
        } else if (transaction.type === 'expense') {
          newBalance -= transaction.amount;
          console.log(`[BalanceSync] Subtracted expense: -${transaction.amount}, new balance: ${newBalance}`);
        }
      }

      console.log(`[BalanceSync] Final calculated balance for account ${accountId}: ${newBalance}`);

      // Atualizar conta com novo balance e IDs sincronizados
      const updatedSyncedIds = transactions
        .filter((t: any) => {
          // Filtrar transações de cartão de crédito
          // Verifica tanto a coluna dedicada quanto o campo no JSON
          if (t.credit_card_id) return false;

          try {
            const data = typeof t.data === 'string' ? JSON.parse(t.data) : t.data;
            return !data?.credit_card_id;
          } catch {
            return true;
          }
        })
        .map((t: any) => t.$id);

      // Prepare update payload with only the fields we want to change
      // Include all required fields from the account to avoid validation errors
      const { dateToUserTimezone } = await import('@/lib/utils/timezone');
      const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

      const updatePayload = {
        user_id: account.user_id,
        name: account.name,
        account_type: account.account_type || 'checking', // Default to 'checking' if missing
        is_manual: account.is_manual ?? true, // Default to true if missing
        balance: newBalance,
        synced_transaction_ids: JSON.stringify(updatedSyncedIds),
        updated_at: now,
      };

      console.log(`[BalanceSync] Updating account ${accountId} with balance: ${newBalance}`);

      await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId, updatePayload);

      console.log(`[BalanceSync] Successfully updated account ${accountId} balance to ${newBalance}`);

      return newBalance;
    } catch (error: any) {
      console.error(`Error syncing balance for account ${accountId}:`, error);
      throw new Error(`Failed to sync account balance: ${error.message}`);
    }
  }

  /**
   * Sincroniza o balance após criar uma transação
   */
  async syncAfterCreate(accountId: string, transactionId: string): Promise<void> {
    await this.syncAccountBalance(accountId);
  }

  /**
   * Sincroniza o balance após editar uma transação
   */
  async syncAfterUpdate(accountId: string, transactionId: string): Promise<void> {
    await this.syncAccountBalance(accountId);
  }

  /**
   * Sincroniza o balance após remover uma transação
   */
  async syncAfterDelete(accountId: string, transactionId: string): Promise<void> {
    await this.syncAccountBalance(accountId);
  }

  /**
   * Recalcula o balance de todas as contas de um usuário
   */
  async recalculateAllBalances(userId: string): Promise<void> {
    try {
      const accountsResult = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
        Query.equal('user_id', userId),
        Query.limit(1000),
      ]);

      const accounts = accountsResult.documents || [];

      for (const account of accounts) {
        await this.syncAccountBalance(account.$id);
      }
    } catch (error: any) {
      console.error(`Error recalculating balances for user ${userId}:`, error);
      throw new Error(`Failed to recalculate balances: ${error.message}`);
    }
  }
}
