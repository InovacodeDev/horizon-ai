import { getCurrentUserId } from '@/lib/auth/session';
import { DataAccessService, InvoiceFilters } from '@/lib/services/data-access.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/sharing/invoices
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All invoice data (own + shared) should be fetched via the `useInvoicesWithSharing` hook
 * which uses Appwrite Realtime for automatic updates.
 *
 * @see hooks/useInvoicesWithSharing.ts
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message:
        'This endpoint is deprecated. Use Appwrite Realtime subscriptions via useInvoicesWithSharing hook instead.',
      migration: {
        hook: 'useInvoicesWithSharing',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 },
  );
}
