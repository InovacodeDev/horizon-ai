import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { requireAuth } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

/**
 * GET /api/credit-cards/bills
 * List credit card bills with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const creditCardId = searchParams.get('creditCardId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const databases = getAppwriteDatabases();
    const queries: any[] = [Query.equal('user_id', user.sub), Query.orderDesc('due_date'), Query.limit(100)];

    if (creditCardId) {
      queries.push(Query.equal('credit_card_id', creditCardId));
    }

    if (status) {
      queries.push(Query.equal('status', status));
    }

    if (startDate) {
      queries.push(Query.greaterThanEqual('due_date', startDate));
    }

    if (endDate) {
      queries.push(Query.lessThanEqual('due_date', endDate));
    }

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARD_BILLS, queries);

    return NextResponse.json({
      bills: response.documents,
      total: response.total,
    });
  } catch (error: any) {
    console.error('Error fetching credit card bills:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bills' },
      { status: error.code === 401 ? 401 : 500 },
    );
  }
}
