'use client';

import type { TransactionWithOwnership } from '@/lib/types/sharing.types';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseTransactionsWithSharingOptions {
  enableRealtime?: boolean;
  filters?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
  };
}

/**
 * Hook for managing transactions with sharing support
 * Fetches both own and shared transactions with ownership metadata
 */
export function useTransactionsWithSharing(options: UseTransactionsWithSharingOptions = {}) {
  const { enableRealtime = true, filters } = options;
  const [transactions, setTransactions] = useState<TransactionWithOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      const url = `/api/sharing/transactions${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions with sharing');
      }

      const data = await response.json();
      setTransactions(data.data || []);
      setInitialized(true);
    } catch (err: any) {
      console.error('Error fetching transactions with sharing:', err);
      setError(err.message || 'Failed to fetch transactions');
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!initialized) {
      fetchTransactions();
    }
  }, [initialized, fetchTransactions]);

  // Refetch when filters change
  useEffect(() => {
    if (initialized) {
      fetchTransactions();
    }
  }, [filters, fetchTransactions, initialized]);

  // Setup realtime subscription for transactions
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.transactions.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: () => {
      fetchTransactions();
    },
    onCreate: () => {
      fetchTransactions();
    },
    onDelete: () => {
      fetchTransactions();
    },
  });

  // Setup realtime subscription for sharing relationships
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.sharing_relationships.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: () => {
      fetchTransactions();
    },
    onCreate: () => {
      fetchTransactions();
    },
    onDelete: () => {
      fetchTransactions();
    },
  });

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}
