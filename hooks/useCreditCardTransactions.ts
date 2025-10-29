import { cacheManager, getCacheKey, invalidateCache } from '@/lib/utils/cache';
import { useCallback, useEffect, useState } from 'react';

export interface CreditCardTransaction {
  $id: string;
  user_id: string;
  credit_card_id: string;
  amount: number;
  date: string;
  purchase_date: string;
  category: string;
  description?: string;
  merchant?: string;
  installment?: number;
  installments?: number;
  is_recurring?: boolean;
  status: 'pending' | 'paid' | 'cancelled';
  $createdAt: string;
  $updatedAt: string;
}

interface UseCreditCardTransactionsOptions {
  creditCardId?: string;
  startDate?: string;
  endDate?: string;
  startPurchaseDate?: string;
  endPurchaseDate?: string;
  status?: 'pending' | 'paid' | 'cancelled';
  isRecurring?: boolean;
  limit?: number;
}

export function useCreditCardTransactions(options: UseCreditCardTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (skipCache = false) => {
      const params = new URLSearchParams();

      if (options.creditCardId) params.append('credit_card_id', options.creditCardId);
      if (options.startDate) params.append('start_date', options.startDate);
      if (options.endDate) params.append('end_date', options.endDate);
      if (options.startPurchaseDate) params.append('start_purchase_date', options.startPurchaseDate);
      if (options.endPurchaseDate) params.append('end_purchase_date', options.endPurchaseDate);
      if (options.status) params.append('status', options.status);
      if (options.isRecurring !== undefined) params.append('is_recurring', String(options.isRecurring));
      if (options.limit) params.append('limit', String(options.limit));

      const paramsString = params.toString();

      // Check cache first
      if (!skipCache) {
        const cacheKey = getCacheKey.creditCardTransactions(paramsString);
        const cached = cacheManager.get<CreditCardTransaction[]>(cacheKey);

        if (cached) {
          setTransactions(cached);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/credit-cards/transactions?${paramsString}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch credit card transactions');
        }

        const result = await response.json();
        const data = result.data || [];
        setTransactions(data);

        // Cache the result
        const cacheKey = getCacheKey.creditCardTransactions(paramsString);
        cacheManager.set(cacheKey, data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [
      options.creditCardId,
      options.startDate,
      options.endDate,
      options.startPurchaseDate,
      options.endPurchaseDate,
      options.status,
      options.isRecurring,
      options.limit,
    ],
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}
