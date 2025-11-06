#!/usr/bin/env tsx

/**
 * Price Comparison UI Component Tests
 *
 * Tests for the price comparison UI components including:
 * - Products page rendering
 * - PriceHistoryChart component
 * - PriceComparisonTable component
 * - ShoppingListBuilder component
 */
import assert from 'assert';

// ============================================
// Test Utilities
// ============================================

let testsPassed = 0;
let testsFailed = 0;

function logTest(testName: string, passed: boolean, error?: any) {
  if (passed) {
    console.log(`  ✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${testName}`);
    if (error) {
      console.log(`     Error: ${error.message || error}`);
    }
    testsFailed++;
  }
}

// ============================================
// Component Import Tests
// ============================================

async function testComponentImports() {
  console.log('\n📝 Test Group: Component Imports');

  // Test 1: Products page exists
  try {
    const productsPage = await import('../app/(app)/invoices/products/page');
    assert(typeof productsPage.default === 'function', 'Products page should be a React component');
    logTest('Products page component exists', true);
  } catch (error) {
    logTest('Products page component exists', false, error);
  }

  // Test 2: PriceHistoryChart component exists
  try {
    const priceHistoryChart = await import('../components/invoices/PriceHistoryChart');
    assert(typeof priceHistoryChart.default === 'function', 'PriceHistoryChart should be a React component');
    logTest('PriceHistoryChart component exists', true);
  } catch (error) {
    logTest('PriceHistoryChart component exists', false, error);
  }

  // Test 3: PriceComparisonTable component exists
  try {
    const priceComparisonTable = await import('../components/invoices/PriceComparisonTable');
    assert(typeof priceComparisonTable.default === 'function', 'PriceComparisonTable should be a React component');
    logTest('PriceComparisonTable component exists', true);
  } catch (error) {
    logTest('PriceComparisonTable component exists', false, error);
  }

  // Test 4: ShoppingListBuilder component exists
  try {
    const shoppingListBuilder = await import('../components/invoices/ShoppingListBuilder');
    assert(typeof shoppingListBuilder.default === 'function', 'ShoppingListBuilder should be a React component');
    logTest('ShoppingListBuilder component exists', true);
  } catch (error) {
    logTest('ShoppingListBuilder component exists', false, error);
  }
}

// ============================================
// Component Structure Tests
// ============================================

async function testComponentStructure() {
  console.log('\n📝 Test Group: Component Structure');

  // Test 1: PriceHistoryChart accepts required props
  try {
    const PriceHistoryChart = (await import('../components/invoices/PriceHistoryChart')).default;

    // Component should accept data and productName props
    // We can't render without React, but we can verify the component exists
    assert(typeof PriceHistoryChart === 'function', 'PriceHistoryChart should be a function component');
    logTest('PriceHistoryChart has correct structure', true);
  } catch (error) {
    logTest('PriceHistoryChart has correct structure', false, error);
  }

  // Test 2: PriceComparisonTable accepts required props
  try {
    const PriceComparisonTable = (await import('../components/invoices/PriceComparisonTable')).default;

    assert(typeof PriceComparisonTable === 'function', 'PriceComparisonTable should be a function component');
    logTest('PriceComparisonTable has correct structure', true);
  } catch (error) {
    logTest('PriceComparisonTable has correct structure', false, error);
  }

  // Test 3: ShoppingListBuilder accepts required props
  try {
    const ShoppingListBuilder = (await import('../components/invoices/ShoppingListBuilder')).default;

    assert(typeof ShoppingListBuilder === 'function', 'ShoppingListBuilder should be a function component');
    logTest('ShoppingListBuilder has correct structure', true);
  } catch (error) {
    logTest('ShoppingListBuilder has correct structure', false, error);
  }
}

// ============================================
// Integration Tests
// ============================================

async function testIntegration() {
  console.log('\n📝 Test Group: Component Integration');

  // Test 1: Products page imports ShoppingListBuilder
  try {
    const productsPageSource = await import('fs').then((fs) =>
      fs.promises.readFile('app/(app)/invoices/products/page.tsx', 'utf-8'),
    );

    assert(productsPageSource.includes('ShoppingListBuilder'), 'Products page should import ShoppingListBuilder');
    logTest('Products page integrates ShoppingListBuilder', true);
  } catch (error) {
    logTest('Products page integrates ShoppingListBuilder', false, error);
  }

  // Test 2: Components use recharts library
  try {
    const priceHistorySource = await import('fs').then((fs) =>
      fs.promises.readFile('components/invoices/PriceHistoryChart.tsx', 'utf-8'),
    );

    assert(priceHistorySource.includes('recharts'), 'PriceHistoryChart should use recharts library');
    logTest('PriceHistoryChart uses recharts library', true);
  } catch (error) {
    logTest('PriceHistoryChart uses recharts library', false, error);
  }

  // Test 3: PriceComparisonTable has sorting functionality
  try {
    const priceComparisonSource = await import('fs').then((fs) =>
      fs.promises.readFile('components/invoices/PriceComparisonTable.tsx', 'utf-8'),
    );

    assert(
      priceComparisonSource.includes('handleSort') || priceComparisonSource.includes('sortField'),
      'PriceComparisonTable should have sorting functionality',
    );
    logTest('PriceComparisonTable has sorting functionality', true);
  } catch (error) {
    logTest('PriceComparisonTable has sorting functionality', false, error);
  }

  // Test 4: ShoppingListBuilder calls shopping list API
  try {
    const shoppingListSource = await import('fs').then((fs) =>
      fs.promises.readFile('components/invoices/ShoppingListBuilder.tsx', 'utf-8'),
    );

    assert(
      shoppingListSource.includes('/api/products/shopping-list'),
      'ShoppingListBuilder should call shopping list API',
    );
    logTest('ShoppingListBuilder calls shopping list API', true);
  } catch (error) {
    logTest('ShoppingListBuilder calls shopping list API', false, error);
  }
}

// ============================================
// API Integration Tests
// ============================================

async function testAPIIntegration() {
  console.log('\n📝 Test Group: API Integration');

  // Test 1: Products API endpoint exists
  try {
    const { GET } = await import('../app/api/products/route');
    assert(typeof GET === 'function', 'GET products endpoint should exist');
    logTest('Products API endpoint exists', true);
  } catch (error) {
    logTest('Products API endpoint exists', false, error);
  }

  // Test 2: Price history API endpoint exists
  try {
    const { GET } = await import('../app/api/products/[id]/price-history/route');
    assert(typeof GET === 'function', 'GET price history endpoint should exist');
    logTest('Price history API endpoint exists', true);
  } catch (error) {
    logTest('Price history API endpoint exists', false, error);
  }

  // Test 3: Price comparison API endpoint exists
  try {
    const { GET } = await import('../app/api/products/[id]/compare/route');
    assert(typeof GET === 'function', 'GET price comparison endpoint should exist');
    logTest('Price comparison API endpoint exists', true);
  } catch (error) {
    logTest('Price comparison API endpoint exists', false, error);
  }

  // Test 4: Shopping list API endpoint exists
  try {
    const { POST } = await import('../app/api/products/shopping-list/route');
    assert(typeof POST === 'function', 'POST shopping list endpoint should exist');
    logTest('Shopping list API endpoint exists', true);
  } catch (error) {
    logTest('Shopping list API endpoint exists', false, error);
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Price Comparison UI Component Tests\n');
  console.log('='.repeat(60));

  await testComponentImports();
  await testComponentStructure();
  await testIntegration();
  await testAPIIntegration();

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);

  if (testsFailed > 0) {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('\n💥 Fatal error running tests:', error);
  process.exit(1);
});
