import { getCurrentUserId } from '@/lib/auth/session';
import { CreditCardTransactionService } from '@/lib/services/credit-card-transaction.service';
import { dateToUserTimezone } from '@/lib/utils/timezone';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/credit-cards/transactions
 * List credit card transactions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creditCardIdParam = searchParams.get('credit_card_id');

    // Se não há credit_card_id ou é vazio, retorna vazio
    if (!creditCardIdParam || creditCardIdParam.trim() === '') {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const creditCardTransactionService = new CreditCardTransactionService();
    const result = await creditCardTransactionService.listTransactions({
      userId,
      creditCardId: creditCardIdParam,
      category: searchParams.get('category') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      startDate: searchParams.get('start_date') || undefined,
      endDate: searchParams.get('end_date') || undefined,
      startPurchaseDate: searchParams.get('start_purchase_date') || undefined,
      endPurchaseDate: searchParams.get('end_purchase_date') || undefined,
      isRecurring: searchParams.get('is_recurring') === 'true' ? true : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result.transactions,
      total: result.total,
    });
  } catch (error: any) {
    console.error('GET /api/credit-cards/transactions error:', error);
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
