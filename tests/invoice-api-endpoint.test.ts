/**
 * Invoice API Endpoint Tests
 *
 * Tests for the updated POST /api/invoices endpoint with:
 * - forceRefresh query parameter support
 * - Cache metadata in response
 * - Updated error response format
 *
 * Requirements: 5.5, 6.1
 */
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Test Helpers
// ============================================

let testsPassed = 0;
let testsFailed = 0;

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

// ============================================
// API Endpoint Structure Tests
// ============================================

async function testPOSTEndpointStructure() {
  console.log('\n📝 Test Group: POST /api/invoices Endpoint Structure');

  // Test 1: POST endpoint file exists
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    assert(fs.existsSync(apiFilePath), 'API route file should exist');

    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');
    assert(apiFileContent.includes('export async function POST'), 'POST endpoint should be exported');

    logTest('POST /api/invoices endpoint exists', true);
  } catch (error) {
    logTest('POST /api/invoices endpoint exists', false, error);
  }

  // Test 2: Verify endpoint accepts NextRequest
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that the function signature is correct
    assert(apiFileContent.includes('request: NextRequest'), 'POST should accept NextRequest parameter');

    logTest('POST endpoint has correct function signature', true);
  } catch (error) {
    logTest('POST endpoint has correct function signature', false, error);
  }
}

async function testForceRefreshParameter() {
  console.log('\n📝 Test Group: Force Refresh Query Parameter');

  // Test 1: Verify forceRefresh query parameter is parsed
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that forceRefresh is parsed from query params
    assert(apiFileContent.includes('forceRefresh'), 'API should parse forceRefresh parameter');
    assert(
      apiFileContent.includes("searchParams.get('forceRefresh')"),
      'API should use searchParams to get forceRefresh parameter',
    );

    logTest('API parses forceRefresh query parameter', true);
  } catch (error) {
    logTest('API parses forceRefresh query parameter', false, error);
  }

  // Test 2: Verify forceRefresh is passed to parseFromUrl
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that forceRefresh is passed to parseFromUrl
    assert(
      apiFileContent.includes('parseFromUrl(body.invoiceUrl, forceRefresh)'),
      'API should pass forceRefresh to parseFromUrl',
    );

    logTest('API passes forceRefresh to parseFromUrl', true);
  } catch (error) {
    logTest('API passes forceRefresh to parseFromUrl', false, error);
  }

  // Test 3: Verify forceRefresh is passed to parseFromQRCode
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that forceRefresh is passed to parseFromQRCode
    assert(
      apiFileContent.includes('parseFromQRCode(body.qrCodeData, forceRefresh)'),
      'API should pass forceRefresh to parseFromQRCode',
    );

    logTest('API passes forceRefresh to parseFromQRCode', true);
  } catch (error) {
    logTest('API passes forceRefresh to parseFromQRCode', false, error);
  }
}

async function testCacheMetadataInResponse() {
  console.log('\n📝 Test Group: Cache Metadata in Response');

  // Test 1: Verify response includes metadata field
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that the response includes metadata
    assert(apiFileContent.includes('metadata:'), 'API response should include metadata field');

    logTest('API response includes metadata field', true);
  } catch (error) {
    logTest('API response includes metadata field', false, error);
  }

  // Test 2: Verify metadata includes fromCache
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that metadata includes fromCache
    assert(apiFileContent.includes('fromCache:'), 'API response metadata should include fromCache');
    assert(
      apiFileContent.includes('parsedInvoice.metadata?.fromCache'),
      'fromCache should be read from parsedInvoice metadata',
    );

    logTest('Metadata includes fromCache field', true);
  } catch (error) {
    logTest('Metadata includes fromCache field', false, error);
  }

  // Test 3: Verify metadata includes cachedAt
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that metadata includes cachedAt
    assert(apiFileContent.includes('cachedAt:'), 'API response metadata should include cachedAt');

    logTest('Metadata includes cachedAt field', true);
  } catch (error) {
    logTest('Metadata includes cachedAt field', false, error);
  }

  // Test 4: Verify metadata includes parsingMethod
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that metadata includes parsingMethod
    assert(apiFileContent.includes('parsingMethod:'), 'API response metadata should include parsingMethod');
    assert(
      apiFileContent.includes('parsedInvoice.metadata?.parsingMethod'),
      'parsingMethod should be read from parsedInvoice metadata',
    );

    logTest('Metadata includes parsingMethod field', true);
  } catch (error) {
    logTest('Metadata includes parsingMethod field', false, error);
  }
}

async function testErrorResponseFormat() {
  console.log('\n📝 Test Group: Error Response Format');

  // Test 1: Verify error responses include code field
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that error responses include code
    assert(apiFileContent.includes('code: error.code'), 'Error responses should include code field');

    logTest('Error responses include code field', true);
  } catch (error) {
    logTest('Error responses include code field', false, error);
  }

  // Test 2: Verify error responses include details field
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that error responses include details
    assert(apiFileContent.includes('details: error.details'), 'Error responses should include details field');

    logTest('Error responses include details field', true);
  } catch (error) {
    logTest('Error responses include details field', false, error);
  }

  // Test 3: Verify InvoiceParserError is handled
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that InvoiceParserError is caught and handled
    assert(apiFileContent.includes('if (error instanceof InvoiceParserError)'), 'API should handle InvoiceParserError');

    logTest('API handles InvoiceParserError', true);
  } catch (error) {
    logTest('API handles InvoiceParserError', false, error);
  }
}

async function testDocumentation() {
  console.log('\n📝 Test Group: Documentation');

  // Test 1: Verify endpoint has JSDoc comments
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that endpoint has documentation
    assert(apiFileContent.includes('* POST /api/invoices'), 'Endpoint should have JSDoc comments');

    logTest('Endpoint has JSDoc documentation', true);
  } catch (error) {
    logTest('Endpoint has JSDoc documentation', false, error);
  }

  // Test 2: Verify forceRefresh parameter is documented
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that forceRefresh is documented
    assert(
      apiFileContent.includes('forceRefresh') && apiFileContent.includes('Query Parameters'),
      'forceRefresh parameter should be documented',
    );

    logTest('forceRefresh parameter is documented', true);
  } catch (error) {
    logTest('forceRefresh parameter is documented', false, error);
  }

  // Test 3: Verify requirements are documented
  try {
    const apiFilePath = path.join(process.cwd(), 'app/api/invoices/route.ts');
    const apiFileContent = fs.readFileSync(apiFilePath, 'utf-8');

    // Check that requirements are documented
    assert(apiFileContent.includes('Requirements: 5.5, 6.1'), 'Requirements should be documented in comments');

    logTest('Requirements are documented', true);
  } catch (error) {
    logTest('Requirements are documented', false, error);
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Invoice API Endpoint Tests...\n');
  console.log('==================================================');
  console.log('Testing Task 8: Update API endpoint');
  console.log('Requirements: 5.5, 6.1');
  console.log('==================================================');

  await testPOSTEndpointStructure();
  await testForceRefreshParameter();
  await testCacheMetadataInResponse();
  await testErrorResponseFormat();
  await testDocumentation();

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
