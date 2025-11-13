/**
 * Transaction Mapper Tests
 *
 * Unit tests for transaction mapping, validation, and category assignment
 */
import { TransactionMapper } from '../lib/services/mappers/transaction.mapper';
import { ImportError, ImportErrorCode, ParsedTransaction } from '../lib/types';

// ============================================
// Test Setup
// ============================================

const mapper = new TransactionMapper();
const TEST_ACCOUNT_ID = 'test-account-123';
const TEST_USER_ID = 'test-user-456';

// ============================================
// Helper Functions
// ============================================

function createValidParsedTransaction(overrides?: Partial<ParsedTransaction>): ParsedTransaction {
  return {
    id: 'temp-id-123',
    date: '2025-11-06',
    amount: 100.5,
    type: 'expense',
    description: 'Test Transaction',
    ...overrides,
  };
}

// ============================================
// Tests
// ============================================

async function testMapToDto() {
  console.log('\n🧪 Testing mapToDto method...');

  const parsed = createValidParsedTransaction();
  const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);

  // Verify DTO structure
  console.assert(dto.amount === 100.5, '❌ Amount should be preserved');
  console.assert(dto.type === 'expense', '❌ Type should be preserved');
  console.assert(dto.date === '2025-11-06', '❌ Date should be preserved');
  console.assert(dto.description === 'Test Transaction', '❌ Description should be preserved');
  console.assert(dto.account_id === TEST_ACCOUNT_ID, '❌ Account ID should be set');
  console.assert(dto.currency === 'BRL', '❌ Currency should default to BRL');
  console.assert(Array.isArray(dto.tags) && dto.tags.includes('imported'), '❌ Should have imported tag');
  console.assert(dto.category !== undefined, '❌ Category should be assigned');

  console.log('✅ mapToDto creates valid DTO');
}

async function testMapToDtoWithNegativeAmount() {
  console.log('\n🧪 Testing mapToDto with negative amount...');

  const parsed = createValidParsedTransaction({ amount: -50.25 });
  const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);

  console.assert(dto.amount === 50.25, '❌ Negative amount should be converted to positive');
  console.log('✅ Negative amounts converted to absolute value');
}

async function testMapToDtoWithCategory() {
  console.log('\n🧪 Testing mapToDto with pre-assigned category...');

  const parsed = createValidParsedTransaction({ category: 'food' });
  const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);

  console.assert(dto.category === 'food', '❌ Pre-assigned category should be preserved');
  console.log('✅ Pre-assigned category preserved');
}

async function testValidationSuccess() {
  console.log('\n🧪 Testing validation with valid transaction...');

  const parsed = createValidParsedTransaction();

  try {
    mapper.validate(parsed);
    console.log('✅ Valid transaction passes validation');
  } catch (error) {
    console.error('❌ Valid transaction should not throw error');
    throw error;
  }
}

async function testValidationInvalidDate() {
  console.log('\n🧪 Testing validation with invalid date...');

  // Test missing date
  try {
    const parsed = createValidParsedTransaction({ date: '' });
    mapper.validate(parsed);
    console.error('❌ Should throw error for missing date');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.INVALID_DATE_FORMAT,
      '❌ Should have INVALID_DATE_FORMAT error code',
    );
    console.log('✅ Throws error for missing date');
  }

  // Test invalid date format
  try {
    const parsed = createValidParsedTransaction({ date: 'invalid-date' });
    mapper.validate(parsed);
    console.error('❌ Should throw error for invalid date format');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.INVALID_DATE_FORMAT,
      '❌ Should have INVALID_DATE_FORMAT error code',
    );
    console.log('✅ Throws error for invalid date format');
  }
}

async function testValidationInvalidAmount() {
  console.log('\n🧪 Testing validation with invalid amount...');

  // Test NaN amount
  try {
    const parsed = createValidParsedTransaction({ amount: NaN });
    mapper.validate(parsed);
    console.error('❌ Should throw error for NaN amount');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.INVALID_AMOUNT_FORMAT,
      '❌ Should have INVALID_AMOUNT_FORMAT error code',
    );
    console.log('✅ Throws error for NaN amount');
  }

  // Test non-number amount
  try {
    const parsed = createValidParsedTransaction({ amount: 'not-a-number' as any });
    mapper.validate(parsed);
    console.error('❌ Should throw error for non-number amount');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.INVALID_AMOUNT_FORMAT,
      '❌ Should have INVALID_AMOUNT_FORMAT error code',
    );
    console.log('✅ Throws error for non-number amount');
  }
}

async function testValidationMissingDescription() {
  console.log('\n🧪 Testing validation with missing description...');

  // Test empty description
  try {
    const parsed = createValidParsedTransaction({ description: '' });
    mapper.validate(parsed);
    console.error('❌ Should throw error for empty description');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.VALIDATION_ERROR,
      '❌ Should have VALIDATION_ERROR error code',
    );
    console.log('✅ Throws error for empty description');
  }

  // Test whitespace-only description
  try {
    const parsed = createValidParsedTransaction({ description: '   ' });
    mapper.validate(parsed);
    console.error('❌ Should throw error for whitespace-only description');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.log('✅ Throws error for whitespace-only description');
  }
}

async function testValidationInvalidType() {
  console.log('\n🧪 Testing validation with invalid type...');

  try {
    const parsed = createValidParsedTransaction({ type: 'invalid' as any });
    mapper.validate(parsed);
    console.error('❌ Should throw error for invalid type');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.VALIDATION_ERROR,
      '❌ Should have VALIDATION_ERROR error code',
    );
    console.log('✅ Throws error for invalid type');
  }
}

async function testZeroAmountFiltering() {
  console.log('\n🧪 Testing zero amount filtering...');

  try {
    const parsed = createValidParsedTransaction({ amount: 0 });
    mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.error('❌ Should throw error for zero amount');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.VALIDATION_ERROR,
      '❌ Should have VALIDATION_ERROR error code',
    );
    console.log('✅ Throws error for zero amount transaction');
  }
}

async function testCategoryAssignmentPix() {
  console.log('\n🧪 Testing category assignment for Pix transactions...');

  // Pix received (income)
  const pixReceived = createValidParsedTransaction({
    description: 'Transferência Recebida - Pix',
    type: 'income',
  });
  const pixReceivedDto = mapper.mapToDto(pixReceived, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(pixReceivedDto.category === 'other_income', '❌ Pix received should be other_income');
  console.log('✅ Pix received categorized as other_income');

  // Pix sent (transfer)
  const pixSent = createValidParsedTransaction({
    description: 'Transferência enviada pelo Pix',
    type: 'expense',
  });
  const pixSentDto = mapper.mapToDto(pixSent, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(pixSentDto.category === 'transfer', '❌ Pix sent should be transfer');
  console.log('✅ Pix sent categorized as transfer');
}

async function testCategoryAssignmentUtilities() {
  console.log('\n🧪 Testing category assignment for utilities...');

  const testCases = [
    { description: 'Pagamento de boleto - Conta de luz', expected: 'utilities' },
    { description: 'CELESC - Energia elétrica', expected: 'utilities' },
    { description: 'Conta de água', expected: 'utilities' },
    { description: 'Conta de gás', expected: 'utilities' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Utilities categorized correctly');
}

async function testCategoryAssignmentInternetPhone() {
  console.log('\n🧪 Testing category assignment for internet and phone...');

  // Internet
  const internet = createValidParsedTransaction({ description: 'Internet banda larga' });
  const internetDto = mapper.mapToDto(internet, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(internetDto.category === 'internet', '❌ Internet should be internet category');
  console.log('✅ Internet categorized correctly');

  // Phone
  const phone = createValidParsedTransaction({ description: 'Conta de celular Vivo' });
  const phoneDto = mapper.mapToDto(phone, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(phoneDto.category === 'phone', '❌ Phone should be phone category');
  console.log('✅ Phone categorized correctly');
}

async function testCategoryAssignmentTransportation() {
  console.log('\n🧪 Testing category assignment for transportation...');

  const testCases = [
    { description: 'Uber - Viagem', expected: 'transport' },
    { description: '99 Taxi', expected: 'transport' },
    { description: 'Posto de gasolina', expected: 'transport' },
    { description: 'Transporte público', expected: 'transport' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Transportation categorized correctly');
}

async function testCategoryAssignmentFood() {
  console.log('\n🧪 Testing category assignment for food...');

  const testCases = [
    { description: 'Restaurante Italiano', expected: 'food' },
    { description: 'iFood - Delivery', expected: 'food' },
    { description: 'Rappi - Lanche', expected: 'food' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Food categorized correctly');
}

async function testCategoryAssignmentCoffee() {
  console.log('\n🧪 Testing category assignment for coffee...');

  const testCases = [
    { description: 'Starbucks', expected: 'coffee' },
    { description: 'Padaria - Café da manhã', expected: 'coffee' },
    { description: 'Coffee shop', expected: 'coffee' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Coffee categorized correctly');
}

async function testCategoryAssignmentGroceries() {
  console.log('\n🧪 Testing category assignment for groceries...');

  const testCases = [
    { description: 'Supermercado Carrefour', expected: 'groceries' },
    { description: 'Pão de Açúcar', expected: 'groceries' },
    { description: 'Extra Hipermercado', expected: 'groceries' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Groceries categorized correctly');
}

async function testCategoryAssignmentShopping() {
  console.log('\n🧪 Testing category assignment for shopping...');

  const testCases = [
    { description: 'Magazine Luiza', expected: 'shopping' },
    { description: 'Amazon - Compra online', expected: 'shopping' },
    { description: 'Loja de roupas', expected: 'shopping' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Shopping categorized correctly');
}

async function testCategoryAssignmentHealth() {
  console.log('\n🧪 Testing category assignment for health...');

  const testCases = [
    { description: 'Farmácia Drogasil', expected: 'health' },
    { description: 'Consulta médica', expected: 'health' },
    { description: 'Hospital', expected: 'health' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Health categorized correctly');
}

async function testCategoryAssignmentEntertainment() {
  console.log('\n🧪 Testing category assignment for entertainment...');

  const testCases = [
    { description: 'Netflix', expected: 'entertainment' },
    { description: 'Spotify Premium', expected: 'entertainment' },
    { description: 'Ingresso de cinema', expected: 'entertainment' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Entertainment categorized correctly');
}

async function testCategoryAssignmentIncome() {
  console.log('\n🧪 Testing category assignment for income...');

  const testCases = [
    { description: 'Salário mensal', type: 'income' as const, expected: 'salary' },
    { description: 'Pagamento freelance', type: 'income' as const, expected: 'freelance' },
    { description: 'Dividendos investimento', type: 'income' as const, expected: 'investment' },
    { description: 'Bônus anual', type: 'income' as const, expected: 'bonus' },
    { description: 'Reembolso de despesas', type: 'income' as const, expected: 'refund' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description, type: testCase.type });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Income categories assigned correctly');
}

async function testCategoryAssignmentDefault() {
  console.log('\n🧪 Testing default category assignment...');

  // Default expense category
  const unknownExpense = createValidParsedTransaction({
    description: 'Unknown expense transaction',
    type: 'expense',
  });
  const expenseDto = mapper.mapToDto(unknownExpense, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(expenseDto.category === 'other_expense', '❌ Unknown expense should be other_expense');
  console.log('✅ Default expense category assigned');

  // Default income category
  const unknownIncome = createValidParsedTransaction({
    description: 'Unknown income transaction',
    type: 'income',
  });
  const incomeDto = mapper.mapToDto(unknownIncome, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(incomeDto.category === 'other_income', '❌ Unknown income should be other_income');
  console.log('✅ Default income category assigned');
}

async function testCategoryAssignmentCaseInsensitive() {
  console.log('\n🧪 Testing case-insensitive category assignment...');

  const testCases = [
    { description: 'UBER - VIAGEM', expected: 'transport' },
    { description: 'netflix', expected: 'entertainment' },
    { description: 'BoLeTO', expected: 'utilities' },
  ];

  for (const testCase of testCases) {
    const parsed = createValidParsedTransaction({ description: testCase.description });
    const dto = mapper.mapToDto(parsed, TEST_ACCOUNT_ID, TEST_USER_ID);
    console.assert(dto.category === testCase.expected, `❌ "${testCase.description}" should be ${testCase.expected}`);
  }

  console.log('✅ Case-insensitive category assignment works');
}

async function testEdgeCases() {
  console.log('\n🧪 Testing edge cases...');

  // Very large amount
  const largeAmount = createValidParsedTransaction({ amount: 999999999.99 });
  const largeDto = mapper.mapToDto(largeAmount, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(largeDto.amount === 999999999.99, '❌ Should handle very large amounts');
  console.log('✅ Large amounts handled correctly');

  // Very small amount
  const smallAmount = createValidParsedTransaction({ amount: 0.01 });
  const smallDto = mapper.mapToDto(smallAmount, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(smallDto.amount === 0.01, '❌ Should handle very small amounts');
  console.log('✅ Small amounts handled correctly');

  // Very long description
  const longDescription = 'A'.repeat(500);
  const longDesc = createValidParsedTransaction({ description: longDescription });
  const longDto = mapper.mapToDto(longDesc, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(longDto.description === longDescription, '❌ Should handle long descriptions');
  console.log('✅ Long descriptions handled correctly');

  // Special characters in description
  const specialChars = createValidParsedTransaction({
    description: 'Transaction with ç ã õ é "quotes" & symbols',
  });
  const specialDto = mapper.mapToDto(specialChars, TEST_ACCOUNT_ID, TEST_USER_ID);
  console.assert(specialDto.description.includes('ç'), '❌ Should preserve special characters');
  console.log('✅ Special characters preserved');
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  console.log('🚀 Starting Transaction Mapper Tests...\n');
  console.log('='.repeat(60));

  try {
    await testMapToDto();
    await testMapToDtoWithNegativeAmount();
    await testMapToDtoWithCategory();
    await testValidationSuccess();
    await testValidationInvalidDate();
    await testValidationInvalidAmount();
    await testValidationMissingDescription();
    await testValidationInvalidType();
    await testZeroAmountFiltering();
    await testCategoryAssignmentPix();
    await testCategoryAssignmentUtilities();
    await testCategoryAssignmentInternetPhone();
    await testCategoryAssignmentTransportation();
    await testCategoryAssignmentFood();
    await testCategoryAssignmentCoffee();
    await testCategoryAssignmentGroceries();
    await testCategoryAssignmentShopping();
    await testCategoryAssignmentHealth();
    await testCategoryAssignmentEntertainment();
    await testCategoryAssignmentIncome();
    await testCategoryAssignmentDefault();
    await testCategoryAssignmentCaseInsensitive();
    await testEdgeCases();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Transaction Mapper tests passed!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Tests failed:', error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests };
