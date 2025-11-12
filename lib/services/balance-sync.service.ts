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
   * Busca todas as transações de uma conta com paginação
   */
  private async getAllTransactions(accountId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const allTransactions: any[] = [];
    let offset = 0;
    const limit = 500; // Buscar em lotes de 500

    while (true) {
      const queries = [
        Query.equal('account_id', accountId),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('date'),
      ];

      // Adicionar filtros de data se fornecidos
      if (startDate) {
        queries.push(Query.greaterThanEqual('date', startDate));
      }
      if (endDate) {
        queries.push(Query.lessThanEqual('date', endDate));
      }

      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, queries);
      const transactions = result.documents || [];

      allTransactions.push(...transactions);

      // Parar se não há mais documentos ou se retornou menos que o limite
      if (transactions.length === 0 || transactions.length < limit) {
        break;
      }

      offset += limit;
    }

    return allTransactions;
  }

  /**
   * Sincroniza o balance de uma conta após criar/editar/remover transação
   * @param accountId - ID da conta
   * @param startDate - Data inicial para filtrar transações (opcional, formato ISO)
   * @param endDate - Data final para filtrar transações (opcional, formato ISO)
   */
  async syncAccountBalance(accountId: string, startDate?: string, endDate?: string): Promise<number> {
    try {
      // Buscar a conta
      const account = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);

      // Parse synced transaction IDs
      let syncedIds: string[] = [];
      if (account.synced_transaction_ids) {
        try {
          syncedIds = JSON.parse(account.synced_transaction_ids);
        } catch {
          syncedIds = [];
        }
      }

      // Buscar todas as transações desta conta com paginação
      const transactions = await this.getAllTransactions(accountId, startDate, endDate);

      // Recalcular balance do zero baseado nas transações
      // O saldo inicial já está contabilizado como uma transação de receita (categoria "balance")
      // quando a conta é criada com initial_balance > 0
      let newBalance = 0;

      // Somar/subtrair todas as transações
      const now = new Date();

      console.log(`[BalanceSync] Syncing account ${accountId}:`);
      console.log(`[BalanceSync] - Total transactions: ${transactions.length}`);

      for (const transaction of transactions) {
        // Ignorar transações de cartão de crédito
        // Verifica tanto a coluna dedicada quanto o campo no JSON (para compatibilidade)
        if (transaction.credit_card_id) continue;

        // Ignorar transações futuras (não contabilizar no saldo)
        const transactionDate = new Date(transaction.date);
        if (transactionDate > now) {
          continue;
        }

        // Processar cada tipo de transação
        if (transaction.direction === 'in') {
          newBalance += transaction.amount;
        } else {
          newBalance -= transaction.amount;
        }
      }

      console.log(`[BalanceSync] - Final balance: ${newBalance}`);

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
      // Only update balance and synced_transaction_ids to avoid schema validation errors
      const { dateToUserTimezone } = await import('@/lib/utils/timezone');

      const updatePayload: any = {
        balance: newBalance,
        synced_transaction_ids: JSON.stringify(updatedSyncedIds),
        updated_at: dateToUserTimezone(new Date().toISOString().split('T')[0]),
      };

      console.log(`[BalanceSync] Updating account ${accountId} with balance: ${newBalance}`);

      const updatedAccount = await this.dbAdapter.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ACCOUNTS,
        accountId,
        updatePayload,
      );

      console.log(`[BalanceSync] Account updated successfully. New balance in DB: ${updatedAccount.balance}`);

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
   * @param userId - ID do usuário
   * @param startDate - Data inicial para filtrar transações (opcional, formato ISO)
   * @param endDate - Data final para filtrar transações (opcional, formato ISO)
   */
  async recalculateAllBalances(userId: string, startDate?: string, endDate?: string): Promise<void> {
    try {
      // Se não foi fornecido período, usar últimos 2 anos até hoje
      if (!startDate && !endDate) {
        const now = new Date();
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(now.getFullYear() - 2);

        startDate = twoYearsAgo.toISOString();
        endDate = now.toISOString();
      }

      const accountsResult = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
        Query.equal('user_id', userId),
        Query.limit(1000),
      ]);

      const accounts = accountsResult.documents || [];

      for (const account of accounts) {
        await this.syncAccountBalance(account.$id, startDate, endDate);
      }
    } catch (error: any) {
      console.error(`[BalanceSync] Error recalculating balances for user ${userId}:`, error);
      throw new Error(`Failed to recalculate balances: ${error.message}`);
    }
  }

  /**
   * Processa transações futuras que chegaram na data de hoje
   * Retorna o número de transações processadas
   */
  async processDueTransactions(userId: string): Promise<number> {
    try {
      // Buscar todas as transações do usuário
      const transactionsResult = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
        Query.equal('user_id', userId),
        Query.limit(10000),
      ]);

      const transactions = transactionsResult.documents || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Identificar transações que eram futuras mas agora são de hoje ou passado
      const dueTransactions = transactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        const transactionDay = new Date(
          transactionDate.getFullYear(),
          transactionDate.getMonth(),
          transactionDate.getDate(),
        );

        // Transação é de hoje ou passado
        return transactionDay <= today;
      });

      if (dueTransactions.length === 0) {
        return 0;
      }

      // Agrupar por conta
      const accountIds = new Set<string>();
      for (const transaction of dueTransactions) {
        if (transaction.account_id && !transaction.credit_card_id) {
          accountIds.add(transaction.account_id);
        }
      }

      // Recalcular saldo de cada conta afetada
      for (const accountId of accountIds) {
        await this.syncAccountBalance(accountId);
      }

      return accountIds.size;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`Error processing due transactions for user ${userId}:`, error);
      throw new Error(`Failed to process due transactions: ${error.message}`);
    }
  }
}
