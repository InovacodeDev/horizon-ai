'use client';

import { useUser } from '@/lib/contexts/UserContext';
import type { Account } from '@/lib/types';
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
  const { user } = useUser();
  const [accounts, setAccounts] = useState<AccountWithOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch directly from Appwrite
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

      if (!databaseId) {
        throw new Error('Database ID not configured');
      }

      // Fetch user's own accounts
      const ownAccountsResult = await databases.listDocuments(databaseId, 'accounts', [
        Query.equal('user_id', user.$id),
        Query.orderDesc('created_at'),
      ]);

      const ownAccounts: AccountWithOwnership[] = (ownAccountsResult.documents as unknown as Account[]).map(
        (account) => ({
          ...account,
          ownerId: user.$id,
          ownerName: user.name,
          isOwn: true,
        }),
      );

      // Fetch sharing relationships where user is a member
      const sharingResult = await databases.listDocuments(databaseId, 'sharing_relationships', [
        Query.equal('member_user_id', user.$id),
        Query.equal('status', 'active'),
      ]);

      // For each sharing relationship, fetch the responsible user's accounts
      let sharedAccounts: AccountWithOwnership[] = [];

      if (sharingResult.documents.length > 0) {
        const responsibleUserIds = sharingResult.documents.map((rel: any) => rel.responsible_user_id);

        // Fetch accounts owned by responsible users
        const sharedAccountsResult = await databases.listDocuments(databaseId, 'accounts', [
          Query.equal('user_id', responsibleUserIds),
        ]);

        sharedAccounts = (sharedAccountsResult.documents as unknown as Account[]).map((account) => {
          const sharingRel = sharingResult.documents.find((rel: any) => rel.responsible_user_id === account.user_id);
          return {
            ...account,
            ownerId: account.user_id,
            ownerName: 'Shared User', // We don't have the owner name in the relationship
            isOwn: false,
          };
        });
      }

      // Combine own and shared accounts
      const allAccounts = [...ownAccounts, ...sharedAccounts];
      setAccounts(allAccounts);
      setInitialized(true);
    } catch (err: any) {
      console.error('Error fetching accounts with sharing:', err);
      setError(err.message || 'Failed to fetch accounts');
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [user.$id, user.name]);

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
