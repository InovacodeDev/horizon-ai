'use client';

import { getAppwriteBrowserClient } from '@/lib/appwrite/client-browser';
import type { CreditCard } from '@/lib/types';
import { cacheManager, getCacheKey as getKey, invalidateCache as invalidateCacheUtil } from '@/lib/utils/cache';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAccounts } from './useAccounts';

interface UseCreditCardsOptions {
  accountId?: string;
  enableRealtime?: boolean;
  cacheTime?: number;
}

// Global state para evitar múltiplas chamadas simultâneas
let globalCreditCards: CreditCard[] | null = null;
let globalFetchPromise: Promise<CreditCard[]> | null = null;
let globalSubscription: (() => void) | null = null;
let subscriberCount = 0;

/**
 * Hook otimizado para gerenciar cartões de crédito com cache e realtime
 * - Cache de 12h por padrão
 * - Batch loading (carrega todos os cartões de uma vez)
 * - Realtime subscribe compartilhado entre todos os componentes
 * - Deduplicação de requests
 */
export function useCreditCardsWithCache(options: UseCreditCardsOptions = {}) {
  const { accounts } = useAccounts();
  const { accountId, enableRealtime = true, cacheTime = 12 * 60 * 60 * 1000 } = options; // 12 hours default

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    // Primeiro tenta carregar do estado global
    if (globalCreditCards) {
      return accountId ? globalCreditCards.filter((c) => c.account_id === accountId) : globalCreditCards;
    }

    // Depois tenta carregar do cache
    const cacheKey = getKey.creditCards('user');
    const cached = cacheManager.get<CreditCard[]>(cacheKey);
    if (cached) {
      globalCreditCards = cached;
      return accountId ? cached.filter((c) => c.account_id === accountId) : cached;
    }

    return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(!!globalCreditCards);
  const mountedRef = useRef(true);

  const saveToCache = useCallback(
    (data: CreditCard[]) => {
      const cacheKey = getKey.creditCards('user');
      cacheManager.set(cacheKey, data, cacheTime);
      globalCreditCards = data;
    },
    [cacheTime],
  );

  const fetchCreditCards = useCallback(
    async (silent = false) => {
      // Se já existe uma chamada em andamento, reutiliza
      if (globalFetchPromise) {
        try {
          const data = await globalFetchPromise;
          if (mountedRef.current) {
            setCreditCards(accountId ? data.filter((c) => c.account_id === accountId) : data);
          }
          return data;
        } catch (err) {
          // Ignora erro se já foi tratado
          return [];
        }
      }

      // Cria nova promise de fetch
      globalFetchPromise = (async () => {
        try {
          if (!silent && mountedRef.current) setLoading(true);
          setError(null);

          // Fetch directly from Appwrite
          const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
          const { Query } = await import('appwrite');

          const databases = getAppwriteBrowserDatabases();
          const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

          if (!databaseId) {
            throw new Error('Database ID not configured');
          }

          // Build queries - if we have accounts, filter by them
          const queries = [Query.orderDesc('created_at')];

          if (accounts && accounts.length > 0) {
            const accountIds = accounts.map((a) => a.$id);
            queries.unshift(Query.equal('account_id', accountIds));
          }

          const result = await databases.listDocuments(databaseId, 'credit_cards', queries);
          const cardsData = result.documents as unknown as CreditCard[];

          saveToCache(cardsData);

          if (mountedRef.current) {
            setCreditCards(accountId ? cardsData.filter((c: CreditCard) => c.account_id === accountId) : cardsData);
            setInitialized(true);
          }

          return cardsData;
        } catch (err: any) {
          console.warn('Error fetching credit cards:', err);
          const emptyData: CreditCard[] = [];
          if (mountedRef.current) {
            setCreditCards(emptyData);
            setError(null);
            setInitialized(true);
          }
          return emptyData;
        } finally {
          if (!silent && mountedRef.current) setLoading(false);
          globalFetchPromise = null;
        }
      })();

      return globalFetchPromise;
    },
    [accountId, accounts, saveToCache],
  );

  // Initial fetch
  useEffect(() => {
    if (!initialized) {
      fetchCreditCards();
    }
  }, [initialized, fetchCreditCards]);

  // Setup realtime subscription (compartilhado globalmente)
  useEffect(() => {
    if (!enableRealtime || !initialized) return;

    subscriberCount++;

    // Se já existe uma subscription global, apenas incrementa o contador
    if (globalSubscription) {
      return () => {
        subscriberCount--;
        // Só desinscreve quando não há mais subscribers
        if (subscriberCount === 0 && globalSubscription) {
          globalSubscription();
          globalSubscription = null;
        }
      };
    }

    const databaseId = process.env.APPWRITE_DATABASE_ID;
    if (!databaseId) {
      console.warn('APPWRITE_DATABASE_ID not set, realtime disabled');
      return;
    }

    try {
      const client = getAppwriteBrowserClient();

      const channels = [`databases.${databaseId}.collections.credit_cards.documents`];

      const unsubscribe = client.subscribe(channels, (response: any) => {
        console.log('📡 Realtime: credit card updated');

        // Atualiza o cache global silenciosamente
        fetchCreditCards(true);
      });

      globalSubscription = unsubscribe;
      console.log('✅ Subscribed to credit cards realtime (shared)');

      return () => {
        subscriberCount--;
        if (subscriberCount === 0 && globalSubscription) {
          globalSubscription();
          globalSubscription = null;
          console.log('🔌 Unsubscribed from credit cards realtime');
        }
      };
    } catch (error) {
      console.error('❌ Error setting up realtime for credit cards:', error);
    }
  }, [enableRealtime, initialized, fetchCreditCards]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Atualiza quando o estado global muda
  useEffect(() => {
    if (globalCreditCards) {
      setCreditCards(accountId ? globalCreditCards.filter((c) => c.account_id === accountId) : globalCreditCards);
    }
  }, [accountId]);

  const deleteCreditCard = useCallback(
    async (cardId: string) => {
      let deletedCard: CreditCard | undefined;

      // Atualiza estado local e global otimisticamente
      setCreditCards((prev) => {
        deletedCard = prev.find((c) => c.$id === cardId);
        return prev.filter((c) => c.$id !== cardId);
      });

      if (globalCreditCards) {
        globalCreditCards = globalCreditCards.filter((c) => c.$id !== cardId);
        saveToCache(globalCreditCards);
      }

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

        // Rollback
        if (deletedCard) {
          setCreditCards((prev) => [...prev, deletedCard!]);
          if (globalCreditCards) {
            globalCreditCards = [...globalCreditCards, deletedCard];
            saveToCache(globalCreditCards);
          }
        }
        throw err;
      }
    },
    [saveToCache],
  );

  const invalidateCache = useCallback(() => {
    invalidateCacheUtil.creditCards('user');
    globalCreditCards = null;
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
