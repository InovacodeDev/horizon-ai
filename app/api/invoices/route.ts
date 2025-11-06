import { getCurrentUserId } from '@/lib/auth/session';
import { InvoiceParserError, invoiceParserService } from '@/lib/services/invoice-parser.service';
import { InvoiceServiceError, getInvoiceService } from '@/lib/services/invoice.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/invoices
 * Register a new invoice from URL or QR code data
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    if (!body.invoiceUrl && !body.qrCodeData) {
      return NextResponse.json(
        {
          error: 'Either invoiceUrl or qrCodeData is required',
          code: 'INVALID_INPUT',
        },
        { status: 400 },
      );
    }

    // Parse invoice data
    let parsedInvoice;
    try {
      if (body.invoiceUrl) {
        parsedInvoice = await invoiceParserService.parseFromUrl(body.invoiceUrl);
      } else {
        parsedInvoice = await invoiceParserService.parseFromQRCode(body.qrCodeData);
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

    // Store invoice
    const invoiceService = getInvoiceService();
    const invoice = await invoiceService.createInvoice({
      userId,
      parsedInvoice,
      customCategory: body.customCategory,
      transactionId: body.transactionId,
      accountId: body.accountId,
    });

    return NextResponse.json(
      {
        success: true,
        data: invoice,
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
 * List invoices for the authenticated user with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Build filters
    const filters: any = {
      userId,
    };

    // Date range filters
    const startDate = searchParams.get('startDate');
    if (startDate) {
      filters.startDate = startDate;
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      filters.endDate = endDate;
    }

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      filters.category = category;
    }

    // Merchant filter
    const merchant = searchParams.get('merchant');
    if (merchant) {
      filters.merchant = merchant;
    }

    // Amount range filters
    const minAmount = searchParams.get('minAmount');
    if (minAmount) {
      const parsed = parseFloat(minAmount);
      if (!isNaN(parsed)) {
        filters.minAmount = parsed;
      }
    }

    const maxAmount = searchParams.get('maxAmount');
    if (maxAmount) {
      const parsed = parseFloat(maxAmount);
      if (!isNaN(parsed)) {
        filters.maxAmount = parsed;
      }
    }

    // Search filter
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Pagination
    const limit = searchParams.get('limit');
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        filters.limit = parsed;
      }
    }

    const offset = searchParams.get('offset');
    if (offset) {
      const parsed = parseInt(offset, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        filters.offset = parsed;
      }
    }

    // Fetch invoices
    const invoiceService = getInvoiceService();
    const result = await invoiceService.listInvoices(filters);

    return NextResponse.json({
      success: true,
      data: result.invoices,
      total: result.total,
      limit: filters.limit || 25,
      offset: filters.offset || 0,
    });
  } catch (error: any) {
    console.error('GET /api/invoices error:', error);

    if (error instanceof InvoiceServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch invoices',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
