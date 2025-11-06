import { getCurrentUserId } from '@/lib/auth/session';
import { PriceTrackingError, getPriceTrackingService } from '@/lib/services/price-tracking.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/products/[id]/compare
 * Compare prices across all merchants for a product
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        {
          error: 'Product ID is required',
          code: 'INVALID_INPUT',
        },
        { status: 400 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Date range filtering (default 90 days)
    const days = searchParams.get('days');
    const parsedDays = days ? parseInt(days, 10) : 90;
    const finalDays = !isNaN(parsedDays) && parsedDays > 0 ? parsedDays : 90;

    // Fetch price comparison
    const priceTrackingService = getPriceTrackingService();
    const comparison = await priceTrackingService.comparePrice(userId, productId, finalDays);

    // Format merchant data with additional details
    const merchants = comparison.merchants.map((merchant) => ({
      merchantName: merchant.merchantName,
      merchantCnpj: merchant.merchantCnpj,
      prices: {
        average: merchant.averagePrice,
        lowest: merchant.lowestPrice,
        highest: merchant.highestPrice,
      },
      purchaseCount: merchant.purchaseCount,
      lastPurchaseDate: merchant.lastPurchaseDate,
      savingsVsBest: merchant.averagePrice - comparison.merchants[0].averagePrice, // First merchant is best (lowest)
      savingsVsBestPercent:
        comparison.merchants[0].averagePrice > 0
          ? ((merchant.averagePrice - comparison.merchants[0].averagePrice) / comparison.merchants[0].averagePrice) *
            100
          : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        productId: comparison.productId,
        productName: comparison.productName,
        dateRange: {
          days: finalDays,
        },
        overallStatistics: {
          lowestPrice: comparison.overallLowestPrice,
          highestPrice: comparison.overallHighestPrice,
          averagePrice: comparison.overallAveragePrice,
        },
        bestMerchant: {
          name: comparison.bestMerchant,
          averagePrice: comparison.merchants[0]?.averagePrice || 0,
        },
        savingsPotential: comparison.savingsPotential,
        merchants,
        totalMerchants: merchants.length,
      },
    });
  } catch (error: any) {
    console.error('GET /api/products/[id]/compare error:', error);

    // Handle product not found
    if (error instanceof PriceTrackingError && error.code === 'PRODUCT_NOT_FOUND') {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: 404 },
      );
    }

    // Handle no price data
    if (error instanceof PriceTrackingError && error.code === 'NO_PRICE_DATA') {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 404 },
      );
    }

    // Handle other price tracking errors
    if (error instanceof PriceTrackingError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to compare prices',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
