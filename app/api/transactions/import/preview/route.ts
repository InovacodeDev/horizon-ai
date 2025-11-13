import { getCurrentUserId } from '@/lib/auth/session';
import { AccountService } from '@/lib/services/account.service';
import { ImportService } from '@/lib/services/import.service';
import { ERROR_MESSAGES, ImportError, ImportErrorCode } from '@/lib/types';
import {
  logFileValidationFailed,
  logImportPreview,
  logRateLimitExceeded,
  logUnauthorizedAccess,
} from '@/lib/utils/audit-logger';
import { validateFile } from '@/lib/utils/file-security';
import { checkImportPreviewRateLimit } from '@/lib/utils/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transactions/import/preview
 * Parse uploaded file and return preview data without creating transactions
 */
export async function POST(request: NextRequest) {
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

    // Check rate limit
    const rateLimit = checkImportPreviewRateLimit(userId);
    if (!rateLimit.allowed) {
      await logRateLimitExceeded(userId, 'import_preview', request.headers.get('x-forwarded-for') || undefined);

      return NextResponse.json(
        {
          success: false,
          error: `Limite de importações excedido. Tente novamente em ${rateLimit.resetIn} segundos.`,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetIn.toString(),
          },
        },
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const accountId = formData.get('accountId') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'File is required',
        },
        { status: 400 },
      );
    }

    // Validate account ID
    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account ID is required',
        },
        { status: 400 },
      );
    }

    // Comprehensive file validation (extension, MIME type, size, malicious content)
    try {
      await validateFile(file);
    } catch (error) {
      if (error instanceof ImportError) {
        await logFileValidationFailed(
          userId,
          file.name,
          error.message,
          request.headers.get('x-forwarded-for') || undefined,
        );
        throw error;
      }
      throw error;
    }

    // Verify user owns the account
    const accountService = new AccountService();
    try {
      await accountService.getAccountById(accountId, userId);
    } catch (error) {
      await logUnauthorizedAccess(userId, accountId, request.headers.get('x-forwarded-for') || undefined);

      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES[ImportErrorCode.ACCOUNT_NOT_FOUND],
        },
        { status: 404 },
      );
    }

    // Get all user accounts for matching
    const userAccounts = await accountService.getAccountsByUserId(userId);

    // Process import preview
    const importService = new ImportService();
    const result = await importService.previewImport(file, accountId, userId, userAccounts);

    // Log successful preview
    await logImportPreview(userId, file.name, accountId, result.transactions.length);

    // Convert Set to Array for JSON serialization
    const duplicatesArray = Array.from(result.duplicates);

    return NextResponse.json({
      success: true,
      data: {
        transactions: result.transactions,
        duplicates: duplicatesArray,
        summary: result.summary,
        matchedAccountId: result.matchedAccountId,
        accountInfo: result.accountInfo,
      },
    });
  } catch (error: any) {
    console.error('POST /api/transactions/import/preview error:', error);

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
        error: error.message || 'Failed to preview import',
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
