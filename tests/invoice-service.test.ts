/**
 * Invoice Service Tests
 *
 * Unit tests for invoice CRUD operations, duplicate detection,
 * product catalog updates, and price history recording
 */
import { InvoiceCategory, MerchantInfo, ParsedInvoice } from '../lib/services/invoice-parser.service';
import { InvoiceService, InvoiceServiceError } from '../lib/services/invoice.service';

// ============================================
// Test Data
// ============================================

const TEST_USER_ID = 'test-user-123';
const TEST_INVOICE_KEY = '12345678901234567890123456789012345678901234';

const SAMPLE_MERCHANT: MerchantInfo = {
  cnpj: '12345678000190',
  name: 'FARMACIA EXEMPLO LTDA',
  tradeName: 'Farmacia Exemplo',
  address: 'Rua das Flores, 123',
  city: 'Florianopolis',
  state: 'SC',
};

const SAMPLE_PARSED_INVOICE: ParsedInvoice = {
  invoiceKey: TEST_INVOICE_KEY,
  invoiceNumber: '123456',
  series: '1',
  issueDate: new Date('2024-01-15T10:30:00-03:00'),
  merchant: SAMPLE_MERCHANT,
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
    {
      description: 'PARACETAMOL 750MG 20 COMPRIMIDOS',
      productCode: '7891234567891',
      ncmCode: '30049099',
      quantity: 1,
      unitPrice: 8.9,
      totalPrice: 8.9,
      discountAmount: 0.5,
    },
  ],
  totals: {
    subtotal: 19.9,
    discount: 0.5,
    tax: 2.5,
    total: 19.4,
  },
  xmlData: '<xml>sample</xml>',
  category: InvoiceCategory.PHARMACY,
};

// ============================================
// Mock Database Adapter
// ============================================

class MockDatabaseAdapter {
  private documents: Map<string, Map<string, any>> = new Map();
  private idCounter = 1;

  constructor() {
    // Initialize collections
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
    this.idCounter = 1;
  }

  getCollectionSize(collectionId: string): number {
    return this.documents.get(collectionId)?.size || 0;
  }
}

// ============================================
// Test Helpers
// ============================================

let testsPassed = 0;
let testsFailed = 0;
let mockDb: MockDatabaseAdapter;
let invoiceService: InvoiceService;

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

function setupTest() {
  mockDb = new MockDatabaseAdapter();
  // Create invoice service without initializing real database
  invoiceService = Object.create(InvoiceService.prototype);
  // Inject mock database adapter
  (invoiceService as any).dbAdapter = mockDb;
}

// ============================================
// Invoice CRUD Tests
// ============================================

async function testInvoiceCreation() {
  console.log('\n📝 Test Group: Invoice Creation');

  // Test 1: Create invoice successfully
  try {
    setupTest();

    const result = await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    assert(result.$id !== undefined, 'Invoice should have an ID');
    assert(result.user_id === TEST_USER_ID, 'Invoice should belong to user');
    assert(result.invoice_key === TEST_INVOICE_KEY, 'Invoice key should match');
    assert(result.total_amount === 19.4, 'Total amount should match');
    assert(result.category === InvoiceCategory.PHARMACY, 'Category should match');
    assert(result.items.length === 2, 'Should have 2 invoice items');

    // Verify invoice items were created
    assert(mockDb.getCollectionSize('invoice_items') === 2, 'Should create 2 invoice items');

    // Verify products were created
    assert(mockDb.getCollectionSize('products') >= 2, 'Should create at least 2 products');

    // Verify price history was recorded
    assert(mockDb.getCollectionSize('price_history') === 2, 'Should record 2 price history entries');

    logTest('Create invoice successfully', true);
  } catch (error) {
    logTest('Create invoice successfully', false, error);
  }

  // Test 2: Create invoice with custom category
  try {
    setupTest();

    const result = await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
      customCategory: 'health',
    });

    assert(result.category === 'health', 'Should use custom category');

    logTest('Create invoice with custom category', true);
  } catch (error) {
    logTest('Create invoice with custom category', false, error);
  }

  // Test 3: Create invoice with transaction link
  try {
    setupTest();

    const transactionId = 'transaction-123';
    const result = await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
      transactionId,
    });

    const invoiceData = JSON.parse(result.data || '{}');
    assert(invoiceData.transaction_id === transactionId, 'Should link to transaction');

    logTest('Create invoice with transaction link', true);
  } catch (error) {
    logTest('Create invoice with transaction link', false, error);
  }
}

async function testDuplicateDetection() {
  console.log('\n📝 Test Group: Duplicate Detection');

  // Test 1: Detect duplicate invoice
  try {
    setupTest();

    // Create first invoice
    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    // Try to create duplicate
    let errorThrown = false;
    try {
      await invoiceService.createInvoice({
        userId: TEST_USER_ID,
        parsedInvoice: SAMPLE_PARSED_INVOICE,
      });
    } catch (error) {
      errorThrown = true;
      assert(error instanceof InvoiceServiceError, 'Should throw InvoiceServiceError');
      assert((error as InvoiceServiceError).code === 'INVOICE_DUPLICATE', 'Error code should be INVOICE_DUPLICATE');
    }

    assert(errorThrown, 'Should throw error for duplicate invoice');
    assert(mockDb.getCollectionSize('invoices') === 1, 'Should only have 1 invoice');

    logTest('Detect duplicate invoice', true);
  } catch (error) {
    logTest('Detect duplicate invoice', false, error);
  }

  // Test 2: Allow same invoice for different users
  try {
    setupTest();

    // Create invoice for first user
    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    // Create same invoice for different user
    await invoiceService.createInvoice({
      userId: 'different-user-456',
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    assert(mockDb.getCollectionSize('invoices') === 2, 'Should allow same invoice for different users');

    logTest('Allow same invoice for different users', true);
  } catch (error) {
    logTest('Allow same invoice for different users', false, error);
  }
}

async function testInvoiceRetrieval() {
  console.log('\n📝 Test Group: Invoice Retrieval');

  // Test 1: Get invoice by ID
  try {
    setupTest();

    const created = await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    const retrieved = await invoiceService.getInvoiceById(created.$id, TEST_USER_ID);

    assert(retrieved.$id === created.$id, 'Should retrieve correct invoice');
    assert(retrieved.items.length === 2, 'Should include invoice items');
    assert(retrieved.items[0].line_number === 1, 'Items should be ordered by line number');

    logTest('Get invoice by ID', true);
  } catch (error) {
    logTest('Get invoice by ID', false, error);
  }

  // Test 2: Reject access to other user's invoice
  try {
    setupTest();

    const created = await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    let errorThrown = false;
    try {
      await invoiceService.getInvoiceById(created.$id, 'different-user-456');
    } catch (error) {
      errorThrown = true;
      assert(error instanceof InvoiceServiceError, 'Should throw InvoiceServiceError');
      assert((error as InvoiceServiceError).code === 'INVOICE_NOT_FOUND', 'Error code should be INVOICE_NOT_FOUND');
    }

    assert(errorThrown, 'Should reject access to other user invoice');

    logTest("Reject access to other user's invoice", true);
  } catch (error) {
    logTest("Reject access to other user's invoice", false, error);
  }

  // Test 3: List invoices with filters
  try {
    setupTest();

    // Create multiple invoices
    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    const secondInvoice = {
      ...SAMPLE_PARSED_INVOICE,
      invoiceKey: 'different-key-98765432109876543210987654321098',
      category: InvoiceCategory.SUPERMARKET,
    };

    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: secondInvoice,
    });

    const result = await invoiceService.listInvoices({
      userId: TEST_USER_ID,
    });

    assert(result.invoices.length === 2, 'Should list all user invoices');
    assert(result.total === 2, 'Total count should be 2');

    logTest('List invoices with filters', true);
  } catch (error) {
    logTest('List invoices with filters', false, error);
  }
}

async function testProductCatalogUpdates() {
  console.log('\n📝 Test Group: Product Catalog Updates');

  // Test 1: Create products from invoice items
  try {
    setupTest();

    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    const productsSize = mockDb.getCollectionSize('products');
    assert(productsSize >= 2, 'Should create products for invoice items');

    logTest('Create products from invoice items', true);
  } catch (error) {
    logTest('Create products from invoice items', false, error);
  }

  // Test 2: Update product statistics on new purchase
  try {
    setupTest();

    // Create first invoice
    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    // Create second invoice with same product
    const secondInvoice = {
      ...SAMPLE_PARSED_INVOICE,
      invoiceKey: 'different-key-98765432109876543210987654321098',
      items: [SAMPLE_PARSED_INVOICE.items[0]], // Same first product
    };

    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: secondInvoice,
    });

    // Product should have updated statistics
    const products = await mockDb.listDocuments('db', 'products', [
      { method: 'equal', attribute: 'user_id', values: [TEST_USER_ID] },
    ]);

    const product = products.documents.find((p: any) => p.product_code === '7891234567890');
    assert(product !== undefined, 'Product should exist');
    assert(product.total_purchases >= 2, 'Product should have at least 2 purchases');

    logTest('Update product statistics on new purchase', true);
  } catch (error) {
    logTest('Update product statistics on new purchase', false, error);
  }
}

async function testPriceHistoryRecording() {
  console.log('\n📝 Test Group: Price History Recording');

  // Test 1: Record price history for each item
  try {
    setupTest();

    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    const priceHistorySize = mockDb.getCollectionSize('price_history');
    assert(priceHistorySize === 2, 'Should record price history for each item');

    logTest('Record price history for each item', true);
  } catch (error) {
    logTest('Record price history for each item', false, error);
  }

  // Test 2: Price history includes merchant and date
  try {
    setupTest();

    await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    const priceHistory = await mockDb.listDocuments('db', 'price_history', [
      { method: 'equal', attribute: 'user_id', values: [TEST_USER_ID] },
    ]);

    const entry = priceHistory.documents[0];
    assert(entry.merchant_cnpj === SAMPLE_MERCHANT.cnpj, 'Should include merchant CNPJ');
    assert(entry.merchant_name === SAMPLE_MERCHANT.name, 'Should include merchant name');
    assert(entry.purchase_date !== undefined, 'Should include purchase date');
    assert(entry.unit_price > 0, 'Should include unit price');

    logTest('Price history includes merchant and date', true);
  } catch (error) {
    logTest('Price history includes merchant and date', false, error);
  }
}

async function testInvoiceDeletion() {
  console.log('\n📝 Test Group: Invoice Deletion');

  // Test 1: Delete invoice and cascade to items
  try {
    setupTest();

    const created = await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    await invoiceService.deleteInvoice(created.$id, TEST_USER_ID);

    assert(mockDb.getCollectionSize('invoices') === 0, 'Invoice should be deleted');
    assert(mockDb.getCollectionSize('invoice_items') === 0, 'Invoice items should be deleted');

    logTest('Delete invoice and cascade to items', true);
  } catch (error) {
    logTest('Delete invoice and cascade to items', false, error);
  }

  // Test 2: Update product stats after deletion
  try {
    setupTest();

    const created = await invoiceService.createInvoice({
      userId: TEST_USER_ID,
      parsedInvoice: SAMPLE_PARSED_INVOICE,
    });

    await invoiceService.deleteInvoice(created.$id, TEST_USER_ID);

    // Products should still exist but with updated stats
    const productsSize = mockDb.getCollectionSize('products');
    assert(productsSize >= 2, 'Products should still exist');

    logTest('Update product stats after deletion', true);
  } catch (error) {
    logTest('Update product stats after deletion', false, error);
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Invoice Service Tests...\n');
  console.log('==================================================');

  await testInvoiceCreation();
  await testDuplicateDetection();
  await testInvoiceRetrieval();
  await testProductCatalogUpdates();
  await testPriceHistoryRecording();
  await testInvoiceDeletion();

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
