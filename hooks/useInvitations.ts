'use client';

import { getAppwriteBrowserClient } from '@/lib/appwrite/client-browser';
import type { SharingInvitation } from '@/lib/appwrite/schema';
import { useCallback, useEffect, useState } from 'react';

interface UseInvitationsOptions {
  userId?: string | null;
  initialInvitations?: SharingInvitation[];
}

/**
 * Hook for managing invitations with Appwrite Realtime updates
 *
 * Automatically subscribes to invitation collection changes and updates
 * the UI when invitation status changes (e.g., when expired by Appwrite Function)
 */
export function useInvitations(options: UseInvitationsOptions = {}) {
  const { userId, initialInvitations } = options;
  const [invitations, setInvitations] = useState<SharingInvitation[]>(initialInvitations || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/family/invitations', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();

      if (data.success !== false) {
        setInvitations(data.invitations || []);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(err.message || 'Failed to fetch invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-fetch on mount if no initial data
  useEffect(() => {
    if (userId && !initialInvitations) {
      fetchInvitations();
    }
  }, [userId, initialInvitations, fetchInvitations]);

  // Setup realtime subscription for invitations
  useEffect(() => {
    if (!userId) return;

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
    if (!databaseId) {
      console.warn('APPWRITE_DATABASE_ID not set, realtime disabled for invitations');
      return;
    }

    try {
      const client = getAppwriteBrowserClient();

      const channels = [`databases.${databaseId}.collections.sharing_invitations.documents`];

      const unsubscribe = client.subscribe(channels, (response: any) => {
        const events = response.events || [];
        const payload = response.payload as SharingInvitation;

        console.log('📡 Realtime event received for invitations:', events);

        // Only process events for the current user (as responsible user)
        if (payload.responsible_user_id !== userId) {
          return;
        }

        // Handle create events
        if (events.some((e: string) => e.includes('.create'))) {
          console.log('➕ Invitation created:', payload.$id);
          setInvitations((prev) => {
            // Avoid duplicates
            if (prev.some((inv) => inv.$id === payload.$id)) {
              return prev;
            }
            return [payload, ...prev];
          });
        }
        // Handle update events (e.g., status changed to expired)
        else if (events.some((e: string) => e.includes('.update'))) {
          console.log('✏️ Invitation updated:', payload.$id, 'Status:', payload.status);
          setInvitations((prev) => prev.map((inv) => (inv.$id === payload.$id ? payload : inv)));
        }
        // Handle delete events
        else if (events.some((e: string) => e.includes('.delete'))) {
          console.log('🗑️ Invitation deleted:', payload.$id);
          setInvitations((prev) => prev.filter((inv) => inv.$id !== payload.$id));
        }
      });

      console.log('✅ Subscribed to invitations realtime updates');

      return () => {
        unsubscribe();
        console.log('🔌 Unsubscribed from invitations realtime');
      };
    } catch (error) {
      console.error('❌ Error setting up realtime for invitations:', error);
      setError('Failed to setup realtime updates');
    }
  }, [userId]);

  const refetch = useCallback(() => {
    return fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    refetch,
  };
}
