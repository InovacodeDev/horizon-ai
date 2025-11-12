'use client';

import { getAppwriteBrowserClient, getAppwriteBrowserDatabases } from '@/lib/appwrite/client-browser';
import type { Account } from '@/lib/types';
import { useEffect, useState } from 'react';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'horizon_ai_db';
const ACCOUNTS_COLLECTION = 'accounts';

interface UseAccountBalanceOptions {
  /**
   * Whether to enable realtime subscription
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback when balance updates
   */
  onBalanceUpdate?: (balance: number) => void;
  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;
}

interface UseAccountBalanceReturn {
  /**
   * Current account balance
   */
  balance: number | null;
  /**
   * Loading state (initial fetch)
   */
  loading: boolean;
  /**
   * Error state
   */
  error: Error | null;
  /**
   * Manually refresh the balance
   */
  refresh: () => Promise<void>;
}

/**
 * Hook for subscribing to account balance updates via Appwrite Realtime
 *
 * This hook automatically subscribes to account document updates and keeps
 * the balance in sync. It handles the subscription lifecycle, fetches the
 * initial balance, and provides error handling.
 *
 * @example
 * ```tsx
 * function AccountCard({ accountId }: { accountId: string }) {
 *   const { balance, loading, error } = useAccountBalance(accountId);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>Balance: {formatCurrency(balance)}</div>;
 * }
 * ```
 *
 * @param accountId - The account ID to subscribe to
 * @param options - Configuration options
 * @returns Account balance state and utilities
 */
export function useAccountBalance(accountId: string, options: UseAccountBalanceOptions = {}): UseAccountBalanceReturn {
  const { enabled = true, onBalanceUpdate, onError } = options;

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial balance
  const fetchBalance = async () => {
    if (!accountId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const databases = getAppwriteBrowserDatabases();
      const account = (await databases.getDocument(DATABASE_ID, ACCOUNTS_COLLECTION, accountId)) as Account;

      setBalance(account.balance);
      setLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch account balance');
      console.error('❌ Error fetching account balance:', error);
      setError(error);
      setLoading(false);
      onError?.(error);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    if (!accountId || !enabled) {
      setLoading(false);
      return;
    }

    // Fetch initial balance
    fetchBalance();

    // Subscribe to account document updates
    const client = getAppwriteBrowserClient();
    const channel = `databases.${DATABASE_ID}.collections.${ACCOUNTS_COLLECTION}.documents.${accountId}`;

    try {
      const unsubscribe = client.subscribe(channel, (response: any) => {
        try {
          const events = response.events || [];

          // Check if this is an update event
          if (events.some((e: string) => e.includes('.update'))) {
            const updatedAccount = response.payload as Account;
            console.log('📡 Realtime: account balance updated', {
              accountId: updatedAccount.$id,
              newBalance: updatedAccount.balance,
            });

            setBalance(updatedAccount.balance);
            onBalanceUpdate?.(updatedAccount.balance);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to process realtime update');
          console.error('❌ Error processing realtime update:', error);
          setError(error);
          onError?.(error);
        }
      });

      console.log('✅ Subscribed to account balance updates:', accountId);

      // Cleanup on unmount
      return () => {
        unsubscribe();
        console.log('🔌 Unsubscribed from account balance updates:', accountId);
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to subscribe to realtime updates');
      console.error('❌ Error subscribing to realtime:', error);
      setError(error);
      onError?.(error);
    }
  }, [accountId, enabled, onBalanceUpdate, onError]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}
