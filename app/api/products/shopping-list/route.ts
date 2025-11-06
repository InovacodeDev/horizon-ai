import { getCurrentUserId } from '@/lib/auth/session';
import { PriceTrackingError, ShoppingListItem, getPriceTrackingService } from '@/lib/services/price-tracking.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/products/shopping-list
 * Optimize shopping list by calculating best prices per merchant
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          error: 'Items array is required and must not be empty',
          code: 'INVALID_INPUT',
        },
        { status: 400 },
      );
    }

    // Validate each item
    const items: ShoppingListItem[] = [];
    for (const item of body.items) {
      if (!item.productId) {
        return NextResponse.json(
          {
            error: 'Each item must have a productId',
            code: 'INVALID_INPUT',
          },
          { status: 400 },
        );
      }

      items.push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity || 1,
      });
    }

    // Date range for price data (default 90 days)
    const days = body.days || 90;
    const parsedDays = !isNaN(days) && days > 0 ? days : 90;

    // Optimize shopping list
    const priceTrackingService = getPriceTrackingService();
    const optimization = await priceTrackingService.optimizeShoppingList(userId, items, parsedDays);

    // Format response
    const response = {
      requestedItems: optimization.requestedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity || 1,
      })),
      merchantOptions: optimization.merchantOptions.map((option) => ({
        merchantName: option.merchantName,
        merchantCnpj: option.merchantCnpj,
        items: option.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          totalCost: item.price * item.quantity,
        })),
        totalCost: option.totalCost,
        averagePricePerItem: option.averagePricePerItem,
        itemsAvailable: option.items.length,
        itemsMissing: optimization.requestedItems.length - option.items.length,
      })),
      bestOption: {
        merchantName: optimization.bestOption.merchantName,
        merchantCnpj: optimization.bestOption.merchantCnpj,
        totalCost: optimization.bestOption.totalCost,
        itemsAvailable: optimization.bestOption.items.length,
        itemsMissing: optimization.requestedItems.length - optimization.bestOption.items.length,
      },
      potentialSavings: optimization.potentialSavings,
      recommendation: optimization.recommendation,
      dateRange: {
        days: parsedDays,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('POST /api/products/shopping-list error:', error);

    // Handle empty shopping list
    if (error instanceof PriceTrackingError && error.code === 'EMPTY_SHOPPING_LIST') {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: 400 },
      );
    }

    // Handle no price data
    if (error instanceof PriceTrackingError && error.code === 'NO_PRICE_DATA') {
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
        error: error.message || 'Failed to optimize shopping list',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
