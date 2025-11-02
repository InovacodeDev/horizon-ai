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

    if (!body.account_id) {
      return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });
    }

    const closingDay = body.closing_day || 10;

    // Calculate installment amounts
    // Round down to 2 decimal places for regular installments
    const regularInstallmentAmount = Math.floor((body.total_amount / body.installments) * 100) / 100;

    // Calculate the total of regular installments
    const regularInstallmentsTotal = regularInstallmentAmount * (body.installments - 1);

    // First installment gets the remainder to ensure total is exact
    const firstInstallmentAmount = Math.round((body.total_amount - regularInstallmentsTotal) * 100) / 100;

    // Determine the first installment date based on purchase date and closing day
    // Parse the purchase date in YYYY-MM-DD format to avoid timezone issues
    const [purchaseYear, purchaseMonth, purchaseDay] = body.purchase_date.split('-').map(Number);

    // Simple logic: if purchase is before closing day, it goes to current month's bill
    // If purchase is on or after closing day, it goes to next month's bill
    // Example with closing day 30:
    // - Purchase on 20/08 (day 20 < 30) -> August bill
    // - Purchase on 30/08 (day 30 >= 30) -> September bill

    let firstInstallmentMonth = purchaseMonth - 1; // Convert to 0-indexed (August = 7)
    let firstInstallmentYear = purchaseYear;

    // If purchase is on or after closing day, move to next month
    if (purchaseDay >= closingDay) {
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

    // Prepare all transactions for bulk creation
    const creditCardTransactionService = new CreditCardTransactionService();
    const transactionsToCreate = [];

    for (let i = 0; i < body.installments; i++) {
      // Calculate the month and year for this installment
      let installmentMonth = firstInstallmentMonth + i;
      let installmentYear = firstInstallmentYear;

      while (installmentMonth > 11) {
        installmentMonth -= 12;
        installmentYear += 1;
      }

      // The transaction date should be the purchase date, but in the corresponding month
      // For example: purchase on 04/03
      // - First installment: 04/03 (appears in March bill if before closing, or April if after)
      // - Second installment: 04/04 (appears in April bill if before closing, or May if after)
      // - Third installment: 04/05 (appears in May bill if before closing, or June if after)

      // Calculate the actual month for this installment's purchase date
      let actualMonth = purchaseMonth - 1 + i; // Start from purchase month
      let actualYear = purchaseYear;

      while (actualMonth > 11) {
        actualMonth -= 12;
        actualYear += 1;
      }

      // Adjust day if the month doesn't have that day (e.g., Feb 30 -> Feb 28)
      const adjustedPurchaseDay = adjustDayForMonth(actualYear, actualMonth, purchaseDay);

      // Create the installment date using the actual month and purchase day
      const installmentDate = new Date(actualYear, actualMonth, adjustedPurchaseDay);

      // Create description with installment info
      const description = body.description
        ? `${body.description} (${i + 1}/${body.installments})`
        : `Parcela ${i + 1}/${body.installments}`;

      // Use first installment amount for the first installment, regular amount for others
      const currentInstallmentAmount = i === 0 ? firstInstallmentAmount : regularInstallmentAmount;

      transactionsToCreate.push({
        userId,
        amount: currentInstallmentAmount,
        category: body.category,
        description,
        date: installmentDate.toISOString(), // Transaction date (same day as purchase, but in corresponding month)
        purchaseDate: dateToUserTimezone(body.purchase_date),
        creditCardId: body.credit_card_id,
        merchant: body.merchant,
        status: 'completed' as const,
        installment: i + 1, // Current installment number (1, 2, 3...)
        installments: body.installments, // Total installments (12 for 12x)
      });
    }

    // Create all transactions in bulk
    const createdTransactions = await creditCardTransactionService.bulkCreateTransactions(transactionsToCreate);

    return NextResponse.json({
      success: true,
      data: {
        installments: body.installments,
        total_amount: body.total_amount,
        first_installment_amount: firstInstallmentAmount,
        regular_installment_amount: regularInstallmentAmount,
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
