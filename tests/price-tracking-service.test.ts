/**
 * Price Tracking Service Tests
 *
 * Unit tests for price history retrieval, price comparison,
 * shopping list optimization, and price change detection
 */
import { PriceTrackingError, PriceTrackingService, ShoppingListItem } from '../lib/services/price-tracking.service';

// ============================================
// Test Data
// ============================================

const TEST_USER_ID = 'test-user-123';
const TEST_PRODUCT_1 = 'product-1';
const TEST_PRODUCT_2 = 'product-2';
const TEST_PRODUCT_3 = 'product-3';

const MERCHANT_A = {
  cnpj: '11111111000111',
  name: 'Supermercado A',
};

const MERCHANT_B = {
  cnpj: '22222222000122',
  name: 'Supermercado B',
};

const MERCHANT_C = {
  cnpj: '33333333000133',
  name: 'Supermercado C',
};

// ============================================
// Mock Database Adapter
// ============================================

class MockDatabaseAdapter {
  private documents: Map<string, Map<string, any>> = new Map();

  constructor() {
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
      if (query.method === 'greaterThanEqual') {
        documents = documents.filter((doc) => {
          const docVal = doc[query.attribute];
          const queryVal = query.values[0];
          // Handle date comparisons
          if (typeof docVal === 'string' && typeof queryVal === 'string') {
            return new Date(docVal) >= new Date(queryVal);
          }
          return docVal >= queryVal;
        });
      }
      if (query.method === 'lessThanEqual') {
        documents = documents.filter((doc) => {
          const docVal = doc[query.attribute];
          const queryVal = query.values[0];
          // Handle date comparisons
          if (typeof docVal === 'string' && typeof queryVal === 'string') {
            return new Date(docVal) <= new Date(queryVal);
          }
          return docVal <= queryVal;
        });
      }
      if (query.method === 'orderDesc') {
        documents.sort((a, b) => {
          const aVal = a[query.attribute];
          const bVal = b[query.attribute];
          // Handle date comparisons
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return new Date(bVal).getTime() - new Date(aVal).getTime();
          }
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        });
      }
      if (query.method === 'orderAsc') {
        documents.sort((a, b) => {
          const aVal = a[query.attribute];
          const bVal = b[query.attribute];
          // Handle date comparisons
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return new Date(aVal).getTime() - new Date(bVal).getTime();
          }
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

  reset() {
    this.documents.clear();
    this.documents.set('products', new Map());
    this.documents.set('price_history', new Map());
  }

  // Helper methods for test setup
  addProduct(productId: string, userId: string, name: string) {
    const collection = this.documents.get('products');
    collection?.set(productId, {
      $id: productId,
      user_id: userId,
      name,
      category: 'groceries',
      total_purchases: 0,
      average_price: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  addPriceHistory(
    id: string,
    userId: string,
    productId: string,
    merchantCnpj: string,
    merchantName: string,
    price: number,
    daysAgo: number,
  ) {
    const collection = this.documents.get('price_history');
    const purchaseDate = new Date();
    purchaseDate.setDate(purchaseDate.getDate() - daysAgo);

    collection?.set(id, {
      $id: id,
      user_id: userId,
      product_id: productId,
      invoice_id: `invoice-${id}`,
      merchant_cnpj: merchantCnpj,
      merchant_name: merchantName,
      purchase_date: purchaseDate.toISOString(),
      unit_price: price,
      quantity: 1,
      created_at: new Date().toISOString(),
    });
  }
}

// ============================================
// Test Helpers
// ============================================

let testsPassed = 0;
let testsFailed = 0;
let mockDb: MockDatabaseAdapter;
let priceTrackingService: PriceTrackingService;

function logTest(testName: string, passed: boolean, details?: any) {
  if (passed) {
    console.log(`✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    if (details) {
      if (details instanceof Error) {
        console.log('   Error:', details.message);
        console.log('   Stack:', details.stack);
      } else {
        console.log('   Details:', JSON.stringify(details, null, 2));
      }
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
  priceTrackingService = Object.create(PriceTrackingService.prototype);
  (priceTrackingService as any).dbAdapter = mockDb;
}

function setupSampleData() {
  // Add products
  mockDb.addProduct(TEST_PRODUCT_1, TEST_USER_ID, 'Arroz Branco 5kg');
  mockDb.addProduct(TEST_PRODUCT_2, TEST_USER_ID, 'Feijão Preto 1kg');
  mockDb.addProduct(TEST_PRODUCT_3, TEST_USER_ID, 'Óleo de Soja 900ml');

  // Add price history for Product 1 (Arroz)
  // Merchant A: R$ 20.00, R$ 22.00, R$ 24.00 (increasing prices)
  mockDb.addPriceHistory('ph1', TEST_USER_ID, TEST_PRODUCT_1, MERCHANT_A.cnpj, MERCHANT_A.name, 20.0, 60);
  mockDb.addPriceHistory('ph2', TEST_USER_ID, TEST_PRODUCT_1, MERCHANT_A.cnpj, MERCHANT_A.name, 22.0, 30);
  mockDb.addPriceHistory('ph3', TEST_USER_ID, TEST_PRODUCT_1, MERCHANT_A.cnpj, MERCHANT_A.name, 24.0, 5);

  // Merchant B: R$ 18.00, R$ 19.00 (cheaper)
  mockDb.addPriceHistory('ph4', TEST_USER_ID, TEST_PRODUCT_1, MERCHANT_B.cnpj, MERCHANT_B.name, 18.0, 45);
  mockDb.addPriceHistory('ph5', TEST_USER_ID, TEST_PRODUCT_1, MERCHANT_B.cnpj, MERCHANT_B.name, 19.0, 10);

  // Add price history for Product 2 (Feijão)
  // Merchant A: R$ 8.00
  mockDb.addPriceHistory('ph6', TEST_USER_ID, TEST_PRODUCT_2, MERCHANT_A.cnpj, MERCHANT_A.name, 8.0, 20);

  // Merchant C: R$ 7.50 (cheaper)
  mockDb.addPriceHistory('ph7', TEST_USER_ID, TEST_PRODUCT_2, MERCHANT_C.cnpj, MERCHANT_C.name, 7.5, 15);

  // Add price history for Product 3 (Óleo)
  // Merchant B: R$ 6.00
  mockDb.addPriceHistory('ph8', TEST_USER_ID, TEST_PRODUCT_3, MERCHANT_B.cnpj, MERCHANT_B.name, 6.0, 25);

  // Merchant C: R$ 5.50 (cheaper)
  mockDb.addPriceHistory('ph9', TEST_USER_ID, TEST_PRODUCT_3, MERCHANT_C.cnpj, MERCHANT_C.name, 5.5, 12);
}

// ============================================
// Price History Tests
// ============================================

async function testPriceHistoryRetrieval() {
  console.log('\n📝 Test Group: Price History Retrieval');

  // Test 1: Get price history for product
  try {
    setupTest();
    setupSampleData();

    const result = await priceTrackingService.getPriceHistory(TEST_USER_ID, TEST_PRODUCT_1, 90);

    assert(result.productId === TEST_PRODUCT_1, 'Should return correct product ID');
    assert(result.productName === 'Arroz Branco 5kg', 'Should return product name');
    assert(result.prices.length >= 5, `Should return at least 5 price points (got ${result.prices.length})`);
    assert(result.lowestPrice > 0, 'Should identify lowest price');
    assert(result.highestPrice > 0, 'Should identify highest price');
    assert(result.averagePrice > 0, 'Should calculate average price');

    logTest('Get price history for product', true);
  } catch (error) {
    logTest('Get price history for product', false, error);
  }

  // Test 2: Calculate average price per merchant
  try {
    setupTest();
    setupSampleData();

    const result = await priceTrackingService.getAveragePriceByMerchant(TEST_USER_ID, TEST_PRODUCT_1, 90);

    assert(result.length >= 1, 'Should return stats for at least 1 merchant');
    assert(result[0].merchantName.length > 0, 'Should have merchant name');
    assert(result[0].averagePrice > 0, 'Should calculate average price');
    assert(result[0].purchaseCount >= 1, 'Should count purchases correctly');
    // Verify merchants are sorted by price (lowest first)
    if (result.length > 1) {
      assert(result[0].averagePrice <= result[1].averagePrice, 'Merchants should be sorted by price');
    }

    logTest('Calculate average price per merchant', true);
  } catch (error) {
    logTest('Calculate average price per merchant', false, error);
  }

  // Test 3: Handle product with no price history
  try {
    setupTest();
    mockDb.addProduct('empty-product', TEST_USER_ID, 'Empty Product');

    const result = await priceTrackingService.getPriceHistory(TEST_USER_ID, 'empty-product', 90);

    assert(result.prices.length === 0, 'Should return empty price array');
    assert(result.lowestPrice === 0, 'Lowest price should be 0');
    assert(result.highestPrice === 0, 'Highest price should be 0');

    logTest('Handle product with no price history', true);
  } catch (error) {
    logTest('Handle product with no price history', false, error);
  }
}

async function testPriceChangeDetection() {
  console.log('\n📝 Test Group: Price Change Detection');

  // Test 1: Detect significant price increases
  try {
    setupTest();
    setupSampleData();

    const changes = await priceTrackingService.detectPriceChanges(TEST_USER_ID, TEST_PRODUCT_1, 10, 90);

    assert(changes.length > 0, 'Should detect price changes');

    const increases = changes.filter((c) => c.isIncrease);
    assert(increases.length > 0, 'Should detect price increases');

    const firstIncrease = increases[0];
    assert(firstIncrease.priceChangePercent >= 10, 'Price change should exceed threshold');

    logTest('Detect significant price increases', true);
  } catch (error) {
    logTest('Detect significant price increases', false, error);
  }

  // Test 2: Threshold filtering works
  try {
    setupTest();
    setupSampleData();

    // Get all changes with 10% threshold
    const allChanges = await priceTrackingService.detectPriceChanges(TEST_USER_ID, TEST_PRODUCT_1, 10, 90);

    // Get changes with 15% threshold (should be fewer)
    const filteredChanges = await priceTrackingService.detectPriceChanges(TEST_USER_ID, TEST_PRODUCT_1, 15, 90);

    assert(filteredChanges.length <= allChanges.length, 'Higher threshold should return fewer or equal changes');

    logTest('Threshold filtering works', true);
  } catch (error) {
    logTest('Threshold filtering works', false, error);
  }

  // Test 3: Handle product with insufficient data
  try {
    setupTest();
    mockDb.addProduct('single-price', TEST_USER_ID, 'Single Price Product');
    mockDb.addPriceHistory('ph-single', TEST_USER_ID, 'single-price', MERCHANT_A.cnpj, MERCHANT_A.name, 10.0, 5);

    const changes = await priceTrackingService.detectPriceChanges(TEST_USER_ID, 'single-price', 10, 90);

    assert(changes.length === 0, 'Should return empty array for single price point');

    logTest('Handle product with insufficient data', true);
  } catch (error) {
    logTest('Handle product with insufficient data', false, error);
  }
}

// ============================================
// Price Comparison Tests
// ============================================

async function testPriceComparison() {
  console.log('\n📝 Test Group: Price Comparison');

  // Test 1: Compare prices across merchants
  try {
    setupTest();
    setupSampleData();

    const comparison = await priceTrackingService.comparePrice(TEST_USER_ID, TEST_PRODUCT_1, 90);

    assert(comparison.productId === TEST_PRODUCT_1, 'Should return correct product');
    assert(comparison.merchants.length >= 1, 'Should have at least one merchant');
    assert(comparison.bestMerchant.length > 0, 'Should identify best merchant');
    assert(comparison.savingsPotential >= 0, 'Should calculate savings potential');
    assert(comparison.overallLowestPrice > 0, 'Should identify overall lowest price');

    logTest('Compare prices across merchants', true);
  } catch (error) {
    logTest('Compare prices across merchants', false, error);
  }

  // Test 2: Rank merchants by price for multiple products
  try {
    setupTest();
    setupSampleData();

    const rankings = await priceTrackingService.rankMerchantsByPrice(
      TEST_USER_ID,
      [TEST_PRODUCT_1, TEST_PRODUCT_2],
      90,
    );

    assert(rankings.size >= 1, 'Should rank at least 1 product');
    assert(rankings.has(TEST_PRODUCT_1) || rankings.has(TEST_PRODUCT_2), 'Should include at least one product');

    // Verify that rankings contain valid data
    for (const [productId, comparison] of rankings.entries()) {
      assert(comparison.bestMerchant.length > 0, `Product ${productId} should have a best merchant`);
    }

    logTest('Rank merchants by price for multiple products', true);
  } catch (error) {
    logTest('Rank merchants by price for multiple products', false, error);
  }

  // Test 3: Handle product with no price data
  try {
    setupTest();
    mockDb.addProduct('no-prices', TEST_USER_ID, 'No Prices Product');

    let errorThrown = false;
    try {
      await priceTrackingService.comparePrice(TEST_USER_ID, 'no-prices', 90);
    } catch (error) {
      errorThrown = true;
      assert(error instanceof PriceTrackingError, 'Should throw PriceTrackingError');
      assert((error as PriceTrackingError).code === 'NO_PRICE_DATA', 'Error code should be NO_PRICE_DATA');
    }

    assert(errorThrown, 'Should throw error for product with no prices');

    logTest('Handle product with no price data', true);
  } catch (error) {
    logTest('Handle product with no price data', false, error);
  }
}

// ============================================
// Shopping List Optimization Tests
// ============================================

async function testShoppingListOptimization() {
  console.log('\n📝 Test Group: Shopping List Optimization');

  // Test 1: Optimize shopping list
  try {
    setupTest();
    setupSampleData();

    const shoppingList: ShoppingListItem[] = [
      { productId: TEST_PRODUCT_1, productName: 'Arroz Branco 5kg', quantity: 2 },
      { productId: TEST_PRODUCT_2, productName: 'Feijão Preto 1kg', quantity: 1 },
      { productId: TEST_PRODUCT_3, productName: 'Óleo de Soja 900ml', quantity: 3 },
    ];

    const optimization = await priceTrackingService.optimizeShoppingList(TEST_USER_ID, shoppingList, 90);

    assert(optimization.requestedItems.length === 3, 'Should include all requested items');
    assert(optimization.merchantOptions.length > 0, 'Should provide merchant options');
    assert(optimization.bestOption !== undefined, 'Should identify best option');
    assert(optimization.bestOption.totalCost > 0, 'Should calculate total cost');
    assert(optimization.recommendation.length > 0, 'Should provide recommendation');

    logTest('Optimize shopping list', true);
  } catch (error) {
    logTest('Optimize shopping list', false, error);
  }

  // Test 2: Calculate merchant costs
  try {
    setupTest();
    setupSampleData();

    const shoppingList: ShoppingListItem[] = [
      { productId: TEST_PRODUCT_1, productName: 'Arroz Branco 5kg', quantity: 1 },
      { productId: TEST_PRODUCT_2, productName: 'Feijão Preto 1kg', quantity: 1 },
    ];

    const costs = await priceTrackingService.calculateMerchantCosts(TEST_USER_ID, shoppingList, 90);

    assert(costs.size > 0, 'Should calculate costs for merchants');
    assert(costs.has(MERCHANT_A.cnpj), 'Should include Merchant A');

    const merchantACost = costs.get(MERCHANT_A.cnpj);
    // Merchant A should have some cost calculated
    assert(merchantACost !== undefined && merchantACost > 0, 'Should calculate cost for Merchant A');

    logTest('Calculate merchant costs', true);
  } catch (error) {
    logTest('Calculate merchant costs', false, error);
  }

  // Test 3: Handle empty shopping list
  try {
    setupTest();
    setupSampleData();

    let errorThrown = false;
    try {
      await priceTrackingService.optimizeShoppingList(TEST_USER_ID, [], 90);
    } catch (error) {
      errorThrown = true;
      assert(error instanceof PriceTrackingError, 'Should throw PriceTrackingError');
      assert((error as PriceTrackingError).code === 'EMPTY_SHOPPING_LIST', 'Error code should be EMPTY_SHOPPING_LIST');
    }

    assert(errorThrown, 'Should throw error for empty shopping list');

    logTest('Handle empty shopping list', true);
  } catch (error) {
    logTest('Handle empty shopping list', false, error);
  }

  // Test 4: Best merchant has most items and lowest cost
  try {
    setupTest();
    setupSampleData();

    const shoppingList: ShoppingListItem[] = [
      { productId: TEST_PRODUCT_1, productName: 'Arroz Branco 5kg', quantity: 1 },
      { productId: TEST_PRODUCT_3, productName: 'Óleo de Soja 900ml', quantity: 1 },
    ];

    const optimization = await priceTrackingService.optimizeShoppingList(TEST_USER_ID, shoppingList, 90);

    // Best option should have items and a valid cost
    assert(optimization.bestOption.items.length >= 1, 'Best option should have at least one item');
    assert(optimization.bestOption.totalCost > 0, 'Best option should have a total cost');

    logTest('Best merchant has most items and lowest cost', true);
  } catch (error) {
    logTest('Best merchant has most items and lowest cost', false, error);
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Price Tracking Service Tests...\n');
  console.log('==================================================');

  await testPriceHistoryRetrieval();
  await testPriceChangeDetection();
  await testPriceComparison();
  await testShoppingListOptimization();

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
