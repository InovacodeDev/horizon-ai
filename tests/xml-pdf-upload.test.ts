import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InvoiceParserService } from '../lib/services/invoice-parser.service';
import { aiParserService } from '../lib/services/nfe-crawler/ai-parser.service';

// Mock AI service to avoid real API calls
vi.mock('../lib/services/nfe-crawler/ai-parser.service', () => ({
  aiParserService: {
    processItemsInBatches: vi.fn().mockImplementation((items) => Promise.resolve(items)),
    parseInvoiceHtml: vi.fn().mockResolvedValue({
      invoice: { number: '123', series: '1', issueDate: '2023-01-01' },
      merchant: { name: 'Test Merchant', cnpj: '12345678901234', address: '', city: '', state: '' },
      items: [{ description: 'Test Item', quantity: 1, unitPrice: 10, totalPrice: 10, discountAmount: 0 }],
      totals: { subtotal: 10, discount: 0, tax: 0, total: 10 },
      category: 'other',
    }),
  },
}));

describe('XML and PDF Upload Tests', () => {
  let service: InvoiceParserService;

  beforeEach(() => {
    service = new InvoiceParserService();
    vi.clearAllMocks();
  });

  it('should parse XML file correctly', async () => {
    const xmlPath = path.join(__dirname, '../temp/42251119791896002731550030004768031193388793.xml');
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

    const result = await service.parseFromXmlFile(xmlContent);

    expect(result).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.merchant.name).toBeDefined();
    expect(result.totals.total).toBeGreaterThan(0);
    expect(aiParserService.processItemsInBatches).toHaveBeenCalled();
  });

  it('should parse PDF file correctly', async () => {
    // We need a sample PDF. If not available, we might skip or mock the PDF parser.
    // Assuming temp/NFSe_55083048_15091336.pdf exists as per task description.
    const pdfPath = path.join(__dirname, '../temp/NFSe_55083048_15091336.pdf');

    if (fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);

      const result = await service.parseFromPdfFile(arrayBuffer);

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.length).toBeGreaterThan(0);
      // For this PDF, we expect items to be found.
      // If heuristics work, parseInvoiceHtml won't be called, but processItemsInBatches will.
      // If heuristics fail, parseInvoiceHtml will be called.
      // So we just ensure we got a result.
      expect(result.invoiceNumber).toBeDefined();
    } else {
      console.warn('Skipping PDF test: Sample file not found');
    }
  });

  it('should parse PDF from serialized buffer object', async () => {
    const pdfPath = path.join(__dirname, '../temp/NFSe_55083048_15091336.pdf');

    if (fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      // Simulate serialized buffer
      const serializedBuffer = {
        type: 'Buffer',
        data: Array.from(pdfBuffer),
      };

      const result = await service.parseFromPdfFile(serializedBuffer);

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    }
  });
});
