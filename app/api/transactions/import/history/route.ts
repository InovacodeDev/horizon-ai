import { getCurrentUserId } from '@/lib/auth/session';
import { ImportService } from '@/lib/services/import.service';
import { ERROR_MESSAGES, ImportError, ImportErrorCode } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/transactions/import/history
 * Retrieve import history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES[ImportErrorCode.UNAUTHORIZED],
        },
        { status: 401 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');

    // Parse limit with default value
    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        limit = parsed;
      }
    }

    // Get import history
    const importService = new ImportService();
    const history = await importService.getImportHistory(userId, limit);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('GET /api/transactions/import/history error:', error);

    // Handle ImportError with specific error codes
    if (error instanceof ImportError) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES[error.code] || error.message,
        },
        { status: statusCode },
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve import history',
      },
      { status: 500 },
    );
  }
}

/**
 * Map ImportErrorCode to HTTP status code
 */
function getStatusCodeForError(code: ImportErrorCode): number {
  switch (code) {
    case ImportErrorCode.INVALID_FILE_FORMAT:
    case ImportErrorCode.FILE_TOO_LARGE:
    case ImportErrorCode.VALIDATION_ERROR:
    case ImportErrorCode.MISSING_REQUIRED_COLUMNS:
    case ImportErrorCode.INVALID_DATE_FORMAT:
    case ImportErrorCode.INVALID_AMOUNT_FORMAT:
      return 400;
    case ImportErrorCode.UNAUTHORIZED:
      return 401;
    case ImportErrorCode.ACCOUNT_NOT_FOUND:
      return 404;
    case ImportErrorCode.PARSE_ERROR:
    case ImportErrorCode.NO_TRANSACTIONS_FOUND:
    case ImportErrorCode.MALFORMED_FILE:
      return 422;
    case ImportErrorCode.DATABASE_ERROR:
    case ImportErrorCode.AI_SERVICE_ERROR:
    default:
      return 500;
  }
}
