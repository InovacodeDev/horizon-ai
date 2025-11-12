import { getCurrentUserId } from '@/lib/auth/session';
import { DataAccessService } from '@/lib/services/data-access.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sharing/accounts
 * Get all accounts accessible by the current user (own + shared)
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from session
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch accessible accounts using DataAccessService
    const dataAccessService = new DataAccessService();
    const accounts = await dataAccessService.getAccessibleAccounts(userId);

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error: any) {
    console.error('Error fetching accessible accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch accounts',
      },
      { status: 500 },
    );
  }
}
