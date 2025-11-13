'use client';

import { cacheManager, getCacheKey, invalidateCache as invalidateCacheUtil } from '@/lib/utils/cache';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface Transaction {
  $id: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  merchant?: string;
  installment?: number;
  installments?: number;
  is_recurring?: boolean;
  purchase_date?: string;
  credit_card_id?: string;
}

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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!creditCardId) {
      setTransactions([]);
      setInitialized(true);
      return;
    }

    try {
      // Check cache first
      const cacheKey = getCacheKey.creditCardTransactions(creditCardId);
      const cached = cacheManager.get<Transaction[]>(cacheKey);

      if (cached) {
        setTransactions(cached);
        setInitialized(true);
        return;
      }

      setLoading(true);
      setError(null);

      const start = startDate || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 meses
      const url = `/api/credit-cards/transactions?credit_card_id=${creditCardId}&start_date=${start.toISOString()}`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credit card transactions');
      }

      const result = await response.json();
      const transactionsData = result.data || [];

      setTransactions(transactionsData);

      // Cache the result
      cacheManager.set(cacheKey, transactionsData);
      setInitialized(true);
    } catch (err: any) {
      console.error('Error fetching credit card transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
      setTransactions([]);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [creditCardId, startDate]);

  // Initial fetch
  useEffect(() => {
    if (!initialized) {
      fetchTransactions();
    }
  }, [initialized, fetchTransactions]);

  // Setup realtime subscription
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.credit_card_transactions.documents`],
    enabled: enableRealtime && initialized && !!creditCardId,
    onCreate: (payload: Transaction) => {
      if (payload.credit_card_id === creditCardId) {
        console.log('📡 Realtime: transaction created for card', creditCardId);
        setTransactions((prev) => {
          if (prev.some((t) => t.$id === payload.$id)) return prev;
          return [payload, ...prev];
        });
        if (creditCardId) {
          invalidateCacheUtil.creditCardTransactions();
        }
      }
    },
    onUpdate: (payload: Transaction) => {
      if (payload.credit_card_id === creditCardId) {
        console.log('📡 Realtime: transaction updated for card', creditCardId);
        setTransactions((prev) => prev.map((t) => (t.$id === payload.$id ? payload : t)));
        if (creditCardId) {
          invalidateCacheUtil.creditCardTransactions();
        }
      }
    },
    onDelete: (payload: Transaction) => {
      if (payload.credit_card_id === creditCardId) {
        console.log('📡 Realtime: transaction deleted for card', creditCardId);
        setTransactions((prev) => prev.filter((t) => t.$id !== payload.$id));
        if (creditCardId) {
          invalidateCacheUtil.creditCardTransactions();
        }
      }
    },
  });

  const invalidateCache = useCallback(() => {
    invalidateCacheUtil.creditCardTransactions();
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    invalidateCache,
  };
}
