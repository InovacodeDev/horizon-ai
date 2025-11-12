import { InvitationService } from '@/lib/services/invitation.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cron/expire-invitations
 * Expire old pending invitations that have passed their expiration date
 *
 * This endpoint should be called daily by a cron job (configured in vercel.json)
 * For security, requires CRON_SECRET authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check for cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set');
      return NextResponse.json(
        {
          success: false,
          message: 'Server configuration error',
        },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron job attempt');
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 },
      );
    }

    // Initialize invitation service
    const invitationService = new InvitationService();

    // Expire old invitations
    const expiredCount = await invitationService.expireOldInvitations();

    const now = new Date();

    return NextResponse.json({
      success: true,
      data: {
        expired_count: expiredCount,
        timestamp: now.toISOString(),
        message: `Successfully expired ${expiredCount} invitation(s)`,
      },
    });
  } catch (error: any) {
    console.error('GET /api/cron/expire-invitations error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to expire invitations',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
