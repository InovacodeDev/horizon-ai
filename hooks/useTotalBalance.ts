'use client';

import { useMemo } from 'react';

import { useAccounts } from './useAccounts';

interface UseTotalBalanceOptions {
  initialBalance?: number;
}

/**
 * Hook for calculating total balance across all accounts
 * Uses useAccounts hook with realtime updates
 */
export function useTotalBalance(options: UseTotalBalanceOptions = {}) {
  const { accounts, loading, error, fetchAccounts } = useAccounts();

  // Calculate total balance from accounts
  const totalBalance = useMemo(() => {
    if (accounts.length === 0 && options.initialBalance !== undefined) {
      return options.initialBalance;
    }
    return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  }, [accounts, options.initialBalance]);

  return {
    totalBalance,
    loading,
    error,
    refreshTotalBalance: fetchAccounts,
  };
}
