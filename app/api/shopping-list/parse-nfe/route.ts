import { GoogleAIServiceError, getGoogleAIService } from '@/lib/services/google-ai.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/shopping-list/parse-nfe
 * Parse a Brazilian electronic invoice (NFe) URL to extract purchase details using Google AI
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.nfeUrl || typeof body.nfeUrl !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'NFe URL is required and must be a string',
        },
        { status: 400 },
      );
    }

    // Validate URL is not empty after trimming
    if (body.nfeUrl.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'EMPTY_URL',
          message: 'NFe URL cannot be empty',
        },
        { status: 400 },
      );
    }

    // Basic URL format validation
    try {
      new URL(body.nfeUrl.trim());
    } catch {
      return NextResponse.json(
        {
          error: 'INVALID_URL_FORMAT',
          message: 'Invalid URL format. Please provide a valid NFe URL.',
        },
        { status: 400 },
      );
    }

    // Get Google AI service instance
    const googleAIService = getGoogleAIService();

    // Parse NFe
    const parsedPurchase = await googleAIService.parseNFe(body.nfeUrl.trim());

    // Validate parsed response contains all required fields
    if (!parsedPurchase.storeName) {
      return NextResponse.json(
        {
          error: 'INVALID_PARSED_DATA',
          message: 'Failed to extract store name from NFe',
        },
        { status: 500 },
      );
    }

    if (!parsedPurchase.purchaseDate) {
      return NextResponse.json(
        {
          error: 'INVALID_PARSED_DATA',
          message: 'Failed to extract purchase date from NFe',
        },
        { status: 500 },
      );
    }

    if (typeof parsedPurchase.totalAmount !== 'number' || parsedPurchase.totalAmount <= 0) {
      return NextResponse.json(
        {
          error: 'INVALID_PARSED_DATA',
          message: 'Failed to extract valid total amount from NFe',
        },
        { status: 500 },
      );
    }

    if (!Array.isArray(parsedPurchase.items) || parsedPurchase.items.length === 0) {
      return NextResponse.json(
        {
          error: 'INVALID_PARSED_DATA',
          message: 'Failed to extract items from NFe',
        },
        { status: 500 },
      );
    }

    // Return formatted purchase data
    return NextResponse.json({
      storeName: parsedPurchase.storeName,
      purchaseDate: parsedPurchase.purchaseDate,
      totalAmount: parsedPurchase.totalAmount,
      items: parsedPurchase.items,
    });
  } catch (error: any) {
    console.error('POST /api/shopping-list/parse-nfe error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

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
        case 'INVALID_URL':
        case 'INVALID_URL_FORMAT':
          statusCode = 400;
          userMessage = 'Invalid NFe URL. Please check the URL and try again.';
          break;
        case 'INVALID_PARSED_DATA':
          statusCode = 500;
          userMessage = 'Failed to parse NFe data. The invoice format may not be supported.';
          break;
        case 'EMPTY_RESPONSE':
        case 'PARSE_ERROR':
        case 'NFE_PARSE_ERROR':
          statusCode = 500;
          userMessage = 'Failed to parse NFe. Please try again or check if the URL is accessible.';
          break;
        default:
          statusCode = 500;
          userMessage = 'An error occurred while parsing the NFe. Please try again.';
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
        error: 'NFE_PARSE_ERROR',
        message: 'Failed to parse NFe. Please try again later.',
      },
      { status: 500 },
    );
  }
}
