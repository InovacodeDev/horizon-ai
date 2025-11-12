import { getCurrentUserId } from '@/lib/auth/session';
import { canAccessResource } from '@/lib/auth/sharing-permissions';
import { AccountService } from '@/lib/services/account.service';
import { CreditCardService } from '@/lib/services/credit-card.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/credit-cards/[id]
 * Get a specific credit card by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: creditCardId } = await params;

    if (!creditCardId) {
      return NextResponse.json({ message: 'Credit card ID is required' }, { status: 400 });
    }

    // Fetch credit card
    const creditCardService = new CreditCardService();
    const creditCard = await creditCardService.getCreditCardById(creditCardId);

    if (!creditCard) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credit card not found',
        },
        { status: 404 },
      );
    }

    // Fetch the account to get the owner user_id
    const accountService = new AccountService();
    const account = await accountService.getAccountById(creditCard.account_id, userId);

    // Verify user has access to this credit card (own or shared)
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
      data: creditCard,
    });
  } catch (error: any) {
    console.error('GET /api/credit-cards/[id] error:', error);

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credit card not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch credit card',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/credit-cards/[id]
 * Update a specific credit card
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: creditCardId } = await params;

    if (!creditCardId) {
      return NextResponse.json({ message: 'Credit card ID is required' }, { status: 400 });
    }

    // Fetch credit card to verify ownership
    const creditCardService = new CreditCardService();
    const creditCard = await creditCardService.getCreditCardById(creditCardId);

    if (!creditCard) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credit card not found',
        },
        { status: 404 },
      );
    }

    // Fetch the account to get the owner user_id
    const accountService = new AccountService();
    const account = await accountService.getAccountById(creditCard.account_id, userId);

    // Verify user owns this credit card (cannot modify shared credit cards)
    const { canModifyResource } = await import('@/lib/auth/sharing-permissions');
    const modifyCheck = await canModifyResource(userId, account.user_id, 'credit_card');
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
      return NextResponse.json({ message: 'Credit card name must be a string' }, { status: 400 });
    }

    if (body.credit_limit !== undefined) {
      const creditLimit = Number(body.credit_limit);
      if (isNaN(creditLimit) || creditLimit < 0) {
        return NextResponse.json({ message: 'Credit limit must be a non-negative number' }, { status: 400 });
      }
    }

    if (body.used_limit !== undefined) {
      const usedLimit = Number(body.used_limit);
      if (isNaN(usedLimit) || usedLimit < 0) {
        return NextResponse.json({ message: 'Used limit must be a non-negative number' }, { status: 400 });
      }
    }

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

    if (body.brand !== undefined) {
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

    if (body.last_digits !== undefined) {
      if (typeof body.last_digits !== 'string' || !/^\d{4}$/.test(body.last_digits)) {
        return NextResponse.json({ message: 'Last digits must be exactly 4 numeric characters' }, { status: 400 });
      }
    }

    // Update credit card
    const updatedCreditCard = await creditCardService.updateCreditCard(creditCardId, {
      name: body.name,
      last_digits: body.last_digits,
      credit_limit: body.credit_limit,
      used_limit: body.used_limit,
      closing_day: body.closing_day,
      due_day: body.due_day,
      brand: body.brand,
      network: body.network,
      color: body.color,
    });

    return NextResponse.json({
      success: true,
      data: updatedCreditCard,
    });
  } catch (error: any) {
    console.error('PATCH /api/credit-cards/[id] error:', error);

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credit card not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update credit card',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/credit-cards/[id]
 * Delete a specific credit card
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: creditCardId } = await params;

    if (!creditCardId) {
      return NextResponse.json({ message: 'Credit card ID is required' }, { status: 400 });
    }

    // Fetch credit card to verify ownership
    const creditCardService = new CreditCardService();
    const creditCard = await creditCardService.getCreditCardById(creditCardId);

    if (!creditCard) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credit card not found',
        },
        { status: 404 },
      );
    }

    // Fetch the account to get the owner user_id
    const accountService = new AccountService();
    const account = await accountService.getAccountById(creditCard.account_id, userId);

    // Verify user owns this credit card (cannot delete shared credit cards)
    const { canDeleteResource } = await import('@/lib/auth/sharing-permissions');
    const deleteCheck = await canDeleteResource(userId, account.user_id, 'credit_card');
    if (!deleteCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: deleteCheck.reason || 'Forbidden',
        },
        { status: 403 },
      );
    }

    // Delete credit card
    await creditCardService.deleteCreditCard(creditCardId);

    return NextResponse.json({
      success: true,
      message: 'Credit card deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/credit-cards/[id] error:', error);

    // Check if it's a not found error
    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credit card not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete credit card',
      },
      { status: 500 },
    );
  }
}
