'use client';

import { invalidateCache } from '@/lib/utils/cache';
import { useCallback } from 'react';

/**
 * Hook for invalidating cache after mutations
 * Use this in API route handlers or after successful mutations
 */
export function useCacheInvalidation() {
  const invalidateTransactions = useCallback((userId: string) => {
    invalidateCache.transactions(userId);
  }, []);

  const invalidateAccounts = useCallback((userId: string) => {
    invalidateCache.accounts(userId);
  }, []);

  const invalidateCreditCards = useCallback((userId: string) => {
    invalidateCache.creditCards(userId);
  }, []);

  const invalidateCreditCardTransactions = useCallback(() => {
    invalidateCache.creditCardTransactions();
  }, []);

  const invalidateAll = useCallback((userId: string) => {
    invalidateCache.all(userId);
  }, []);

  return {
    invalidateTransactions,
    invalidateAccounts,
    invalidateCreditCards,
    invalidateCreditCardTransactions,
    invalidateAll,
  };
}
