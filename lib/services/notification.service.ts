/**
 * Notification Service
 *
 * Handles creation and retrieval of user notifications
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { ID, Query } from 'node-appwrite';

export interface Notification {
  $id: string;
  user_id: string;
  type: 'shopping_list_completed' | 'shopping_list_error' | 'sharing_invitation' | 'system';
  title: string;
  message: string;
  read: boolean;
  read_at?: string;
  action_url?: string;
  related_id?: string;
  metadata?: string;
  created_at: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateNotificationParams {
  user_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  action_url?: string;
  related_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new notification
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
  const databases = getAppwriteDatabases();

  const data = {
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    message: params.message,
    read: false,
    action_url: params.action_url || '',
    related_id: params.related_id || '',
    metadata: params.metadata ? JSON.stringify(params.metadata) : '',
    created_at: new Date().toISOString(),
  };

  const notification = await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), data);

  return notification as unknown as Notification;
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  },
): Promise<{ notifications: Notification[]; total: number }> {
  const databases = getAppwriteDatabases();

  const queries: string[] = [Query.equal('user_id', userId), Query.orderDesc('created_at')];

  if (options?.unreadOnly) {
    queries.push(Query.equal('read', false));
  }

  if (options?.limit) {
    queries.push(Query.limit(options.limit));
  }

  if (options?.offset) {
    queries.push(Query.offset(options.offset));
  }

  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, queries);

  return {
    notifications: response.documents as unknown as Notification[],
    total: response.total,
  };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const databases = getAppwriteDatabases();

  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
    Query.equal('user_id', userId),
    Query.equal('read', false),
  ]);

  return response.total;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const databases = getAppwriteDatabases();

  await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, notificationId, {
    read: true,
    read_at: new Date().toISOString(),
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { notifications } = await getUserNotifications(userId, { unreadOnly: true, limit: 100 });

  // Mark each notification as read
  await Promise.all(notifications.map((notification) => markNotificationAsRead(notification.$id)));
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const databases = getAppwriteDatabases();

  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, notificationId);
}
