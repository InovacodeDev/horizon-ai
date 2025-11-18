'use client';

import { useUser } from '@/lib/contexts/UserContext';
import type {
  CreateTransactionDto,
  Transaction,
  TransactionStatus,
  TransactionType,
  UpdateTransactionDto,
} from '@/lib/types';
import { cacheManager, getCacheKey, invalidateCache } from '@/lib/utils/cache';
import { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react';

interface TransactionFilters {
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  category?: string;
  startDate?: string;
  endDate?: string;
  creditCardId?: string;
  accountId?: string;
  limit?: number;
  offset?: number;
}

interface UseTransactionsOptions {
  userId?: string | null;
  initialTransactions?: Transaction[];
  initialTotal?: number;
}

interface TransactionResponse {
  success: boolean;
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { user } = useUser();
  const userId = user.$id;
  const { initialTransactions, initialTotal } = options;
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [total, setTotal] = useState(initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT_PER_PAGE = 100;
  const totalPages = Math.ceil(total / LIMIT_PER_PAGE);

  const [optimisticTransactions, addOptimisticUpdate] = useOptimistic(
    transactions,
    (state, update: { type: 'add' | 'update' | 'delete'; transaction?: Transaction; id?: string }) => {
      switch (update.type) {
        case 'add':
          return update.transaction ? [update.transaction, ...state] : state;
        case 'update':
          return update.transaction
            ? state.map((tx) => (tx.$id === update.transaction!.$id ? update.transaction! : tx))
            : state;
        case 'delete':
          return state.filter((tx) => tx.$id !== update.id);
        default:
          return state;
      }
    },
  );

  const fetchTransactions = useCallback(
    async (filters?: TransactionFilters, skipCache = false, page = 1) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const offset = (page - 1) * LIMIT_PER_PAGE;

      if (!skipCache && page === 1) {
        const cacheKey = getCacheKey.transactions(userId);
        const cached = cacheManager.get<{ data: Transaction[]; total: number }>(cacheKey);

        if (cached) {
          setTransactions(cached.data);
          setTotal(cached.total);
          setCurrentPage(1);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
        const { Query } = await import('appwrite');

        const databases = getAppwriteBrowserDatabases();

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
        if (!databaseId) {
          throw new Error('Database ID not configured');
        }

        const queries = [Query.equal('user_id', userId)];

        if (filters?.type) queries.push(Query.equal('type', filters.type));
        if (filters?.status) queries.push(Query.equal('status', filters.status));
        if (filters?.category) queries.push(Query.equal('category', filters.category));
        if (filters?.creditCardId) queries.push(Query.equal('credit_card_id', filters.creditCardId));
        if (filters?.accountId) queries.push(Query.equal('account_id', filters.accountId));
        if (filters?.startDate) queries.push(Query.greaterThanEqual('date', filters.startDate));
        if (filters?.endDate) queries.push(Query.lessThanEqual('date', filters.endDate));

        const limit = filters?.limit || LIMIT_PER_PAGE;

        queries.push(Query.limit(limit));
        queries.push(Query.offset(offset));

        queries.push(Query.orderDesc('date'));

        const result = await databases.listRows({ databaseId, tableId: 'transactions', queries });

        const transactionsData = result.rows as unknown as Transaction[];

        setTransactions(transactionsData);
        setTotal(result.total);
        setCurrentPage(page);

        if (page === 1) {
          const cacheKey = getCacheKey.transactions(userId);
          cacheManager.set(cacheKey, { data: transactionsData, total: result.total });
        }
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(err.message || 'Failed to fetch transactions');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [userId, LIMIT_PER_PAGE],
  );

  useEffect(() => {
    if (userId && !initialTransactions) {
      fetchTransactions();
    }
  }, [userId, initialTransactions, fetchTransactions]);

  const changePage = useCallback(
    async (page: number, filters?: TransactionFilters) => {
      if (page < 1 || page > totalPages || loading) return;
      await fetchTransactions(filters, true, page);
    },
    [totalPages, loading, fetchTransactions],
  );

  useEffect(() => {
    if (!userId) return;

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
    if (!databaseId) {
      console.warn('APPWRITE_DATABASE_ID not set, realtime disabled for transactions');
      return;
    }

    try {
      const { getAppwriteBrowserClient } = require('@/lib/appwrite/client-browser');
      const client = getAppwriteBrowserClient();

      const channels = [`databases.${databaseId}.collections.transactions.documents`];

      const unsubscribe = client.subscribe(channels, (response: any) => {
        const events = response.events || [];
        const payload = response.payload as Transaction;

        console.log('📡 Realtime event received for transactions:', events);

        if (payload.user_id !== userId) {
          return;
        }

        if (events.some((e: string) => e.includes('.create'))) {
          console.log('➕ Transaction created:', payload.$id);
          setTransactions((prev) => {
            if (prev.some((t) => t.$id === payload.$id)) {
              return prev;
            }
            return [payload, ...prev];
          });
          setTotal((prev) => prev + 1);

          invalidateCache.transactions(userId);
        } else if (events.some((e: string) => e.includes('.update'))) {
          console.log('✏️ Transaction updated:', payload.$id);
          setTransactions((prev) => prev.map((t) => (t.$id === payload.$id ? payload : t)));

          invalidateCache.transactions(userId);
        } else if (events.some((e: string) => e.includes('.delete'))) {
          console.log('🗑️ Transaction deleted:', payload.$id);
          setTransactions((prev) => prev.filter((t) => t.$id !== payload.$id));
          setTotal((prev) => Math.max(0, prev - 1));

          invalidateCache.transactions(userId);
        }
      });

      console.log('✅ Subscribed to transactions realtime updates');

      return () => {
        unsubscribe();
        console.log('🔌 Unsubscribed from transactions realtime');
      };
    } catch (error) {
      console.error('❌ Error setting up realtime for transactions:', error);
      setError('Failed to setup realtime updates');
    }
  }, [userId]);

  const createTransaction = useCallback(
    async (input: CreateTransactionDto) => {
      const now = new Date();
      now.setHours(12);
      const tempId = `temp-${now.getTime()}`;
      const optimisticTransaction: Transaction = {
        $id: tempId,
        $createdAt: now.toISOString(),
        $updatedAt: now.toISOString(),
        user_id: userId || '',
        amount: input.type !== 'expense' ? input.amount : -input.amount,
        type: input.type,
        direction: input.type !== 'expense' ? 'in' : 'out',
        date: input.date,
        status: 'pending',
        category: input.category,
        description: input.description,
        account_id: input.account_id,
        credit_card_id: input.credit_card_id,
        merchant: input.merchant,
        currency: input.currency || 'BRL',
        source: 'manual',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      startTransition(() => {
        addOptimisticUpdate({ type: 'add', transaction: optimisticTransaction });
      });

      try {
        setError(null);
        const response = await fetch('/api/transactions/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create transaction');
        }

        const result = await response.json();
        const newTransaction = result.success ? result.data : result;

        setTransactions((prev) => [newTransaction, ...prev.filter((t) => t.$id !== tempId)]);
        setTotal((prev) => prev + 1);

        if (userId) {
          invalidateCache.transactions(userId);
        }

        return newTransaction;
      } catch (err: any) {
        console.error('Error creating transaction:', err);
        setError(err.message || 'Failed to create transaction');
        setTransactions((prev) => prev.filter((t) => t.$id !== tempId));
        throw err;
      }
    },
    [userId, addOptimisticUpdate, startTransition],
  );

  const updateTransaction = useCallback(
    async (transactionId: string, input: UpdateTransactionDto) => {
      const existingTransaction = transactions.find((t) => t.$id === transactionId);
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }

      const optimisticTransaction: Transaction = {
        ...existingTransaction,
        ...input,
        $updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      startTransition(() => {
        addOptimisticUpdate({ type: 'update', transaction: optimisticTransaction });
      });

      try {
        setError(null);
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update transaction');
        }

        const updatedTransaction = await response.json();

        setTransactions((prev) => prev.map((t) => (t.$id === transactionId ? updatedTransaction : t)));

        if (userId) {
          invalidateCache.transactions(userId);
        }

        return updatedTransaction;
      } catch (err: any) {
        console.error('Error updating transaction:', err);
        setError(err.message || 'Failed to update transaction');
        // Rollback optimistic update
        setTransactions((prev) => prev.map((t) => (t.$id === transactionId ? existingTransaction : t)));
        throw err;
      }
    },
    [transactions, addOptimisticUpdate, startTransition],
  );

  const deleteTransaction = useCallback(
    async (transactionId: string) => {
      startTransition(() => {
        addOptimisticUpdate({ type: 'delete', id: transactionId });
      });

      const deletedTransaction = transactions.find((t) => t.$id === transactionId);

      try {
        setError(null);
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete transaction');
        }

        setTransactions((prev) => prev.filter((t) => t.$id !== transactionId));
        setTotal((prev) => Math.max(0, prev - 1));

        if (userId) {
          invalidateCache.transactions(userId);
        }
      } catch (err: any) {
        console.error('Error deleting transaction:', err);
        setError(err.message || 'Failed to delete transaction');
        if (deletedTransaction) {
          setTransactions((prev) => [...prev, deletedTransaction]);
        }
        throw err;
      }
    },
    [transactions, addOptimisticUpdate, startTransition],
  );

  const refetch = useCallback(
    (filters?: TransactionFilters) => {
      setCurrentPage(1);
      return fetchTransactions(filters, true, 1);
    },
    [fetchTransactions],
  );

  return {
    transactions: optimisticTransactions,
    total,
    totalPages,
    currentPage,
    loading: loading || isPending,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
    changePage,
  };
}
