/**
 * Analytics Service Tests
 *
 * Unit tests for insights generation, spending predictions,
 * anomaly detection, and budget tracking
 */
import { Invoice } from '../lib/appwrite/schema';
import {
  AnalyticsService,
  AnalyticsServiceError,
  BudgetLimit,
  CategorySpending,
  SpendingAnomaly,
  SpendingPrediction,
} from '../lib/services/analytics.service';

// ============================================
// Test Data
// ============================================

const TEST_USER_ID = 'test-user-123';

function createTestInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    $id: `invoice-${Math.random().toString(36).substr(2, 9)}`,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    user_id: TEST_USER_ID,
    invoice_key: `key-${Math.random().toString(36).substr(2, 9)}`,
    invoice_number: '123456',
    issue_date: new Date().toISOString(),
    merchant_cnpj: '12345678000190',
    merchant_name: 'Test Merchant',
    total_amount: 100,
    category: 'supermarket',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// Mock Database Adapter
// ============================================

class MockDatabaseAdapter {
  private documents: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.documents.set('invoices', new Map());
    this.documents.set('products', new Map());
  }

  async listDocuments(databaseId: string, collectionId: string, queries: any[]): Promise<any> {
    const collection = this.documents.get(collectionId);
    if (!collection) {
      return { documents: [], total: 0 };
    }

    let documents = Array.from(collection.values());

    // Apply filters from queries
    for (const query of queries) {
      if (query.method === 'equal') {
        documents = documents.filter((doc) => doc[query.attribute] === query.values[0]);
      }
      if (query.method === 'greaterThanEqual') {
        documents = documents.filter((doc) => doc[query.attribute] >= query.values[0]);
      }
      if (query.method === 'lessThanEqual') {
        documents = documents.filter((doc) => doc[query.attribute] <= query.values[0]);
      }
      if (query.method === 'orderDesc') {
        documents.sort((a, b) => {
          const aVal = a[query.attribute];
          const bVal = b[query.attribute];
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
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

  addInvoice(invoice: Invoice) {
    const collection = this.documents.get('invoices')!;
    collection.set(invoice.$id, invoice);
  }

  addProduct(product: any) {
    const collection = this.documents.get('products')!;
    collection.set(product.$id, product);
  }

  reset() {
    this.documents.clear();
    this.documents.set('invoices', new Map());
    this.documents.set('products', new Map());
  }
}

// ============================================
// Test Helpers
// ============================================

let testsPassed = 0;
let testsFailed = 0;
let mockDb: MockDatabaseAdapter;
let analyticsService: AnalyticsService;

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
  analyticsService = Object.create(AnalyticsService.prototype);
  (analyticsService as any).dbAdapter = mockDb;
  (analyticsService as any).MINIMUM_INVOICES = 3;
  (analyticsService as any).MINIMUM_MONTHS = 3;
  (analyticsService as any).budgets = new Map();
}

// ============================================
// Insights Generation Tests
// ============================================

async function testInsightsGeneration() {
  console.log('\n📝 Test Group: Insights Generation');

  // Test 1: Insufficient data (< 3 invoices)
  try {
    setupTest();

    // Add only 2 invoices
    mockDb.addInvoice(createTestInvoice({ total_amount: 50 }));
    mockDb.addInvoice(createTestInvoice({ total_amount: 75 }));

    const insights = await analyticsService.generateInsights(TEST_USER_ID);

    assert(insights.hasMinimumData === false, 'Should indicate insufficient data');
    assert(insights.totalInvoices === 2, 'Should count 2 invoices');
    assert(insights.categoryBreakdown.length === 0, 'Should not generate insights');

    logTest('Handle insufficient data (< 3 invoices)', true);
  } catch (error) {
    logTest('Handle insufficient data (< 3 invoices)', false, error);
  }

  // Test 2: Generate insights with sufficient data
  try {
    setupTest();

    // Add 5 invoices across different categories
    mockDb.addInvoice(createTestInvoice({ category: 'supermarket', total_amount: 150 }));
    mockDb.addInvoice(createTestInvoice({ category: 'pharmacy', total_amount: 50 }));
    mockDb.addInvoice(createTestInvoice({ category: 'supermarket', total_amount: 200 }));
    mockDb.addInvoice(createTestInvoice({ category: 'restaurant', total_amount: 80 }));
    mockDb.addInvoice(createTestInvoice({ category: 'pharmacy', total_amount: 45 }));

    const insights = await analyticsService.generateInsights(TEST_USER_ID);

    assert(insights.hasMinimumData === true, 'Should have minimum data');
    assert(insights.totalInvoices === 5, 'Should count 5 invoices');
    assert(insights.totalSpent === 525, 'Should calculate total spent');
    assert(insights.averageInvoiceAmount === 105, 'Should calculate average');
    assert(insights.categoryBreakdown.length === 3, 'Should have 3 categories');

    logTest('Generate insights with sufficient data', true);
  } catch (error) {
    logTest('Generate insights with sufficient data', false, error);
  }

  // Test 3: Category breakdown calculation
  try {
    setupTest();

    mockDb.addInvoice(createTestInvoice({ category: 'supermarket', total_amount: 300 }));
    mockDb.addInvoice(createTestInvoice({ category: 'supermarket', total_amount: 200 }));
    mockDb.addInvoice(createTestInvoice({ category: 'pharmacy', total_amount: 100 }));

    const insights = await analyticsService.generateInsights(TEST_USER_ID);
    const categoryBreakdown = insights.categoryBreakdown;

    // Supermarket should be first (highest spending)
    assert(categoryBreakdown[0].category === 'supermarket', 'Supermarket should be top category');
    assert(categoryBreakdown[0].totalAmount === 500, 'Supermarket total should be 500');
    assert(categoryBreakdown[0].invoiceCount === 2, 'Supermarket should have 2 invoices');
    assert(Math.abs(categoryBreakdown[0].percentage - 83.33) < 0.1, 'Percentage should be ~83.33%');
    assert(categoryBreakdown[0].averageAmount === 250, 'Average should be 250');

    logTest('Calculate category breakdown correctly', true);
  } catch (error) {
    logTest('Calculate category breakdown correctly', false, error);
  }

  // Test 4: Top merchants calculation
  try {
    setupTest();

    mockDb.addInvoice(
      createTestInvoice({
        merchant_cnpj: '11111111000111',
        merchant_name: 'Merchant A',
        total_amount: 100,
      }),
    );
    mockDb.addInvoice(
      createTestInvoice({
        merchant_cnpj: '11111111000111',
        merchant_name: 'Merchant A',
        total_amount: 150,
      }),
    );
    mockDb.addInvoice(
      createTestInvoice({
        merchant_cnpj: '22222222000222',
        merchant_name: 'Merchant B',
        total_amount: 200,
      }),
    );

    const insights = await analyticsService.generateInsights(TEST_USER_ID);
    const topMerchants = insights.topMerchants;

    // Merchant A should be first (2 visits)
    assert(topMerchants[0].merchantName === 'Merchant A', 'Merchant A should be top');
    assert(topMerchants[0].visitCount === 2, 'Should have 2 visits');
    assert(topMerchants[0].totalSpent === 250, 'Total spent should be 250');
    assert(topMerchants[0].averageSpent === 125, 'Average should be 125');

    logTest('Calculate top merchants correctly', true);
  } catch (error) {
    logTest('Calculate top merchants correctly', false, error);
  }
}

// ============================================
// Spending Prediction Tests
// ============================================

async function testSpendingPredictions() {
  console.log('\n📝 Test Group: Spending Predictions');

  // Test 1: No predictions with insufficient months
  try {
    setupTest();

    // Add invoices for only 2 months
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    mockDb.addInvoice(createTestInvoice({ issue_date: twoMonthsAgo.toISOString(), total_amount: 100 }));
    mockDb.addInvoice(createTestInvoice({ issue_date: new Date().toISOString(), total_amount: 150 }));
    mockDb.addInvoice(createTestInvoice({ issue_date: new Date().toISOString(), total_amount: 120 }));

    const insights = await analyticsService.generateInsights(TEST_USER_ID);

    assert(insights.predictions.length === 0, 'Should not generate predictions with < 3 months');

    logTest('No predictions with insufficient months', true);
  } catch (error) {
    logTest('No predictions with insufficient months', false, error);
  }

  // Test 2: Generate predictions with 3+ months of data
  try {
    setupTest();

    // Add invoices for 4 months
    for (let i = 0; i < 4; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      mockDb.addInvoice(
        createTestInvoice({
          category: 'supermarket',
          issue_date: date.toISOString(),
          total_amount: 200 + i * 10,
        }),
      );
    }

    const insights = await analyticsService.generateInsights(TEST_USER_ID);

    assert(insights.predictions.length > 0, 'Should generate predictions');

    const prediction = insights.predictions.find((p) => p.category === 'supermarket');
    assert(prediction !== undefined, 'Should have prediction for supermarket');
    assert(prediction!.predictedAmount > 0, 'Predicted amount should be positive');
    assert(prediction!.confidence >= 0.5 && prediction!.confidence <= 0.95, 'Confidence should be in valid range');

    logTest('Generate predictions with 3+ months of data', true);
  } catch (error) {
    logTest('Generate predictions with 3+ months of data', false, error);
  }

  // Test 3: Prediction algorithm accuracy
  try {
    setupTest();

    // Create consistent spending pattern
    const amounts = [200, 210, 220]; // Increasing trend
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (3 - i));

      mockDb.addInvoice(
        createTestInvoice({
          category: 'supermarket',
          issue_date: date.toISOString(),
          total_amount: amounts[i],
        }),
      );
    }

    const insights = await analyticsService.generateInsights(TEST_USER_ID);
    const prediction = insights.predictions.find((p) => p.category === 'supermarket');

    assert(prediction !== undefined, 'Should have prediction');
    // Baseline should be around 210 (average of 200, 210, 220)
    assert(Math.abs(prediction!.baseline - 210) < 5, 'Baseline should be close to average');
    // Trend should be positive (increasing)
    assert(prediction!.trend > 0, 'Trend should be positive');

    logTest('Prediction algorithm calculates baseline and trend', true);
  } catch (error) {
    logTest('Prediction algorithm calculates baseline and trend', false, error);
  }
}

// ============================================
// Anomaly Detection Tests
// ============================================

async function testAnomalyDetection() {
  console.log('\n📝 Test Group: Anomaly Detection');

  // Test 1: Detect high spending anomaly
  try {
    setupTest();

    // Add normal invoices
    for (let i = 0; i < 5; i++) {
      mockDb.addInvoice(createTestInvoice({ total_amount: 100 }));
    }

    // Add anomalous high spending
    mockDb.addInvoice(createTestInvoice({ total_amount: 500 }));

    const insights = await analyticsService.generateInsights(TEST_USER_ID);
    const highSpendingAnomalies = insights.anomalies.filter((a) => a.type === 'high_spending');

    assert(highSpendingAnomalies.length > 0, 'Should detect high spending anomaly');
    assert(highSpendingAnomalies[0].amount === 500, 'Should identify correct amount');

    logTest('Detect high spending anomaly', true);
  } catch (error) {
    logTest('Detect high spending anomaly', false, error);
  }

  // Test 2: Detect unusual merchant
  try {
    setupTest();

    // Add regular merchants
    for (let i = 0; i < 3; i++) {
      mockDb.addInvoice(
        createTestInvoice({
          merchant_cnpj: '11111111000111',
          merchant_name: 'Regular Merchant',
          total_amount: 50,
        }),
      );
    }

    // Add unusual merchant with high spending
    mockDb.addInvoice(
      createTestInvoice({
        merchant_cnpj: '99999999000999',
        merchant_name: 'Unusual Merchant',
        total_amount: 200,
      }),
    );

    const insights = await analyticsService.generateInsights(TEST_USER_ID);
    const unusualMerchantAnomalies = insights.anomalies.filter((a) => a.type === 'unusual_merchant');

    assert(unusualMerchantAnomalies.length > 0, 'Should detect unusual merchant');

    logTest('Detect unusual merchant', true);
  } catch (error) {
    logTest('Detect unusual merchant', false, error);
  }

  // Test 3: Detect potential duplicate invoices
  try {
    setupTest();

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Add two similar invoices from same merchant (sorted by date)
    mockDb.addInvoice(
      createTestInvoice({
        merchant_cnpj: '11111111000111',
        merchant_name: 'Test Merchant',
        total_amount: 100,
        issue_date: today.toISOString(),
      }),
    );

    mockDb.addInvoice(
      createTestInvoice({
        merchant_cnpj: '11111111000111',
        merchant_name: 'Test Merchant',
        total_amount: 102, // Within 5% similarity
        issue_date: tomorrow.toISOString(),
      }),
    );

    // Add one more to meet minimum (3 invoices)
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    mockDb.addInvoice(createTestInvoice({ total_amount: 50, issue_date: dayAfter.toISOString() }));

    const insights = await analyticsService.generateInsights(TEST_USER_ID);
    const duplicateAnomalies = insights.anomalies.filter((a) => a.type === 'duplicate_invoice');

    // The duplicate detection should find the similar invoices
    assert(duplicateAnomalies.length > 0, 'Should detect potential duplicate');
    if (duplicateAnomalies.length > 0) {
      assert(duplicateAnomalies[0].severity === 'high', 'Duplicate should be high severity');
    }

    logTest('Detect potential duplicate invoices', true);
  } catch (error) {
    logTest('Detect potential duplicate invoices', false, error);
  }
}

// ============================================
// Budget Tracking Tests
// ============================================

async function testBudgetTracking() {
  console.log('\n📝 Test Group: Budget Tracking');

  // Test 1: Set and get budget limit
  try {
    setupTest();

    await analyticsService.setBudgetLimit(TEST_USER_ID, 'supermarket', 500);
    const limit = await analyticsService.getBudgetLimit(TEST_USER_ID, 'supermarket');

    assert(limit === 500, 'Should set and retrieve budget limit');

    logTest('Set and get budget limit', true);
  } catch (error) {
    logTest('Set and get budget limit', false, error);
  }

  // Test 2: Reject invalid budget limit
  try {
    setupTest();

    let errorThrown = false;
    try {
      await analyticsService.setBudgetLimit(TEST_USER_ID, 'supermarket', -100);
    } catch (error) {
      errorThrown = true;
      assert(error instanceof AnalyticsServiceError, 'Should throw AnalyticsServiceError');
      assert((error as AnalyticsServiceError).code === 'INVALID_BUDGET_LIMIT', 'Error code should be correct');
    }

    assert(errorThrown, 'Should reject negative budget limit');

    logTest('Reject invalid budget limit', true);
  } catch (error) {
    logTest('Reject invalid budget limit', false, error);
  }

  // Test 3: Calculate budget status (ok, warning, exceeded)
  try {
    setupTest();

    await analyticsService.setBudgetLimit(TEST_USER_ID, 'supermarket', 500);

    // Add current month invoices
    const today = new Date();
    mockDb.addInvoice(
      createTestInvoice({
        category: 'supermarket',
        total_amount: 450, // 90% of budget
        issue_date: today.toISOString(),
      }),
    );

    const budgets = await analyticsService.getAllBudgetLimits(TEST_USER_ID);

    assert(budgets.length === 1, 'Should have 1 budget');
    assert(budgets[0].category === 'supermarket', 'Should be supermarket category');
    assert(budgets[0].currentSpending === 450, 'Current spending should be 450');
    assert(budgets[0].percentage === 90, 'Percentage should be 90');
    assert(budgets[0].status === 'warning', 'Status should be warning (>= 80%)');

    logTest('Calculate budget status correctly', true);
  } catch (error) {
    logTest('Calculate budget status correctly', false, error);
  }

  // Test 4: Generate budget alerts
  try {
    setupTest();

    await analyticsService.setBudgetLimit(TEST_USER_ID, 'supermarket', 500);
    await analyticsService.setBudgetLimit(TEST_USER_ID, 'pharmacy', 200);

    const today = new Date();
    // Supermarket: 90% (warning)
    mockDb.addInvoice(
      createTestInvoice({
        category: 'supermarket',
        total_amount: 450,
        issue_date: today.toISOString(),
      }),
    );

    // Pharmacy: 110% (exceeded)
    mockDb.addInvoice(
      createTestInvoice({
        category: 'pharmacy',
        total_amount: 220,
        issue_date: today.toISOString(),
      }),
    );

    const alerts = await analyticsService.generateBudgetAlerts(TEST_USER_ID);

    assert(alerts.length === 2, 'Should generate 2 alerts');

    const exceededAlert = alerts.find((a) => a.threshold === 100);
    assert(exceededAlert !== undefined, 'Should have exceeded alert');
    assert(exceededAlert!.category === 'pharmacy', 'Exceeded alert should be for pharmacy');

    const warningAlert = alerts.find((a) => a.threshold === 80);
    assert(warningAlert !== undefined, 'Should have warning alert');
    assert(warningAlert!.category === 'supermarket', 'Warning alert should be for supermarket');

    logTest('Generate budget alerts at thresholds', true);
  } catch (error) {
    logTest('Generate budget alerts at thresholds', false, error);
  }

  // Test 5: Delete budget limit
  try {
    setupTest();

    await analyticsService.setBudgetLimit(TEST_USER_ID, 'supermarket', 500);
    await analyticsService.deleteBudgetLimit(TEST_USER_ID, 'supermarket');

    const limit = await analyticsService.getBudgetLimit(TEST_USER_ID, 'supermarket');

    assert(limit === null, 'Budget limit should be deleted');

    logTest('Delete budget limit', true);
  } catch (error) {
    logTest('Delete budget limit', false, error);
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Analytics Service Tests...\n');
  console.log('==================================================');

  await testInsightsGeneration();
  await testSpendingPredictions();
  await testAnomalyDetection();
  await testBudgetTracking();

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
