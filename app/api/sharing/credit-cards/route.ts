import { getCurrentUserId } from '@/lib/auth/session';
import { DataAccessService } from '@/lib/services/data-access.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sharing/credit-cards
 * Get all credit cards accessible by the current user (own + shared)
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from session
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch accessible credit cards using DataAccessService
    const dataAccessService = new DataAccessService();
    const creditCards = await dataAccessService.getAccessibleCreditCards(userId);

    return NextResponse.json({
      success: true,
      data: creditCards,
    });
  } catch (error: any) {
    console.error('Error fetching accessible credit cards:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch credit cards',
      },
      { status: 500 },
    );
  }
}
