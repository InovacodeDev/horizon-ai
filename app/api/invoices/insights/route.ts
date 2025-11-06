/**
 * GET /api/invoices/insights
 *
 * Generate spending insights for the authenticated user.
 * Requires minimum 3 invoices to generate insights.
 */
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { getAnalyticsService } from '@/lib/services/analytics.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyRequestAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 });
    }

    const userId = user.sub;

    // Get analytics service
    const analyticsService = getAnalyticsService();

    // Generate insights
    const insights = await analyticsService.generateInsights(userId);

    // Check if user has minimum data
    if (!insights.hasMinimumData) {
      return NextResponse.json(
        {
          message: 'Insufficient data to generate insights. Please register at least 3 invoices.',
          totalInvoices: insights.totalInvoices,
          minimumRequired: 3,
          hasMinimumData: false,
        },
        { status: 200 },
      );
    }

    // Return insights
    return NextResponse.json(
      {
        insights: {
          totalInvoices: insights.totalInvoices,
          totalSpent: insights.totalSpent,
          averageInvoiceAmount: insights.averageInvoiceAmount,
          categoryBreakdown: insights.categoryBreakdown,
          topMerchants: insights.topMerchants,
          frequentProducts: insights.frequentProducts,
          monthlyTrend: insights.monthlyTrend,
          predictions: insights.predictions,
          anomalies: insights.anomalies,
        },
        hasMinimumData: true,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to generate insights:', error);

    return NextResponse.json(
      {
        error: 'INSIGHTS_GENERATION_ERROR',
        message: 'Failed to generate spending insights',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
