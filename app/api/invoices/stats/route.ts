/**
 * Invoice Parser Statistics API
 *
 * Provides comprehensive statistics about invoice parsing operations:
 * - Performance metrics (response time, success rate)
 * - AI token usage and costs
 * - Cache hit/miss rates
 * - Validation statistics
 *
 * GET /api/invoices/stats
 */
import { loggerService } from '@/lib/services/nfe-crawler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive statistics
    const stats = loggerService.getStats();

    return NextResponse.json({
      success: true,
      data: {
        performance: {
          totalOperations: stats.performance.totalOperations,
          successfulOperations: stats.performance.successfulOperations,
          failedOperations: stats.performance.failedOperations,
          successRate: `${(stats.performance.successRate * 100).toFixed(2)}%`,
          averageResponseTime: `${stats.performance.averageResponseTime.toFixed(0)}ms`,
          minResponseTime: `${stats.performance.minResponseTime}ms`,
          maxResponseTime: `${stats.performance.maxResponseTime}ms`,
          operationBreakdown: Object.entries(stats.performance.operationBreakdown).map(([operation, data]) => {
            const breakdown = data as { count: number; avgTime: number; successRate: number };
            return {
              operation,
              count: breakdown.count,
              avgTime: `${breakdown.avgTime.toFixed(0)}ms`,
              successRate: `${(breakdown.successRate * 100).toFixed(2)}%`,
            };
          }),
        },
        aiTokens: {
          totalRequests: stats.aiTokens.totalRequests,
          totalInputTokens: stats.aiTokens.totalInputTokens.toLocaleString(),
          totalOutputTokens: stats.aiTokens.totalOutputTokens.toLocaleString(),
          totalCachedTokens: stats.aiTokens.totalCachedTokens.toLocaleString(),
          totalTokens: stats.aiTokens.totalTokens.toLocaleString(),
          totalCost: `$${stats.aiTokens.totalCost.toFixed(4)}`,
          totalCacheSavings: `$${stats.aiTokens.totalCacheSavings.toFixed(4)}`,
          averageTokensPerRequest: stats.aiTokens.averageTokensPerRequest.toFixed(0),
          averageCostPerRequest: `$${stats.aiTokens.averageCostPerRequest.toFixed(4)}`,
        },
        cache: {
          totalOperations: stats.cache.totalOperations,
          hits: stats.cache.hits,
          misses: stats.cache.misses,
          sets: stats.cache.sets,
          clears: stats.cache.clears,
          hitRate: `${(stats.cache.hitRate * 100).toFixed(2)}%`,
        },
        validation: {
          totalValidations: stats.validation.totalValidations,
          successfulValidations: stats.validation.successfulValidations,
          failedValidations: stats.validation.failedValidations,
          successRate: `${(stats.validation.successRate * 100).toFixed(2)}%`,
          commonErrors: Object.entries(stats.validation.commonErrors)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([error, count]) => ({ error, count })),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invoice parser stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      { status: 500 },
    );
  }
}
