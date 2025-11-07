'use client';

import { cacheManager, getCacheKey, invalidateCache as invalidateCacheUtil } from '@/lib/utils/cache';
import { useCallback, useEffect, useRef, useState } from 'react';

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
}

interface UseCreditCardTransactionsOptions {
  creditCardId: string;
  startDate?: Date;
  enableRealtime?: boolean;
  cacheTime?: number;
}

// Cache global por cartão
const transactionsCache = new Map<string, Transaction[]>();
const fetchPromises = new Map<string, Promise<Transaction[]>>();
const subscriptions = new Map<string, { unsubscribe: () => void; count: number }>();

/**
 * Hook otimizado para transações de cartão de crédito
 * - Cache por cartão com TTL de 12h
 * - Deduplicação de requests
 * - Realtime subscribe compartilhado por cartão
 */
export function useCreditCardTransactions(options: UseCreditCardTransactionsOptions) {
  const { creditCardId, startDate, enableRealtime = true, cacheTime = 12 * 60 * 60 * 1000 } = options;

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    // Tenta carregar do cache global
    const cached = transactionsCache.get(creditCardId);
    if (cached) return cached;

    // Tenta carregar do cache manager
    const cacheKey = getCacheKey.creditCardTransactions(creditCardId);
    const cachedData = cacheManager.get<Transaction[]>(cacheKey);
    if (cachedData) {
      transactionsCache.set(creditCardId, cachedData);
      return cachedData;
    }

    return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(!!transactionsCache.get(creditCardId));
  const mountedRef = useRef(true);

  const saveToCache = useCallback(
    (data: Transaction[]) => {
      const cacheKey = getCacheKey.creditCardTransactions(creditCardId);
      cacheManager.set(cacheKey, data, cacheTime);
      transactionsCache.set(creditCardId, data);
    },
    [creditCardId, cacheTime],
  );

  const fetchTransactions = useCallback(
    async (silent = false) => {
      const cacheKey = `${creditCardId}-${startDate?.toISOString() || 'all'}`;

      // Se já existe uma chamada em andamento para este cartão, reutiliza
      if (fetchPromises.has(cacheKey)) {
        try {
          const data = await fetchPromises.get(cacheKey)!;
          if (mountedRef.current) {
            setTransactions(data);
          }
          return data;
        } catch (err) {
          return [];
        }
      }

      // Cria nova promise de fetch
      const promise = (async () => {
        try {
          if (!silent && mountedRef.current) setLoading(true);
          setError(null);

          const start = startDate || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 meses
          const url = `/api/credit-cards/transactions?credit_card_id=${creditCardId}&start_date=${start.toISOString()}`;

          const response = await fetch(url, {
            credentials: 'include',
            cache: 'no-store',
          });

          if (!response.ok) {
            console.warn('Credit card transactions API error');
            const emptyData: Transaction[] = [];
            saveToCache(emptyData);
            if (mountedRef.current) {
              setTransactions(emptyData);
              setInitialized(true);
            }
            return emptyData;
          }

          const result = await response.json();
          const transactionsData = result.data || [];

          saveToCache(transactionsData);

          if (mountedRef.current) {
            setTransactions(transactionsData);
            setInitialized(true);
          }

          return transactionsData;
        } catch (err: any) {
          console.warn('Error fetching credit card transactions:', err);
          const emptyData: Transaction[] = [];
          if (mountedRef.current) {
            setTransactions(emptyData);
            setError(null);
            setInitialized(true);
          }
          return emptyData;
        } finally {
          if (!silent && mountedRef.current) setLoading(false);
          fetchPromises.delete(cacheKey);
        }
      })();

      fetchPromises.set(cacheKey, promise);
      return promise;
    },
    [creditCardId, startDate, saveToCache],
  );

  // Initial fetch
  useEffect(() => {
    if (!initialized) {
      fetchTransactions();
    }
  }, [initialized, fetchTransactions]);

  // Setup realtime subscription (compartilhado por cartão)
  useEffect(() => {
    if (!enableRealtime || !initialized || !creditCardId) return;

    const existing = subscriptions.get(creditCardId);
    if (existing) {
      existing.count++;
      return () => {
        existing.count--;
        if (existing.count === 0) {
          existing.unsubscribe();
          subscriptions.delete(creditCardId);
        }
      };
    }

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    if (!databaseId) {
      console.warn('NEXT_PUBLIC_APPWRITE_DATABASE_ID not set, realtime disabled');
      return;
    }

    try {
      const { getAppwriteBrowserClient } = require('@/lib/appwrite/client-browser');
      const client = getAppwriteBrowserClient();

      const channels = [`databases.${databaseId}.collections.credit_card_transactions.documents`];

      const unsubscribe = client.subscribe(channels, (response: any) => {
        // Verifica se o evento é relacionado a este cartão
        const payload = response.payload;
        if (payload && payload.credit_card_id === creditCardId) {
          console.log('📡 Realtime: transaction updated for card', creditCardId);
          fetchTransactions(true);
        }
      });

      subscriptions.set(creditCardId, { unsubscribe, count: 1 });
      console.log('✅ Subscribed to transactions realtime for card', creditCardId);

      return () => {
        const sub = subscriptions.get(creditCardId);
        if (sub) {
          sub.count--;
          if (sub.count === 0) {
            sub.unsubscribe();
            subscriptions.delete(creditCardId);
            console.log('🔌 Unsubscribed from transactions realtime for card', creditCardId);
          }
        }
      };
    } catch (error) {
      console.error('❌ Error setting up realtime for transactions:', error);
    }
  }, [enableRealtime, initialized, creditCardId, fetchTransactions]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const invalidateCache = useCallback(() => {
    invalidateCacheUtil.creditCardTransactions();
    transactionsCache.delete(creditCardId);
    fetchTransactions();
  }, [creditCardId, fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    invalidateCache,
  };
}
