import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { requireAuth } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

/**
 * GET /api/credit-cards/bills
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All credit card bill data should be fetched via the `useCreditCardBills` hook
 * which uses Appwrite Realtime for automatic updates.
 *
 * @see hooks/useCreditCardBills.ts
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message: 'This endpoint is deprecated. Use Appwrite Realtime subscriptions via useCreditCardBills hook instead.',
      migration: {
        hook: 'useCreditCardBills',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 },
  );
}
