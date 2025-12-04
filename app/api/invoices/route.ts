import { getCurrentUserId } from '@/lib/auth/session';
import { InvoiceParserError, invoiceParserService } from '@/lib/services/invoice-parser.service';
import { InvoiceServiceError, getInvoiceService } from '@/lib/services/invoice.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/invoices
 * Register a new invoice from URL or QR code data
 *
 * Query Parameters:
 * - forceRefresh: boolean - Bypass cache and force re-parsing (default: false)
 *
 * Requirements: 5.5, 6.1
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const parseOnly = searchParams.get('parseOnly') === 'true';

    // Parse request body
    const body = await request.json();

    // Validate input
    if (!body.invoiceUrl && !body.qrCodeData && !body.xmlContent && !body.pdfBuffer && !body.parsedInvoice) {
      return NextResponse.json(
        {
          error: 'Either invoiceUrl, qrCodeData, xmlContent, pdfBuffer or parsedInvoice is required',
          code: 'INVALID_INPUT',
        },
        { status: 400 },
      );
    }

    // Parse invoice data with force refresh option
    let parsedInvoice;

    // If parsedInvoice is provided in body, use it (for saving edited invoices)
    if (body.parsedInvoice) {
      parsedInvoice = body.parsedInvoice;
      // Ensure issueDate is a Date object (it comes as string from JSON)
      if (typeof parsedInvoice.issueDate === 'string') {
        parsedInvoice.issueDate = new Date(parsedInvoice.issueDate);
      }
      // Ensure CNPJ is numbers only
      if (parsedInvoice.merchant?.cnpj) {
        parsedInvoice.merchant.cnpj = parsedInvoice.merchant.cnpj.replace(/\D/g, '');
      }
    } else {
      // Otherwise parse from source
      try {
        if (body.invoiceUrl) {
          parsedInvoice = await invoiceParserService.parseFromUrl(body.invoiceUrl, forceRefresh);
        } else if (body.qrCodeData) {
          parsedInvoice = await invoiceParserService.parseFromQRCode(body.qrCodeData, forceRefresh);
        } else if (body.xmlContent) {
          parsedInvoice = await invoiceParserService.parseFromXmlFile(body.xmlContent);
        } else if (body.pdfBuffer) {
          parsedInvoice = await invoiceParserService.parseFromPdfFile(body.pdfBuffer);
        } else {
          throw new Error('No valid input provided');
        }
      } catch (error) {
        if (error instanceof InvoiceParserError) {
          return NextResponse.json(
            {
              error: error.message,
              code: error.code,
              details: error.details,
            },
            { status: 400 },
          );
        }
        throw error;
      }
    }

    // If parseOnly is true, return the parsed data without saving
    if (parseOnly) {
      return NextResponse.json(
        {
          success: true,
          data: parsedInvoice,
        },
        { status: 200 },
      );
    }

    // Store invoice
    const invoiceService = getInvoiceService();
    const invoice = await invoiceService.createInvoice({
      userId,
      parsedInvoice,
      customCategory: body.customCategory,
      transactionId: body.transactionId,
      accountId: body.accountId,
    });

    // Include cache metadata in response
    return NextResponse.json(
      {
        success: true,
        data: invoice,
        metadata: {
          fromCache: parsedInvoice.metadata?.fromCache || false,
          cachedAt: parsedInvoice.metadata?.fromCache ? parsedInvoice.metadata.parsedAt : undefined,
          parsingMethod: parsedInvoice.metadata?.parsingMethod || 'ai',
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('POST /api/invoices error:', error);

    // Handle duplicate invoice error
    if (error instanceof InvoiceServiceError && error.code === 'INVOICE_DUPLICATE') {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 409 },
      );
    }

    // Handle other service errors
    if (error instanceof InvoiceServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to create invoice',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/invoices
 *
 * @deprecated This endpoint is deprecated. Use Appwrite Realtime subscriptions instead.
 *
 * All invoice data should be fetched via the `useInvoicesWithSharing` hook which uses
 * Appwrite Realtime for automatic updates.
 *
 * @see hooks/useInvoicesWithSharing.ts
 * @see docs/REALTIME_USAGE_GUIDE.md
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message:
        'This endpoint is deprecated. Use Appwrite Realtime subscriptions via useInvoicesWithSharing hook instead.',
      migration: {
        hook: 'useInvoicesWithSharing',
        docs: '/docs/REALTIME_USAGE_GUIDE.md',
      },
    },
    { status: 410 },
  );
}
