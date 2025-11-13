import { getCurrentUserId } from '@/lib/auth/session';
import { AccountService } from '@/lib/services/account.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/accounts
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All account data should be fetched via the `useAccounts` hook which uses
 * Appwrite Realtime for automatic updates.
 *
 * @see hooks/useAccounts.ts
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message: 'This endpoint is deprecated. Use Appwrite Realtime subscriptions via useAccounts hook instead.',
      migration: {
        hook: 'useAccounts',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 },
  );
}

/**
 * POST /api/accounts
 * Create a new account for the authenticated user
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
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ message: 'Account name is required' }, { status: 400 });
    }

    if (!body.account_type) {
      return NextResponse.json({ message: 'Account type is required' }, { status: 400 });
    }

    // Validate account type
    const validAccountTypes = ['checking', 'savings', 'investment', 'vale', 'other'];
    if (!validAccountTypes.includes(body.account_type)) {
      return NextResponse.json(
        {
          message: `Invalid account type. Must be one of: ${validAccountTypes.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate initial_balance if provided
    if (body.initial_balance !== undefined) {
      const balance = Number(body.initial_balance);
      if (isNaN(balance) || balance < 0) {
        return NextResponse.json({ message: 'Initial balance must be a non-negative number' }, { status: 400 });
      }
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['Connected', 'Sync Error', 'Disconnected', 'Manual'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 },
        );
      }
    }

    // Create account
    const accountService = new AccountService();
    const account = await accountService.createAccount(userId, {
      name: body.name,
      account_type: body.account_type,
      initial_balance: body.initial_balance,
      is_manual: body.is_manual ?? true,
      bank_id: body.bank_id,
      last_digits: body.last_digits,
      status: body.status,
      integration_id: body.integration_id,
      integration_data: body.integration_data,
    });

    return NextResponse.json(
      {
        success: true,
        data: account,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('POST /api/accounts error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create account',
      },
      { status: 500 },
    );
  }
}
