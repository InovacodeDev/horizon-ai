import { getCurrentUserId } from '@/lib/auth/session';
import { InvoiceServiceError, getInvoiceService } from '@/lib/services/invoice.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/invoices/[id]
 * Get invoice by ID with all line items
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Fetch invoice with items
    const invoiceService = getInvoiceService();
    const invoice = await invoiceService.getInvoiceById(invoiceId, userId);

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error('GET /api/invoices/[id] error:', error);

    // Handle not found error
    if (error instanceof InvoiceServiceError && error.code === 'INVOICE_NOT_FOUND') {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: 404 },
      );
    }

    // Handle other service errors
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
        error: error.message || 'Failed to fetch invoice',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/invoices/[id]
 * Delete invoice and cascade to invoice items
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Delete invoice
    const invoiceService = getInvoiceService();
    await invoiceService.deleteInvoice(invoiceId, userId);

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/invoices/[id] error:', error);

    // Handle not found error
    if (error instanceof InvoiceServiceError && error.code === 'INVOICE_NOT_FOUND') {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: 404 },
      );
    }

    // Handle other service errors
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
        error: error.message || 'Failed to delete invoice',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
