'use client';

import type { Account, CreateAccountDto, UpdateAccountDto } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAccountsOptions {
  enableRealtime?: boolean;
  cacheTime?: number; // milliseconds
}

const CACHE_KEY = 'accounts_cache';
const CACHE_TIMESTAMP_KEY = 'accounts_cache_timestamp';

/**
 * Hook for managing bank accounts with cache and realtime updates
 */
export function useAccountsWithCache(options: UseAccountsOptions = {}) {
  const { enableRealtime = true, cacheTime = 5 * 60 * 1000 } = options; // 5 minutes default

  const [accounts, setAccounts] = useState<Account[]>(() => {
    // Try to load from cache
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < cacheTime) {
            return JSON.parse(cached);
          }
        }
      } catch (err) {
        console.error('Error loading cache:', err);
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save to cache
  const saveToCache = useCallback((data: Account[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (err) {
        console.error('Error saving to cache:', err);
      }
    }
  }, []);

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

  // Setup realtime polling (simple implementation)
  useEffect(() => {
    if (!enableRealtime || !initialized) return;

    // Poll every 30 seconds for updates
    pollingIntervalRef.current = setInterval(() => {
      fetchAccounts(true); // Silent fetch
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
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

  const invalidateCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    }
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
    invalidateCache,
  };
}
