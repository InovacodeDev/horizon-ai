'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@/lib/contexts/UserContext';
import {
  BellIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
} from '@/components/assets/Icons';

export default function NotificationCenter() {
  const { user } = useUser();
  const { notifications, unreadCount, loading, markAsRead, requestPermission } = useNotifications(user?.$id);

  useEffect(() => {
    // Solicita permissão para notificações do navegador ao montar
    requestPermission();
  }, [requestPermission]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shopping_list_completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'shopping_list_error':
        return <AlertCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-on-surface-variant mt-1">
              {unreadCount} {unreadCount === 1 ? 'nova notificação' : 'novas notificações'}
            </p>
          )}
        </div>
        <div className="relative">
          <BellIcon className="w-6 h-6 text-on-surface-variant" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <Card className="p-8">
          <div className="text-center text-on-surface-variant">Carregando notificações...</div>
        </Card>
      )}

      {!loading && notifications.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <BellIcon className="w-16 h-16 mx-auto mb-4 text-on-surface-variant opacity-50" />
            <h3 className="text-lg font-semibold text-on-surface mb-2">Nenhuma notificação</h3>
            <p className="text-sm text-on-surface-variant">
              Você não tem notificações no momento
            </p>
          </div>
        </Card>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.$id}
              className={`p-4 transition-colors ${
                !notification.read
                  ? 'bg-primary/5 border-l-4 border-primary'
                  : 'bg-surface hover:bg-surface-container'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-on-surface">{notification.title}</h3>
                    <span className="text-xs text-on-surface-variant whitespace-nowrap">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {notification.action_url && (
                      <Button
                        onClick={() => {
                          markAsRead(notification.$id);
                          window.location.href = notification.action_url!;
                        }}
                        size="sm"
                        className="bg-primary text-on-primary text-xs"
                      >
                        Ver Detalhes
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead(notification.$id)}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Marcar como lida
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
