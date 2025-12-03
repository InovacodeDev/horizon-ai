'use client';

import { Transaction } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseCreditCardTransactionsOptions {
  creditCardId: string | undefined;
  startDate?: Date;
  enableRealtime?: boolean;
}

/**
 * Hook para transações de cartão de crédito com Realtime
 */
export function useCreditCardTransactions(options: UseCreditCardTransactionsOptions) {
  const { creditCardId, startDate, enableRealtime = true } = options;
  const { useUser } = require('@/lib/contexts/UserContext');
  const { user } = useUser();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchTransactions = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        console.log('🔍 useCreditCardTransactions: Fetching for card:', creditCardId);

        if (!options?.silent) {
          setLoading(true);
        }
        setError(null);

        // Fetch directly from Appwrite using the browser client
        const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
        const { Query } = await import('appwrite');

        const databases = getAppwriteBrowserDatabases();
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

        if (!databaseId) {
          throw new Error('Database ID not configured');
        }

        console.log('🔍 useCreditCardTransactions: Database ID:', databaseId);

        // Se creditCardId foi fornecido, validar propriedade primeiro
        if (creditCardId) {
          const cardResult = await databases.getRow({
            databaseId,
            tableId: 'credit_cards',
            rowId: creditCardId,
          });

          const card = cardResult as any;

          // Verificar se a conta do cartão pertence ao usuário ou é compartilhada
          const accountResult = await databases.getRow({
            databaseId,
            tableId: 'accounts',
            rowId: card.account_id,
          });

          const account = accountResult as any;

          // Verificar propriedade direta
          const isOwner = account.user_id === user.$id;

          // Verificar compartilhamento
          let isShared = false;
          if (!isOwner) {
            const sharingResult = await databases.listRows({
              databaseId,
              tableId: 'sharing_relationships',
              queries: [
                Query.equal('member_user_id', user.$id),
                Query.equal('responsible_user_id', account.user_id),
                Query.equal('status', 'active'),
              ],
            });
            isShared = sharingResult.rows.length > 0;
          }

          if (!isOwner && !isShared) {
            throw new Error('Unauthorized: Credit card does not belong to user');
          }
        }

        // Build queries
        const queries = [];

        // Adicionar filtro por creditCardId se fornecido
        if (creditCardId) {
          queries.push(Query.equal('credit_card_id', creditCardId));
        }

        // Filter by start date if provided (opcional)
        if (startDate) {
          queries.push(Query.greaterThanEqual('purchase_date', startDate.toISOString()));
          console.log('🔍 useCreditCardTransactions: Filtering from date:', startDate.toISOString());
        }

        // IMPORTANTE: Usar limit alto para pegar todas as transações (seguindo guideline)
        queries.push(Query.limit(5000));
        // Order by purchase date descending
        queries.push(Query.orderDesc('purchase_date'));

        console.log('🔍 useCreditCardTransactions: Executing query...');
        const result = await databases.listRows({ databaseId, tableId: 'credit_card_transactions', queries });
        const transactionsData = result.rows as unknown as Transaction[];

        console.log('✅ useCreditCardTransactions: Found', transactionsData.length, 'transactions');
        setTransactions(transactionsData);
        setInitialized(true);
      } catch (err: any) {
        console.error('❌ useCreditCardTransactions: Error fetching transactions:', err);
        console.error('   Message:', err.message);
        console.error('   Code:', err.code || 'N/A');
        setError(err.message || 'Failed to fetch transactions');
        setTransactions([]);
        setInitialized(true);
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [creditCardId, startDate, user.$id],
  );

  // Initial fetch
  useEffect(() => {
    console.log('🔄 useCreditCardTransactions: useEffect triggered, initialized');
    // if (!initialized) {
    console.log('🚀 useCreditCardTransactions: Starting initial fetch...');
    fetchTransactions();
    // }
  }, [fetchTransactions]);

  // Setup realtime subscription
  useAppwriteRealtime({
    channels: [
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.credit_card_transactions.documents`,
    ],
    enabled: enableRealtime && initialized && !!creditCardId,
    onCreate: (payload: Transaction) => {
      if (payload.credit_card_id === creditCardId) {
        console.log('📡 Realtime: transaction created for card', creditCardId);
        // Refazer busca para garantir segurança
        fetchTransactions();
      }
    },
    onUpdate: (payload: Transaction) => {
      if (payload.credit_card_id === creditCardId) {
        console.log('📡 Realtime: transaction updated for card', creditCardId);
        // Refazer busca para garantir segurança
        fetchTransactions();
      }
    },
    onDelete: (payload: Transaction) => {
      if (payload.credit_card_id === creditCardId) {
        console.log('📡 Realtime: transaction deleted for card', creditCardId);
        // Refazer busca para garantir segurança
        fetchTransactions();
      }
    },
  });

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    removeTransaction: (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.$id !== id));
    },
  };
}
