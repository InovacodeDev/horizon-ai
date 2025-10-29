import { getCurrentUserId } from '@/lib/auth/session';
import { CreditCardTransactionService } from '@/lib/services/credit-card-transaction.service';
import { dateToUserTimezone } from '@/lib/utils/timezone';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/credit-cards/installments
 * Create an installment plan for a credit card purchase
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

    if (!body.total_amount || typeof body.total_amount !== 'number') {
      return NextResponse.json({ message: 'Total amount is required and must be a number' }, { status: 400 });
    }

    if (!body.installments || typeof body.installments !== 'number' || body.installments < 2) {
      return NextResponse.json({ message: 'Installments must be at least 2' }, { status: 400 });
    }

    if (!body.purchase_date) {
      return NextResponse.json({ message: 'Purchase date is required' }, { status: 400 });
    }

    if (!body.category) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 });
    }

    console.log({ body });
    if (!body.account_id) {
      return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });
    }

    const closingDay = body.closing_day || 10;

    // Calculate installment amount
    const installmentAmount = body.total_amount / body.installments;

    // Determine the first installment date based on purchase date and closing day
    const purchaseDate = new Date(body.purchase_date);
    const purchaseDay = purchaseDate.getDate();
    const purchaseMonth = purchaseDate.getMonth();
    const purchaseYear = purchaseDate.getFullYear();

    // Calculate which bill this purchase belongs to
    // If purchase is on or before closing day, it goes to current month's bill
    // If purchase is after closing day, it goes to next month's bill
    let firstInstallmentMonth = purchaseMonth;
    let firstInstallmentYear = purchaseYear;

    // If purchase is after closing day, first installment goes to next month's bill
    if (purchaseDay > closingDay) {
      firstInstallmentMonth += 1;
      if (firstInstallmentMonth > 11) {
        firstInstallmentMonth = 0;
        firstInstallmentYear += 1;
      }
    }

    // The installment date should be the due date of the bill
    // For now, we'll use the purchase day as the transaction date within that bill month

    /**
     * Helper function to get the last day of a month
     */
    const getLastDayOfMonth = (year: number, month: number): number => {
      return new Date(year, month + 1, 0).getDate();
    };

    /**
     * Helper function to adjust day to fit within the month
     * If the day doesn't exist in the month (e.g., Feb 30), use the last day of that month
     */
    const adjustDayForMonth = (year: number, month: number, day: number): number => {
      const lastDay = getLastDayOfMonth(year, month);
      return Math.min(day, lastDay);
    };

    // Create transactions for each installment
    const creditCardTransactionService = new CreditCardTransactionService();
    const createdTransactions = [];

    for (let i = 0; i < body.installments; i++) {
      // Calculate the month and year for this installment
      let installmentMonth = firstInstallmentMonth - 1 + i;
      let installmentYear = firstInstallmentYear;

      while (installmentMonth > 11) {
        installmentMonth -= 12;
        installmentYear += 1;
      }

      // The transaction date should be in the bill month, using the purchase day
      // This ensures the transaction appears in the correct bill
      // For example: purchase on 22/09 with closing on day 10
      // - First installment should be dated 22/10 (appears in October bill)
      // - Second installment should be dated 22/11 (appears in November bill)
      const adjustedPurchaseDay = adjustDayForMonth(installmentYear, installmentMonth, purchaseDay);

      // Create the installment date using the bill month and purchase day
      const installmentDate = new Date(installmentYear, installmentMonth, adjustedPurchaseDay);

      // Create description with installment info
      const description = body.description
        ? `${body.description} (${i + 1}/${body.installments})`
        : `Parcela ${i + 1}/${body.installments}`;

      const transaction = await creditCardTransactionService.createTransaction({
        userId,
        amount: installmentAmount,
        category: body.category,
        description,
        date: installmentDate.toISOString(), // Bill due date
        purchaseDate: dateToUserTimezone(body.purchase_date),
        creditCardId: body.credit_card_id,
        merchant: body.merchant,
        status: 'completed',
        installment: i + 1, // Current installment number (1, 2, 3...)
        installments: body.installments, // Total installments (12 for 12x)
      });

      createdTransactions.push(transaction);
    }

    return NextResponse.json({
      success: true,
      data: {
        installments: body.installments,
        total_amount: body.total_amount,
        installment_amount: installmentAmount,
        transactions: createdTransactions,
      },
    });
  } catch (error: any) {
    console.error('POST /api/credit-cards/installments error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create installment plan',
      },
      { status: 500 },
    );
  }
}
