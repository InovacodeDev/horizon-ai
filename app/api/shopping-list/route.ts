/**
 * GET /api/shopping-list
 * Get user's shopping lists
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

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SHOPPING_LISTS, [
      Query.equal('user_id', userId),
      Query.orderDesc('created_at'),
      Query.limit(50),
    ]);

    return NextResponse.json({
      lists: response.documents,
      total: response.total,
    });
  } catch (error) {
    console.error('Error fetching shopping lists:', error);
    return NextResponse.json({ error: 'Failed to fetch shopping lists' }, { status: 500 });
  }
}
