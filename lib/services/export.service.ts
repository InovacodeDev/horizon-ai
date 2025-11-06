/**
 * Export Service
 *
 * Handles exporting invoice data to CSV and PDF formats with filtering support.
 * Generates reports with category breakdowns and spending summaries.
 */
import { Invoice, InvoiceItem } from '@/lib/appwrite/schema';

import { InvoiceFilter, InvoiceService, InvoiceWithItems } from './invoice.service';

// ============================================
// Types and Interfaces
// ============================================

export interface ExportFilter {
  userId: string;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  format: 'csv' | 'pdf';
}

export interface ExportResult {
  data: Buffer | string;
  filename: string;
  mimeType: string;
}

export interface CategorySummary {
  category: string;
  totalAmount: number;
  invoiceCount: number;
  percentage: number;
}

export interface ExportSummary {
  totalInvoices: number;
  totalAmount: number;
  startDate: string;
  endDate: string;
  categories: CategorySummary[];
}

// ============================================
// Error Classes
// ============================================

export class ExportServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ExportServiceError';
  }
}

// ============================================
// Export Service
// ============================================

export class ExportService {
  private invoiceService: InvoiceService;

  constructor(invoiceService: InvoiceService) {
    this.invoiceService = invoiceService;
  }

  // ============================================
  // Main Export Methods
  // ============================================

  /**
   * Export invoices based on filters and format
   */
  async exportInvoices(filters: ExportFilter): Promise<ExportResult> {
    try {
      // Fetch invoices with filters
      const invoices = await this.fetchInvoicesForExport(filters);

      if (invoices.length === 0) {
        throw new ExportServiceError('No invoices found matching the specified filters', 'NO_DATA_TO_EXPORT');
      }

      // Generate export based on format
      if (filters.format === 'csv') {
        return await this.generateCSVExport(invoices, filters);
      } else {
        return await this.generatePDFExport(invoices, filters);
      }
    } catch (error) {
      if (error instanceof ExportServiceError) {
        throw error;
      }
      throw new ExportServiceError('Failed to export invoices', 'EXPORT_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ============================================
  // CSV Export
  // ============================================

  /**
   * Generate CSV export of invoice data
   */
  private async generateCSVExport(invoices: InvoiceWithItems[], filters: ExportFilter): Promise<ExportResult> {
    try {
      const lines: string[] = [];

      // Add header row
      lines.push(
        [
          'Invoice Number',
          'Invoice Key',
          'Issue Date',
          'Merchant Name',
          'Merchant CNPJ',
          'Category',
          'Product Description',
          'Product Code',
          'NCM Code',
          'Quantity',
          'Unit Price',
          'Total Price',
          'Discount',
          'Invoice Total',
        ].join(','),
      );

      // Add data rows (one row per invoice item)
      for (const invoice of invoices) {
        for (const item of invoice.items) {
          const row = [
            this.escapeCSV(invoice.invoice_number),
            this.escapeCSV(invoice.invoice_key),
            this.formatDate(invoice.issue_date),
            this.escapeCSV(invoice.merchant_name),
            this.escapeCSV(invoice.merchant_cnpj),
            this.escapeCSV(invoice.category),
            this.escapeCSV(item.description),
            this.escapeCSV(item.product_code || ''),
            this.escapeCSV(item.ncm_code || ''),
            item.quantity.toString(),
            this.formatCurrency(item.unit_price),
            this.formatCurrency(item.total_price),
            this.formatCurrency(item.discount_amount || 0),
            this.formatCurrency(invoice.total_amount),
          ];
          lines.push(row.join(','));
        }
      }

      const csvContent = lines.join('\n');
      const filename = this.generateFilename('invoices', filters, 'csv');

      return {
        data: csvContent,
        filename,
        mimeType: 'text/csv',
      };
    } catch (error) {
      throw new ExportServiceError('Failed to generate CSV export', 'CSV_GENERATION_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ============================================
  // PDF Export
  // ============================================

  /**
   * Generate PDF report with charts and summaries
   */
  private async generatePDFExport(invoices: InvoiceWithItems[], filters: ExportFilter): Promise<ExportResult> {
    try {
      // Calculate summary statistics
      const summary = this.calculateSummary(invoices);

      // Generate HTML content for PDF
      const htmlContent = this.generatePDFHTML(invoices, summary, filters);

      // For now, return HTML as the PDF content
      // In production, you would use a library like puppeteer or pdfkit to convert HTML to PDF
      const filename = this.generateFilename('invoices-report', filters, 'pdf');

      return {
        data: htmlContent,
        filename,
        mimeType: 'application/pdf',
      };
    } catch (error) {
      throw new ExportServiceError('Failed to generate PDF export', 'PDF_GENERATION_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate HTML content for PDF report
   */
  private generatePDFHTML(invoices: InvoiceWithItems[], summary: ExportSummary, filters: ExportFilter): string {
    const categoriesHTML = summary.categories
      .map(
        (cat) => `
        <tr>
          <td>${this.escapeHTML(cat.category)}</td>
          <td>${cat.invoiceCount}</td>
          <td>R$ ${this.formatCurrency(cat.totalAmount)}</td>
          <td>${cat.percentage.toFixed(1)}%</td>
        </tr>
      `,
      )
      .join('');

    const invoicesHTML = invoices
      .map(
        (invoice) => `
        <div class="invoice-section">
          <h3>Invoice #${this.escapeHTML(invoice.invoice_number)}</h3>
          <div class="invoice-header">
            <p><strong>Date:</strong> ${this.formatDate(invoice.issue_date)}</p>
            <p><strong>Merchant:</strong> ${this.escapeHTML(invoice.merchant_name)}</p>
            <p><strong>CNPJ:</strong> ${this.escapeHTML(invoice.merchant_cnpj)}</p>
            <p><strong>Category:</strong> ${this.escapeHTML(invoice.category)}</p>
            <p><strong>Total:</strong> R$ ${this.formatCurrency(invoice.total_amount)}</p>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item) => `
                <tr>
                  <td>${this.escapeHTML(item.description)}</td>
                  <td>${item.quantity}</td>
                  <td>R$ ${this.formatCurrency(item.unit_price)}</td>
                  <td>R$ ${this.formatCurrency(item.total_price)}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
    }
    h3 {
      color: #1e3a8a;
      margin-top: 20px;
    }
    .summary {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }
    .summary-item strong {
      display: block;
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 5px;
    }
    .summary-item span {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background: #f9fafb;
    }
    .invoice-section {
      page-break-inside: avoid;
      margin: 30px 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
    .invoice-header {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 15px 0;
      padding: 15px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .invoice-header p {
      margin: 5px 0;
    }
    .items-table {
      margin-top: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>Invoice Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <strong>Period</strong>
        <span>${this.formatDate(summary.startDate)} - ${this.formatDate(summary.endDate)}</span>
      </div>
      <div class="summary-item">
        <strong>Total Invoices</strong>
        <span>${summary.totalInvoices}</span>
      </div>
      <div class="summary-item">
        <strong>Total Amount</strong>
        <span>R$ ${this.formatCurrency(summary.totalAmount)}</span>
      </div>
      <div class="summary-item">
        <strong>Average per Invoice</strong>
        <span>R$ ${this.formatCurrency(summary.totalAmount / summary.totalInvoices)}</span>
      </div>
    </div>
  </div>

  <h2>Category Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Invoices</th>
        <th>Total Amount</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${categoriesHTML}
    </tbody>
  </table>

  <h2>Invoice Details</h2>
  ${invoicesHTML}

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Invoice Management System</p>
  </div>
</body>
</html>
    `;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Fetch invoices for export with filters
   */
  private async fetchInvoicesForExport(filters: ExportFilter): Promise<InvoiceWithItems[]> {
    const invoiceFilter: InvoiceFilter = {
      userId: filters.userId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit: 1000, // Fetch up to 1000 invoices for export
    };

    // Fetch all invoices matching filters
    const result = await this.invoiceService.listInvoices(invoiceFilter);
    const invoices: InvoiceWithItems[] = [];

    // Fetch full details (with items) for each invoice
    for (const invoice of result.invoices) {
      // Filter by categories if specified
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(invoice.category)) {
          continue;
        }
      }

      const fullInvoice = await this.invoiceService.getInvoiceById(invoice.$id, filters.userId);
      invoices.push(fullInvoice);
    }

    return invoices;
  }

  /**
   * Calculate summary statistics for invoices
   */
  private calculateSummary(invoices: InvoiceWithItems[]): ExportSummary {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const dates = invoices.map((inv) => new Date(inv.issue_date));
    const startDate = new Date(Math.min(...dates.map((d) => d.getTime()))).toISOString();
    const endDate = new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString();

    // Calculate category breakdown
    const categoryMap = new Map<string, { totalAmount: number; invoiceCount: number }>();

    for (const invoice of invoices) {
      const existing = categoryMap.get(invoice.category) || { totalAmount: 0, invoiceCount: 0 };
      categoryMap.set(invoice.category, {
        totalAmount: existing.totalAmount + invoice.total_amount,
        invoiceCount: existing.invoiceCount + 1,
      });
    }

    const categories: CategorySummary[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalAmount: data.totalAmount,
      invoiceCount: data.invoiceCount,
      percentage: (data.totalAmount / totalAmount) * 100,
    }));

    // Sort by total amount descending
    categories.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      totalInvoices: invoices.length,
      totalAmount,
      startDate,
      endDate,
      categories,
    };
  }

  /**
   * Generate filename for export
   */
  private generateFilename(prefix: string, filters: ExportFilter, extension: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const parts = [prefix, timestamp];

    if (filters.startDate && filters.endDate) {
      const start = filters.startDate.split('T')[0];
      const end = filters.endDate.split('T')[0];
      parts.push(`${start}_to_${end}`);
    }

    if (filters.categories && filters.categories.length > 0) {
      parts.push(filters.categories.join('-'));
    }

    return `${parts.join('_')}.${extension}`;
  }

  /**
   * Escape CSV field
   */
  private escapeCSV(value: string): string {
    if (!value) return '';

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Escape HTML content
   */
  private escapeHTML(value: string): string {
    if (!value) return '';

    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: number): string {
    return value.toFixed(2);
  }
}

// Export singleton instance
let _exportServiceInstance: ExportService | null = null;

export function getExportService(invoiceService?: InvoiceService): ExportService {
  if (!_exportServiceInstance) {
    // Lazy load invoice service to avoid circular dependencies
    const { getInvoiceService } = require('./invoice.service');
    _exportServiceInstance = new ExportService(invoiceService || getInvoiceService());
  }
  return _exportServiceInstance;
}

// For backward compatibility
export const exportService = {
  get instance() {
    return getExportService();
  },
};
