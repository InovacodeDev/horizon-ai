import { getCurrentUserId } from '@/lib/auth/session';
import { TransactionService } from '@/lib/services/transaction.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/credit-cards/bills/pay
 * Create a payment transaction for a credit card bill
 *
 * This creates a regular transaction (without credit_card_id) that affects the account balance
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

    if (!body.account_id) {
      return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });
    }

    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ message: 'Amount must be a positive number' }, { status: 400 });
    }

    if (!body.payment_date) {
      return NextResponse.json({ message: 'Payment date is required' }, { status: 400 });
    }

    // Optional: bill month and year for description
    const billMonth = body.bill_month || '';
    const billYear = body.bill_year || '';
    const billPeriod = billMonth && billYear ? ` - ${billMonth}/${billYear}` : '';

    // Get credit card name for description
    let creditCardName = 'Cartão de Crédito';
    try {
      const { getAppwriteDatabases } = await import('@/lib/appwrite/client');
      const { COLLECTIONS, DATABASE_ID } = await import('@/lib/appwrite/schema');
      const databases = getAppwriteDatabases();

      const creditCard = await databases.getDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, body.credit_card_id);

      creditCardName = creditCard.name || creditCardName;
    } catch (error) {
      console.error('Error fetching credit card name:', error);
    }

    // Create payment transaction
    // IMPORTANT: This transaction does NOT have credit_card_id
    // This ensures it affects the account balance
    const transactionService = new TransactionService();
    const transaction = await transactionService.createManualTransaction({
      userId,
      amount: body.amount,
      type: 'expense',
      category: body.category || 'credit_card_bill',
      description: body.description || `Pagamento Fatura ${creditCardName}${billPeriod}`,
      accountId: body.account_id,
      // DO NOT include credit_card_id - this is a regular account transaction
      date: body.payment_date,
      currency: 'BRL',
      status: 'completed',
      merchant: creditCardName,
    });

    // Get updated account balance
    let accountBalance = 0;
    try {
      const { AccountService } = await import('@/lib/services/account.service');
      const accountService = new AccountService();
      accountBalance = await accountService.getAccountBalance(body.account_id);
    } catch (error) {
      console.error('Error fetching account balance:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.$id,
        amount: body.amount,
        account_balance: accountBalance,
        payment_date: body.payment_date,
        message: 'Fatura paga com sucesso',
      },
    });
  } catch (error: any) {
    console.error('POST /api/credit-cards/bills/pay error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to pay bill',
      },
      { status: 500 },
    );
  }
}
