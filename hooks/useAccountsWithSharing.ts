'use client';

import type { AccountWithOwnership } from '@/lib/types/sharing.types';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseAccountsWithSharingOptions {
  enableRealtime?: boolean;
}

/**
 * Hook for managing bank accounts with sharing support
 * Fetches both own and shared accounts with ownership metadata
 */
export function useAccountsWithSharing(options: UseAccountsWithSharingOptions = {}) {
  const { enableRealtime = true } = options;
  const [accounts, setAccounts] = useState<AccountWithOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sharing/accounts', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts with sharing');
      }

      const data = await response.json();
      setAccounts(data.data || []);
      setInitialized(true);
    } catch (err: any) {
      console.error('Error fetching accounts with sharing:', err);
      setError(err.message || 'Failed to fetch accounts');
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      fetchAccounts();
    }
  }, [initialized, fetchAccounts]);

  // Setup realtime subscription for accounts
  useAppwriteRealtime({
    channels: [`databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.accounts.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: () => {
      // Refresh all accounts when any account is updated
      fetchAccounts();
    },
    onCreate: () => {
      // Refresh all accounts when a new account is created
      fetchAccounts();
    },
    onDelete: () => {
      // Refresh all accounts when an account is deleted
      fetchAccounts();
    },
  });

  // Setup realtime subscription for sharing relationships
  useAppwriteRealtime({
    channels: [`databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.sharing_relationships.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: () => {
      // Refresh accounts when sharing relationship changes
      fetchAccounts();
    },
    onCreate: () => {
      // Refresh accounts when new sharing relationship is created
      fetchAccounts();
    },
    onDelete: () => {
      // Refresh accounts when sharing relationship is terminated
      fetchAccounts();
    },
  });

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
  };
}
