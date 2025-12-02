// ============================================
// Import Services
// ============================================
import { CacheManager } from '../lib/services/nfe-crawler/cache-manager';
import {
  AIParseError,
  HTMLFetchError,
  InvoiceKeyNotFoundError,
  ValidationError,
} from '../lib/services/nfe-crawler/errors';
import type { AIParseResponse } from '../lib/services/nfe-crawler/types';
import { ValidatorService } from '../lib/services/nfe-crawler/validator.service';
import { WebCrawlerService } from '../lib/services/nfe-crawler/web-crawler.service';

// Check if AI API key is available for AI-dependent tests
const hasAIKey = !!(process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);

/**
 * NFe Web Crawler with AI Extraction - Integration Tests
 *
 * Comprehensive integration tests covering:
 * - Complete flow with sample HTML from different portals
 * - Error scenarios (network failures, invalid HTML, AI errors)
 * - Cache hit/miss scenarios
 * - Validation with valid and invalid data
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
      if (details instanceof Error) {
        console.log('   Error:', details.message);
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

// ============================================
// Sample HTML Data from Different Portals
// ============================================

const SANTA_CATARINA_HTML = `
<!DOCTYPE html>
<html>
<head><title>NFC-e</title></head>
<body>
  <div class="txtTopo">SUPERMERCADO EXEMPLO LTDA</div>
  <div class="text">CNPJ: 12.345.678/0001-90</div>
  <div class="text">Rua das Flores, 123 - Centro</div>
  <div class="text">Florianopolis - SC</div>
  <div class="text">
    <span class="chave">1234 5678 9012 3456 7890 1234 5678 9012 3456 7890 1234</span>
  </div>
  <div class="text">Número: 123456 Série: 1</div>
  <div class="text">Emissão: 03/11/2025 10:30:00</div>
  <table id="tabResult">
    <tr id="Item + 1">
      <td><span class="txtTit">ARROZ BRANCO TIPO 1 5KG</span></td>
      <td><span class="RUN">Qtd: 1</span></td>
      <td><span class="valor">R$ 25,90</span></td>
    </tr>
    <tr id="Item + 2">
      <td><span class="txtTit">FEIJAO PRETO 1KG</span></td>
      <td><span class="RUN">Qtd: 2</span></td>
      <td><span class="valor">R$ 15,00</span></td>
    </tr>
  </table>
  <div class="text">Valor total R$: 40,90</div>
</body>
</html>
`;

const RIO_GRANDE_SUL_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div id="conteudo">
    <h3>FARMACIA SAUDE LTDA</h3>
    <p>CNPJ: 98765432000110</p>
    <p>Av Principal, 456 - Bairro Centro</p>
    <p>Porto Alegre - RS</p>
    <p>Chave de Acesso: 43251109477652000019012345678901234567890123</p>
    <p>NF-e: 789012 Serie: 2</p>
    <p>Data de Emissão: 05/11/2025</p>
    <table class="produtos">
      <tr>
        <td>DIPIRONA 500MG 10 COMPRIMIDOS</td>
        <td>Qtd: 2</td>
        <td>Unit: R$ 8,50</td>
        <td>Total: R$ 17,00</td>
      </tr>
      <tr>
        <td>PARACETAMOL 750MG 20 COMPRIMIDOS</td>
        <td>Qtd: 1</td>
        <td>Unit: R$ 12,30</td>
        <td>Total: R$ 12,30</td>
      </tr>
    </table>
    <p>Total: R$ 29,30</p>
  </div>
</body>
</html>
`;

const SAO_PAULO_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div class="header">
    <h2>LOJA DE ROUPAS FASHION</h2>
    <p>Nome Fantasia: Fashion Store</p>
    <p>CNPJ: 11.222.333/0001-44</p>
    <p>Rua das Flores, 123 - Centro - São Paulo - SP</p>
  </div>
  <div class="invoice-info">
    <p>Nota Fiscal: 555666</p>
    <p>Serie: 1</p>
    <p>Data de Emissao: 10/11/2025</p>
    <p>Chave: 35251109477652000019012345678901234567890124</p>
  </div>
  <table class="items">
    <tr>
      <td>CAMISETA BASICA</td>
      <td>Codigo: 1001</td>
      <td>R$ 49,90</td>
    </tr>
    <tr>
      <td>CALCA JEANS</td>
      <td>Codigo: 2002</td>
      <td>R$ 129,90</td>
    </tr>
  </table>
  <div class="totals">
    <p>Subtotal: R$ 179,80</p>
    <p>Desconto: R$ 17,98</p>
    <p>Total: R$ 161,82</p>
  </div>
</body>
</html>
`;

const INVALID_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div>This is not a valid invoice page</div>
  <p>No invoice data here</p>
</body>
</html>
`;

const MALFORMED_HTML = `
<html>
<body>
  <div>SOME STORE
  <p>Missing closing tags
  <table>
    <tr><td>Item
</html>
`;

// ============================================
// Test Group 1: Web Crawler Service Tests
// ============================================

async function testWebCrawlerService() {
  console.log('\n📝 Test Group: Web Crawler Service');

  const crawler = new WebCrawlerService();

  // Test 1: Extract invoice key from Santa Catarina HTML
  try {
    const key = crawler.extractKeyFromHtml(SANTA_CATARINA_HTML);
    assert(key !== null, 'Should extract key from Santa Catarina HTML');
    assert(key!.length === 44, 'Key should be 44 digits');
    assert(key === '12345678901234567890123456789012345678901234', 'Key should match expected value');
    logTest('Extract invoice key from Santa Catarina HTML', true);
  } catch (error) {
    logTest('Extract invoice key from Santa Catarina HTML', false, error);
  }

  // Test 2: Extract invoice key from Rio Grande do Sul HTML
  try {
    const key = crawler.extractKeyFromHtml(RIO_GRANDE_SUL_HTML);
    assert(key !== null, 'Should extract key from Rio Grande do Sul HTML');
    assert(key!.length === 44, 'Key should be 44 digits');
    assert(key === '43251109477652000019012345678901234567890123', 'Key should match expected value');
    logTest('Extract invoice key from Rio Grande do Sul HTML', true);
  } catch (error) {
    logTest('Extract invoice key from Rio Grande do Sul HTML', false, error);
  }

  // Test 3: Extract invoice key from São Paulo HTML
  try {
    const key = crawler.extractKeyFromHtml(SAO_PAULO_HTML);
    assert(key !== null, 'Should extract key from São Paulo HTML');
    assert(key!.length === 44, 'Key should be 44 digits');
    assert(key === '35251109477652000019012345678901234567890124', 'Key should match expected value');
    logTest('Extract invoice key from São Paulo HTML', true);
  } catch (error) {
    logTest('Extract invoice key from São Paulo HTML', false, error);
  }

  // Test 4: Handle HTML without invoice key
  try {
    const key = crawler.extractKeyFromHtml(INVALID_HTML);
    assert(key === null, 'Should return null for HTML without invoice key');
    logTest('Handle HTML without invoice key', true);
  } catch (error) {
    logTest('Handle HTML without invoice key', false, error);
  }

  // Test 5: Handle malformed HTML
  try {
    const key = crawler.extractKeyFromHtml(MALFORMED_HTML);
    assert(key === null, 'Should return null for malformed HTML');
    logTest('Handle malformed HTML', true);
  } catch (error) {
    logTest('Handle malformed HTML', false, error);
  }

  // Test 6: Validate government portal URLs
  try {
    const validUrl = 'https://sat.sef.sc.gov.br/nfce/consulta?p=12345';
    const invalidUrl = 'https://example.com/invoice';

    assert(crawler.isGovernmentPortalUrl(validUrl) === true, 'Should validate government portal URL');
    assert(crawler.isGovernmentPortalUrl(invalidUrl) === false, 'Should reject non-government URL');
    logTest('Validate government portal URLs', true);
  } catch (error) {
    logTest('Validate government portal URLs', false, error);
  }

  // Test 7: Construct URL from invoice key
  try {
    const key = '42251109477652000019012345678901234567890123';
    const url = crawler.constructUrlFromKey(key);

    assert(url.includes(key), 'URL should contain invoice key');
    assert(url.startsWith('https://'), 'URL should use HTTPS');
    logTest('Construct URL from invoice key', true);
  } catch (error) {
    logTest('Construct URL from invoice key', false, error);
  }
}

// ============================================
// Test Group 2: AI Parser Service Tests
// ============================================

async function testAIParserService() {
  console.log('\n📝 Test Group: AI Parser Service');

  if (!hasAIKey) {
    console.log('⚠️  Skipping AI Parser tests (no API key configured)');
    return;
  }

  // Dynamically import AIParserService only when API key is available
  const { AIParserService } = await import('../lib/services/nfe-crawler/ai-parser.service');
  const parser = new AIParserService();

  // Test 1: Build metadata prompt
  try {
    const prompt = parser.buildMetadataPrompt(SANTA_CATARINA_HTML);

    assert(prompt.length > 0, 'Prompt should not be empty');
    assert(prompt.includes('You are an expert'), 'Prompt should include static instructions');

    logTest('Build metadata prompt', true);
  } catch (error) {
    logTest('Build metadata prompt', false, error);
  }

  // Test 2: Build items batch prompt
  try {
    const batch = [{ rawDescription: 'Item 1', rawPrice: '10.00' }];
    const prompt = parser.buildItemsBatchPrompt(batch);

    assert(prompt.includes('Item 1'), 'Prompt should include item data');
    assert(prompt.includes('REQUIRED OUTPUT FORMAT'), 'Prompt should include output format');

    logTest('Build items batch prompt', true);
  } catch (error) {
    logTest('Build items batch prompt', false, error);
  }

  // Test 3: Validate AI response structure
  try {
    const validResponse: AIParseResponse = {
      merchant: {
        cnpj: '12345678000190',
        name: 'TEST STORE',
        tradeName: null,
        address: 'Test Address',
        city: 'Test City',
        state: 'SC',
      },
      invoice: {
        number: '123456',
        series: '1',
        issueDate: '2025-11-03',
      },
      items: [
        {
          description: 'TEST ITEM',
          productCode: null,
          quantity: 1,
          unitPrice: 10.0,
          totalPrice: 10.0,
          discountAmount: 0,
        },
      ],
      totals: {
        subtotal: 10.0,
        discount: 0,
        tax: 0,
        total: 10.0,
      },
    };

    const isValid = parser.validateAIResponse(validResponse);
    assert(isValid === true, 'Should validate correct AI response structure');

    logTest('Validate AI response structure', true);
  } catch (error) {
    logTest('Validate AI response structure', false, error);
  }

  // Test 4: Reject invalid AI response (missing required fields)
  try {
    const invalidResponse = {
      merchant: {
        name: 'TEST STORE',
        // Missing cnpj
      },
      invoice: {
        number: '123456',
        // Missing series and issueDate
      },
      items: [],
      totals: {
        total: 10.0,
      },
    };

    const isValid = parser.validateAIResponse(invalidResponse);
    assert(isValid === false, 'Should reject invalid AI response');

    logTest('Reject invalid AI response structure', true);
  } catch (error) {
    logTest('Reject invalid AI response structure', false, error);
  }

  // Test 5: Reject response with empty items array
  try {
    const responseWithNoItems = {
      merchant: {
        cnpj: '12345678000190',
        name: 'TEST STORE',
        address: '',
        city: '',
        state: '',
      },
      invoice: {
        number: '123456',
        series: '1',
        issueDate: '2025-11-03',
      },
      items: [], // Empty items
      totals: {
        total: 0,
      },
    };

    const isValid = parser.validateAIResponse(responseWithNoItems);
    assert(isValid === false, 'Should reject response with no items');

    logTest('Reject AI response with empty items', true);
  } catch (error) {
    logTest('Reject AI response with empty items', false, error);
  }
}

// ============================================
// Test Group 3: Validator Service Tests
// ============================================

async function testValidatorService() {
  console.log('\n📝 Test Group: Validator Service');

  const validator = new ValidatorService();

  // Test 1: Validate correct invoice data
  try {
    const validData: AIParseResponse = {
      merchant: {
        cnpj: '12345678000190',
        name: 'SUPERMERCADO EXEMPLO LTDA',
        tradeName: null,
        address: 'Rua das Flores, 123',
        city: 'Florianopolis',
        state: 'SC',
      },
      invoice: {
        number: '123456',
        series: '1',
        issueDate: '2025-11-03',
      },
      items: [
        {
          description: 'ARROZ BRANCO 5KG',
          productCode: null,
          quantity: 1,
          unitPrice: 25.9,
          totalPrice: 25.9,
          discountAmount: 0,
        },
      ],
      totals: {
        subtotal: 25.9,
        discount: 0,
        tax: 0,
        total: 25.9,
      },
    };

    const result = validator.validate(validData);
    assert(result.isValid === true, 'Should validate correct data');
    assert(result.errors.length === 0, 'Should have no errors');

    logTest('Validate correct invoice data', true);
  } catch (error) {
    logTest('Validate correct invoice data', false, error);
  }

  // Test 2: Detect invalid CNPJ
  try {
    const invalidCNPJ: AIParseResponse = {
      merchant: {
        cnpj: '123', // Invalid CNPJ
        name: 'TEST STORE',
        tradeName: null,
        address: '',
        city: '',
        state: '',
      },
      invoice: {
        number: '123456',
        series: '1',
        issueDate: '2025-11-03',
      },
      items: [
        {
          description: 'TEST ITEM',
          productCode: null,
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
          discountAmount: 0,
        },
      ],
      totals: {
        subtotal: 10,
        discount: 0,
        tax: 0,
        total: 10,
      },
    };

    const result = validator.validate(invalidCNPJ);
    assert(result.isValid === false, 'Should detect invalid CNPJ');
    assert(
      result.errors.some((e) => e.includes('CNPJ')),
      'Should have CNPJ error',
    );

    logTest('Detect invalid CNPJ format', true);
  } catch (error) {
    logTest('Detect invalid CNPJ format', false, error);
  }

  // Test 3: Detect invalid date format
  try {
    const invalidDate: AIParseResponse = {
      merchant: {
        cnpj: '12345678000190',
        name: 'TEST STORE',
        tradeName: null,
        address: '',
        city: '',
        state: '',
      },
      invoice: {
        number: '123456',
        series: '1',
        issueDate: '03/11/2025', // Wrong format
      },
      items: [
        {
          description: 'TEST ITEM',
          productCode: null,
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
          discountAmount: 0,
        },
      ],
      totals: {
        subtotal: 10,
        discount: 0,
        tax: 0,
        total: 10,
      },
    };

    const result = validator.validate(invalidDate);
    assert(result.isValid === false, 'Should detect invalid date format');
    assert(
      result.errors.some((e) => e.includes('date')),
      'Should have date error',
    );

    logTest('Detect invalid date format', true);
  } catch (error) {
    logTest('Detect invalid date format', false, error);
  }

  // Test 4: Detect totals mismatch
  try {
    const mismatchedTotals: AIParseResponse = {
      merchant: {
        cnpj: '12345678000190',
        name: 'TEST STORE',
        tradeName: null,
        address: '',
        city: '',
        state: '',
      },
      invoice: {
        number: '123456',
        series: '1',
        issueDate: '2025-11-03',
      },
      items: [
        {
          description: 'ITEM 1',
          productCode: null,
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
          discountAmount: 0,
        },
        {
          description: 'ITEM 2',
          productCode: null,
          quantity: 1,
          unitPrice: 20,
          totalPrice: 20,
          discountAmount: 0,
        },
      ],
      totals: {
        subtotal: 30,
        discount: 0,
        tax: 0,
        total: 50, // Wrong total
      },
    };

    const result = validator.validate(mismatchedTotals);
    assert(result.isValid === false, 'Should detect totals mismatch');
    assert(
      result.errors.some((e) => e.toLowerCase().includes('total')),
      'Should have total error',
    );

    logTest('Detect totals mismatch', true);
  } catch (error) {
    logTest('Detect totals mismatch', false, error);
  }

  // Test 5: Normalize currency values
  try {
    assert(validator.normalizeCurrency('R$ 25,90') === 25.9, 'Should normalize Brazilian currency');
    assert(validator.normalizeCurrency('1.234,56') === 1234.56, 'Should handle thousand separators');
    assert(validator.normalizeCurrency('1,234.56') === 1234.56, 'Should handle US format');
    assert(validator.normalizeCurrency(100) === 100, 'Should handle numeric input');

    logTest('Normalize currency values', true);
  } catch (error) {
    logTest('Normalize currency values', false, error);
  }

  // Test 6: Validate and normalize CNPJ
  try {
    assert(validator.validateCNPJ('12345678000190') === true, 'Should validate correct CNPJ');
    assert(validator.validateCNPJ('12.345.678/0001-90') === true, 'Should validate formatted CNPJ');
    assert(validator.validateCNPJ('123') === false, 'Should reject short CNPJ');

    assert(validator.normalizeCNPJ('12.345.678/0001-90') === '12345678000190', 'Should normalize CNPJ');

    logTest('Validate and normalize CNPJ', true);
  } catch (error) {
    logTest('Validate and normalize CNPJ', false, error);
  }

  // Test 7: Validate and normalize dates
  try {
    assert(validator.validateDate('2025-11-03') === true, 'Should validate ISO date');
    assert(validator.validateDate('03/11/2025') === false, 'Should reject Brazilian format');
    assert(validator.validateDate('invalid') === false, 'Should reject invalid date');

    assert(validator.normalizeDate('03/11/2025') === '2025-11-03', 'Should normalize Brazilian date');
    assert(validator.normalizeDate('2025-11-03') === '2025-11-03', 'Should keep ISO date');

    logTest('Validate and normalize dates', true);
  } catch (error) {
    logTest('Validate and normalize dates', false, error);
  }

  // Test 8: Verify totals calculation
  try {
    const items = [{ totalPrice: 10.0 }, { totalPrice: 20.0 }, { totalPrice: 15.5 }];
    const totals = {
      subtotal: 45.5,
      discount: 5.0,
      total: 40.5,
    };

    const isValid = validator.verifyTotals(items, totals);
    assert(isValid === true, 'Should verify correct totals');

    logTest('Verify totals calculation', true);
  } catch (error) {
    logTest('Verify totals calculation', false, error);
  }
}

// ============================================
// Test Group 4: Cache Manager Tests
// ============================================

async function testCacheManager() {
  console.log('\n📝 Test Group: Cache Manager');

  const cache = new CacheManager(10, 1000); // Small cache for testing

  // Test 1: Set and get cached data
  try {
    const testData = { test: 'data', value: 123 };
    cache.set('test-key', testData);

    const retrieved = cache.get('test-key');
    assert(retrieved !== null, 'Should retrieve cached data');
    assert(JSON.stringify(retrieved) === JSON.stringify(testData), 'Retrieved data should match');

    logTest('Set and get cached data', true);
  } catch (error) {
    logTest('Set and get cached data', false, error);
  }

  // Test 2: Cache miss for non-existent key
  try {
    const result = cache.get('non-existent-key');
    assert(result === null, 'Should return null for cache miss');

    logTest('Handle cache miss', true);
  } catch (error) {
    logTest('Handle cache miss', false, error);
  }

  // Test 3: Check cache existence
  try {
    cache.set('exists-key', { data: 'test' });

    assert(cache.has('exists-key') === true, 'Should return true for existing key');
    assert(cache.has('missing-key') === false, 'Should return false for missing key');

    logTest('Check cache key existence', true);
  } catch (error) {
    logTest('Check cache key existence', false, error);
  }

  // Test 4: Clear cache entry
  try {
    cache.set('clear-key', { data: 'test' });
    assert(cache.has('clear-key') === true, 'Key should exist before clear');

    cache.clear('clear-key');
    assert(cache.has('clear-key') === false, 'Key should not exist after clear');

    logTest('Clear cache entry', true);
  } catch (error) {
    logTest('Clear cache entry', false, error);
  }

  // Test 5: Cache statistics
  try {
    cache.clearAll();

    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });

    cache.get('key1'); // Hit
    cache.get('key1'); // Hit
    cache.get('missing'); // Miss

    const stats = cache.getStats();
    assert(stats.size === 2, 'Cache size should be 2');
    assert(stats.hits === 2, 'Should have 2 hits');
    assert(stats.misses === 1, 'Should have 1 miss');
    assert(Math.abs(stats.hitRate - 2 / 3) < 0.001, 'Hit rate should be approx 66.67%');

    logTest('Track cache statistics', true);
  } catch (error) {
    logTest('Track cache statistics', false, error);
  }

  // Test 6: Get data with metadata
  try {
    cache.clearAll();
    cache.set('meta-key', { data: 'test' });

    const result = cache.getWithMetadata('meta-key');
    assert(result.data !== null, 'Should have data');
    assert(result.fromCache === true, 'Should indicate from cache');
    assert(result.cachedAt instanceof Date, 'Should have cached timestamp');

    logTest('Get data with cache metadata', true);
  } catch (error) {
    logTest('Get data with cache metadata', false, error);
  }

  // Test 7: LRU eviction when cache is full
  try {
    cache.clearAll();

    // Fill cache to max size (10 items)
    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, { value: i });
    }

    assert(cache.getStats().size === 10, 'Cache should be at max size');

    // Add one more item, should evict LRU
    cache.set('key10', { value: 10 });

    assert(cache.getStats().size === 10, 'Cache should still be at max size');
    assert(cache.has('key0') === false, 'Oldest key should be evicted');
    assert(cache.has('key10') === true, 'New key should exist');

    logTest('LRU eviction when cache is full', true);
  } catch (error) {
    logTest('LRU eviction when cache is full', false, error);
  }

  // Test 8: TTL expiration
  try {
    cache.clearAll();

    // Set with very short TTL (10ms)
    cache.set('ttl-key', { data: 'test' }, 10);

    // Should exist immediately
    assert(cache.has('ttl-key') === true, 'Key should exist immediately');

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Should be expired
    assert(cache.has('ttl-key') === false, 'Key should be expired after TTL');
    assert(cache.get('ttl-key') === null, 'Should return null for expired key');

    logTest('TTL expiration', true);
  } catch (error) {
    logTest('TTL expiration', false, error);
  }
}

// ============================================
// Test Group 5: Error Handling Tests
// ============================================

async function testErrorHandling() {
  console.log('\n📝 Test Group: Error Handling');

  // Test 1: InvoiceKeyNotFoundError
  try {
    const error = new InvoiceKeyNotFoundError('https://example.com', {
      message: 'Key not found in HTML',
    });

    assert(error.code === 'INVOICE_KEY_NOT_FOUND', 'Should have correct error code');
    // assert(error.details?.url === 'https://example.com', 'Should include URL in details');
    assert(error.message.includes('Could not extract'), 'Should have descriptive message');

    logTest('InvoiceKeyNotFoundError structure', true);
  } catch (error) {
    logTest('InvoiceKeyNotFoundError structure', false, error);
  }

  // Test 2: HTMLFetchError
  try {
    const error = new HTMLFetchError('https://example.com', 'HTTP 404: Not Found', {
      statusCode: 404,
      statusText: 'Not Found',
    });

    assert(error.code === 'HTML_FETCH_ERROR', 'Should have correct error code');
    assert(error.details?.statusCode === 404, 'Should include status code');

    logTest('HTMLFetchError structure', true);
  } catch (error) {
    logTest('HTMLFetchError structure', false, error);
  }

  // Test 3: AIParseError
  try {
    const error = new AIParseError('Failed to parse response', {
      invoiceKey: '12345678901234567890123456789012345678901234',
      originalError: 'JSON parse error',
    });

    assert(error.code === 'AI_PARSE_ERROR', 'Should have correct error code');
    assert(error.details?.invoiceKey !== undefined, 'Should include invoice key');

    logTest('AIParseError structure', true);
  } catch (error) {
    logTest('AIParseError structure', false, error);
  }

  // Test 4: ValidationError
  try {
    const error = new ValidationError(['CNPJ is invalid', 'Date format is wrong']);

    assert(error.code === 'VALIDATION_ERROR', 'Should have correct error code');
    assert(Array.isArray(error.details?.validationErrors), 'Should include validation errors array');
    assert(error.details?.validationErrors?.length === 2, 'Should have 2 validation errors');

    logTest('ValidationError structure', true);
  } catch (error) {
    logTest('ValidationError structure', false, error);
  }
}

// ============================================
// Test Group 6: Integration Flow Tests
// ============================================

async function testIntegrationFlow() {
  console.log('\n📝 Test Group: Integration Flow');

  const crawler = new WebCrawlerService();
  const validator = new ValidatorService();
  const cache = new CacheManager();

  // Conditionally import AI parser if API key is available
  let parser: any = null;
  if (hasAIKey) {
    const { AIParserService } = await import('../lib/services/nfe-crawler/ai-parser.service');
    parser = new AIParserService();
  }

  // Test 1: Complete flow simulation (without actual AI call)
  try {
    // Step 1: Extract invoice key
    const key = crawler.extractKeyFromHtml(SANTA_CATARINA_HTML);
    assert(key !== null, 'Should extract invoice key');

    // Step 2: Build AI prompt (skip if no API key)
    if (parser) {
      const prompt = parser.buildMetadataPrompt(SANTA_CATARINA_HTML);
      assert(prompt.length > 0, 'Should build prompt');
    }

    // Step 3: Simulate AI response
    const mockAIResponse: AIParseResponse = {
      merchant: {
        cnpj: '12345678000190',
        name: 'SUPERMERCADO EXEMPLO LTDA',
        tradeName: null,
        address: 'Rua das Flores, 123 - Centro',
        city: 'Florianopolis',
        state: 'SC',
      },
      invoice: {
        number: '123456',
        series: '1',
        issueDate: '2025-11-03',
      },
      items: [
        {
          description: 'ARROZ BRANCO TIPO 1 5KG',
          productCode: null,
          quantity: 1,
          unitPrice: 25.9,
          totalPrice: 25.9,
          discountAmount: 0,
        },
        {
          description: 'FEIJAO PRETO 1KG',
          productCode: null,
          quantity: 2,
          unitPrice: 7.5,
          totalPrice: 15.0,
          discountAmount: 0,
        },
      ],
      totals: {
        subtotal: 40.9,
        discount: 0,
        tax: 0,
        total: 40.9,
      },
    };

    // Step 4: Validate response
    const validationResult = validator.validate(mockAIResponse);
    assert(validationResult.isValid === true, 'Should validate successfully');

    // Step 5: Cache result
    cache.set(key!, mockAIResponse);
    assert(cache.has(key!) === true, 'Should cache result');

    // Step 6: Retrieve from cache
    const cached = cache.get(key!);
    assert(cached !== null, 'Should retrieve from cache');

    logTest('Complete integration flow simulation', true);
  } catch (error) {
    logTest('Complete integration flow simulation', false, error);
  }

  // Test 2: Cache hit scenario
  try {
    cache.clearAll();

    const key = '42251109477652000019012345678901234567890123';
    const testData = { invoice: 'data' };

    // First request - cache miss
    const firstResult = cache.getWithMetadata(key);
    assert(firstResult.fromCache === false, 'First request should be cache miss');

    // Store in cache
    cache.set(key, testData);

    // Second request - cache hit
    const secondResult = cache.getWithMetadata(key);
    assert(secondResult.fromCache === true, 'Second request should be cache hit');
    assert(secondResult.data !== null, 'Should have cached data');

    logTest('Cache hit scenario', true);
  } catch (error) {
    logTest('Cache hit scenario', false, error);
  }

  // Test 3: Force refresh bypasses cache
  try {
    cache.clearAll();

    const key = '42251109477652000019012345678901234567890123';
    cache.set(key, { old: 'data' });

    // Simulate force refresh by clearing cache
    cache.clear(key);

    const result = cache.get(key);
    assert(result === null, 'Force refresh should bypass cache');

    logTest('Force refresh bypasses cache', true);
  } catch (error) {
    logTest('Force refresh bypasses cache', false, error);
  }

  // Test 4: Handle different portal formats
  try {
    const scKey = crawler.extractKeyFromHtml(SANTA_CATARINA_HTML);
    const rsKey = crawler.extractKeyFromHtml(RIO_GRANDE_SUL_HTML);
    const spKey = crawler.extractKeyFromHtml(SAO_PAULO_HTML);

    assert(scKey !== null, 'Should extract from Santa Catarina');
    assert(rsKey !== null, 'Should extract from Rio Grande do Sul');
    assert(spKey !== null, 'Should extract from São Paulo');

    assert(scKey!.length === 44, 'SC key should be 44 digits');
    assert(rsKey!.length === 44, 'RS key should be 44 digits');
    assert(spKey!.length === 44, 'SP key should be 44 digits');

    logTest('Handle different portal formats', true);
  } catch (error) {
    logTest('Handle different portal formats', false, error);
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🧪 Starting NFe Web Crawler Integration Tests...\n');
  console.log('==================================================');

  try {
    await testWebCrawlerService();
    await testAIParserService();
    await testValidatorService();
    await testCacheManager();
    await testErrorHandling();
    await testIntegrationFlow();
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    testsFailed++;
  }

  console.log('\n==================================================');
  console.log('📊 Test Summary');
  console.log('==================================================');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (testsPassed + testsFailed > 0) {
    console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  }

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
