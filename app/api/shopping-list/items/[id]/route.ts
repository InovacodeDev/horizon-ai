import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const databases = getAppwriteDatabases();
    const { id } = await params;

    // Fetch item to verify ownership
    const item = await databases.getDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LIST_ITEMS, id);

    // Fetch parent shopping list to verify ownership
    const list = await databases.getDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LISTS, item?.shopping_list_id);

    if (list?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { quantity, actual_price, checked } = body;

    // Update item
    const updateData: Record<string, any> = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (actual_price !== undefined) updateData.actual_price = actual_price;
    if (checked !== undefined) updateData.checked = checked;

    const updatedItem = await databases.updateDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LIST_ITEMS, id, updateData);

    return NextResponse.json({ item: updatedItem });
  } catch (error: any) {
    console.error('Error updating shopping list item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const databases = getAppwriteDatabases();
    const { id } = await params;

    // Fetch item to verify ownership
    const item = await databases.getDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LIST_ITEMS, id);

    // Fetch parent shopping list to verify ownership
    const list = await databases.getDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LISTS, item?.shopping_list_id);

    if (list?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete item
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LIST_ITEMS, id);

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting shopping list item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
