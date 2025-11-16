import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { getCurrentUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { ID, Query } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;

const COLLECTIONS = {
  SHOPPING_LISTS: 'shopping_lists',
  SHOPPING_LIST_ITEMS: 'shopping_list_items',
  PRODUCTS: 'products',
};

interface ManualListItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  category: string;
  subcategory?: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const databases = getAppwriteDatabases();

    const body = await request.json();
    const { title, category, estimated_total, items } = body as {
      title: string;
      category: string;
      estimated_total: number;
      items: ManualListItem[];
    };

    // Validação básica
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Criar a lista de compras
    const list = await databases.createDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LISTS, ID.unique(), {
      user_id: userId,
      title: title.trim(),
      category,
      source: 'manual',
      status: 'completed',
      estimated_total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Criar os itens da lista
    const itemPromises = items.map((item) =>
      databases.createDocument(DATABASE_ID, COLLECTIONS.SHOPPING_LIST_ITEMS, ID.unique(), {
        shopping_list_id: list.$id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price,
        category: item.category,
        subcategory: item.subcategory || null,
        checked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    );

    await Promise.all(itemPromises);

    return NextResponse.json(
      {
        success: true,
        list_id: list.$id,
        message: 'Shopping list created successfully',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating manual shopping list:', error);
    return NextResponse.json({ error: error.message || 'Failed to create shopping list' }, { status: 500 });
  }
}
