import { getCurrentUserId } from '@/lib/auth/session';
import { DataAccessService } from '@/lib/services/data-access.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sharing/credit-cards
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All credit card data (own + shared) should be fetched via the `useCreditCardsWithSharing` hook
 * which uses Appwrite Realtime for automatic updates.
 *
 * @see hooks/useCreditCardsWithSharing.ts
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message:
        'This endpoint is deprecated. Use Appwrite Realtime subscriptions via useCreditCardsWithSharing hook instead.',
      migration: {
        hook: 'useCreditCardsWithSharing',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 },
  );
}
