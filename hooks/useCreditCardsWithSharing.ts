'use client';

import type { CreditCardWithOwnership } from '@/lib/types/sharing.types';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseCreditCardsWithSharingOptions {
  enableRealtime?: boolean;
}

/**
 * Hook for managing credit cards with sharing support
 * Fetches both own and shared credit cards with ownership metadata
 */
export function useCreditCardsWithSharing(options: UseCreditCardsWithSharingOptions = {}) {
  const { enableRealtime = true } = options;
  const [creditCards, setCreditCards] = useState<CreditCardWithOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchCreditCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sharing/credit-cards', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credit cards with sharing');
      }

      const data = await response.json();
      setCreditCards(data.data || []);
      setInitialized(true);
    } catch (err: any) {
      console.error('Error fetching credit cards with sharing:', err);
      setError(err.message || 'Failed to fetch credit cards');
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      fetchCreditCards();
    }
  }, [initialized, fetchCreditCards]);

  // Setup realtime subscription for credit cards
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.credit_cards.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: () => {
      fetchCreditCards();
    },
    onCreate: () => {
      fetchCreditCards();
    },
    onDelete: () => {
      fetchCreditCards();
    },
  });

  // Setup realtime subscription for sharing relationships
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.sharing_relationships.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: () => {
      fetchCreditCards();
    },
    onCreate: () => {
      fetchCreditCards();
    },
    onDelete: () => {
      fetchCreditCards();
    },
  });

  return {
    creditCards,
    loading,
    error,
    refetch: fetchCreditCards,
  };
}
