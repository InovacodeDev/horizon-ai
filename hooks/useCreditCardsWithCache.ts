'use client';

import type { CreditCard } from '@/lib/types';
import { cacheManager, getCacheKey as getKey, invalidateCache as invalidateCacheUtil } from '@/lib/utils/cache';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAccounts } from './useAccounts';

interface UseCreditCardsOptions {
  accountId?: string;
  enableRealtime?: boolean;
  cacheTime?: number;
}

/**
 * Hook for managing credit cards with cache and realtime updates
 * Now uses centralized cache manager with 12h TTL
 */
export function useCreditCardsWithCache(options: UseCreditCardsOptions = {}) {
  const { accounts } = useAccounts();
  const { accountId, enableRealtime = true, cacheTime = 12 * 60 * 60 * 1000 } = options; // 12 hours default

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    // Try to load from cache
    const cacheKey = getKey.creditCards('user');
    const cached = cacheManager.get<CreditCard[]>(cacheKey);
    return cached || [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveToCache = useCallback(
    (data: CreditCard[]) => {
      const cacheKey = getKey.creditCards('user');
      cacheManager.set(cacheKey, data, cacheTime);
    },
    [cacheTime],
  );

  const fetchCreditCards = useCallback(
    async (silent = false, accountIds?: string[]) => {
      try {
        if (!silent) setLoading(true);
        setError(null);

        let url = '/api/credit-cards';

        if (accountId) {
          url = `/api/credit-cards/account/${accountId}`;
        } else if (accounts && accounts.length > 0) {
          url = `/api/credit-cards?account_ids=${accounts.map((a) => a.$id).join(',')}`;
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

  // Setup realtime subscription
  useEffect(() => {
    if (!enableRealtime || !initialized) return;

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    if (!databaseId) {
      console.warn('NEXT_PUBLIC_APPWRITE_DATABASE_ID not set, falling back to polling');
      // Fallback to polling
      pollingIntervalRef.current = setInterval(() => {
        fetchCreditCards(true);
      }, 30000);
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }

    try {
      const { getAppwriteBrowserClient } = require('@/lib/appwrite/client-browser');
      const client = getAppwriteBrowserClient();

      const channels = [`databases.${databaseId}.collections.credit_cards.documents`];

      const unsubscribe = client.subscribe(channels, (response: any) => {
        console.log('📡 Realtime event received for credit cards:', response.events);

        // Refetch credit cards on any change
        fetchCreditCards(true);
      });

      console.log('✅ Subscribed to credit cards realtime updates');

      return () => {
        unsubscribe();
        console.log('🔌 Unsubscribed from credit cards realtime');
      };
    } catch (error) {
      console.error('❌ Error setting up realtime for credit cards:', error);
      // Fallback to polling on error
      pollingIntervalRef.current = setInterval(() => {
        fetchCreditCards(true);
      }, 30000);
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
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
    invalidateCacheUtil.creditCards('user');
    fetchCreditCards();
  }, [fetchCreditCards]);

  return {
    creditCards,
    loading,
    error,
    fetchCreditCards,
    deleteCreditCard,
    invalidateCache,
  };
}
