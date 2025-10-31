import { getCurrentUserId } from '@/lib/auth/session';
import { CreditCardTransactionService } from '@/lib/services/credit-card-transaction.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/credit-cards/transactions/bulk
 * Create multiple credit card transactions at once
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
    if (!body.transactions || !Array.isArray(body.transactions)) {
      return NextResponse.json({ message: 'Transactions array is required' }, { status: 400 });
    }

    if (body.transactions.length === 0) {
      return NextResponse.json({ message: 'At least one transaction is required' }, { status: 400 });
    }

    // Validate each transaction
    for (let i = 0; i < body.transactions.length; i++) {
      const transaction = body.transactions[i];

      if (!transaction.credit_card_id) {
        return NextResponse.json({ message: `Transaction ${i + 1}: Credit card ID is required` }, { status: 400 });
      }

      if (!transaction.amount || typeof transaction.amount !== 'number') {
        return NextResponse.json(
          { message: `Transaction ${i + 1}: Amount is required and must be a number` },
          { status: 400 },
        );
      }

      if (!transaction.date) {
        return NextResponse.json({ message: `Transaction ${i + 1}: Date is required` }, { status: 400 });
      }

      if (!transaction.purchase_date) {
        return NextResponse.json({ message: `Transaction ${i + 1}: Purchase date is required` }, { status: 400 });
      }

      if (!transaction.category) {
        return NextResponse.json({ message: `Transaction ${i + 1}: Category is required` }, { status: 400 });
      }
    }

    // Create all transactions
    const creditCardTransactionService = new CreditCardTransactionService();

    const transactionsData = body.transactions.map((t: any) => ({
      userId,
      creditCardId: t.credit_card_id,
      amount: t.amount,
      date: t.date,
      purchaseDate: t.purchase_date,
      category: t.category,
      description: t.description,
      merchant: t.merchant,
      installment: t.installment,
      installments: t.installments,
      isRecurring: t.is_recurring,
      status: t.status || 'completed',
    }));

    const createdTransactions = await creditCardTransactionService.bulkCreateTransactions(transactionsData);

    return NextResponse.json({
      success: true,
      data: {
        count: createdTransactions.length,
        transactions: createdTransactions,
      },
    });
  } catch (error: any) {
    console.error('POST /api/credit-cards/transactions/bulk error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create transactions',
      },
      { status: 500 },
    );
  }
}
