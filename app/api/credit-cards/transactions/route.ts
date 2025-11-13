import { getCurrentUserId } from '@/lib/auth/session';
import { CreditCardTransactionService } from '@/lib/services/credit-card-transaction.service';
import { dateToUserTimezone } from '@/lib/utils/timezone';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/credit-cards/transactions
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All credit card transaction data should be fetched via the `useCreditCardTransactions` hook
 * which uses Appwrite Realtime for automatic updates.
 *
 * @see hooks/useCreditCardTransactions.ts
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message:
        'This endpoint is deprecated. Use Appwrite Realtime subscriptions via useCreditCardTransactions hook instead.',
      migration: {
        hook: 'useCreditCardTransactions',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 },
  );
}

/**
 * POST /api/credit-cards/transactions
 * Create a credit card transaction
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.credit_card_id) {
      return NextResponse.json({ message: 'Credit card ID is required' }, { status: 400 });
    }

    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ message: 'Amount must be a positive number' }, { status: 400 });
    }

    if (!body.date) {
      return NextResponse.json({ message: 'Date is required' }, { status: 400 });
    }

    if (!body.purchase_date) {
      return NextResponse.json({ message: 'Purchase date is required' }, { status: 400 });
    }

    if (!body.category) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 });
    }

    const creditCardTransactionService = new CreditCardTransactionService();
    const transaction = await creditCardTransactionService.createTransaction({
      userId,
      creditCardId: body.credit_card_id,
      amount: body.amount,
      date: body.date,
      purchaseDate: body.purchase_date,
      category: body.category,
      description: body.description,
      merchant: body.merchant,
      installment: body.installment,
      installments: body.installments,
      isRecurring: body.is_recurring,
      status: body.status,
    });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('POST /api/credit-cards/transactions error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create transaction',
      },
      { status: 500 },
    );
  }
}
