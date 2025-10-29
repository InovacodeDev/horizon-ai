'use client';

import type { CreateCreditCardDto, CreditCard, UpdateCreditCardDto } from '@/lib/types';
import { cacheManager, getCacheKey, invalidateCache } from '@/lib/utils/cache';
import { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react';

interface UseCreditCardsOptions {
  accountId?: string | null;
  initialCreditCards?: CreditCard[];
}

/**
 * Hook for managing credit cards with React 19.2 optimistic updates
 */
export function useCreditCards(options: UseCreditCardsOptions = {}) {
  const { accountId, initialCreditCards } = options;
  const [creditCards, setCreditCards] = useState<CreditCard[]>(initialCreditCards || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      if (!accountId) {
        setCreditCards([]);
        setLoading(false);
        return;
      }

      try {
        // Check cache first
        if (!skipCache) {
          const cacheKey = getCacheKey.creditCards('user');
          const cached = cacheManager.get<CreditCard[]>(cacheKey);

          if (cached) {
            setCreditCards(cached);
            setLoading(false);
            return;
          }
        }

        setLoading(true);
        setError(null);

        const response = await fetch(`/api/credit-cards/account/${accountId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch credit cards');
        }

        const data = await response.json();
        setCreditCards(data);

        // Cache the result
        const cacheKey = getCacheKey.creditCards('user');
        cacheManager.set(cacheKey, data);
      } catch (err: any) {
        console.error('Error fetching credit cards:', err);
        setError(err.message || 'Failed to fetch credit cards');
      } finally {
        setLoading(false);
      }
    },
    [accountId],
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (accountId && !initialCreditCards) {
      fetchCreditCards();
    }
  }, [accountId, initialCreditCards, fetchCreditCards]);

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
        invalidateCache.creditCards('user');

        return newCard;
      } catch (err: any) {
        console.error('Error creating credit card:', err);
        setError(err.message || 'Failed to create credit card');
        // Rollback optimistic update
        setCreditCards((prev) => prev.filter((c) => c.$id !== tempId));
        throw err;
      }
    },
    [addOptimisticUpdate, startTransition],
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
        invalidateCache.creditCards('user');

        return updatedCard;
      } catch (err: any) {
        console.error('Error updating credit card:', err);
        setError(err.message || 'Failed to update credit card');
        // Rollback optimistic update
        setCreditCards((prev) => prev.map((c) => (c.$id === creditCardId ? existingCard : c)));
        throw err;
      }
    },
    [creditCards, addOptimisticUpdate, startTransition],
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
        invalidateCache.creditCards('user');
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
        invalidateCache.creditCards('user');

        return updatedCard;
      } catch (err: any) {
        console.error('Error updating used limit:', err);
        setError(err.message || 'Failed to update used limit');
        // Rollback optimistic update
        setCreditCards((prev) => prev.map((c) => (c.$id === creditCardId ? existingCard : c)));
        throw err;
      }
    },
    [creditCards, addOptimisticUpdate, startTransition],
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
