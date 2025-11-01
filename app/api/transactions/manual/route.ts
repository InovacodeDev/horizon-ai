import { getCurrentUserId } from '@/lib/auth/session';
import { TransactionService } from '@/lib/services/transaction.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transactions/manual
 * Create a manual transaction for the authenticated user
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
    if (body.amount === undefined || body.amount === null) {
      return NextResponse.json({ message: 'Amount is required' }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: 'Amount must be a positive number' }, { status: 400 });
    }

    if (!body.type) {
      return NextResponse.json({ message: 'Transaction type is required' }, { status: 400 });
    }

    const validTypes = ['income', 'expense', 'transfer', 'salary'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        {
          message: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (!body.date) {
      return NextResponse.json({ message: 'Transaction date is required' }, { status: 400 });
    }

    // Validate date format (ISO 8601)
    const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json(
        {
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        },
        { status: 400 },
      );
    }

    if (!body.category) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 });
    }

    if (!body.currency) {
      return NextResponse.json({ message: 'Currency is required' }, { status: 400 });
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 },
        );
      }
    }

    // Validate closing_day and due_day if provided
    if (body.closing_day !== undefined) {
      const closingDay = Number(body.closing_day);
      if (isNaN(closingDay) || closingDay < 1 || closingDay > 31) {
        return NextResponse.json({ message: 'Closing day must be between 1 and 31' }, { status: 400 });
      }
    }

    if (body.due_day !== undefined) {
      const dueDay = Number(body.due_day);
      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        return NextResponse.json({ message: 'Due day must be between 1 and 31' }, { status: 400 });
      }
    }

    // Validate tags if provided
    if (body.tags && !Array.isArray(body.tags)) {
      return NextResponse.json({ message: 'Tags must be an array' }, { status: 400 });
    }

    // Validate location if provided
    if (body.location) {
      if (typeof body.location !== 'object') {
        return NextResponse.json({ message: 'Location must be an object' }, { status: 400 });
      }

      if (body.location.latitude !== undefined) {
        const lat = Number(body.location.latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return NextResponse.json({ message: 'Latitude must be between -90 and 90' }, { status: 400 });
        }
      }

      if (body.location.longitude !== undefined) {
        const lng = Number(body.location.longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          return NextResponse.json({ message: 'Longitude must be between -180 and 180' }, { status: 400 });
        }
      }
    }

    // Validate recurring pattern if provided
    if (body.recurringPattern) {
      if (typeof body.recurringPattern !== 'object') {
        return NextResponse.json({ message: 'Recurring pattern must be an object' }, { status: 400 });
      }

      const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
      if (!body.recurringPattern.frequency || !validFrequencies.includes(body.recurringPattern.frequency)) {
        return NextResponse.json(
          {
            message: `Invalid recurring frequency. Must be one of: ${validFrequencies.join(', ')}`,
          },
          { status: 400 },
        );
      }

      if (!body.recurringPattern.interval || body.recurringPattern.interval < 1) {
        return NextResponse.json({ message: 'Recurring interval must be at least 1' }, { status: 400 });
      }
    }

    // Validate tax amount for salary transactions
    if (body.type === 'salary' && body.taxAmount !== undefined && body.taxAmount !== null) {
      const taxAmount = Number(body.taxAmount || body.tax_amount);
      if (isNaN(taxAmount) || taxAmount < 0) {
        return NextResponse.json({ message: 'Tax amount must be a non-negative number' }, { status: 400 });
      }
    }

    // Create transaction
    const transactionService = new TransactionService();
    const transaction = await transactionService.createManualTransaction({
      userId,
      amount,
      type: body.type,
      date: body.date,
      category: body.category,
      description: body.description,
      currency: body.currency,
      accountId: body.accountId || body.account_id,
      creditCardId: body.creditCardId || body.credit_card_id,
      merchant: body.merchant,
      tags: body.tags,
      location: body.location,
      receiptUrl: body.receiptUrl || body.receipt_url,
      isRecurring: body.isRecurring || body.is_recurring,
      recurringPattern: body.recurringPattern || body.recurring_pattern,
      status: body.status,
      taxAmount: body.taxAmount || body.tax_amount,
    });

    return NextResponse.json(
      {
        success: true,
        data: transaction,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('POST /api/transactions/manual error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create transaction',
      },
      { status: 500 },
    );
  }
}
