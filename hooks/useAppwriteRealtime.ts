'use client';

import { getAppwriteBrowserClient } from '@/lib/appwrite/client-browser';
import { useEffect, useRef } from 'react';

type RealtimeEvent = 'create' | 'update' | 'delete';

interface RealtimeMessage<T = any> {
  events: string[];
  channels: string[];
  timestamp: number;
  payload: T;
}

interface UseAppwriteRealtimeOptions<T = any> {
  channels: string[];
  onMessage?: (message: RealtimeMessage<T>) => void;
  onCreate?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: T) => void;
  enabled?: boolean;
}

/**
 * Hook genérico para subscrever a eventos realtime do Appwrite
 *
 * @example
 * ```tsx
 * useAppwriteRealtime({
 *   channels: [`databases.${databaseId}.collections.${collectionId}.documents`],
 *   onCreate: (payload) => console.log('Created:', payload),
 *   onUpdate: (payload) => console.log('Updated:', payload),
 *   onDelete: (payload) => console.log('Deleted:', payload),
 * });
 * ```
 */
export function useAppwriteRealtime<T = any>(options: UseAppwriteRealtimeOptions<T>) {
  const { channels, onMessage, onCreate, onUpdate, onDelete, enabled = true } = options;
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || channels.length === 0) {
      return;
    }

    try {
      const client = getAppwriteBrowserClient();

      // Subscribe to realtime events
      const unsubscribe = client.subscribe(channels, (response: RealtimeMessage<T>) => {
        // Call generic message handler
        if (onMessage) {
          onMessage(response);
        }

        // Determine event type and call specific handlers
        const events = response.events || [];

        if (events.some((e) => e.includes('.create'))) {
          onCreate?.(response.payload);
        } else if (events.some((e) => e.includes('.update'))) {
          onUpdate?.(response.payload);
        } else if (events.some((e) => e.includes('.delete'))) {
          onDelete?.(response.payload);
        }
      });

      unsubscribeRef.current = unsubscribe;

      console.log('✅ Subscribed to realtime channels:', channels);
    } catch (error) {
      console.error('❌ Error subscribing to realtime:', error);
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        console.log('🔌 Unsubscribed from realtime channels:', channels);
      }
    };
  }, [channels.join(','), enabled, onMessage, onCreate, onUpdate, onDelete]);
}
