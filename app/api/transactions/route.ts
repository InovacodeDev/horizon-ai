import { getCurrentUserId } from '@/lib/auth/session';
import { TransactionService } from '@/lib/services/transaction.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/transactions
 * List transactions for the authenticated user with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Build filters from query params
    const filters: any = {
      userId,
    };

    // Type filter
    const type = searchParams.get('type');
    if (type && ['income', 'expense', 'transfer'].includes(type)) {
      filters.type = type;
    }

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      filters.category = category;
    }

    // Status filter
    const status = searchParams.get('status');
    if (status && ['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      filters.status = status;
    }

    // Source filter
    const source = searchParams.get('source');
    if (source && ['manual', 'integration', 'import'].includes(source)) {
      filters.source = source;
    }

    // Date range filters
    const startDate = searchParams.get('startDate');
    if (startDate) {
      filters.startDate = startDate;
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      filters.endDate = endDate;
    }

    // Amount range filters
    const minAmount = searchParams.get('minAmount');
    if (minAmount) {
      const parsed = parseFloat(minAmount);
      if (!isNaN(parsed)) {
        filters.minAmount = parsed;
      }
    }

    const maxAmount = searchParams.get('maxAmount');
    if (maxAmount) {
      const parsed = parseFloat(maxAmount);
      if (!isNaN(parsed)) {
        filters.maxAmount = parsed;
      }
    }

    // Search filter
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Credit card filter
    const creditCardId = searchParams.get('credit_card_id');
    if (creditCardId) {
      filters.creditCardId = creditCardId;
    }

    // Pagination
    const limit = searchParams.get('limit');
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        filters.limit = parsed;
      }
    }

    const offset = searchParams.get('offset');
    if (offset) {
      const parsed = parseInt(offset, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        filters.offset = parsed;
      }
    }

    // Fetch transactions
    const transactionService = new TransactionService();
    const result = await transactionService.listTransactions(filters);

    return NextResponse.json({
      success: true,
      data: result.transactions,
      total: result.total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });
  } catch (error: any) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch transactions',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/transactions
 * Create a new transaction for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.amount || typeof body.amount !== 'number') {
      return NextResponse.json({ message: 'Amount is required and must be a number' }, { status: 400 });
    }

    if (!body.type || !['income', 'expense', 'transfer'].includes(body.type)) {
      return NextResponse.json({ message: 'Valid type is required (income, expense, transfer)' }, { status: 400 });
    }

    if (!body.category) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 });
    }

    if (!body.date) {
      return NextResponse.json({ message: 'Date is required' }, { status: 400 });
    }

    // Create transaction
    const transactionService = new TransactionService();
    const transaction = await transactionService.createManualTransaction({
      userId,
      amount: Math.abs(body.amount),
      type: body.type,
      category: body.category,
      description: body.description,
      date: body.date,
      currency: body.currency || 'BRL',
      accountId: body.account_id,
      creditCardId: body.credit_card_id,
      merchant: body.merchant,
      tags: body.tags,
      location: body.location,
      receiptUrl: body.receipt_url,
      isRecurring: body.is_recurring,
      recurringPattern: body.recurring_pattern,
      status: body.status || 'completed',
    });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create transaction',
      },
      { status: 500 },
    );
  }
}
