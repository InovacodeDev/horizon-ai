/**
 * POST /api/invoices/budgets
 * Create or update a budget limit for a category
 *
 * GET /api/invoices/budgets
 * Get all budget limits for the authenticated user
 */
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { getAnalyticsService } from '@/lib/services/analytics.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/invoices/budgets
 * Create or update a budget limit for a category
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyRequestAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 });
    }

    const userId = user.sub;

    // Parse request body
    const body = await request.json();
    const { category, limit } = body;

    // Validate required fields
    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Category is required and must be a string',
        },
        { status: 400 },
      );
    }

    if (typeof limit !== 'number' || limit <= 0) {
      return NextResponse.json(
        {
          error: 'INVALID_LIMIT',
          message: 'Limit must be a positive number',
        },
        { status: 400 },
      );
    }

    // Get analytics service
    const analyticsService = getAnalyticsService();

    // Set budget limit
    await analyticsService.setBudgetLimit(userId, category, limit);

    // Get the updated budget with current spending
    const budgets = await analyticsService.getAllBudgetLimits(userId);
    const updatedBudget = budgets.find((b) => b.category === category);

    return NextResponse.json(
      {
        message: 'Budget limit set successfully',
        budget: updatedBudget || {
          category,
          limit,
          currentSpending: 0,
          percentage: 0,
          status: 'ok',
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to set budget limit:', error);

    return NextResponse.json(
      {
        error: error.code || 'BUDGET_SET_ERROR',
        message: error.message || 'Failed to set budget limit',
        details: error.details,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/invoices/budgets
 * Get all budget limits for the authenticated user
 */
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

    // Get all budget limits with current spending
    const budgets = await analyticsService.getAllBudgetLimits(userId);

    // Generate budget alerts
    const alerts = await analyticsService.generateBudgetAlerts(userId);

    return NextResponse.json(
      {
        budgets: budgets.map((budget) => ({
          category: budget.category,
          limit: budget.limit,
          currentSpending: budget.currentSpending,
          percentage: budget.percentage,
          status: budget.status,
          recommendation: budget.recommendation,
          remaining: Math.max(0, budget.limit - budget.currentSpending),
        })),
        alerts,
        summary: {
          totalBudgets: budgets.length,
          exceededCount: budgets.filter((b) => b.status === 'exceeded').length,
          warningCount: budgets.filter((b) => b.status === 'warning').length,
          okCount: budgets.filter((b) => b.status === 'ok').length,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to get budget limits:', error);

    return NextResponse.json(
      {
        error: error.code || 'BUDGET_GET_ERROR',
        message: error.message || 'Failed to get budget limits',
        details: error.details,
      },
      { status: 500 },
    );
  }
}
