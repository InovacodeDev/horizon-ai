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

      // Fetch directly from Appwrite using the browser client
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

      if (!databaseId) {
        throw new Error('Database ID not configured');
      }

      // Fetch all credit cards (simplified - no sharing logic for now)
      const result = await databases.listDocuments(databaseId, 'credit_cards', [Query.orderDesc('created_at')]);

      // Note: This simplified version doesn't include sharing logic
      // For full sharing support, you would need to:
      // 1. Fetch user's own credit cards
      // 2. Fetch sharing relationships
      // 3. Fetch shared credit cards from related users
      // 4. Merge and deduplicate results
      const cardsData = result.documents.map((doc: any) => ({
        ...doc,
        isOwner: true, // Simplified - all are owner's cards
        ownerName: 'You',
      })) as CreditCardWithOwnership[];

      setCreditCards(cardsData);
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
