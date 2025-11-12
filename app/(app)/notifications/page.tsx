'use client';

import React from 'react';
import { MOCK_NOTIFICATIONS } from '@/lib/constants';
import type { Notification } from '@/lib/types';
import { WarrantyIcon, AlertTriangleIcon, ListIcon } from '@/components/assets/Icons';

const NOTIFICATION_ICONS = {
  'Warranty Expiring Soon': <WarrantyIcon className="w-6 h-6 text-tertiary" />,
  'Large Purchase Alert': <AlertTriangleIcon className="w-6 h-6 text-error" />,
  'Weekly Summary Ready': <ListIcon className="w-6 h-6 text-primary" />,
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const icon = NOTIFICATION_ICONS[notification.title] || <ListIcon className="w-6 h-6 text-primary" />;
  return (
    <div
      className={`flex items-start gap-4 p-4 border-l-4 ${
        !notification.read ? 'bg-primary/5 border-primary' : 'border-transparent'
      }`}
    >
      <div className="mt-1">{icon}</div>
      <div className="flex-grow">
        <p className="font-medium text-on-surface">{notification.title}</p>
        <p className="text-sm text-on-surface-variant">{notification.description}</p>
      </div>
      <p className="text-xs text-on-surface-variant flex-shrink-0">{notification.date}</p>
    </div>
  );
};

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-normal text-on-surface">Notifications</h1>
        <p className="text-base text-on-surface-variant">Your latest financial alerts and updates.</p>
      </header>
      <main>
        <div className="bg-surface rounded-m shadow-sm overflow-hidden divide-y divide-outline">
          {MOCK_NOTIFICATIONS.map((notif: Notification) => (
            <NotificationItem key={notif.$id} notification={notif} />
          ))}
        </div>
      </main>
    </div>
  );
}
