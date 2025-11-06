import { getCurrentUserId } from '@/lib/auth/session';
import { InvoiceServiceError, getInvoiceService } from '@/lib/services/invoice.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/invoices/bulk-delete
 * Delete multiple invoices at once
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceIds } = body;

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        {
          error: 'Invoice IDs array is required',
          code: 'INVALID_INPUT',
        },
        { status: 400 },
      );
    }

    // Delete invoices
    const invoiceService = getInvoiceService();
    const results = await Promise.allSettled(invoiceIds.map((id) => invoiceService.deleteInvoice(id, userId)));

    // Count successes and failures
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `${successful} nota(s) fiscal(is) excluída(s) com sucesso`,
      data: {
        total: invoiceIds.length,
        successful,
        failed,
      },
    });
  } catch (error: any) {
    console.error('POST /api/invoices/bulk-delete error:', error);

    // Handle service errors
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
        error: error.message || 'Failed to delete invoices',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
