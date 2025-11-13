import { getCurrentUserId } from '@/lib/auth/session';
import { TransactionService } from '@/lib/services/transaction.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/transactions
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All transaction data should be fetched via the `useTransactions` hook which uses
 * Appwrite Realtime for automatic updates. This eliminates the need for polling
 * and provides instant updates across all clients.
 *
 * Migration guide:
 * - Replace `fetch('/api/transactions')` with `useTransactions()` hook
 * - Remove manual refetch logic
 * - Remove loading states for refetch (keep only initial loading)
 *
 * @see hooks/useTransactions.ts
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message: 'This endpoint is deprecated. Use Appwrite Realtime subscriptions via useTransactions hook instead.',
      migration: {
        hook: 'useTransactions',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 }, // 410 Gone
  );
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
      status: body.status || 'pending',
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
