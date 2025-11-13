import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, Product } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

/**
 * GET /api/products
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All product data should be fetched directly from Appwrite with Realtime subscriptions.
 * Create a `useProducts` hook following the same pattern as other hooks.
 *
 * @see hooks/useTransactions.ts (example pattern)
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message: 'This endpoint is deprecated. Use Appwrite Realtime subscriptions instead. Create a useProducts hook.',
      migration: {
        pattern: 'Create useProducts hook following useTransactions pattern',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 },
  );
}
