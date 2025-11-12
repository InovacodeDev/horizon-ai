import { getCurrentUserId } from '@/lib/auth/session';
import { DataAccessService, TransactionFilters } from '@/lib/services/data-access.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sharing/transactions
 * Get all transactions accessible by the current user (own + shared)
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from session
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse filters from query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: TransactionFilters = {};

    if (searchParams.has('type')) {
      filters.type = searchParams.get('type') as any;
    }
    if (searchParams.has('category')) {
      filters.category = searchParams.get('category') || undefined;
    }
    if (searchParams.has('status')) {
      filters.status = searchParams.get('status') as any;
    }
    if (searchParams.has('startDate')) {
      filters.startDate = searchParams.get('startDate') || undefined;
    }
    if (searchParams.has('endDate')) {
      filters.endDate = searchParams.get('endDate') || undefined;
    }
    if (searchParams.has('minAmount')) {
      filters.minAmount = parseFloat(searchParams.get('minAmount') || '0');
    }
    if (searchParams.has('maxAmount')) {
      filters.maxAmount = parseFloat(searchParams.get('maxAmount') || '0');
    }
    if (searchParams.has('search')) {
      filters.search = searchParams.get('search') || undefined;
    }
    if (searchParams.has('creditCardId')) {
      filters.creditCardId = searchParams.get('creditCardId') || undefined;
    }
    if (searchParams.has('accountId')) {
      filters.accountId = searchParams.get('accountId') || undefined;
    }

    // Fetch accessible transactions using DataAccessService
    const dataAccessService = new DataAccessService();
    const transactions = await dataAccessService.getAccessibleTransactions(userId, filters);

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Error fetching accessible transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transactions',
      },
      { status: 500 },
    );
  }
}
