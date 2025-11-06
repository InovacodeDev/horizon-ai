import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, Product } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

/**
 * GET /api/products
 * Return paginated list of products for current user with filtering and search
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Build queries
    const queries: string[] = [Query.equal('user_id', userId)];

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      queries.push(Query.equal('category', category));
    }

    // Search by product name
    const search = searchParams.get('search');
    if (search) {
      queries.push(Query.search('name', search));
    }

    // Pagination
    const limit = searchParams.get('limit');
    const parsedLimit = limit ? parseInt(limit, 10) : 25;
    if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
      queries.push(Query.limit(parsedLimit));
    } else {
      queries.push(Query.limit(25));
    }

    const offset = searchParams.get('offset');
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      queries.push(Query.offset(parsedOffset));
    }

    // Sort by last purchase date (most recent first)
    queries.push(Query.orderDesc('last_purchase_date'));

    // Fetch products
    const dbAdapter = getAppwriteDatabases();
    const result = await dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, queries);

    // Format response with product statistics
    const products = result.documents.map((doc: any) => ({
      id: doc.$id,
      name: doc.name,
      productCode: doc.product_code,
      ncmCode: doc.ncm_code,
      category: doc.category,
      subcategory: doc.subcategory,
      statistics: {
        purchaseCount: doc.total_purchases,
        averagePrice: doc.average_price,
        lastPurchaseDate: doc.last_purchase_date,
      },
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: products,
      total: result.total,
      limit: parsedLimit,
      offset: parsedOffset,
    });
  } catch (error: any) {
    console.error('GET /api/products error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch products',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
