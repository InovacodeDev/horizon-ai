import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { ID, Query } from 'node-appwrite';

/**
 * POST /api/shopping-list/generate-ai
 * Create an async request for AI shopping list generation
 * The Appwrite Function will process the request in the background
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        { status: 401 },
      );
    }

    const databases = getAppwriteDatabases();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Category is required',
        },
        { status: 400 },
      );
    }

    const category = body.category as
      | 'pharmacy'
      | 'groceries'
      | 'supermarket'
      | 'restaurant'
      | 'fuel'
      | 'retail'
      | 'services'
      | 'other';

    // Get historical months (default to 12 months)
    const historicalMonths =
      body.historicalMonths && typeof body.historicalMonths === 'number' ? body.historicalMonths : 12;

    // Quick validation: Check if user has invoices in this category
    const invoicesResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, [
      Query.equal('user_id', userId),
      Query.equal('category', category),
      Query.limit(1), // Just check if any exist
    ]);

    if (!invoicesResponse.documents || invoicesResponse.documents.length === 0) {
      return NextResponse.json(
        {
          error: 'NO_HISTORY',
          message: `Nenhuma nota fiscal encontrada na categoria "${category}". Adicione notas fiscais para gerar listas inteligentes.`,
        },
        { status: 400 },
      );
    }

    console.log(`Creating async request for user ${userId}, category ${category}`);

    // Create shopping list request (async queue)
    const now = new Date().toISOString();
    const requestData = {
      user_id: userId,
      category,
      status: 'pending',
      historical_months: historicalMonths,
      metadata: JSON.stringify({
        requested_at: now,
        category_label: getCategoryLabel(category),
      }),
      created_at: now,
      updated_at: now,
    };

    const shoppingListRequest = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SHOPPING_LIST_REQUESTS,
      ID.unique(),
      requestData,
    );

    console.log(`Created shopping list request ${shoppingListRequest.$id}`);

    // Return immediately with request ID
    return NextResponse.json({
      success: true,
      data: {
        request_id: shoppingListRequest.$id,
        status: 'pending',
        message: 'Sua lista está sendo gerada. Você receberá uma notificação quando estiver pronta.',
        category,
        estimated_processing_time: '30-60 segundos',
      },
    });
  } catch (error: any) {
    console.error('POST /api/shopping-list/generate-ai error:', error);

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Erro ao criar requisição. Tente novamente.',
        details: error.message || String(error),
      },
      { status: 500 },
    );
  }
}

// Helper function to get category label
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    pharmacy: 'Farmácia',
    groceries: 'Mercearia',
    supermarket: 'Supermercado',
    restaurant: 'Restaurante',
    fuel: 'Combustível',
    retail: 'Varejo',
    services: 'Serviços',
    other: 'Outros',
  };
  return labels[category] || category;
}
