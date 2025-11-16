'use client';

import { DATABASE_ID } from '@/lib/appwrite/schema';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface Notification {
  $id: string;
  user_id: string;
  type: 'shopping_list_completed' | 'shopping_list_error' | 'sharing_invitation' | 'system';
  title: string;
  message: string;
  read: boolean;
  read_at?: string;
  action_url?: string;
  related_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications?unread=false&limit=20', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime updates
  useAppwriteRealtime({
    channels: [`databases.${DATABASE_ID}.collections.notifications.documents`],
    onCreate: (payload) => {
      // Adiciona nova notificação se for do usuário atual
      if (payload.user_id === userId) {
        console.log('Realtime: New notification', payload);
        setNotifications((prev) => [payload, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Opcional: Mostrar notificação do navegador
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.title, {
            body: payload.message,
            icon: '/favicon.ico',
          });
        }
      }
    },
    onUpdate: (payload) => {
      // Atualiza notificação existente
      if (payload.user_id === userId) {
        console.log('Realtime: Notification updated', payload);
        setNotifications((prev) => prev.map((n) => (n.$id === payload.$id ? { ...n, ...payload } : n)));

        // Atualiza contador de não lidas
        fetchUnreadCount();
      }
    },
    onDelete: (payload) => {
      // Remove notificação
      console.log('Realtime: Notification deleted', payload);
      setNotifications((prev) => prev.filter((n) => n.$id !== payload.$id));
      fetchUnreadCount();
    },
    enabled: !!userId,
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.$id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    fetchNotifications,
    requestPermission,
  };
}
