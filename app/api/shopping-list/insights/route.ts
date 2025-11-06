import { GoogleAIServiceError, getGoogleAIService } from '@/lib/services/google-ai.service';
import type { PurchaseRecord } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/shopping-list/insights
 * Generate savings insights from purchase history using Google AI
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.purchaseHistory) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Purchase history is required',
        },
        { status: 400 },
      );
    }

    // Validate purchaseHistory is an array
    if (!Array.isArray(body.purchaseHistory)) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Purchase history must be an array',
        },
        { status: 400 },
      );
    }

    // Check that purchase history is not empty before calling AI
    if (body.purchaseHistory.length === 0) {
      return NextResponse.json(
        {
          error: 'EMPTY_HISTORY',
          message: 'Purchase history cannot be empty. Add some purchases first.',
        },
        { status: 400 },
      );
    }

    // Get Google AI service instance
    const googleAIService = getGoogleAIService();

    // Generate insights
    const insights = await googleAIService.generateInsights(body.purchaseHistory as PurchaseRecord[]);

    // Return insights in response
    return NextResponse.json({
      insights,
    });
  } catch (error: any) {
    console.error('POST /api/shopping-list/insights error:', error);

    // Handle Google AI service errors
    if (error instanceof GoogleAIServiceError) {
      // Map error codes to appropriate HTTP status codes and user-friendly messages
      let statusCode = 500;
      let userMessage = error.message;

      switch (error.code) {
        case 'MISSING_API_KEY':
          statusCode = 500;
          userMessage = 'Service configuration error. Please contact support.';
          break;
        case 'INVALID_INPUT':
        case 'EMPTY_HISTORY':
          statusCode = 400;
          userMessage = error.message;
          break;
        case 'EMPTY_RESPONSE':
        case 'EMPTY_RESULT':
          statusCode = 500;
          userMessage = 'Failed to generate insights. Please try again.';
          break;
        case 'INSIGHTS_ERROR':
          statusCode = 500;
          userMessage = 'An error occurred while generating insights. Please try again.';
          break;
        default:
          statusCode = 500;
          userMessage = 'Failed to generate insights. Please try again later.';
      }

      return NextResponse.json(
        {
          error: error.code,
          message: userMessage,
        },
        { status: statusCode },
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'INSIGHTS_ERROR',
        message: 'Failed to generate insights. Please try again later.',
      },
      { status: 500 },
    );
  }
}
