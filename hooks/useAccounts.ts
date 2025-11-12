'use client';

import type { Account, CreateAccountDto, UpdateAccountDto } from '@/lib/types';
import { cacheManager, getCacheKey, invalidateCache } from '@/lib/utils/cache';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseAccountsOptions {
  initialAccounts?: Account[];
  enableRealtime?: boolean;
}

/**
 * Hook for managing bank accounts with React 19.2 optimistic updates
 */
export function useAccounts(options: UseAccountsOptions = {}) {
  const { enableRealtime = true } = options;
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const initial = options.initialAccounts || [];
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [initialized, setInitialized] = useState(false);

  const fetchAccounts = useCallback(async (skipCache = false) => {
    try {
      // Check cache first
      if (!skipCache) {
        const cacheKey = getCacheKey.accounts('user');
        const cached = cacheManager.get<Account[]>(cacheKey);

        if (cached) {
          setAccounts(cached);
          setInitialized(true);
          return;
        }
      }

      setLoading(true);
      setError(null);

      const response = await fetch('/api/accounts', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data.data);

      // Cache the result
      const cacheKey = getCacheKey.accounts('user');
      cacheManager.set(cacheKey, data.data);

      setInitialized(true);
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError(err.message || 'Failed to fetch accounts');
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized && !options.initialAccounts) {
      fetchAccounts();
    }
  }, [initialized, options.initialAccounts, fetchAccounts]);

  const createAccount = useCallback(async (input: CreateAccountDto) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticAccount: Account = {
      $id: tempId,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      user_id: '',
      name: input.name,
      account_type: input.account_type,
      balance: 0,
      is_manual: input.is_manual ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bank_id: input.bank_id,
      last_digits: input.last_digits,
      status: input.status || 'Manual',
    };

    // Add optimistically
    setAccounts((prev) => [...prev, optimisticAccount]);

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
        const currentAccounts = Array.isArray(prev) ? prev : [];
        return [...currentAccounts.filter((a) => a.$id !== tempId), newAccount.data];
      });

      // Invalidate cache
      invalidateCache.accounts('user');

      return newAccount;
    } catch (err: any) {
      console.error('Error creating account:', err);
      setError(err.message || 'Failed to create account');
      // Rollback optimistic update
      setAccounts((prev) => {
        const currentAccounts = Array.isArray(prev) ? prev : [];
        return currentAccounts.filter((a) => a.$id !== tempId);
      });
      throw err;
    }
  }, []);

  const updateAccount = useCallback(async (accountId: string, input: UpdateAccountDto) => {
    let existingAccount: Account | undefined;

    setAccounts((prev) => {
      existingAccount = prev.find((a) => a.$id === accountId);
      if (!existingAccount) {
        return prev;
      }

      const optimisticAccount: Account = {
        ...existingAccount,
        ...input,
        $updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return prev.map((a) => (a.$id === accountId ? optimisticAccount : a));
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
      setAccounts((prev) => prev.map((a) => (a.$id === accountId ? updatedAccount : a)));

      // Invalidate cache
      invalidateCache.accounts('user');

      return updatedAccount;
    } catch (err: any) {
      console.error('Error updating account:', err);
      setError(err.message || 'Failed to update account');
      // Rollback optimistic update
      setAccounts((prev) => prev.map((a) => (a.$id === accountId ? existingAccount! : a)));
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async (accountId: string) => {
    let deletedAccount: Account | undefined;

    // Delete optimistically and capture the deleted account
    setAccounts((prev) => {
      deletedAccount = prev.find((a) => a.$id === accountId);
      return prev.filter((a) => a.$id !== accountId);
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

      // Invalidate cache
      invalidateCache.accounts('user');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account');
      // Rollback optimistic update
      if (deletedAccount) {
        setAccounts((prev) => [...prev, deletedAccount!]);
      }
      throw err;
    }
  }, []);

  const getAccountBalance = useCallback(async (accountId: string): Promise<number> => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get account balance');
      }

      const account = await response.json();
      return account.balance;
    } catch (err: any) {
      console.error('Error getting account balance:', err);
      throw err;
    }
  }, []);

  // Setup realtime subscription for accounts
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.accounts.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: (payload: any) => {
      console.log('📡 Realtime: account updated', payload.$id);
      // Update the account in the list
      setAccounts((prev) => {
        const index = prev.findIndex((a) => a.$id === payload.$id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...payload };
          return updated;
        }
        return prev;
      });
    },
    onCreate: (payload: any) => {
      console.log('📡 Realtime: account created', payload.$id);
      // Add new account to the list
      setAccounts((prev) => {
        // Check if account already exists (avoid duplicates)
        if (prev.some((a) => a.$id === payload.$id)) {
          return prev;
        }
        return [...prev, payload];
      });
    },
    onDelete: (payload: any) => {
      console.log('📡 Realtime: account deleted', payload.$id);
      // Remove account from the list
      setAccounts((prev) => prev.filter((a) => a.$id !== payload.$id));
    },
  });

  return {
    accounts,
    loading: loading || isPending,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountBalance,
  };
}
