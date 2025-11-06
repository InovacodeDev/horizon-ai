/**
 * Invoice Input Validation Tests
 *
 * Tests for the validation logic used in the AddInvoiceModal component.
 * These tests verify URL and QR code validation without requiring UI rendering.
 */

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
// Validation Functions (extracted from component)
// ============================================

/**
 * Validates if a string is a valid Brazilian fiscal invoice URL
 */
function validateInvoiceUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'URL não pode estar vazia' };
  }

  // Check if it's a valid URL
  try {
    new URL(url);
  } catch {
    return { valid: false, error: 'URL inválida' };
  }

  // Check if it's from a government portal
  const validDomains = ['sat.sef.sc.gov.br', 'sefaz.rs.gov.br', 'nfe.fazenda.gov.br', 'nfe.fazenda.sp.gov.br'];

  const isValidDomain = validDomains.some((domain) => url.includes(domain));

  if (!isValidDomain) {
    return {
      valid: false,
      error: 'URL deve ser de um portal governamental válido (SEFAZ)',
    };
  }

  return { valid: true };
}

/**
 * Validates if a string is a valid 44-digit invoice access key
 */
function validateInvoiceKey(key: string): { valid: boolean; error?: string } {
  if (!key || key.trim() === '') {
    return { valid: false, error: 'Chave de acesso não pode estar vazia' };
  }

  // Remove any non-digit characters
  const cleanKey = key.replace(/\D/g, '');

  if (cleanKey.length !== 44) {
    return {
      valid: false,
      error: 'Chave de acesso deve ter 44 dígitos',
    };
  }

  return { valid: true };
}

// ============================================
// URL Validation Tests
// ============================================

async function testUrlValidation() {
  console.log('\n📝 Test Group: URL Validation');

  // Test 1: Empty URL should fail
  try {
    const result = validateInvoiceUrl('');
    assert(!result.valid, 'Empty URL should be invalid');
    assert(result.error === 'URL não pode estar vazia', 'Should have correct error message');
    logTest('Empty URL validation', true);
  } catch (error) {
    logTest('Empty URL validation', false, error);
  }

  // Test 2: Invalid URL format should fail
  try {
    const result = validateInvoiceUrl('not-a-url');
    assert(!result.valid, 'Invalid URL format should be invalid');
    assert(result.error === 'URL inválida', 'Should have correct error message');
    logTest('Invalid URL format validation', true);
  } catch (error) {
    logTest('Invalid URL format validation', false, error);
  }

  // Test 3: Valid URL but wrong domain should fail
  try {
    const result = validateInvoiceUrl('https://example.com/invoice');
    assert(!result.valid, 'URL from wrong domain should be invalid');
    assert(
      result.error === 'URL deve ser de um portal governamental válido (SEFAZ)',
      'Should have correct error message',
    );
    logTest('Wrong domain URL validation', true);
  } catch (error) {
    logTest('Wrong domain URL validation', false, error);
  }

  // Test 4: Valid SEFAZ SC URL should pass
  try {
    const result = validateInvoiceUrl('https://sat.sef.sc.gov.br/nfce/consulta?p=12345');
    assert(result.valid, 'Valid SEFAZ SC URL should be valid');
    assert(!result.error, 'Should not have error message');
    logTest('Valid SEFAZ SC URL validation', true);
  } catch (error) {
    logTest('Valid SEFAZ SC URL validation', false, error);
  }

  // Test 5: Valid SEFAZ RS URL should pass
  try {
    const result = validateInvoiceUrl('https://www.sefaz.rs.gov.br/nfe/consulta');
    assert(result.valid, 'Valid SEFAZ RS URL should be valid');
    assert(!result.error, 'Should not have error message');
    logTest('Valid SEFAZ RS URL validation', true);
  } catch (error) {
    logTest('Valid SEFAZ RS URL validation', false, error);
  }

  // Test 6: Valid NFe Fazenda URL should pass
  try {
    const result = validateInvoiceUrl('https://www.nfe.fazenda.gov.br/portal/consulta');
    assert(result.valid, 'Valid NFe Fazenda URL should be valid');
    assert(!result.error, 'Should not have error message');
    logTest('Valid NFe Fazenda URL validation', true);
  } catch (error) {
    logTest('Valid NFe Fazenda URL validation', false, error);
  }

  // Test 7: Valid SEFAZ SP URL should pass
  try {
    const result = validateInvoiceUrl('https://nfe.fazenda.sp.gov.br/consulta');
    assert(result.valid, 'Valid SEFAZ SP URL should be valid');
    assert(!result.error, 'Should not have error message');
    logTest('Valid SEFAZ SP URL validation', true);
  } catch (error) {
    logTest('Valid SEFAZ SP URL validation', false, error);
  }
}

// ============================================
// QR Code / Invoice Key Validation Tests
// ============================================

async function testInvoiceKeyValidation() {
  console.log('\n📝 Test Group: Invoice Key Validation');

  // Test 1: Empty key should fail
  try {
    const result = validateInvoiceKey('');
    assert(!result.valid, 'Empty key should be invalid');
    assert(result.error === 'Chave de acesso não pode estar vazia', 'Should have correct error message');
    logTest('Empty invoice key validation', true);
  } catch (error) {
    logTest('Empty invoice key validation', false, error);
  }

  // Test 2: Key with less than 44 digits should fail
  try {
    const result = validateInvoiceKey('1234567890123456789012345678901234567890123'); // 43 digits
    assert(!result.valid, 'Key with 43 digits should be invalid');
    assert(result.error === 'Chave de acesso deve ter 44 dígitos', 'Should have correct error message');
    logTest('Short invoice key validation', true);
  } catch (error) {
    logTest('Short invoice key validation', false, error);
  }

  // Test 3: Key with more than 44 digits should fail
  try {
    const result = validateInvoiceKey('123456789012345678901234567890123456789012345');
    assert(!result.valid, 'Key with 45 digits should be invalid');
    assert(result.error === 'Chave de acesso deve ter 44 dígitos', 'Should have correct error message');
    logTest('Long invoice key validation', true);
  } catch (error) {
    logTest('Long invoice key validation', false, error);
  }

  // Test 4: Valid 44-digit key should pass
  try {
    const result = validateInvoiceKey('12345678901234567890123456789012345678901234');
    assert(result.valid, 'Valid 44-digit key should be valid');
    assert(!result.error, 'Should not have error message');
    logTest('Valid 44-digit invoice key validation', true);
  } catch (error) {
    logTest('Valid 44-digit invoice key validation', false, error);
  }

  // Test 5: Key with spaces should be cleaned and validated
  try {
    const result = validateInvoiceKey('1234 5678 9012 3456 7890 1234 5678 9012 3456 7890 1234');
    assert(result.valid, 'Key with spaces should be cleaned and validated');
    assert(!result.error, 'Should not have error message');
    logTest('Invoice key with spaces validation', true);
  } catch (error) {
    logTest('Invoice key with spaces validation', false, error);
  }

  // Test 6: Key with hyphens should be cleaned and validated
  try {
    const result = validateInvoiceKey('1234-5678-9012-3456-7890-1234-5678-9012-3456-7890-1234');
    assert(result.valid, 'Key with hyphens should be cleaned and validated');
    assert(!result.error, 'Should not have error message');
    logTest('Invoice key with hyphens validation', true);
  } catch (error) {
    logTest('Invoice key with hyphens validation', false, error);
  }

  // Test 7: Key with letters should fail after cleaning
  try {
    const result = validateInvoiceKey('1234567890123456789012345678901234567890ABCD');
    assert(!result.valid, 'Key with letters should be invalid');
    logTest('Invoice key with letters validation', true);
  } catch (error) {
    logTest('Invoice key with letters validation', false, error);
  }
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Invoice Input Validation Tests\n');
  console.log('='.repeat(60));

  await testUrlValidation();
  await testInvoiceKeyValidation();

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);

  if (testsFailed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
