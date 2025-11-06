import { getCurrentUserId } from '@/lib/auth/session';
import { PriceTrackingError, getPriceTrackingService } from '@/lib/services/price-tracking.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/products/[id]/price-history
 * Fetch price history for specific product with date range filtering
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

    // Fetch price history
    const priceTrackingService = getPriceTrackingService();
    const priceHistory = await priceTrackingService.getPriceHistory(userId, productId, finalDays);

    // Group prices by merchant
    const merchantMap = new Map<string, any[]>();

    for (const price of priceHistory.prices) {
      const key = price.merchantCnpj;
      if (!merchantMap.has(key)) {
        merchantMap.set(key, []);
      }
      merchantMap.get(key)!.push({
        date: price.date,
        price: price.price,
        quantity: price.quantity,
        invoiceId: price.invoiceId,
      });
    }

    // Calculate price change indicators
    const merchantPrices = Array.from(merchantMap.entries()).map(([cnpj, prices]) => {
      const sortedPrices = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let priceChange = 0;
      let priceChangePercent = 0;

      if (sortedPrices.length >= 2) {
        const oldestPrice = sortedPrices[0].price;
        const newestPrice = sortedPrices[sortedPrices.length - 1].price;
        priceChange = newestPrice - oldestPrice;
        priceChangePercent = (priceChange / oldestPrice) * 100;
      }

      return {
        merchantName: priceHistory.prices.find((p) => p.merchantCnpj === cnpj)?.merchantName,
        merchantCnpj: cnpj,
        prices: sortedPrices,
        priceChange,
        priceChangePercent,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        productId: priceHistory.productId,
        productName: priceHistory.productName,
        dateRange: {
          days: finalDays,
          startDate: new Date(Date.now() - finalDays * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
        statistics: {
          lowestPrice: priceHistory.lowestPrice,
          highestPrice: priceHistory.highestPrice,
          averagePrice: priceHistory.averagePrice,
          priceRange: priceHistory.priceRange,
        },
        merchantPrices,
        totalDataPoints: priceHistory.prices.length,
      },
    });
  } catch (error: any) {
    console.error('GET /api/products/[id]/price-history error:', error);

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
        error: error.message || 'Failed to fetch price history',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
