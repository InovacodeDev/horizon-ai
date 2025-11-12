import { getCurrentUserId } from '@/lib/auth/session';
import { SharingService } from '@/lib/services/sharing.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sharing/context
 * Get shared data context for the authenticated user
 * Returns information about linked user and relationship type
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get shared data context
    const sharingService = new SharingService();
    const context = await sharingService.getSharedDataContext(userId);

    return NextResponse.json({
      success: true,
      data: context,
    });
  } catch (error: any) {
    console.error('GET /api/sharing/context error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch sharing context',
      },
      { status: 500 },
    );
  }
}
