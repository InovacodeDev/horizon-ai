import { getCurrentUserId } from '@/lib/auth/session';
import { canAccessResource } from '@/lib/auth/sharing-permissions';
import { AccountService } from '@/lib/services/account.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/accounts/[id]
 * Get a specific account by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: accountId } = await params;

    if (!accountId) {
      return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });
    }

    // Fetch account (service validates ownership)
    const accountService = new AccountService();
    const account = await accountService.getAccountById(accountId, userId);

    // Verify user has access to this account (own or shared)
    const accessCheck = await canAccessResource(userId, account.user_id);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: accessCheck.reason || 'Forbidden',
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('GET /api/accounts/[id] error:', error);

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch account',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/accounts/[id]
 * Update a specific account
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: accountId } = await params;

    if (!accountId) {
      return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });
    }

    // Fetch account to verify ownership
    const accountService = new AccountService();
    const account = await accountService.getAccountById(accountId, userId);

    // Verify user owns this account (cannot modify shared accounts)
    const { canModifyResource } = await import('@/lib/auth/sharing-permissions');
    const modifyCheck = await canModifyResource(userId, account.user_id, 'account');
    if (!modifyCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: modifyCheck.reason || 'Forbidden',
        },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate fields if provided
    if (body.name !== undefined && typeof body.name !== 'string') {
      return NextResponse.json({ message: 'Account name must be a string' }, { status: 400 });
    }

    if (body.account_type !== undefined) {
      const validAccountTypes = ['checking', 'savings', 'investment', 'vale', 'other'];
      if (!validAccountTypes.includes(body.account_type)) {
        return NextResponse.json(
          {
            message: `Invalid account type. Must be one of: ${validAccountTypes.join(', ')}`,
          },
          { status: 400 },
        );
      }
    }

    if (body.status !== undefined) {
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

    // Update account (service validates ownership)
    const updatedAccount = await accountService.updateAccount(accountId, userId, {
      name: body.name,
      account_type: body.account_type,
      bank_id: body.bank_id,
      last_digits: body.last_digits,
      status: body.status,
    });

    return NextResponse.json({
      success: true,
      data: updatedAccount,
    });
  } catch (error: any) {
    console.error('PATCH /api/accounts/[id] error:', error);

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update account',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/accounts/[id]
 * Delete a specific account
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: accountId } = await params;

    if (!accountId) {
      return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });
    }

    // Fetch account to verify ownership
    const accountService = new AccountService();
    const account = await accountService.getAccountById(accountId, userId);

    // Verify user owns this account (cannot delete shared accounts)
    const { canDeleteResource } = await import('@/lib/auth/sharing-permissions');
    const deleteCheck = await canDeleteResource(userId, account.user_id, 'account');
    if (!deleteCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: deleteCheck.reason || 'Forbidden',
        },
        { status: 403 },
      );
    }

    // Delete account (service validates ownership)
    await accountService.deleteAccount(accountId, userId);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/accounts/[id] error:', error);

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete account',
      },
      { status: 500 },
    );
  }
}
