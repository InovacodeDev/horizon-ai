import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const databases = getAppwriteDatabases();
    const { id } = await params;

    // Fetch shopping list
    const list = await databases.getDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LISTS, id);

    if (!list) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    // Verify ownership
    if (list.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch list items
    const { documents: items } = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SHOPPING_LIST_ITEMS, [
      Query.equal('shopping_list_id', id),
      Query.orderAsc('product_name'),
    ]);

    return NextResponse.json({
      list,
      items,
    });
  } catch (error: any) {
    console.error('Error fetching shopping list:', error);
    return NextResponse.json({ error: 'Failed to fetch shopping list' }, { status: 500 });
  }
}
