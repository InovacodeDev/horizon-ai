import { getCurrentUserId } from '@/lib/auth/session';
import { CreditCardService } from '@/lib/services/credit-card.service';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

/**
 * GET /api/credit-cards
 * Get all credit cards for the user, optionally filtered by account IDs
 * Query params: account_ids (comma-separated list of account IDs)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountIdsParam = searchParams.get('account_ids');

    const creditCardService = new CreditCardService();

    // If account_ids provided, filter by those accounts
    if (accountIdsParam) {
      const accountIds = accountIdsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (accountIds.length === 0) {
        return NextResponse.json({ data: [] }, { status: 200 });
      }

      // Fetch cards for each account and combine
      const cardsPromises = accountIds.map((accountId) => creditCardService.getCreditCardsByAccount(accountId));

      const cardsArrays = await Promise.all(cardsPromises);
      const allCards = cardsArrays.flat();

      return NextResponse.json({ data: allCards }, { status: 200 });
    }

    // Otherwise, get all cards for the user
    const cards = await creditCardService.getAllCreditCards(userId);

    return NextResponse.json({ data: cards }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/credit-cards error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch credit cards',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/credit-cards
 * Create a new credit card for an account
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
    if (!body.account_id || typeof body.account_id !== 'string') {
      return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });
    }

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ message: 'Credit card name is required' }, { status: 400 });
    }

    if (!body.last_digits || typeof body.last_digits !== 'string') {
      return NextResponse.json({ message: 'Last digits are required' }, { status: 400 });
    }

    if (body.credit_limit === undefined || body.credit_limit === null) {
      return NextResponse.json({ message: 'Credit limit is required' }, { status: 400 });
    }

    // Validate credit_limit is a positive number
    const creditLimit = Number(body.credit_limit);
    if (isNaN(creditLimit) || creditLimit < 0) {
      return NextResponse.json({ message: 'Credit limit must be a non-negative number' }, { status: 400 });
    }

    if (body.closing_day === undefined || body.closing_day === null) {
      return NextResponse.json({ message: 'Closing day is required' }, { status: 400 });
    }

    // Validate closing_day is between 1 and 31
    const closingDay = Number(body.closing_day);
    if (isNaN(closingDay) || closingDay < 1 || closingDay > 31) {
      return NextResponse.json({ message: 'Closing day must be between 1 and 31' }, { status: 400 });
    }

    if (body.due_day === undefined || body.due_day === null) {
      return NextResponse.json({ message: 'Due day is required' }, { status: 400 });
    }

    // Validate due_day is between 1 and 31
    const dueDay = Number(body.due_day);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      return NextResponse.json({ message: 'Due day must be between 1 and 31' }, { status: 400 });
    }

    // Validate brand if provided
    if (body.brand) {
      const validBrands = ['visa', 'mastercard', 'elo', 'amex', 'other'];
      if (!validBrands.includes(body.brand)) {
        return NextResponse.json(
          {
            message: `Invalid brand. Must be one of: ${validBrands.join(', ')}`,
          },
          { status: 400 },
        );
      }
    }

    // Validate used_limit if provided
    if (body.used_limit !== undefined) {
      const usedLimit = Number(body.used_limit);
      if (isNaN(usedLimit) || usedLimit < 0) {
        return NextResponse.json({ message: 'Used limit must be a non-negative number' }, { status: 400 });
      }
    }

    // Create credit card
    const creditCardService = new CreditCardService();
    const creditCard = await creditCardService.createCreditCard({
      account_id: body.account_id,
      name: body.name,
      last_digits: body.last_digits,
      credit_limit: creditLimit,
      used_limit: body.used_limit,
      closing_day: closingDay,
      due_day: dueDay,
      brand: body.brand,
      network: body.network,
      color: body.color,
    });

    return NextResponse.json(
      {
        success: true,
        data: creditCard,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('POST /api/credit-cards error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create credit card',
      },
      { status: 500 },
    );
  }
}
