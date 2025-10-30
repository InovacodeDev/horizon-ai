'use client';

import type { Account, CreateAccountDto, UpdateAccountDto } from '@/lib/types';
import { cacheManager, getCacheKey, invalidateCache } from '@/lib/utils/cache';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAccountsOptions {
  enableRealtime?: boolean;
  cacheTime?: number; // milliseconds
}

/**
 * Hook for managing bank accounts with cache and realtime updates
 * Now uses centralized cache manager with 12h TTL
 */
export function useAccountsWithCache(options: UseAccountsOptions = {}) {
  const { enableRealtime = true, cacheTime = 12 * 60 * 60 * 1000 } = options; // 12 hours default

  const [accounts, setAccounts] = useState<Account[]>(() => {
    // Try to load from cache
    const cacheKey = getCacheKey.accounts('user');
    const cached = cacheManager.get<Account[]>(cacheKey);
    return cached || [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save to cache
  const saveToCache = useCallback(
    (data: Account[]) => {
      const cacheKey = getCacheKey.accounts('user');
      cacheManager.set(cacheKey, data, cacheTime);
    },
    [cacheTime],
  );

  const fetchAccounts = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);

        const response = await fetch('/api/accounts', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }

        const data = await response.json();
        const accountsData = data.data || [];

        setAccounts(accountsData);
        saveToCache(accountsData);
        setInitialized(true);

        return accountsData;
      } catch (err: any) {
        console.warn('Error fetching accounts:', err);
        setAccounts([]);
        setError(null);
        setInitialized(true);
        return [];
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [saveToCache],
  );

  // Initial fetch
  useEffect(() => {
    if (!initialized) {
      fetchAccounts();
    }
  }, [initialized, fetchAccounts]);

  // Setup realtime subscription
  useEffect(() => {
    if (!enableRealtime || !initialized) return;

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    if (!databaseId) {
      console.warn('NEXT_PUBLIC_APPWRITE_DATABASE_ID not set, falling back to polling');
      // Fallback to polling
      pollingIntervalRef.current = setInterval(() => {
        fetchAccounts(true);
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

      const channels = [`databases.${databaseId}.collections.accounts.documents`];

      const unsubscribe = client.subscribe(channels, (response: any) => {
        console.log('📡 Realtime event received for accounts:', response.events);

        // Refetch accounts on any change
        fetchAccounts(true);
      });

      console.log('✅ Subscribed to accounts realtime updates');

      return () => {
        unsubscribe();
        console.log('🔌 Unsubscribed from accounts realtime');
      };
    } catch (error) {
      console.error('❌ Error setting up realtime for accounts:', error);
      // Fallback to polling on error
      pollingIntervalRef.current = setInterval(() => {
        fetchAccounts(true);
      }, 30000);
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [enableRealtime, initialized, fetchAccounts]);

  const createAccount = useCallback(
    async (input: CreateAccountDto) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticAccount: Account = {
        $id: tempId,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        user_id: '',
        name: input.name,
        account_type: input.account_type,
        balance: input.initial_balance || 0,
        is_manual: input.is_manual ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bank_id: input.bank_id,
        last_digits: input.last_digits,
        status: input.status || 'Manual',
      };

      // Add optimistically
      setAccounts((prev) => {
        const updated = [...prev, optimisticAccount];
        saveToCache(updated);
        return updated;
      });

      try {
        setError(null);
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create account');
        }

        const newAccount = await response.json();

        // Update with real data
        setAccounts((prev) => {
          const updated = [...prev.filter((a) => a.$id !== tempId), newAccount.data];
          saveToCache(updated);
          return updated;
        });

        return newAccount;
      } catch (err: any) {
        console.error('Error creating account:', err);
        setError(err.message || 'Failed to create account');
        // Rollback optimistic update
        setAccounts((prev) => {
          const updated = prev.filter((a) => a.$id !== tempId);
          saveToCache(updated);
          return updated;
        });
        throw err;
      }
    },
    [saveToCache],
  );

  const updateAccount = useCallback(
    async (accountId: string, input: UpdateAccountDto) => {
      let existingAccount: Account | undefined;

      setAccounts((prev) => {
        existingAccount = prev.find((a) => a.$id === accountId);
        if (!existingAccount) return prev;

        const optimisticAccount: Account = {
          ...existingAccount,
          ...input,
          $updatedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updated = prev.map((a) => (a.$id === accountId ? optimisticAccount : a));
        saveToCache(updated);
        return updated;
      });

      if (!existingAccount) {
        throw new Error('Account not found');
      }

      try {
        setError(null);
        const response = await fetch(`/api/accounts/${accountId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update account');
        }

        const updatedAccount = await response.json();

        // Update with real data
        setAccounts((prev) => {
          const updated = prev.map((a) => (a.$id === accountId ? updatedAccount : a));
          saveToCache(updated);
          return updated;
        });

        return updatedAccount;
      } catch (err: any) {
        console.error('Error updating account:', err);
        setError(err.message || 'Failed to update account');
        // Rollback optimistic update
        setAccounts((prev) => {
          const updated = prev.map((a) => (a.$id === accountId ? existingAccount! : a));
          saveToCache(updated);
          return updated;
        });
        throw err;
      }
    },
    [saveToCache],
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      let deletedAccount: Account | undefined;

      // Delete optimistically
      setAccounts((prev) => {
        deletedAccount = prev.find((a) => a.$id === accountId);
        const updated = prev.filter((a) => a.$id !== accountId);
        saveToCache(updated);
        return updated;
      });

      try {
        setError(null);
        const response = await fetch(`/api/accounts/${accountId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete account');
        }
      } catch (err: any) {
        console.error('Error deleting account:', err);
        setError(err.message || 'Failed to delete account');
        // Rollback optimistic update
        if (deletedAccount) {
          setAccounts((prev) => {
            const updated = [...prev, deletedAccount!];
            saveToCache(updated);
            return updated;
          });
        }
        throw err;
      }
    },
    [saveToCache],
  );

  const invalidateCacheAndRefetch = useCallback(() => {
    invalidateCache.accounts('user');
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    invalidateCache: invalidateCacheAndRefetch,
  };
}
