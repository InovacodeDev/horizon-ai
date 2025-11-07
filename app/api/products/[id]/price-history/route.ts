import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

/**
 * GET /api/products/[id]/price-history
 * Get price history for a specific product
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    // Fetch price history from database
    const databases = getAppwriteDatabases();
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRICE_HISTORY, [
      Query.equal('user_id', userId),
      Query.equal('product_id', productId),
      Query.orderDesc('purchase_date'),
      Query.limit(100), // Limit to last 100 purchases
    ]);

    // Transform data for response
    const priceHistory = result.documents.map((doc: any) => ({
      id: doc.$id,
      purchaseDate: doc.purchase_date,
      unitPrice: doc.unit_price,
      quantity: doc.quantity,
      merchantName: doc.merchant_name,
      merchantCnpj: doc.merchant_cnpj,
      invoiceId: doc.invoice_id,
    }));

    return NextResponse.json({
      success: true,
      data: priceHistory,
      total: result.total,
    });
  } catch (error: any) {
    console.error('GET /api/products/[id]/price-history error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch price history',
      },
      { status: 500 },
    );
  }
}
