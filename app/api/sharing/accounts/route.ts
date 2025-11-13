import { getCurrentUserId } from '@/lib/auth/session';
import { DataAccessService } from '@/lib/services/data-access.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sharing/accounts
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All account data (own + shared) should be fetched via the `useAccountsWithSharing` hook
 * which uses Appwrite Realtime for automatic updates.
 *
 * @see hooks/useAccountsWithSharing.ts
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message:
        'This endpoint is deprecated. Use Appwrite Realtime subscriptions via useAccountsWithSharing hook instead.',
      migration: {
        hook: 'useAccountsWithSharing',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 },
  );
}
