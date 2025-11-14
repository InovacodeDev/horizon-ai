'use client';

import { useUser } from '@/lib/contexts/UserContext';
import type { CreateCreditCardDto, CreditCard, UpdateCreditCardDto } from '@/lib/types';
import { cacheManager, getCacheKey, invalidateCache } from '@/lib/utils/cache';
import { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseCreditCardsOptions {
  accountId?: string | null;
  initialCreditCards?: CreditCard[];
  enableRealtime?: boolean;
}

/**
 * Hook for managing credit cards with React 19.2 optimistic updates and Realtime
 */
export function useCreditCards(options: UseCreditCardsOptions = {}) {
  const { accountId, initialCreditCards, enableRealtime = true } = options;
  const { user } = useUser();
  const [creditCards, setCreditCards] = useState<CreditCard[]>(initialCreditCards || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [initialized, setInitialized] = useState(false);

  // Optimistic state for instant UI updates
  const [optimisticCreditCards, addOptimisticUpdate] = useOptimistic(
    creditCards,
    (state, update: { type: 'add' | 'update' | 'delete'; card?: CreditCard; id?: string }) => {
      switch (update.type) {
        case 'add':
          return update.card ? [...state, update.card] : state;
        case 'update':
          return update.card ? state.map((card) => (card.$id === update.card!.$id ? update.card! : card)) : state;
        case 'delete':
          return state.filter((card) => card.$id !== update.id);
        default:
          return state;
      }
    },
  );

  const fetchCreditCards = useCallback(
    async (skipCache = false) => {
      try {
        // Check cache first
        if (!skipCache) {
          const cacheKey = getCacheKey.creditCards(user.$id);
          const cached = cacheManager.get<CreditCard[]>(cacheKey);

          if (cached) {
            // Filter by accountId if provided
            const filteredCards = accountId ? cached.filter((c) => c.account_id === accountId) : cached;
            setCreditCards(filteredCards);
            setLoading(false);
            setInitialized(true);
            return;
          }
        }

        setLoading(true);
        setError(null);

        // Fetch directly from Appwrite
        const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
        const { Query } = await import('appwrite');

        const databases = getAppwriteBrowserDatabases();
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

        if (!databaseId) {
          throw new Error('Database ID not configured');
        }

        // Build queries - if accountId is provided, filter by it
        const queries = accountId
          ? [Query.equal('account_id', accountId), Query.orderDesc('created_at')]
          : [Query.orderDesc('created_at')];

        const result = await databases.listDocuments(databaseId, 'credit_cards', queries);

        const cardsData = result.documents as unknown as CreditCard[];
        setCreditCards(cardsData);

        // Cache the result (cache all cards, filter happens on retrieval)
        const cacheKey = getCacheKey.creditCards(user.$id);
        cacheManager.set(cacheKey, cardsData);
        setInitialized(true);
      } catch (err: any) {
        console.error('Error fetching credit cards:', err);
        setError(err.message || 'Failed to fetch credit cards');
        setCreditCards([]);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    },
    [accountId, user.$id],
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (!initialized && !initialCreditCards) {
      fetchCreditCards();
    }
  }, [initialized, initialCreditCards, fetchCreditCards]);

  // Setup realtime subscription for credit cards
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.credit_cards.documents`],
    enabled: enableRealtime && initialized,
    onCreate: (payload: CreditCard) => {
      console.log('📡 Realtime: credit card created', payload.$id);
      setCreditCards((prev) => {
        if (prev.some((c) => c.$id === payload.$id)) return prev;
        return [...prev, payload];
      });
      invalidateCache.creditCards(user.$id);
    },
    onUpdate: (payload: CreditCard) => {
      console.log('📡 Realtime: credit card updated', payload.$id);
      setCreditCards((prev) => prev.map((c) => (c.$id === payload.$id ? payload : c)));
      invalidateCache.creditCards(user.$id);
    },
    onDelete: (payload: CreditCard) => {
      console.log('📡 Realtime: credit card deleted', payload.$id);
      setCreditCards((prev) => prev.filter((c) => c.$id !== payload.$id));
      invalidateCache.creditCards(user.$id);
    },
  });

  const createCreditCard = useCallback(
    async (input: CreateCreditCardDto) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticCard: CreditCard = {
        $id: tempId,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        account_id: input.account_id,
        name: input.name,
        last_digits: input.last_digits,
        credit_limit: input.credit_limit,
        used_limit: input.used_limit || 0,
        closing_day: input.closing_day,
        due_day: input.due_day,
        brand: input.brand,
        network: input.network,
        color: input.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add optimistically
      startTransition(() => {
        addOptimisticUpdate({ type: 'add', card: optimisticCard });
      });

      try {
        setError(null);
        const response = await fetch('/api/credit-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create credit card');
        }

        const newCard = await response.json();

        // Update with real data
        setCreditCards((prev) => [...prev.filter((c) => c.$id !== tempId), newCard]);

        // Invalidate cache
        invalidateCache.creditCards(user.$id);

        return newCard;
      } catch (err: any) {
        console.error('Error creating credit card:', err);
        setError(err.message || 'Failed to create credit card');
        // Rollback optimistic update
        setCreditCards((prev) => prev.filter((c) => c.$id !== tempId));
        throw err;
      }
    },
    [addOptimisticUpdate, startTransition, user.$id],
  );

  const updateCreditCard = useCallback(
    async (creditCardId: string, input: UpdateCreditCardDto) => {
      const existingCard = creditCards.find((c) => c.$id === creditCardId);
      if (!existingCard) {
        throw new Error('Credit card not found');
      }

      const optimisticCard: CreditCard = {
        ...existingCard,
        ...input,
        $updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update optimistically
      startTransition(() => {
        addOptimisticUpdate({ type: 'update', card: optimisticCard });
      });

      try {
        setError(null);
        const response = await fetch(`/api/credit-cards/${creditCardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update credit card');
        }

        const updatedCard = await response.json();

        // Update with real data
        setCreditCards((prev) => prev.map((c) => (c.$id === creditCardId ? updatedCard : c)));

        // Invalidate cache
        invalidateCache.creditCards(user.$id);

        return updatedCard;
      } catch (err: any) {
        console.error('Error updating credit card:', err);
        setError(err.message || 'Failed to update credit card');
        // Rollback optimistic update
        setCreditCards((prev) => prev.map((c) => (c.$id === creditCardId ? existingCard : c)));
        throw err;
      }
    },
    [creditCards, addOptimisticUpdate, startTransition, user.$id],
  );

  const deleteCreditCard = useCallback(
    async (creditCardId: string) => {
      // Delete optimistically
      startTransition(() => {
        addOptimisticUpdate({ type: 'delete', id: creditCardId });
      });

      const deletedCard = creditCards.find((c) => c.$id === creditCardId);

      try {
        setError(null);
        const response = await fetch(`/api/credit-cards/${creditCardId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete credit card');
        }

        // Confirm deletion
        setCreditCards((prev) => prev.filter((c) => c.$id !== creditCardId));

        // Invalidate cache
        invalidateCache.creditCards(user.$id);
      } catch (err: any) {
        console.error('Error deleting credit card:', err);
        setError(err.message || 'Failed to delete credit card');
        // Rollback optimistic update
        if (deletedCard) {
          setCreditCards((prev) => [...prev, deletedCard]);
        }
        throw err;
      }
    },
    [creditCards, addOptimisticUpdate, startTransition],
  );

  const updateUsedLimit = useCallback(
    async (creditCardId: string, usedLimit: number) => {
      const existingCard = creditCards.find((c) => c.$id === creditCardId);
      if (!existingCard) {
        throw new Error('Credit card not found');
      }

      const optimisticCard: CreditCard = {
        ...existingCard,
        used_limit: usedLimit,
        $updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update optimistically
      startTransition(() => {
        addOptimisticUpdate({ type: 'update', card: optimisticCard });
      });

      try {
        setError(null);
        const response = await fetch(`/api/credit-cards/${creditCardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ used_limit: usedLimit }),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update used limit');
        }

        const updatedCard = await response.json();

        // Update with real data
        setCreditCards((prev) => prev.map((c) => (c.$id === creditCardId ? updatedCard : c)));

        // Invalidate cache
        invalidateCache.creditCards(user.$id);

        return updatedCard;
      } catch (err: any) {
        console.error('Error updating used limit:', err);
        setError(err.message || 'Failed to update used limit');
        // Rollback optimistic update
        setCreditCards((prev) => prev.map((c) => (c.$id === creditCardId ? existingCard : c)));
        throw err;
      }
    },
    [creditCards, addOptimisticUpdate, startTransition, user.$id],
  );

  return {
    creditCards: optimisticCreditCards,
    loading: loading || isPending,
    error,
    fetchCreditCards,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    updateUsedLimit,
  };
}
