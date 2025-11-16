/**
 * GET /api/shopping-list/requests
 * Get user's shopping list requests (async queue status)
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const databases = getAppwriteDatabases();

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SHOPPING_LIST_REQUESTS, [
      Query.equal('user_id', userId),
      Query.orderDesc('created_at'),
      Query.limit(50),
    ]);

    return NextResponse.json({
      requests: response.documents,
      total: response.total,
    });
  } catch (error) {
    console.error('Error fetching shopping list requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}
