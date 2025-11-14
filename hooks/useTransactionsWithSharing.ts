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

      // Fetch directly from Appwrite using the browser client
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

      if (!databaseId) {
        throw new Error('Database ID not configured');
      }

      // Build queries based on filters
      const queries = [];

      if (filters?.type) queries.push(Query.equal('type', filters.type));
      if (filters?.category) queries.push(Query.equal('category', filters.category));
      if (filters?.startDate) queries.push(Query.greaterThanEqual('date', filters.startDate));
      if (filters?.endDate) queries.push(Query.lessThanEqual('date', filters.endDate));
      if (filters?.minAmount) queries.push(Query.greaterThanEqual('amount', filters.minAmount));
      if (filters?.maxAmount) queries.push(Query.lessThanEqual('amount', filters.maxAmount));
      if (filters?.search) queries.push(Query.search('description', filters.search));

      // Default ordering by date descending
      queries.push(Query.orderDesc('date'));

      const result = await databases.listRows({databaseId, tableId: 'transactions', queries});

      // Note: This simplified version doesn't include sharing logic
      // For full sharing support, you would need to:
      // 1. Fetch user's own transactions
      // 2. Fetch sharing relationships
      // 3. Fetch shared transactions from related users
      // 4. Merge and deduplicate results
      const transactionsData = result.rows.map((doc: any) => ({
        ...doc,
        isOwner: true, // Simplified - all are owner's transactions
        ownerName: 'You',
      })) as TransactionWithOwnership[];

      setTransactions(transactionsData);
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
    channels: [`databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.transactions.documents`],
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
    channels: [`databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.sharing_relationships.documents`],
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
