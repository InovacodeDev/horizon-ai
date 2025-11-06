import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { InvoiceCategory } from '@/lib/services/invoice-parser.service';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

/**
 * GET /api/invoices/categories
 * Get list of available invoice categories with counts
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Get all categories
    const categories = Object.values(InvoiceCategory);

    // Get invoice counts per category
    const dbAdapter = getAppwriteDatabases();
    const categoryCounts: Record<string, number> = {};

    // Fetch counts for each category
    await Promise.all(
      categories.map(async (category) => {
        try {
          const result = await dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, [
            Query.equal('user_id', userId),
            Query.equal('category', category),
            Query.limit(1), // We only need the count
          ]);

          categoryCounts[category] = result.total || 0;
        } catch (error) {
          console.error(`Failed to get count for category ${category}:`, error);
          categoryCounts[category] = 0;
        }
      }),
    );

    // Format response
    const categoryData = categories.map((category) => ({
      id: category,
      name: category,
      count: categoryCounts[category] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: categoryData,
    });
  } catch (error: any) {
    console.error('GET /api/invoices/categories error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch categories',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
