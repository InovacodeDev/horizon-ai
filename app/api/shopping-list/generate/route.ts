import { GoogleAIServiceError, getGoogleAIService } from '@/lib/services/google-ai.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/shopping-list/generate
 * Generate a shopping list from a user prompt using Google AI
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Prompt is required and must be a string',
        },
        { status: 400 },
      );
    }

    // Validate prompt is not empty after trimming
    if (body.prompt.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'EMPTY_PROMPT',
          message: 'Prompt cannot be empty',
        },
        { status: 400 },
      );
    }

    // Get Google AI service instance
    const googleAIService = getGoogleAIService();

    // Generate shopping list
    const items = await googleAIService.generateShoppingList(body.prompt);

    // Return formatted response
    return NextResponse.json({
      items,
      title: body.prompt.trim(),
    });
  } catch (error: any) {
    console.error('POST /api/shopping-list/generate error:', error);

    // Handle Google AI service errors
    if (error instanceof GoogleAIServiceError) {
      // Map error codes to appropriate HTTP status codes
      const statusCode = error.code === 'MISSING_API_KEY' ? 500 : 400;

      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: statusCode },
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'GENERATION_ERROR',
        message: 'Failed to generate shopping list. Please try again.',
      },
      { status: 500 },
    );
  }
}
