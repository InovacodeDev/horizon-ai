/**
 * Invoice Export API Endpoint
 *
 * GET /api/invoices/export
 * Exports invoice data in CSV or PDF format with filtering support
 */
import { getCurrentUserId } from '@/lib/auth/session';
import { getExportService } from '@/lib/services/export.service';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/invoices/export
 * Export invoices with filters
 *
 * Query Parameters:
 * - format: 'csv' | 'pdf' (required)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - categories: comma-separated category list (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'User not authenticated' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') as 'csv' | 'pdf';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const categoriesParam = searchParams.get('categories');

    // Validate format
    if (!format || (format !== 'csv' && format !== 'pdf')) {
      return NextResponse.json(
        {
          error: 'Invalid format',
          message: 'Format must be either "csv" or "pdf"',
        },
        { status: 400 },
      );
    }

    // Parse categories
    const categories = categoriesParam ? categoriesParam.split(',').filter((c) => c.trim()) : undefined;

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid date',
            message: 'Start date and end date must be valid ISO date strings',
          },
          { status: 400 },
        );
      }

      if (start > end) {
        return NextResponse.json(
          {
            error: 'Invalid date range',
            message: 'Start date must be before end date',
          },
          { status: 400 },
        );
      }
    }

    // Generate export
    const exportService = getExportService();
    const result = await exportService.exportInvoices({
      userId,
      format,
      startDate,
      endDate,
      categories,
    });

    // Return file download response
    const headers = new Headers();
    headers.set('Content-Type', result.mimeType);
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`);

    // Convert data to appropriate format for NextResponse
    const responseData =
      typeof result.data === 'string'
        ? result.data
        : Buffer.isBuffer(result.data)
          ? result.data.toString('base64')
          : result.data;

    return new NextResponse(responseData, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Export error:', error);

    // Handle specific error codes
    if (error.code === 'NO_DATA_TO_EXPORT') {
      return NextResponse.json(
        {
          error: 'No data',
          message: 'No invoices found matching the specified filters',
          code: error.code,
        },
        { status: 404 },
      );
    }

    if (
      error.code === 'EXPORT_ERROR' ||
      error.code === 'CSV_GENERATION_ERROR' ||
      error.code === 'PDF_GENERATION_ERROR'
    ) {
      return NextResponse.json(
        {
          error: 'Export failed',
          message: error.message || 'Failed to generate export',
          code: error.code,
        },
        { status: 500 },
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while exporting invoices',
      },
      { status: 500 },
    );
  }
}
