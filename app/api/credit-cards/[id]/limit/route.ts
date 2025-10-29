import { getCurrentUserId } from '@/lib/auth/session';
import { CreditCardService } from '@/lib/services/credit-card.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/credit-cards/[id]/limit
 * Get available limit for a credit card
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const creditCardId = params.id;

    // Calculate available limit
    const creditCardService = new CreditCardService();
    const limitInfo = await creditCardService.calculateAvailableLimit(creditCardId);

    return NextResponse.json({
      success: true,
      data: limitInfo,
    });
  } catch (error: any) {
    console.error('GET /api/credit-cards/[id]/limit error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to calculate available limit',
      },
      { status: 500 },
    );
  }
}
