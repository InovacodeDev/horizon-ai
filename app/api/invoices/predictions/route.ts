/**
 * GET /api/invoices/predictions
 *
 * Generate monthly spending predictions per category for the authenticated user.
 * Requires minimum 3 months of historical data.
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

    // Generate insights (which includes predictions)
    const insights = await analyticsService.generateInsights(userId);

    // Check if we have predictions
    if (insights.predictions.length === 0) {
      return NextResponse.json(
        {
          message:
            'Insufficient historical data to generate predictions. Please register invoices for at least 3 months.',
          predictions: [],
          hasMinimumData: false,
        },
        { status: 200 },
      );
    }

    // Return predictions with additional context
    return NextResponse.json(
      {
        predictions: insights.predictions.map((pred) => ({
          category: pred.category,
          predictedAmount: pred.predictedAmount,
          confidence: pred.confidence,
          currentSpending: pred.currentSpending,
          daysRemaining: pred.daysRemaining,
          onTrack: pred.onTrack,
          baseline: pred.baseline,
          trend: pred.trend,
          progressPercentage: pred.predictedAmount > 0 ? (pred.currentSpending / pred.predictedAmount) * 100 : 0,
          remainingBudget: Math.max(0, pred.predictedAmount - pred.currentSpending),
        })),
        hasMinimumData: true,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to generate predictions:', error);

    return NextResponse.json(
      {
        error: 'PREDICTIONS_GENERATION_ERROR',
        message: 'Failed to generate spending predictions',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
