'use client';

import type { CreditCard } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAccounts } from './useAccounts';

interface UseCreditCardsOptions {
  accountId?: string;
  enableRealtime?: boolean;
  cacheTime?: number;
}

const getCacheKey = (accountId?: string) => (accountId ? `credit_cards_cache_${accountId}` : 'credit_cards_cache_all');

const getTimestampKey = (accountId?: string) =>
  accountId ? `credit_cards_timestamp_${accountId}` : 'credit_cards_timestamp_all';

/**
 * Hook for managing credit cards with cache and realtime updates
 */
export function useCreditCardsWithCache(options: UseCreditCardsOptions = {}) {
  const { accountId, enableRealtime = true, cacheTime = 5 * 60 * 1000 } = options;

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    // Try to load from cache
    if (typeof window !== 'undefined') {
      try {
        const cacheKey = getCacheKey(accountId);
        const timestampKey = getTimestampKey(accountId);
        const cached = localStorage.getItem(cacheKey);
        const timestamp = localStorage.getItem(timestampKey);

        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < cacheTime) {
            return JSON.parse(cached);
          }
        }
      } catch (err) {
        console.error('Error loading cache:', err);
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveToCache = useCallback(
    (data: CreditCard[]) => {
      if (typeof window !== 'undefined') {
        try {
          const cacheKey = getCacheKey(accountId);
          const timestampKey = getTimestampKey(accountId);
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(timestampKey, Date.now().toString());
        } catch (err) {
          console.error('Error saving to cache:', err);
        }
      }
    },
    [accountId],
  );

  const fetchCreditCards = useCallback(
    async (silent = false, accountIds?: string[]) => {
      try {
        if (!silent) setLoading(true);
        setError(null);

        let url = '/api/credit-cards';

        // If specific account ID provided via options
        if (accountId) {
          url = `/api/credit-cards/account/${accountId}`;
        }
        // If multiple account IDs provided as parameter
        else if (accountIds && accountIds.length > 0) {
          url = `/api/credit-cards?account_ids=${accountIds.join(',')}`;
        }

        const response = await fetch(url, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          // If API doesn't exist or returns error, just return empty array
          console.warn('Credit cards API not available or returned error');
          setCreditCards([]);
          saveToCache([]);
          setInitialized(true);
          return [];
        }

        const data = await response.json();
        const cardsData = Array.isArray(data) ? data : data.data || [];

        setCreditCards(cardsData);
        saveToCache(cardsData);
        setInitialized(true);

        return cardsData;
      } catch (err: any) {
        console.warn('Error fetching credit cards:', err);
        // Don't throw error, just set empty array
        setCreditCards([]);
        setError(null); // Clear error to not break UI
        setInitialized(true);
        return [];
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [accountId, saveToCache],
  );

  // Initial fetch
  useEffect(() => {
    if (!initialized) {
      fetchCreditCards();
    }
  }, [initialized, fetchCreditCards]);

  // Setup realtime polling
  useEffect(() => {
    if (!enableRealtime || !initialized) return;

    pollingIntervalRef.current = setInterval(() => {
      fetchCreditCards(true);
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enableRealtime, initialized, fetchCreditCards]);

  const deleteCreditCard = useCallback(
    async (cardId: string) => {
      let deletedCard: CreditCard | undefined;

      setCreditCards((prev) => {
        deletedCard = prev.find((c) => c.$id === cardId);
        const updated = prev.filter((c) => c.$id !== cardId);
        saveToCache(updated);
        return updated;
      });

      try {
        setError(null);
        const response = await fetch(`/api/credit-cards/${cardId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete credit card');
        }
      } catch (err: any) {
        console.error('Error deleting credit card:', err);
        setError(err.message || 'Failed to delete credit card');
        if (deletedCard) {
          setCreditCards((prev) => {
            const updated = [...prev, deletedCard!];
            saveToCache(updated);
            return updated;
          });
        }
        throw err;
      }
    },
    [saveToCache],
  );

  const invalidateCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      const cacheKey = getCacheKey(accountId);
      const timestampKey = getTimestampKey(accountId);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(timestampKey);
    }
    fetchCreditCards();
  }, [accountId, fetchCreditCards]);

  return {
    creditCards,
    loading,
    error,
    fetchCreditCards,
    deleteCreditCard,
    invalidateCache,
  };
}
