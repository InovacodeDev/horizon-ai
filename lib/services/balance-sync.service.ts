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
    let hasMore = true;

    while (hasMore) {
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

      if (transactions.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    return allTransactions;
  }

  /**
   * Busca todas as transferências de uma conta com paginação
   */
  private async getAllTransfers(
    accountId: string,
    direction: 'from' | 'to',
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    const allTransfers: any[] = [];
    let offset = 0;
    const limit = 500; // Buscar em lotes de 500
    let hasMore = true;

    while (hasMore) {
      const queries = [
        Query.equal(direction === 'from' ? 'from_account_id' : 'to_account_id', accountId),
        Query.equal('status', 'completed'),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('created_at'),
      ];

      // Adicionar filtros de data se fornecidos
      if (startDate) {
        queries.push(Query.greaterThanEqual('created_at', startDate));
      }
      if (endDate) {
        queries.push(Query.lessThanEqual('created_at', endDate));
      }

      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.TRANSFER_LOGS, queries);
      const transfers = result.documents || [];

      allTransfers.push(...transfers);

      if (transfers.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    return allTransfers;
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

      // Buscar todas as transferências relacionadas a esta conta com paginação
      const transfersFrom = await this.getAllTransfers(accountId, 'from', startDate, endDate);
      const transfersTo = await this.getAllTransfers(accountId, 'to', startDate, endDate);

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

      // Recalcular balance do zero baseado nas transações e transferências
      // O saldo inicial já está contabilizado como uma transação de receita (categoria "balance")
      // quando a conta é criada com initial_balance > 0
      let newBalance = 0;

      // Somar/subtrair todas as transações
      const now = new Date();

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

        // Ignorar transações futuras (não contabilizar no saldo)
        const transactionDate = new Date(transaction.date);
        if (transactionDate > now) {
          continue;
        }

        if (transaction.type === 'income' || transaction.type === 'salary') {
          newBalance += transaction.amount;
        } else if (transaction.type === 'expense') {
          newBalance -= transaction.amount;
        }
      }

      // Processar transferências de saída (diminuem o saldo)
      for (const transfer of transfersFrom) {
        // Ignorar transferências futuras
        const transferDate = new Date(transfer.created_at);
        if (transferDate > now) {
          continue;
        }

        newBalance -= transfer.amount;
      }

      // Processar transferências de entrada (aumentam o saldo)
      for (const transfer of transfersTo) {
        // Ignorar transferências futuras
        const transferDate = new Date(transfer.created_at);
        if (transferDate > now) {
          continue;
        }

        newBalance += transfer.amount;
      }

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

      const updatePayload = {
        user_id: account.user_id,
        name: account.name,
        account_type: account.account_type || 'checking', // Default to 'checking' if missing
        is_manual: account.is_manual ?? true, // Default to true if missing
        balance: newBalance,
        synced_transaction_ids: JSON.stringify(updatedSyncedIds),
        updated_at: dateToUserTimezone(new Date().toISOString().split('T')[0]),
      };

      await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId, updatePayload);

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
    } catch (error: any) {
      console.error(`Error processing due transactions for user ${userId}:`, error);
      throw new Error(`Failed to process due transactions: ${error.message}`);
    }
  }
}
