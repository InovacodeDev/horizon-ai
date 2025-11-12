import { getCurrentUserId } from '@/lib/auth/session';
import { CreditCardTransactionService } from '@/lib/services/credit-card-transaction.service';
import { dateToUserTimezone } from '@/lib/utils/timezone';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/credit-cards/recurring
 * Create a recurring subscription for a credit card
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
    if (!body.credit_card_id) {
      return NextResponse.json({ message: 'Credit card ID is required' }, { status: 400 });
    }

    if (!body.amount || typeof body.amount !== 'number') {
      return NextResponse.json({ message: 'Amount is required and must be a number' }, { status: 400 });
    }

    if (!body.category) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 });
    }

    if (!body.account_id) {
      return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });
    }

    if (
      !body.recurring_day ||
      typeof body.recurring_day !== 'number' ||
      body.recurring_day < 1 ||
      body.recurring_day > 31
    ) {
      return NextResponse.json({ message: 'Recurring day must be between 1 and 31' }, { status: 400 });
    }

    if (!body.start_date) {
      return NextResponse.json({ message: 'Start date is required' }, { status: 400 });
    }

    // Create the first transaction with recurring flag
    const transactionService = new CreditCardTransactionService();

    const startDate = new Date(body.start_date);
    const recurringDay = body.recurring_day;

    // Adjust the date to the recurring day
    const transactionDate = new Date(startDate);
    transactionDate.setDate(recurringDay);

    // If the recurring day is before the start date in the same month, move to next month
    if (transactionDate < startDate) {
      transactionDate.setMonth(transactionDate.getMonth() + 1);
    }

    const transaction = await transactionService.createTransaction({
      userId,
      amount: body.amount,
      category: body.category,
      description: body.description || 'Assinatura recorrente',
      date: transactionDate.toISOString(),
      purchaseDate: dateToUserTimezone(body.start_date),
      creditCardId: body.credit_card_id,
      merchant: body.merchant,
      status: 'pending',
      isRecurring: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        recurring_day: recurringDay,
        next_charge_date: transactionDate.toISOString(),
        message: `Assinatura criada com sucesso. Próxima cobrança: dia ${recurringDay} de cada mês`,
      },
    });
  } catch (error: any) {
    console.error('POST /api/credit-cards/recurring error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create recurring subscription',
      },
      { status: 500 },
    );
  }
}
