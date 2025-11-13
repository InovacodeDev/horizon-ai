import { getCurrentUserId } from '@/lib/auth/session';
import { AccountService } from '@/lib/services/account.service';
import { ImportService } from '@/lib/services/import.service';
import { ERROR_MESSAGES, ImportError, ImportErrorCode, type ParsedTransaction } from '@/lib/types';
import {
  logImportCompleted,
  logImportFailed,
  logImportStarted,
  logRateLimitExceeded,
  logUnauthorizedAccess,
} from '@/lib/utils/audit-logger';
import { checkImportRateLimit } from '@/lib/utils/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transactions/import
 * Create transactions from selected preview items
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
    const rateLimit = checkImportRateLimit(userId);
    if (!rateLimit.allowed) {
      await logRateLimitExceeded(userId, 'import', request.headers.get('x-forwarded-for') || undefined);

      return NextResponse.json(
        {
          success: false,
          error: `Limite de importações excedido. Tente novamente em ${Math.ceil(rateLimit.resetIn / 60)} minutos.`,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetIn.toString(),
          },
        },
      );
    }

    // Parse request body
    const body = await request.json();
    const { accountId, transactions, fileName } = body;

    // Validate required fields
    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account ID is required',
        },
        { status: 400 },
      );
    }

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transactions array is required',
        },
        { status: 400 },
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one transaction must be selected',
        },
        { status: 400 },
      );
    }

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          error: 'File name is required',
        },
        { status: 400 },
      );
    }

    // Validate transactions structure
    for (const transaction of transactions) {
      if (!isValidParsedTransaction(transaction)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid transaction data',
          },
          { status: 400 },
        );
      }
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

    // Log import started
    await logImportStarted(
      userId,
      fileName,
      accountId,
      transactions.length,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined,
    );

    // Process import
    const importService = new ImportService();
    const result = await importService.processImport(transactions, accountId, userId, fileName);

    // Log import completed
    await logImportCompleted(userId, fileName, accountId, result.imported, result.importId);

    return NextResponse.json({
      success: true,
      data: {
        imported: result.imported,
        failed: result.failed,
        importId: result.importId,
      },
    });
  } catch (error: any) {
    console.error('POST /api/transactions/import error:', error);

    // Log import failed
    try {
      const userId = await getCurrentUserId();
      const body = await request.json().catch(() => ({}));
      const { accountId, fileName } = body;

      if (userId && fileName && accountId) {
        await logImportFailed(userId, fileName, accountId, error.message || 'Unknown error');
      }
    } catch (logError) {
      console.error('Failed to log import failure:', logError);
    }

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
        error: error.message || 'Failed to process import',
      },
      { status: 500 },
    );
  }
}

/**
 * Validate ParsedTransaction structure
 */
function isValidParsedTransaction(transaction: any): transaction is ParsedTransaction {
  if (!transaction || typeof transaction !== 'object') {
    return false;
  }

  // Check required fields
  if (!transaction.id || typeof transaction.id !== 'string') {
    return false;
  }

  if (!transaction.date || typeof transaction.date !== 'string') {
    return false;
  }

  if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
    return false;
  }

  if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
    return false;
  }

  if (!transaction.description || typeof transaction.description !== 'string') {
    return false;
  }

  return true;
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
