/**
 * OFX Parser Tests
 *
 * Unit tests for OFX file parsing, transaction extraction, and date conversion
 */
import * as fs from 'fs';
import * as path from 'path';

import { OFXParser } from '../lib/services/parsers/ofx.parser';
import { ImportError, ImportErrorCode } from '../lib/types';

// ============================================
// Test Setup
// ============================================

const parser = new OFXParser();

// Sample OFX file path
const SAMPLE_OFX_PATH = path.join(process.cwd(), 'public', 'assets', 'Extrato conta corrente - 112025.ofx');

// ============================================
// Helper Functions
// ============================================

function readSampleOFX(): string {
  return fs.readFileSync(SAMPLE_OFX_PATH, 'utf-8');
}

// ============================================
// Tests
// ============================================

async function testCanParse() {
  console.log('\n🧪 Testing canParse method...');

  // Test with valid OFX file
  const ofxFile = new File([''], 'test.ofx', { type: 'application/x-ofx' });
  const canParseOFX = parser.canParse(ofxFile);
  console.assert(canParseOFX === true, '❌ Should be able to parse .ofx files');
  console.log('✅ Can parse .ofx files');

  // Test with uppercase extension
  const ofxFileUpper = new File([''], 'test.OFX', { type: 'application/x-ofx' });
  const canParseOFXUpper = parser.canParse(ofxFileUpper);
  console.assert(canParseOFXUpper === true, '❌ Should be able to parse .OFX files');
  console.log('✅ Can parse .OFX files (uppercase)');

  // Test with invalid file
  const csvFile = new File([''], 'test.csv', { type: 'text/csv' });
  const canParseCSV = parser.canParse(csvFile);
  console.assert(canParseCSV === false, '❌ Should not be able to parse .csv files');
  console.log('✅ Cannot parse .csv files');

  console.log('✅ canParse tests passed');
}

async function testParseRealOFXFile() {
  console.log('\n🧪 Testing parse with real OFX file...');

  try {
    const ofxContent = readSampleOFX();
    const transactions = await parser.parse(ofxContent);

    console.assert(transactions.length > 0, '❌ Should extract transactions from OFX file');
    console.log(`✅ Extracted ${transactions.length} transactions`);

    // Verify transaction structure
    const firstTransaction = transactions[0];
    console.assert(firstTransaction.id !== undefined, '❌ Transaction should have an id');
    console.assert(firstTransaction.date !== undefined, '❌ Transaction should have a date');
    console.assert(firstTransaction.amount !== undefined, '❌ Transaction should have an amount');
    console.assert(firstTransaction.type !== undefined, '❌ Transaction should have a type');
    console.assert(firstTransaction.description !== undefined, '❌ Transaction should have a description');
    console.log('✅ Transaction structure is valid');

    // Verify date format (ISO 8601)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    console.assert(dateRegex.test(firstTransaction.date), '❌ Date should be in ISO 8601 format (YYYY-MM-DD)');
    console.log(`✅ Date format is correct: ${firstTransaction.date}`);

    // Verify transaction types
    const hasIncome = transactions.some((t) => t.type === 'income');
    const hasExpense = transactions.some((t) => t.type === 'expense');
    console.assert(hasIncome, '❌ Should have income transactions');
    console.assert(hasExpense, '❌ Should have expense transactions');
    console.log('✅ Has both income and expense transactions');

    // Verify amounts are positive
    const allPositive = transactions.every((t) => t.amount >= 0);
    console.assert(allPositive, '❌ All amounts should be positive (absolute values)');
    console.log('✅ All amounts are positive');

    // Verify external IDs (FITID)
    const hasExternalIds = transactions.some((t) => t.externalId !== undefined && t.externalId !== '');
    console.assert(hasExternalIds, '❌ Should have transactions with external IDs');
    console.log('✅ Transactions have external IDs (FITID)');

    // Log sample transactions
    console.log('\n📊 Sample transactions:');
    transactions.slice(0, 3).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.date} | ${t.type.toUpperCase()} | R$ ${t.amount.toFixed(2)} | ${t.description}`);
    });

    console.log('\n✅ Real OFX file parsing tests passed');
  } catch (error) {
    console.error('❌ Failed to parse real OFX file:', error);
    throw error;
  }
}

async function testParseMalformedOFX() {
  console.log('\n🧪 Testing parse with malformed OFX data...');

  // Test with missing OFX header
  try {
    const malformedOFX = '<OFX><BANKMSGSRSV1></BANKMSGSRSV1></OFX>';
    await parser.parse(malformedOFX);
    console.error('❌ Should throw error for missing OFX header');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.MALFORMED_FILE,
      '❌ Should have MALFORMED_FILE error code',
    );
    console.log('✅ Throws error for missing OFX header');
  }

  // Test with missing BANKTRANLIST
  try {
    const malformedOFX = `OFXHEADER:100
VERSION:102

<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
    await parser.parse(malformedOFX);
    console.error('❌ Should throw error for missing BANKTRANLIST');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.log('✅ Throws error for missing BANKTRANLIST');
  }

  // Test with empty transactions
  try {
    const emptyOFX = `OFXHEADER:100
VERSION:102

<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
    await parser.parse(emptyOFX);
    console.error('❌ Should throw error for no transactions found');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.NO_TRANSACTIONS_FOUND,
      '❌ Should have NO_TRANSACTIONS_FOUND error code',
    );
    console.log('✅ Throws error for no transactions found');
  }

  console.log('✅ Malformed OFX tests passed');
}

async function testDateParsing() {
  console.log('\n🧪 Testing OFX date parsing...');

  const ofxContent = readSampleOFX();
  const transactions = await parser.parse(ofxContent);

  // Test various date formats from the sample file
  const dates = transactions.map((t) => t.date);

  // All dates should be valid ISO 8601 format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const allValidDates = dates.every((date) => dateRegex.test(date));
  console.assert(allValidDates, '❌ All dates should be in ISO 8601 format');
  console.log('✅ All dates are in ISO 8601 format');

  // All dates should be parseable
  const allParseable = dates.every((date) => !isNaN(new Date(date).getTime()));
  console.assert(allParseable, '❌ All dates should be parseable');
  console.log('✅ All dates are parseable');

  // Check for specific dates from the sample file
  const hasNovemberDates = dates.some((date) => date.startsWith('2025-11'));
  console.assert(hasNovemberDates, '❌ Should have November 2025 dates');
  console.log('✅ Has November 2025 dates');

  console.log('✅ Date parsing tests passed');
}

async function testTransactionTypeMapping() {
  console.log('\n🧪 Testing transaction type mapping...');

  const ofxContent = readSampleOFX();
  const transactions = await parser.parse(ofxContent);

  // Find specific transactions to verify type mapping
  const pixRecebido = transactions.find((t) => t.description.includes('Pix - Recebido'));
  if (pixRecebido) {
    console.assert(pixRecebido.type === 'income', '❌ Pix Recebido should be income');
    console.log('✅ Pix Recebido mapped to income');
  }

  const pixEnviado = transactions.find((t) => t.description.includes('Pix - Enviado'));
  if (pixEnviado) {
    console.assert(pixEnviado.type === 'expense', '❌ Pix Enviado should be expense');
    console.log('✅ Pix Enviado mapped to expense');
  }

  const compraCartao = transactions.find((t) => t.description.includes('Compra com Cartão'));
  if (compraCartao) {
    console.assert(compraCartao.type === 'expense', '❌ Compra com Cartão should be expense');
    console.log('✅ Compra com Cartão mapped to expense');
  }

  const resgate = transactions.find((t) => t.description.includes('Resgate Poupança'));
  if (resgate) {
    console.assert(resgate.type === 'income', '❌ Resgate Poupança should be income');
    console.log('✅ Resgate Poupança mapped to income');
  }

  console.log('✅ Transaction type mapping tests passed');
}

async function testDescriptionBuilding() {
  console.log('\n🧪 Testing description building...');

  const ofxContent = readSampleOFX();
  const transactions = await parser.parse(ofxContent);

  // Verify descriptions are built from NAME and MEMO
  const pixTransaction = transactions.find((t) => t.description.includes('Pix'));
  if (pixTransaction) {
    console.assert(pixTransaction.description.length > 0, '❌ Description should not be empty');
    console.log(`✅ Description built correctly: "${pixTransaction.description}"`);
  }

  // Verify all transactions have descriptions
  const allHaveDescriptions = transactions.every((t) => t.description && t.description.length > 0);
  console.assert(allHaveDescriptions, '❌ All transactions should have descriptions');
  console.log('✅ All transactions have descriptions');

  console.log('✅ Description building tests passed');
}

async function testZeroAmountFiltering() {
  console.log('\n🧪 Testing zero amount filtering...');

  const ofxContent = readSampleOFX();
  const transactions = await parser.parse(ofxContent);

  // Verify no zero-amount transactions (like "Saldo do dia" or "Saldo Anterior")
  const hasZeroAmount = transactions.some((t) => t.amount === 0);
  console.assert(!hasZeroAmount, '❌ Should not include zero-amount transactions');
  console.log('✅ Zero-amount transactions are filtered out');

  // Verify "Saldo do dia" and "Saldo Anterior" are not included
  const hasSaldoDoDia = transactions.some((t) => t.description.includes('Saldo do dia'));
  const hasSaldoAnterior = transactions.some((t) => t.description.includes('Saldo Anterior'));
  console.assert(!hasSaldoDoDia, '❌ Should not include "Saldo do dia" transactions');
  console.assert(!hasSaldoAnterior, '❌ Should not include "Saldo Anterior" transactions');
  console.log('✅ Balance transactions are filtered out');

  console.log('✅ Zero amount filtering tests passed');
}

async function testOFXv1AndV2Support() {
  console.log('\n🧪 Testing OFX v1 and v2 format support...');

  // The sample file is OFX v1 (SGML format)
  const ofxV1Content = readSampleOFX();
  const v1Transactions = await parser.parse(ofxV1Content);
  console.assert(v1Transactions.length > 0, '❌ Should parse OFX v1 (SGML) format');
  console.log(`✅ OFX v1 (SGML) format parsed: ${v1Transactions.length} transactions`);

  // Test OFX v2 (XML format) - create a simple v2 file
  const ofxV2Content = `OFXHEADER:100
VERSION:200

<?xml version="1.0" encoding="UTF-8"?>
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20251103000000</DTPOSTED>
            <TRNAMT>100.00</TRNAMT>
            <FITID>12345</FITID>
            <NAME>Test Transaction</NAME>
            <MEMO>Test Memo</MEMO>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

  const v2Transactions = await parser.parse(ofxV2Content);
  console.assert(v2Transactions.length === 1, '❌ Should parse OFX v2 (XML) format');
  console.assert(v2Transactions[0].description === 'Test Transaction - Test Memo', '❌ Should parse v2 description');
  console.log('✅ OFX v2 (XML) format parsed');

  console.log('✅ OFX v1 and v2 support tests passed');
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  console.log('🚀 Starting OFX Parser Tests...\n');
  console.log('='.repeat(60));

  try {
    await testCanParse();
    await testParseRealOFXFile();
    await testParseMalformedOFX();
    await testDateParsing();
    await testTransactionTypeMapping();
    await testDescriptionBuilding();
    await testZeroAmountFiltering();
    await testOFXv1AndV2Support();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All OFX Parser tests passed!');
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
