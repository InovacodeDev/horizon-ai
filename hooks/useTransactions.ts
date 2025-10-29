'use client';

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

/**
 * Hook for managing transactions with React 19.2 optimistic updates
 */
export function useTransactions(options: UseTransactionsOptions = {}) {
  const { userId, initialTransactions, initialTotal } = options;
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [total, setTotal] = useState(initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic state for instant UI updates
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
    async (filters?: TransactionFilters, skipCache = false) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      // Check cache first
      if (!skipCache) {
        const cacheKey = getCacheKey.transactions(userId);
        const cached = cacheManager.get<{ data: Transaction[]; total: number }>(cacheKey);

        if (cached) {
          setTransactions(cached.data);
          setTotal(cached.total);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('userId', userId);

        if (filters?.type) params.append('type', filters.type);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const response = await fetch(`/api/transactions?${params.toString()}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const data: TransactionResponse = await response.json();

        if (data.success) {
          setTransactions(data.data);
          setTotal(data.total);

          // Cache the result
          const cacheKey = getCacheKey.transactions(userId);
          cacheManager.set(cacheKey, { data: data.data, total: data.total });
        } else {
          throw new Error('API returned unsuccessful response');
        }
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(err.message || 'Failed to fetch transactions');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (userId && !initialTransactions) {
      fetchTransactions();
    }
  }, [userId, initialTransactions, fetchTransactions]);

  const createTransaction = useCallback(
    async (input: CreateTransactionDto) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticTransaction: Transaction = {
        $id: tempId,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        user_id: userId || '',
        amount: input.amount,
        type: input.type,
        date: input.date,
        status: 'completed',
        category: input.category,
        description: input.description,
        account_id: input.account_id,
        credit_card_id: input.credit_card_id,
        merchant: input.merchant,
        currency: input.currency || 'BRL',
        source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add optimistically
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

        // Update with real data
        setTransactions((prev) => [newTransaction, ...prev.filter((t) => t.$id !== tempId)]);
        setTotal((prev) => prev + 1);

        // Invalidate cache
        if (userId) {
          invalidateCache.transactions(userId);
        }

        return newTransaction;
      } catch (err: any) {
        console.error('Error creating transaction:', err);
        setError(err.message || 'Failed to create transaction');
        // Rollback optimistic update
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

      // Update optimistically
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

        // Update with real data
        setTransactions((prev) => prev.map((t) => (t.$id === transactionId ? updatedTransaction : t)));

        // Invalidate cache
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
      // Delete optimistically
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

        // Confirm deletion
        setTransactions((prev) => prev.filter((t) => t.$id !== transactionId));
        setTotal((prev) => Math.max(0, prev - 1));

        // Invalidate cache
        if (userId) {
          invalidateCache.transactions(userId);
        }
      } catch (err: any) {
        console.error('Error deleting transaction:', err);
        setError(err.message || 'Failed to delete transaction');
        // Rollback optimistic update
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
      return fetchTransactions(filters);
    },
    [fetchTransactions],
  );

  return {
    transactions: optimisticTransactions,
    total,
    loading: loading || isPending,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
  };
}
