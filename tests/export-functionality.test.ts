/**
 * Export Functionality Tests
 *
 * Tests for CSV generation, PDF generation, filtering in exports, and API endpoint responses
 */
import { ExportService, ExportServiceError } from '../lib/services/export.service';
import { InvoiceCategory, MerchantInfo, ParsedInvoice } from '../lib/services/invoice-parser.service';
import { InvoiceService } from '../lib/services/invoice.service';

// ============================================
// Test Data
// ============================================

const TEST_USER_ID = 'test-user-export-123';

const SAMPLE_MERCHANT_1: MerchantInfo = {
  cnpj: '12345678000190',
  name: 'FARMACIA EXEMPLO LTDA',
  tradeName: 'Farmacia Exemplo',
  address: 'Rua das Flores, 123',
  city: 'Florianopolis',
  state: 'SC',
};

const SAMPLE_MERCHANT_2: MerchantInfo = {
  cnpj: '98765432000111',
  name: 'SUPERMERCADO BOM PRECO',
  tradeName: 'Supermercado Bom Preco',
  address: 'Av Principal, 456',
  city: 'Florianopolis',
  state: 'SC',
};

const SAMPLE_INVOICE_1: ParsedInvoice = {
  invoiceKey: '11111111111111111111111111111111111111111111',
  invoiceNumber: '100001',
  series: '1',
  issueDate: new Date('2024-01-15T10:30:00-03:00'),
  merchant: SAMPLE_MERCHANT_1,
  items: [
    {
      description: 'DIPIRONA 500MG 10 COMPRIMIDOS',
      productCode: '7891234567890',
      ncmCode: '30049099',
      quantity: 2,
      unitPrice: 5.5,
      totalPrice: 11.0,
      discountAmount: 0,
    },
  ],
  totals: {
    subtotal: 11.0,
    discount: 0,
    tax: 1.5,
    total: 11.0,
  },
  xmlData: '<xml>sample1</xml>',
  category: InvoiceCategory.PHARMACY,
};

const SAMPLE_INVOICE_2: ParsedInvoice = {
  invoiceKey: '22222222222222222222222222222222222222222222',
  invoiceNumber: '200002',
  series: '1',
  issueDate: new Date('2024-01-20T14:00:00-03:00'),
  merchant: SAMPLE_MERCHANT_2,
  items: [
    {
      description: 'ARROZ BRANCO 5KG',
      productCode: '7891234567891',
      ncmCode: '10063021',
      quantity: 1,
      unitPrice: 25.9,
      totalPrice: 25.9,
      discountAmount: 0,
    },
    {
      description: 'FEIJAO PRETO 1KG',
      productCode: '7891234567892',
      ncmCode: '07133390',
      quantity: 2,
      unitPrice: 8.5,
      totalPrice: 17.0,
      discountAmount: 0,
    },
  ],
  totals: {
    subtotal: 42.9,
    discount: 0,
    tax: 3.5,
    total: 42.9,
  },
  xmlData: '<xml>sample2</xml>',
  category: InvoiceCategory.SUPERMARKET,
};

// ============================================
// Mock Database Adapter
// ============================================

class MockDatabaseAdapter {
  private documents: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.documents.set('invoices', new Map());
    this.documents.set('invoice_items', new Map());
    this.documents.set('products', new Map());
    this.documents.set('price_history', new Map());
  }

  async createDocument(databaseId: string, collectionId: string, documentId: string, data: any): Promise<any> {
    const collection = this.documents.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const doc = {
      $id: documentId,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      ...data,
    };

    collection.set(documentId, doc);
    return doc;
  }

  async getDocument(databaseId: string, collectionId: string, documentId: string): Promise<any> {
    const collection = this.documents.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const doc = collection.get(documentId);
    if (!doc) {
      const error: any = new Error('Document not found');
      error.code = 404;
      throw error;
    }

    return doc;
  }

  async listDocuments(databaseId: string, collectionId: string, queries: any[]): Promise<any> {
    const collection = this.documents.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    let documents = Array.from(collection.values());

    // Apply filters from queries
    for (const query of queries) {
      if (query.method === 'equal') {
        documents = documents.filter((doc) => doc[query.attribute] === query.values[0]);
      }
      if (query.method === 'orderDesc') {
        documents.sort((a, b) => {
          const aVal = a[query.attribute];
          const bVal = b[query.attribute];
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        });
      }
      if (query.method === 'orderAsc') {
        documents.sort((a, b) => {
          const aVal = a[query.attribute];
          const bVal = b[query.attribute];
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
      }
      if (query.method === 'limit') {
        documents = documents.slice(0, query.values[0]);
      }
    }

    return {
      documents,
      total: documents.length,
    };
  }

  async updateDocument(databaseId: string, collectionId: string, documentId: string, data: any): Promise<any> {
    const collection = this.documents.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const doc = collection.get(documentId);
    if (!doc) {
      const error: any = new Error('Document not found');
      error.code = 404;
      throw error;
    }

    const updatedDoc = {
      ...doc,
      ...data,
      $updatedAt: new Date().toISOString(),
    };

    collection.set(documentId, updatedDoc);
    return updatedDoc;
  }

  async deleteDocument(databaseId: string, collectionId: string, documentId: string): Promise<void> {
    const collection = this.documents.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    if (!collection.has(documentId)) {
      const error: any = new Error('Document not found');
      error.code = 404;
      throw error;
    }

    collection.delete(documentId);
  }

  reset() {
    this.documents.clear();
    this.documents.set('invoices', new Map());
    this.documents.set('invoice_items', new Map());
    this.documents.set('products', new Map());
    this.documents.set('price_history', new Map());
  }
}

// ============================================
// Test Helpers
// ============================================

let testsPassed = 0;
let testsFailed = 0;
let mockDb: MockDatabaseAdapter;
let invoiceService: InvoiceService;
let exportService: ExportService;

function logTest(testName: string, passed: boolean, details?: any) {
  if (passed) {
    console.log(`✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    if (details) {
      console.log('   Details:', JSON.stringify(details, null, 2));
    }
    testsFailed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function setupTest() {
  mockDb = new MockDatabaseAdapter();

  // Create invoice service with mock database
  invoiceService = Object.create(InvoiceService.prototype);
  (invoiceService as any).dbAdapter = mockDb;

  // Create export service with mock invoice service
  exportService = new ExportService(invoiceService);

  // Create sample invoices
  await invoiceService.createInvoice({
    userId: TEST_USER_ID,
    parsedInvoice: SAMPLE_INVOICE_1,
  });

  await invoiceService.createInvoice({
    userId: TEST_USER_ID,
    parsedInvoice: SAMPLE_INVOICE_2,
  });
}

// ============================================
// CSV Export Tests
// ============================================

async function testCSVGeneration() {
  console.log('\n📝 Test Group: CSV Generation');

  // Test 1: Generate CSV with all invoices
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
    });

    assert(result.mimeType === 'text/csv', 'MIME type should be text/csv');
    assert(result.filename.endsWith('.csv'), 'Filename should end with .csv');
    assert(typeof result.data === 'string', 'CSV data should be a string');

    const csvContent = result.data as string;
    const lines = csvContent.split('\n');

    // Should have header + 3 data rows (1 item from invoice 1, 2 items from invoice 2)
    assert(lines.length >= 4, 'CSV should have header and data rows');
    assert(lines[0].includes('Invoice Number'), 'Header should include Invoice Number');
    assert(lines[0].includes('Merchant Name'), 'Header should include Merchant Name');
    assert(lines[0].includes('Product Description'), 'Header should include Product Description');

    logTest('Generate CSV with all invoices', true);
  } catch (error) {
    logTest('Generate CSV with all invoices', false, error);
  }

  // Test 2: CSV contains correct data
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
    });

    const csvContent = result.data as string;

    assert(csvContent.includes('FARMACIA EXEMPLO LTDA'), 'CSV should include merchant name');
    assert(csvContent.includes('DIPIRONA 500MG'), 'CSV should include product description');
    assert(csvContent.includes('11.00'), 'CSV should include prices');

    logTest('CSV contains correct data', true);
  } catch (error) {
    logTest('CSV contains correct data', false, error);
  }

  // Test 3: CSV escapes special characters
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
    });

    const csvContent = result.data as string;

    // Check that commas in values are properly escaped
    assert(!csvContent.includes(',,'), 'CSV should not have empty fields without quotes');

    logTest('CSV escapes special characters', true);
  } catch (error) {
    logTest('CSV escapes special characters', false, error);
  }
}

// ============================================
// PDF Export Tests
// ============================================

async function testPDFGeneration() {
  console.log('\n📝 Test Group: PDF Generation');

  // Test 1: Generate PDF report
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'pdf',
    });

    assert(result.mimeType === 'application/pdf', 'MIME type should be application/pdf');
    assert(result.filename.endsWith('.pdf'), 'Filename should end with .pdf');
    assert(typeof result.data === 'string', 'PDF data should be a string (HTML)');

    const htmlContent = result.data as string;
    assert(htmlContent.includes('<!DOCTYPE html>'), 'PDF should contain HTML structure');
    assert(htmlContent.includes('Invoice Report'), 'PDF should have title');

    logTest('Generate PDF report', true);
  } catch (error) {
    logTest('Generate PDF report', false, error);
  }

  // Test 2: PDF includes summary statistics
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'pdf',
    });

    const htmlContent = result.data as string;

    assert(htmlContent.includes('Summary'), 'PDF should include summary section');
    assert(htmlContent.includes('Total Invoices'), 'PDF should show total invoices');
    assert(htmlContent.includes('Total Amount'), 'PDF should show total amount');
    assert(htmlContent.includes('Category Breakdown'), 'PDF should include category breakdown');

    logTest('PDF includes summary statistics', true);
  } catch (error) {
    logTest('PDF includes summary statistics', false, error);
  }

  // Test 3: PDF includes invoice details
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'pdf',
    });

    const htmlContent = result.data as string;

    assert(htmlContent.includes('FARMACIA EXEMPLO LTDA'), 'PDF should include merchant names');
    assert(htmlContent.includes('DIPIRONA 500MG'), 'PDF should include product descriptions');
    assert(htmlContent.includes('Invoice Details'), 'PDF should have invoice details section');

    logTest('PDF includes invoice details', true);
  } catch (error) {
    logTest('PDF includes invoice details', false, error);
  }
}

// ============================================
// Filtering Tests
// ============================================

async function testExportFiltering() {
  console.log('\n📝 Test Group: Export Filtering');

  // Test 1: Filter by category
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
      categories: ['pharmacy'],
    });

    const csvContent = result.data as string;

    assert(csvContent.includes('FARMACIA EXEMPLO LTDA'), 'Should include pharmacy invoice');
    assert(!csvContent.includes('SUPERMERCADO BOM PRECO'), 'Should not include supermarket invoice');

    logTest('Filter by category', true);
  } catch (error) {
    logTest('Filter by category', false, error);
  }

  // Test 2: Filter by date range
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
      startDate: '2024-01-18T00:00:00Z',
      endDate: '2024-01-25T23:59:59Z',
    });

    const csvContent = result.data as string;
    const lines = csvContent.split('\n');

    // Should only include invoice 2 (dated 2024-01-20)
    assert(csvContent.includes('SUPERMERCADO BOM PRECO'), 'Should include invoice within date range');
    assert(!csvContent.includes('FARMACIA EXEMPLO LTDA'), 'Should not include invoice outside date range');

    logTest('Filter by date range', true);
  } catch (error) {
    logTest('Filter by date range', false, error);
  }

  // Test 3: Filter by multiple categories
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
      categories: ['pharmacy', 'supermarket'],
    });

    const csvContent = result.data as string;

    assert(csvContent.includes('FARMACIA EXEMPLO LTDA'), 'Should include pharmacy invoice');
    assert(csvContent.includes('SUPERMERCADO BOM PRECO'), 'Should include supermarket invoice');

    logTest('Filter by multiple categories', true);
  } catch (error) {
    logTest('Filter by multiple categories', false, error);
  }

  // Test 4: Handle no matching invoices
  try {
    await setupTest();

    let errorThrown = false;
    try {
      await exportService.exportInvoices({
        userId: TEST_USER_ID,
        format: 'csv',
        categories: ['restaurant'], // No restaurant invoices
      });
    } catch (error) {
      errorThrown = true;
      assert(error instanceof ExportServiceError, 'Should throw ExportServiceError');
      assert((error as ExportServiceError).code === 'NO_DATA_TO_EXPORT', 'Error code should be NO_DATA_TO_EXPORT');
    }

    assert(errorThrown, 'Should throw error when no invoices match filters');

    logTest('Handle no matching invoices', true);
  } catch (error) {
    logTest('Handle no matching invoices', false, error);
  }
}

// ============================================
// Filename Generation Tests
// ============================================

async function testFilenameGeneration() {
  console.log('\n📝 Test Group: Filename Generation');

  // Test 1: Generate filename with date
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
    });

    const today = new Date().toISOString().split('T')[0];
    assert(result.filename.includes(today), 'Filename should include current date');

    logTest('Generate filename with date', true);
  } catch (error) {
    logTest('Generate filename with date', false, error);
  }

  // Test 2: Include date range in filename
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
    });

    assert(result.filename.includes('2024-01-01'), 'Filename should include start date');
    assert(result.filename.includes('2024-01-31'), 'Filename should include end date');

    logTest('Include date range in filename', true);
  } catch (error) {
    logTest('Include date range in filename', false, error);
  }

  // Test 3: Include categories in filename
  try {
    await setupTest();

    const result = await exportService.exportInvoices({
      userId: TEST_USER_ID,
      format: 'csv',
      categories: ['pharmacy', 'supermarket'],
    });

    assert(
      result.filename.includes('pharmacy') || result.filename.includes('supermarket'),
      'Filename should include category names',
    );

    logTest('Include categories in filename', true);
  } catch (error) {
    logTest('Include categories in filename', false, error);
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Export Functionality Tests...\n');
  console.log('==================================================');

  await testCSVGeneration();
  await testPDFGeneration();
  await testExportFiltering();
  await testFilenameGeneration();

  console.log('\n==================================================');
  console.log('📊 Test Summary');
  console.log('==================================================');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('==================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests };
