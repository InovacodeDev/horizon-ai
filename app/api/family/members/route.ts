import { getCurrentUserId } from '@/lib/auth/session';
import { SharingService } from '@/lib/services/sharing.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/family/members
 * List all active members for the authenticated responsible user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active members
    const sharingService = new SharingService();
    const members = await sharingService.getActiveMembers(userId);

    return NextResponse.json({
      success: true,
      data: {
        members,
      },
    });
  } catch (error: any) {
    console.error('GET /api/family/members error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch members',
      },
      { status: 500 },
    );
  }
}
