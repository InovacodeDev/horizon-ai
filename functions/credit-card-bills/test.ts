// Import the function
import creditCardBillsFunction from './src/index.js';

/**
 * Test script for Credit Card Bills Function
 *
 * This script simulates the function execution locally for testing purposes.
 * Run with: npm run test
 */

// Mock environment variables
process.env.APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
process.env.APPWRITE_FUNCTION_PROJECT_ID = 'YOUR_PROJECT_ID';
process.env.APPWRITE_API_KEY = 'YOUR_API_KEY';
process.env.APPWRITE_DATABASE_ID = 'YOUR_DATABASE_ID';

// Mock request object
const mockRequest = {
  bodyRaw: JSON.stringify({
    $id: 'test-transaction-id',
    user_id: 'test-user-id',
    credit_card_id: 'test-credit-card-id',
    amount: 100.0,
    date: '2024-12-15T00:00:00.000Z',
    purchase_date: '2024-11-05T00:00:00.000Z',
    category: 'Shopping',
    description: 'Test purchase',
    merchant: 'Test Merchant',
    installment: 1,
    installments: 3,
    status: 'completed',
  }),
};

// Mock response object
const mockResponse = {
  json: (data: any, status = 200) => {
    console.log(`\n📤 Response (${status}):`);
    console.log(JSON.stringify(data, null, 2));
    return data;
  },
};

// Mock log functions
const mockLog = (...args: any[]) => {
  console.log('📋 LOG:', ...args);
};

const mockError = (...args: any[]) => {
  console.error('❌ ERROR:', ...args);
};

// Execute the function
async function runTest() {
  console.log('🧪 Testing Credit Card Bills Function\n');
  console.log('📥 Mock Request:');
  console.log(JSON.stringify(JSON.parse(mockRequest.bodyRaw), null, 2));
  console.log('\n⚙️  Executing function...\n');

  try {
    await creditCardBillsFunction({
      req: mockRequest,
      res: mockResponse,
      log: mockLog,
      error: mockError,
    });

    console.log('\n✅ Test completed successfully!');
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  }
}

// Run the test
runTest();
