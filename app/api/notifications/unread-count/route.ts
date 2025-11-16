/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
import { getUserFromSession } from '@/lib/auth/session';
import { getUnreadCount } from '@/lib/services/notification.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getUnreadCount(user.$id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
