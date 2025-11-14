'use client';

import { getAppwriteBrowserClient } from '@/lib/appwrite/client-browser';
import { useEffect, useRef } from 'react';

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

// Global state para subscrição compartilhada
let globalSubscription: (() => void) | null = null;
let globalChannels: Set<string> = new Set();
let globalCallbacks: Map<string, Set<(response: RealtimeMessage) => void>> = new Map();
let isInitialized = false;

function initializeGlobalSubscription() {
  if (isInitialized) return;

  try {
    const client = getAppwriteBrowserClient();
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

    if (!databaseId) {
      console.warn('Database ID not configured, realtime disabled');
      return;
    }

    // Subscreve a todos os canais de uma vez
    const allChannels = [
      `databases.${databaseId}.collections.credit_cards.documents`,
      `databases.${databaseId}.collections.credit_card_bills.documents`,
      `databases.${databaseId}.collections.credit_card_transactions.documents`,
      `databases.${databaseId}.collections.accounts.documents`,
      `databases.${databaseId}.collections.transactions.documents`,
      `databases.${databaseId}.collections.invoices.documents`,
      `databases.${databaseId}.collections.sharing_relationships.documents`,
    ];

    const unsubscribe = client.subscribe(allChannels, (response: RealtimeMessage) => {
      // Chama todos os callbacks registrados para os canais afetados
      response.channels.forEach((channel) => {
        const callbacks = globalCallbacks.get(channel);
        if (callbacks) {
          callbacks.forEach((callback) => callback(response));
        }
      });
    });

    globalSubscription = unsubscribe;
    isInitialized = true;
    console.log('✅ Global realtime subscription initialized');
  } catch (error) {
    console.error('❌ Error initializing global realtime subscription:', error);
  }
}

/**
 * Hook genérico para subscrever a eventos realtime do Appwrite
 * Usa uma subscrição global compartilhada para evitar múltiplas conexões
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
  const callbackRef = useRef<((response: RealtimeMessage<T>) => void) | undefined>(undefined);

  useEffect(() => {
    if (!enabled || channels.length === 0) {
      return;
    }

    // Inicializa subscrição global se necessário
    if (!isInitialized) {
      initializeGlobalSubscription();
    }

    // Cria callback para este hook
    const callback = (response: RealtimeMessage<T>) => {
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
    };

    callbackRef.current = callback;

    // Registra callback para cada canal
    channels.forEach((channel) => {
      if (!globalCallbacks.has(channel)) {
        globalCallbacks.set(channel, new Set());
      }
      globalCallbacks.get(channel)!.add(callback as any);
      globalChannels.add(channel);
    });

    // Cleanup
    return () => {
      channels.forEach((channel) => {
        const callbacks = globalCallbacks.get(channel);
        if (callbacks && callbackRef.current) {
          callbacks.delete(callbackRef.current as any);
          if (callbacks.size === 0) {
            globalCallbacks.delete(channel);
            globalChannels.delete(channel);
          }
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.join(','), enabled]);
}

/**
 * Função para desinscrever da subscrição global (usar no logout)
 */
export function unsubscribeGlobalRealtime() {
  if (globalSubscription) {
    globalSubscription();
    globalSubscription = null;
    isInitialized = false;
    globalChannels.clear();
    globalCallbacks.clear();
    console.log('🔌 Global realtime subscription closed');
  }
}
