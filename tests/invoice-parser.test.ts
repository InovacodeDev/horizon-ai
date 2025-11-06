/**
 * Invoice Parser Service Tests
 *
 * Unit tests for invoice parsing, category detection, and product normalization
 */
import {
  InvoiceCategory,
  InvoiceParserService,
  type MerchantInfo,
  type ParsedInvoiceItem,
} from '../lib/services/invoice-parser.service';
import { type NormalizedProduct, ProductNormalizationService } from '../lib/services/product-normalization.service';

// ============================================
// Test Data
// ============================================

const SAMPLE_NFE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc>
  <NFe>
    <infNFe>
      <ide>
        <nNF>123456</nNF>
        <serie>1</serie>
        <dhEmi>2024-01-15T10:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>FARMACIA EXEMPLO LTDA</xNome>
        <xFant>Farmacia Exemplo</xFant>
        <enderEmit>
          <xLgr>Rua das Flores</xLgr>
          <xMun>Florianopolis</xMun>
          <UF>SC</UF>
        </enderEmit>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>001</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>DIPIRONA 500MG 10 COMPRIMIDOS</xProd>
          <NCM>30049099</NCM>
          <qCom>2.0000</qCom>
          <vUnCom>5.50</vUnCom>
          <vProd>11.00</vProd>
          <vDesc>0.00</vDesc>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>002</cProd>
          <cEAN>7891234567891</cEAN>
          <xProd>PARACETAMOL 750MG 20 COMPRIMIDOS</xProd>
          <NCM>30049099</NCM>
          <qCom>1.0000</qCom>
          <vUnCom>8.90</vUnCom>
          <vProd>8.90</vProd>
          <vDesc>0.50</vDesc>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>19.90</vProd>
          <vDesc>0.50</vDesc>
          <vTotTrib>2.50</vTotTrib>
          <vNF>19.40</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

const SAMPLE_SUPERMARKET_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc>
  <NFe>
    <infNFe>
      <ide>
        <nNF>789012</nNF>
        <serie>1</serie>
        <dhEmi>2024-01-20T15:45:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>98765432000100</CNPJ>
        <xNome>SUPERMERCADO BOM PRECO LTDA</xNome>
        <xFant>Supermercado Bom Preco</xFant>
        <enderEmit>
          <xLgr>Av Principal</xLgr>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
        </enderEmit>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>101</cProd>
          <cEAN>7891234560001</cEAN>
          <xProd>ARROZ BRANCO TIPO 1 5KG</xProd>
          <NCM>10063021</NCM>
          <qCom>1.0000</qCom>
          <vUnCom>25.90</vUnCom>
          <vProd>25.90</vProd>
          <vDesc>0.00</vDesc>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>102</cProd>
          <cEAN>7891234560002</cEAN>
          <xProd>FEIJAO PRETO 1KG</xProd>
          <NCM>07133390</NCM>
          <qCom>2.0000</qCom>
          <vUnCom>7.50</vUnCom>
          <vProd>15.00</vProd>
          <vDesc>1.00</vDesc>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>40.90</vProd>
          <vDesc>1.00</vDesc>
          <vTotTrib>3.20</vTotTrib>
          <vNF>39.90</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

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
// Invoice Parser Tests
// ============================================

async function testXmlParsing() {
  console.log('\n📝 Test Group: XML Parsing');

  const parserService = new InvoiceParserService();

  // Test 1: Parse pharmacy invoice
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(SAMPLE_NFE_XML, 'text/xml');
    const items = parserService.extractProducts(xmlDoc);

    assert(items.length === 2, 'Should extract 2 items');
    assert(items[0].description === 'DIPIRONA 500MG 10 COMPRIMIDOS', 'First item description should match');
    assert(items[0].quantity === 2, 'First item quantity should be 2');
    assert(items[0].unitPrice === 5.5, 'First item unit price should be 5.50');
    assert(items[0].totalPrice === 11.0, 'First item total should be 11.00');
    assert(items[0].productCode === '7891234567890', 'First item should have product code');
    assert(items[0].ncmCode === '30049099', 'First item should have NCM code');

    logTest('Parse pharmacy NFe XML', true);
  } catch (error) {
    logTest('Parse pharmacy NFe XML', false, error);
  }

  // Test 2: Parse supermarket invoice
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(SAMPLE_SUPERMARKET_XML, 'text/xml');
    const items = parserService.extractProducts(xmlDoc);

    assert(items.length === 2, 'Should extract 2 items');
    assert(items[0].description === 'ARROZ BRANCO TIPO 1 5KG', 'First item description should match');
    assert(items[1].description === 'FEIJAO PRETO 1KG', 'Second item description should match');
    assert(items[1].discountAmount === 0, 'Second item should have no discount in item level');

    logTest('Parse supermarket NFe XML', true);
  } catch (error) {
    logTest('Parse supermarket NFe XML', false, error);
  }

  // Test 3: Handle malformed XML
  try {
    const parser = new DOMParser();
    const malformedXml = '<invalid>xml<without>closing</tags>';
    const xmlDoc = parser.parseFromString(malformedXml, 'text/xml');

    // Should not throw, but should return empty array
    const items = parserService.extractProducts(xmlDoc);
    assert(items.length === 0, 'Should return empty array for malformed XML');

    logTest('Handle malformed XML gracefully', true);
  } catch (error) {
    logTest('Handle malformed XML gracefully', false, error);
  }
}

async function testCategoryDetection() {
  console.log('\n📝 Test Group: Category Detection');

  const parserService = new InvoiceParserService();

  // Test 1: Detect pharmacy by merchant name
  try {
    const merchant: MerchantInfo = {
      cnpj: '12345678000190',
      name: 'FARMACIA EXEMPLO LTDA',
      tradeName: 'Farmacia Exemplo',
      address: 'Rua das Flores',
      city: 'Florianopolis',
      state: 'SC',
    };

    const category = parserService.identifyMerchantCategory(merchant);
    assert(category === InvoiceCategory.PHARMACY, 'Should detect pharmacy category');

    logTest('Detect pharmacy by merchant name', true);
  } catch (error) {
    logTest('Detect pharmacy by merchant name', false, error);
  }

  // Test 2: Detect supermarket by merchant name
  try {
    const merchant: MerchantInfo = {
      cnpj: '98765432000100',
      name: 'SUPERMERCADO BOM PRECO LTDA',
      tradeName: 'Supermercado Bom Preco',
      address: 'Av Principal',
      city: 'Sao Paulo',
      state: 'SP',
    };

    const category = parserService.identifyMerchantCategory(merchant);
    assert(category === InvoiceCategory.SUPERMARKET, 'Should detect supermarket category');

    logTest('Detect supermarket by merchant name', true);
  } catch (error) {
    logTest('Detect supermarket by merchant name', false, error);
  }

  // Test 3: Detect restaurant by merchant name
  try {
    const merchant: MerchantInfo = {
      cnpj: '11111111000111',
      name: 'RESTAURANTE SABOR CASEIRO',
      address: 'Rua Central',
      city: 'Rio de Janeiro',
      state: 'RJ',
    };

    const category = parserService.identifyMerchantCategory(merchant);
    assert(category === InvoiceCategory.RESTAURANT, 'Should detect restaurant category');

    logTest('Detect restaurant by merchant name', true);
  } catch (error) {
    logTest('Detect restaurant by merchant name', false, error);
  }

  // Test 4: Detect fuel station by merchant name
  try {
    const merchant: MerchantInfo = {
      cnpj: '22222222000122',
      name: 'POSTO DE COMBUSTIVEL ESTRELA',
      address: 'Rodovia BR-101',
      city: 'Curitiba',
      state: 'PR',
    };

    const category = parserService.identifyMerchantCategory(merchant);
    assert(category === InvoiceCategory.FUEL, 'Should detect fuel category');

    logTest('Detect fuel station by merchant name', true);
  } catch (error) {
    logTest('Detect fuel station by merchant name', false, error);
  }

  // Test 5: Detect category by NCM code
  try {
    const merchant: MerchantInfo = {
      cnpj: '33333333000133',
      name: 'LOJA GENERICA',
      address: 'Rua Qualquer',
      city: 'Belo Horizonte',
      state: 'MG',
    };

    const items: ParsedInvoiceItem[] = [
      {
        description: 'PRODUTO MEDICINAL',
        ncmCode: '30049099',
        quantity: 1,
        unitPrice: 10,
        totalPrice: 10,
        discountAmount: 0,
      },
    ];

    const category = parserService.identifyMerchantCategory(merchant, items);
    assert(category === InvoiceCategory.PHARMACY, 'Should detect pharmacy by NCM code');

    logTest('Detect category by NCM code', true);
  } catch (error) {
    logTest('Detect category by NCM code', false, error);
  }

  // Test 6: Fallback to OTHER category
  try {
    const merchant: MerchantInfo = {
      cnpj: '44444444000144',
      name: 'EMPRESA DESCONHECIDA LTDA',
      address: 'Endereco Qualquer',
      city: 'Salvador',
      state: 'BA',
    };

    const category = parserService.identifyMerchantCategory(merchant);
    assert(category === InvoiceCategory.OTHER, 'Should fallback to OTHER category');

    logTest('Fallback to OTHER category', true);
  } catch (error) {
    logTest('Fallback to OTHER category', false, error);
  }
}

async function testProductNormalization() {
  console.log('\n📝 Test Group: Product Normalization');

  const normalizationService = new ProductNormalizationService();

  // Test 1: Normalize product name
  try {
    const normalized = normalizationService.normalizeProductName('COCA-COLA   2L  PET   REFRIG');

    // Should remove extra spaces, special chars, and noise words
    assert(normalized.includes('coca'), 'Should contain coca');
    assert(normalized.includes('cola'), 'Should contain cola');
    assert(!normalized.includes('  '), 'Should not have double spaces');

    logTest('Normalize product name', true);
  } catch (error) {
    logTest('Normalize product name', false, error);
  }

  // Test 2: Match products by EAN code
  try {
    const product1: NormalizedProduct = {
      normalizedName: 'coca cola 2l',
      originalName: 'COCA-COLA 2L PET',
      productCode: '7891234567890',
    };

    const product2: NormalizedProduct = {
      normalizedName: 'coca cola pet 2 litros',
      originalName: 'COCA COLA PET 2 LITROS',
      productCode: '7891234567890',
    };

    const matchResult = normalizationService.matchProducts(product1, product2);
    assert(matchResult.isMatch === true, 'Should match by product code');
    assert(matchResult.confidence === 1.0, 'Should have 100% confidence');

    logTest('Match products by EAN code', true);
  } catch (error) {
    logTest('Match products by EAN code', false, error);
  }

  // Test 3: Match products by similar name
  try {
    const product1: NormalizedProduct = {
      normalizedName: 'arroz branco tipo 1',
      originalName: 'ARROZ BRANCO TIPO 1 5KG',
    };

    const product2: NormalizedProduct = {
      normalizedName: 'arroz branco tipo 1',
      originalName: 'ARROZ BRANCO TIPO 1 1KG',
    };

    const matchResult = normalizationService.matchProducts(product1, product2);
    assert(matchResult.isMatch === true, 'Should match by similar name');
    assert(matchResult.confidence >= 0.75, 'Should have high confidence');

    logTest('Match products by similar name', true);
  } catch (error) {
    logTest('Match products by similar name', false, error);
  }

  // Test 4: Don't match different products
  try {
    const product1: NormalizedProduct = {
      normalizedName: 'arroz branco',
      originalName: 'ARROZ BRANCO 5KG',
    };

    const product2: NormalizedProduct = {
      normalizedName: 'feijao preto',
      originalName: 'FEIJAO PRETO 1KG',
    };

    const matchResult = normalizationService.matchProducts(product1, product2);
    assert(matchResult.isMatch === false, 'Should not match different products');

    logTest("Don't match different products", true);
  } catch (error) {
    logTest("Don't match different products", false, error);
  }

  // Test 5: Handle edge cases
  try {
    const normalized1 = normalizationService.normalizeProductName('');
    assert(normalized1 === '', 'Should handle empty string');

    const normalized2 = normalizationService.normalizeProductName('   ');
    assert(normalized2 === '', 'Should handle whitespace-only string');

    const normalized3 = normalizationService.normalizeProductName('A');
    assert(normalized3 === '', 'Should remove single-character words');

    logTest('Handle edge cases in normalization', true);
  } catch (error) {
    logTest('Handle edge cases in normalization', false, error);
  }
}

async function testUrlValidation() {
  console.log('\n📝 Test Group: URL Validation');

  const parserService = new InvoiceParserService();

  // Test 1: Validate correct government portal URL
  try {
    const validUrl = 'https://sat.sef.sc.gov.br/nfce/consulta?p=12345678901234567890123456789012345678901234';
    const isValid = parserService.validateInvoiceFormat(validUrl);
    assert(isValid === true, 'Should validate correct URL');

    logTest('Validate correct government portal URL', true);
  } catch (error) {
    logTest('Validate correct government portal URL', false, error);
  }

  // Test 2: Reject invalid URL
  try {
    const invalidUrl = 'https://example.com/invoice';
    const isValid = parserService.validateInvoiceFormat(invalidUrl);
    assert(isValid === false, 'Should reject invalid URL');

    logTest('Reject invalid URL', true);
  } catch (error) {
    logTest('Reject invalid URL', false, error);
  }

  // Test 3: Validate invoice key format
  try {
    const validKey = '12345678901234567890123456789012345678901234';
    const isValid = parserService.validateInvoiceFormat(validKey);
    assert(isValid === true, 'Should validate 44-digit key');

    logTest('Validate invoice key format', true);
  } catch (error) {
    logTest('Validate invoice key format', false, error);
  }

  // Test 4: Reject invalid key length
  try {
    const invalidKey = '123456789'; // Too short
    const isValid = parserService.validateInvoiceFormat(invalidKey);
    assert(isValid === false, 'Should reject short key');

    logTest('Reject invalid key length', true);
  } catch (error) {
    logTest('Reject invalid key length', false, error);
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Invoice Parser Service Tests...\n');
  console.log('==================================================');

  await testXmlParsing();
  await testCategoryDetection();
  await testProductNormalization();
  await testUrlValidation();

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
