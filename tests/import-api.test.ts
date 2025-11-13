/**
 * Import API Tests
 *
 * Manual test script for validating import API endpoints
 * Run with: tsx tests/import-api.test.ts
 *
 * Prerequisites: User must be logged in and have an account
 */
import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

// Test data
let authToken: string | null = null;
let testAccountId: string | null = null;
let userId: string | null = null;
let importId: string | null = null;

// Helper function to log results
function logResult(result: TestResult) {
  results.push(result);
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.data) {
    console.log('   Data:', JSON.stringify(result.data, null, 2));
  }
}

// Setup: Login and create test account
async function setupAuth() {
  console.log('🔐 Setting up authentication and test account...');

  const testUser = {
    email: `test-import-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Import',
  };

  try {
    // Register user
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    if (!registerResponse.ok) {
      throw new Error('Failed to register test user');
    }

    const registerData = await registerResponse.json();
    userId = registerData.user?.id;

    // Extract token from cookie
    const setCookie = registerResponse.headers.get('set-cookie');
    const match = setCookie?.match(/auth_token=([^;]+)/);
    authToken = match ? match[1] : null;

    if (!authToken) {
      throw new Error('Failed to get auth token');
    }

    // Create test account
    const accountResponse = await fetch(`${API_BASE_URL}/api/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        name: `Test Import Account ${Date.now()}`,
        account_type: 'checking',
        initial_balance: 1000,
      }),
    });

    if (!accountResponse.ok) {
      throw new Error('Failed to create test account');
    }

    const accountData = await accountResponse.json();
    testAccountId = accountData.data?.$id || accountData.$id;

    console.log('✅ Authentication and test account setup complete\n');
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Test 1: Preview import with valid OFX file
async function testPreviewImportOFX() {
  console.log('\n📝 Test 1: Preview Import with Valid OFX File');

  try {
    // Read sample OFX file
    const ofxPath = path.join(process.cwd(), 'public', 'assets', 'Extrato conta corrente - 112025.ofx');

    if (!fs.existsSync(ofxPath)) {
      logResult({
        name: 'Preview Import OFX',
        passed: false,
        message: 'Sample OFX file not found',
      });
      return;
    }

    const fileContent = fs.readFileSync(ofxPath);
    const blob = new Blob([fileContent], { type: 'application/x-ofx' });
    const file = new File([blob], 'test.ofx', { type: 'application/x-ofx' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', testAccountId!);

    const response = await fetch(`${API_BASE_URL}/api/transactions/import/preview`, {
      method: 'POST',
      headers: {
        Cookie: `auth_token=${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success && data.data?.transactions) {
      logResult({
        name: 'Preview Import OFX',
        passed: true,
        message: `Successfully parsed ${data.data.transactions.length} transactions`,
        data: {
          transactionCount: data.data.transactions.length,
          summary: data.data.summary,
          duplicateCount: data.data.duplicates?.length || 0,
        },
      });
    } else {
      logResult({
        name: 'Preview Import OFX',
        passed: false,
        message: data.error || 'Failed to preview import',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Preview Import OFX',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 2: Preview import with valid CSV file
async function testPreviewImportCSV() {
  console.log('\n📝 Test 2: Preview Import with Valid CSV File');

  try {
    // Read sample CSV file
    const csvPath = path.join(process.cwd(), 'public', 'assets', 'NU_69759831_01NOV2025_11NOV2025.csv');

    if (!fs.existsSync(csvPath)) {
      logResult({
        name: 'Preview Import CSV',
        passed: false,
        message: 'Sample CSV file not found',
      });
      return;
    }

    const fileContent = fs.readFileSync(csvPath);
    const blob = new Blob([fileContent], { type: 'text/csv' });
    const file = new File([blob], 'test.csv', { type: 'text/csv' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', testAccountId!);

    const response = await fetch(`${API_BASE_URL}/api/transactions/import/preview`, {
      method: 'POST',
      headers: {
        Cookie: `auth_token=${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success && data.data?.transactions) {
      logResult({
        name: 'Preview Import CSV',
        passed: true,
        message: `Successfully parsed ${data.data.transactions.length} transactions`,
        data: {
          transactionCount: data.data.transactions.length,
          summary: data.data.summary,
          duplicateCount: data.data.duplicates?.length || 0,
        },
      });
    } else {
      logResult({
        name: 'Preview Import CSV',
        passed: false,
        message: data.error || 'Failed to preview import',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Preview Import CSV',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 3: Preview import with invalid file format
async function testPreviewImportInvalidFormat() {
  console.log('\n📝 Test 3: Preview Import with Invalid File Format');

  try {
    const blob = new Blob(['test content'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', testAccountId!);

    const response = await fetch(`${API_BASE_URL}/api/transactions/import/preview`, {
      method: 'POST',
      headers: {
        Cookie: `auth_token=${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok && data.error) {
      logResult({
        name: 'Preview Import Invalid Format',
        passed: true,
        message: 'Correctly rejected invalid file format',
        data: { error: data.error },
      });
    } else {
      logResult({
        name: 'Preview Import Invalid Format',
        passed: false,
        message: 'Should have rejected invalid file format',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Preview Import Invalid Format',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 4: Preview import with file too large
async function testPreviewImportFileTooLarge() {
  console.log('\n📝 Test 4: Preview Import with File Too Large');

  try {
    // Create a file larger than 10MB
    const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const blob = new Blob([largeContent], { type: 'text/csv' });
    const file = new File([blob], 'large.csv', { type: 'text/csv' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', testAccountId!);

    const response = await fetch(`${API_BASE_URL}/api/transactions/import/preview`, {
      method: 'POST',
      headers: {
        Cookie: `auth_token=${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok && data.error) {
      logResult({
        name: 'Preview Import File Too Large',
        passed: true,
        message: 'Correctly rejected file that is too large',
        data: { error: data.error },
      });
    } else {
      logResult({
        name: 'Preview Import File Too Large',
        passed: false,
        message: 'Should have rejected file that is too large',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Preview Import File Too Large',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 5: Preview import without authentication
async function testPreviewImportUnauthorized() {
  console.log('\n📝 Test 5: Preview Import without Authentication');

  try {
    const blob = new Blob(['test'], { type: 'text/csv' });
    const file = new File([blob], 'test.csv', { type: 'text/csv' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', testAccountId!);

    const response = await fetch(`${API_BASE_URL}/api/transactions/import/preview`, {
      method: 'POST',
      body: formData,
      // No auth token
    });

    const data = await response.json();

    if (response.status === 401 && !data.success) {
      logResult({
        name: 'Preview Import Unauthorized',
        passed: true,
        message: 'Correctly rejected unauthenticated request',
        data: { status: response.status },
      });
    } else {
      logResult({
        name: 'Preview Import Unauthorized',
        passed: false,
        message: 'Should have rejected unauthenticated request',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Preview Import Unauthorized',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 6: Process import with valid transactions
async function testProcessImport() {
  console.log('\n📝 Test 6: Process Import with Valid Transactions');

  try {
    const transactions = [
      {
        id: 'temp-1',
        date: '2025-11-10',
        amount: 100.5,
        type: 'expense',
        description: 'Test transaction 1',
        category: 'food',
      },
      {
        id: 'temp-2',
        date: '2025-11-11',
        amount: 200.75,
        type: 'income',
        description: 'Test transaction 2',
        category: 'salary',
      },
    ];

    const response = await fetch(`${API_BASE_URL}/api/transactions/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        accountId: testAccountId,
        transactions,
        fileName: 'test-import.csv',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.data?.importId) {
      importId = data.data.importId;
      logResult({
        name: 'Process Import',
        passed: true,
        message: `Successfully imported ${data.data.imported} transactions`,
        data: {
          imported: data.data.imported,
          failed: data.data.failed,
          importId: data.data.importId,
        },
      });
    } else {
      logResult({
        name: 'Process Import',
        passed: false,
        message: data.error || 'Failed to process import',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Process Import',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 7: Process import with invalid transactions
async function testProcessImportInvalidData() {
  console.log('\n📝 Test 7: Process Import with Invalid Transactions');

  try {
    const invalidTransactions = [
      {
        id: 'temp-1',
        // Missing required fields
        amount: 100,
      },
    ];

    const response = await fetch(`${API_BASE_URL}/api/transactions/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        accountId: testAccountId,
        transactions: invalidTransactions,
        fileName: 'test-invalid.csv',
      }),
    });

    const data = await response.json();

    if (!response.ok && data.error) {
      logResult({
        name: 'Process Import Invalid Data',
        passed: true,
        message: 'Correctly rejected invalid transaction data',
        data: { error: data.error },
      });
    } else {
      logResult({
        name: 'Process Import Invalid Data',
        passed: false,
        message: 'Should have rejected invalid transaction data',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Process Import Invalid Data',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 8: Process import with non-existent account
async function testProcessImportInvalidAccount() {
  console.log('\n📝 Test 8: Process Import with Non-existent Account');

  try {
    const transactions = [
      {
        id: 'temp-1',
        date: '2025-11-10',
        amount: 100,
        type: 'expense',
        description: 'Test',
        category: 'food',
      },
    ];

    const response = await fetch(`${API_BASE_URL}/api/transactions/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_token=${authToken}`,
      },
      body: JSON.stringify({
        accountId: 'non-existent-account-id',
        transactions,
        fileName: 'test.csv',
      }),
    });

    const data = await response.json();

    if (response.status === 404 && !data.success) {
      logResult({
        name: 'Process Import Invalid Account',
        passed: true,
        message: 'Correctly rejected non-existent account',
        data: { status: response.status },
      });
    } else {
      logResult({
        name: 'Process Import Invalid Account',
        passed: false,
        message: 'Should have rejected non-existent account',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Process Import Invalid Account',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 9: Get import history
async function testGetImportHistory() {
  console.log('\n📝 Test 9: Get Import History');

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/import/history`, {
      method: 'GET',
      headers: {
        Cookie: `auth_token=${authToken}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.data)) {
      const hasImport = importId ? data.data.some((record: any) => record.$id === importId) : true;
      logResult({
        name: 'Get Import History',
        passed: hasImport,
        message: `Successfully retrieved ${data.data.length} import record(s)`,
        data: {
          count: data.data.length,
          hasImport,
        },
      });
    } else {
      logResult({
        name: 'Get Import History',
        passed: false,
        message: 'Failed to retrieve import history',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Get Import History',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 10: Get import history with limit
async function testGetImportHistoryWithLimit() {
  console.log('\n📝 Test 10: Get Import History with Limit');

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/import/history?limit=5`, {
      method: 'GET',
      headers: {
        Cookie: `auth_token=${authToken}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.data)) {
      const withinLimit = data.data.length <= 5;
      logResult({
        name: 'Get Import History with Limit',
        passed: withinLimit,
        message: `Retrieved ${data.data.length} record(s) with limit of 5`,
        data: {
          count: data.data.length,
          withinLimit,
        },
      });
    } else {
      logResult({
        name: 'Get Import History with Limit',
        passed: false,
        message: 'Failed to retrieve import history with limit',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Get Import History with Limit',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Test 11: Get import history without authentication
async function testGetImportHistoryUnauthorized() {
  console.log('\n📝 Test 11: Get Import History without Authentication');

  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/import/history`, {
      method: 'GET',
      // No auth token
    });

    const data = await response.json();

    if (response.status === 401 && !data.success) {
      logResult({
        name: 'Get Import History Unauthorized',
        passed: true,
        message: 'Correctly rejected unauthenticated request',
        data: { status: response.status },
      });
    } else {
      logResult({
        name: 'Get Import History Unauthorized',
        passed: false,
        message: 'Should have rejected unauthenticated request',
        data,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Get Import History Unauthorized',
      passed: false,
      message: `Error: ${error.message}`,
    });
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Import API Tests...');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  await setupAuth();
  await testPreviewImportOFX();
  await testPreviewImportCSV();
  await testPreviewImportInvalidFormat();
  await testPreviewImportFileTooLarge();
  await testPreviewImportUnauthorized();
  await testProcessImport();
  await testProcessImportInvalidData();
  await testProcessImportInvalidAccount();
  await testGetImportHistory();
  await testGetImportHistoryWithLimit();
  await testGetImportHistoryUnauthorized();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
