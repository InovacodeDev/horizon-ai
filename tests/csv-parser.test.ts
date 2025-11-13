/**
 * CSV Parser Tests
 *
 * Unit tests for CSV file parsing, delimiter detection, date/amount parsing, and validation
 */
import * as fs from 'fs';
import * as path from 'path';

import { CSVParser } from '../lib/services/parsers/csv.parser';
import { ImportError, ImportErrorCode } from '../lib/types';

// ============================================
// Test Setup
// ============================================

const parser = new CSVParser();

// Sample CSV file path
const SAMPLE_CSV_PATH = path.join(process.cwd(), 'public', 'assets', 'NU_69759831_01NOV2025_11NOV2025.csv');

// ============================================
// Helper Functions
// ============================================

function readSampleCSV(): string {
  return fs.readFileSync(SAMPLE_CSV_PATH, 'utf-8');
}

// ============================================
// Tests
// ============================================

async function testCanParse() {
  console.log('\n🧪 Testing canParse method...');

  // Test with valid CSV file
  const csvFile = new File([''], 'test.csv', { type: 'text/csv' });
  const canParseCSV = parser.canParse(csvFile);
  console.assert(canParseCSV === true, '❌ Should be able to parse .csv files');
  console.log('✅ Can parse .csv files');

  // Test with uppercase extension
  const csvFileUpper = new File([''], 'test.CSV', { type: 'text/csv' });
  const canParseCSVUpper = parser.canParse(csvFileUpper);
  console.assert(canParseCSVUpper === true, '❌ Should be able to parse .CSV files');
  console.log('✅ Can parse .CSV files (uppercase)');

  // Test with invalid file
  const ofxFile = new File([''], 'test.ofx', { type: 'application/x-ofx' });
  const canParseOFX = parser.canParse(ofxFile);
  console.assert(canParseOFX === false, '❌ Should not be able to parse .ofx files');
  console.log('✅ Cannot parse .ofx files');

  console.log('✅ canParse tests passed');
}

async function testParseRealCSVFile() {
  console.log('\n🧪 Testing parse with real CSV file...');

  try {
    const csvContent = readSampleCSV();
    const transactions = await parser.parse(csvContent);

    console.assert(transactions.length > 0, '❌ Should extract transactions from CSV file');
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

    // Verify external IDs (Identificador)
    const hasExternalIds = transactions.some((t) => t.externalId !== undefined && t.externalId !== '');
    console.assert(hasExternalIds, '❌ Should have transactions with external IDs');
    console.log('✅ Transactions have external IDs (Identificador)');

    // Log sample transactions
    console.log('\n📊 Sample transactions:');
    transactions.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.date} | ${t.type.toUpperCase()} | R$ ${t.amount.toFixed(2)} | ${t.description}`);
    });

    console.log('\n✅ Real CSV file parsing tests passed');
  } catch (error) {
    console.error('❌ Failed to parse real CSV file:', error);
    throw error;
  }
}

async function testDelimiterDetection() {
  console.log('\n🧪 Testing delimiter detection...');

  // Test comma delimiter (default)
  const commaCSV = `Data,Valor,Descrição
01/11/2025,100.50,Test Transaction`;
  const commaTransactions = await parser.parse(commaCSV);
  console.assert(commaTransactions.length === 1, '❌ Should parse comma-delimited CSV');
  console.log('✅ Comma delimiter detected and parsed');

  // Test semicolon delimiter
  const semicolonCSV = `Data;Valor;Descrição
01/11/2025;100.50;Test Transaction`;
  const semicolonTransactions = await parser.parse(semicolonCSV);
  console.assert(semicolonTransactions.length === 1, '❌ Should parse semicolon-delimited CSV');
  console.log('✅ Semicolon delimiter detected and parsed');

  // Test tab delimiter
  const tabCSV = `Data\tValor\tDescrição
01/11/2025\t100.50\tTest Transaction`;
  const tabTransactions = await parser.parse(tabCSV);
  console.assert(tabTransactions.length === 1, '❌ Should parse tab-delimited CSV');
  console.log('✅ Tab delimiter detected and parsed');

  console.log('✅ Delimiter detection tests passed');
}

async function testDateFormats() {
  console.log('\n🧪 Testing various date formats...');

  // Test DD/MM/YYYY format
  const ddmmyyyyCSV = `Data,Valor,Descrição
06/11/2025,100.00,Test Transaction`;
  const ddmmyyyyTransactions = await parser.parse(ddmmyyyyCSV);
  console.assert(ddmmyyyyTransactions[0].date === '2025-11-06', '❌ Should parse DD/MM/YYYY format');
  console.log('✅ DD/MM/YYYY format parsed correctly');

  // Test YYYY-MM-DD format
  const yyyymmddCSV = `Date,Amount,Description
2025-11-06,100.00,Test Transaction`;
  const yyyymmddTransactions = await parser.parse(yyyymmddCSV);
  console.assert(yyyymmddTransactions[0].date === '2025-11-06', '❌ Should parse YYYY-MM-DD format');
  console.log('✅ YYYY-MM-DD format parsed correctly');

  // Test DD-MM-YYYY format
  const ddmmyyyyDashCSV = `Data,Valor,Descrição
06-11-2025,100.00,Test Transaction`;
  const ddmmyyyyDashTransactions = await parser.parse(ddmmyyyyDashCSV);
  console.assert(ddmmyyyyDashTransactions[0].date === '2025-11-06', '❌ Should parse DD-MM-YYYY format');
  console.log('✅ DD-MM-YYYY format parsed correctly');

  // Test single-digit day and month
  const singleDigitCSV = `Data,Valor,Descrição
6/1/2025,100.00,Test Transaction`;
  const singleDigitTransactions = await parser.parse(singleDigitCSV);
  console.assert(singleDigitTransactions[0].date === '2025-01-06', '❌ Should parse single-digit dates');
  console.log('✅ Single-digit day/month parsed correctly');

  console.log('✅ Date format tests passed');
}

async function testAmountFormats() {
  console.log('\n🧪 Testing various amount formats...');

  // Test positive amount with period decimal
  const periodDecimalCSV = `Data,Valor,Descrição
01/11/2025,1234.56,Test Transaction`;
  const periodTransactions = await parser.parse(periodDecimalCSV);
  console.assert(periodTransactions[0].amount === 1234.56, '❌ Should parse period decimal separator');
  console.assert(periodTransactions[0].type === 'income', '❌ Positive amount should be income');
  console.log('✅ Period decimal separator parsed correctly');

  // Test amount with comma decimal (European format)
  const commaDecimalCSV = `Data;Valor;Descrição
01/11/2025;1234,56;Test Transaction`;
  const commaTransactions = await parser.parse(commaDecimalCSV);
  console.assert(commaTransactions[0].amount === 1234.56, '❌ Should parse comma decimal separator');
  console.log('✅ Comma decimal separator parsed correctly');

  // Test amount with thousands separator (period) and comma decimal
  const thousandsPeriodCSV = `Data;Valor;Descrição
01/11/2025;1.234,56;Test Transaction`;
  const thousandsPeriodTransactions = await parser.parse(thousandsPeriodCSV);
  console.assert(thousandsPeriodTransactions[0].amount === 1234.56, '❌ Should parse thousands separator (period)');
  console.log('✅ Thousands separator (period) with comma decimal parsed correctly');

  // Test amount with thousands separator (comma) and period decimal
  const thousandsCommaCSV = `Data,Valor,Descrição
01/11/2025,"1,234.56",Test Transaction`;
  const thousandsCommaTransactions = await parser.parse(thousandsCommaCSV);
  console.assert(thousandsCommaTransactions[0].amount === 1234.56, '❌ Should parse thousands separator (comma)');
  console.log('✅ Thousands separator (comma) with period decimal parsed correctly');

  // Test negative amount
  const negativeCSV = `Data,Valor,Descrição
01/11/2025,-100.50,Test Transaction`;
  const negativeTransactions = await parser.parse(negativeCSV);
  console.assert(negativeTransactions[0].amount === 100.5, '❌ Should parse negative amount as positive');
  console.assert(negativeTransactions[0].type === 'expense', '❌ Negative amount should be expense');
  console.log('✅ Negative amount parsed correctly as expense');

  // Test parentheses format (accounting)
  const parenthesesCSV = `Data,Valor,Descrição
01/11/2025,(100.50),Test Transaction`;
  const parenthesesTransactions = await parser.parse(parenthesesCSV);
  console.assert(parenthesesTransactions[0].amount === 100.5, '❌ Should parse parentheses format');
  console.assert(parenthesesTransactions[0].type === 'expense', '❌ Parentheses amount should be expense');
  console.log('✅ Parentheses format (accounting) parsed correctly');

  // Test amount with currency symbol
  const currencyCSV = `Data,Valor,Descrição
01/11/2025,R$ 100.50,Test Transaction`;
  const currencyTransactions = await parser.parse(currencyCSV);
  console.assert(currencyTransactions[0].amount === 100.5, '❌ Should parse amount with currency symbol');
  console.log('✅ Currency symbol removed and amount parsed correctly');

  console.log('✅ Amount format tests passed');
}

async function testColumnMapping() {
  console.log('\n🧪 Testing column mapping with various header names...');

  // Test Portuguese headers
  const portugueseCSV = `Data,Valor,Descrição,Identificador
01/11/2025,100.00,Test Transaction,12345`;
  const portugueseTransactions = await parser.parse(portugueseCSV);
  console.assert(portugueseTransactions.length === 1, '❌ Should map Portuguese headers');
  console.assert(portugueseTransactions[0].externalId === '12345', '❌ Should map Identificador to externalId');
  console.log('✅ Portuguese headers mapped correctly');

  // Test English headers
  const englishCSV = `Date,Amount,Description,ID
2025-11-01,100.00,Test Transaction,12345`;
  const englishTransactions = await parser.parse(englishCSV);
  console.assert(englishTransactions.length === 1, '❌ Should map English headers');
  console.assert(englishTransactions[0].externalId === '12345', '❌ Should map ID to externalId');
  console.log('✅ English headers mapped correctly');

  // Test headers with accents
  const accentCSV = `Data,Valor,Descrição
01/11/2025,100.00,Test Transaction`;
  const accentTransactions = await parser.parse(accentCSV);
  console.assert(accentTransactions.length === 1, '❌ Should handle headers with accents');
  console.log('✅ Headers with accents handled correctly');

  // Test case-insensitive headers
  const caseCSV = `DATA,VALOR,DESCRIÇÃO
01/11/2025,100.00,Test Transaction`;
  const caseTransactions = await parser.parse(caseCSV);
  console.assert(caseTransactions.length === 1, '❌ Should handle uppercase headers');
  console.log('✅ Case-insensitive headers handled correctly');

  console.log('✅ Column mapping tests passed');
}

async function testMissingColumns() {
  console.log('\n🧪 Testing missing required columns...');

  // Test missing date column
  try {
    const missingDateCSV = `Valor,Descrição
100.00,Test Transaction`;
    await parser.parse(missingDateCSV);
    console.error('❌ Should throw error for missing date column');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.MISSING_REQUIRED_COLUMNS,
      '❌ Should have MISSING_REQUIRED_COLUMNS error code',
    );
    console.log('✅ Throws error for missing date column');
  }

  // Test missing amount column
  try {
    const missingAmountCSV = `Data,Descrição
01/11/2025,Test Transaction`;
    await parser.parse(missingAmountCSV);
    console.error('❌ Should throw error for missing amount column');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.MISSING_REQUIRED_COLUMNS,
      '❌ Should have MISSING_REQUIRED_COLUMNS error code',
    );
    console.log('✅ Throws error for missing amount column');
  }

  // Test missing description column
  try {
    const missingDescCSV = `Data,Valor
01/11/2025,100.00`;
    await parser.parse(missingDescCSV);
    console.error('❌ Should throw error for missing description column');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.MISSING_REQUIRED_COLUMNS,
      '❌ Should have MISSING_REQUIRED_COLUMNS error code',
    );
    console.log('✅ Throws error for missing description column');
  }

  console.log('✅ Missing columns tests passed');
}

async function testEmptyFile() {
  console.log('\n🧪 Testing empty CSV file...');

  try {
    const emptyCSV = '';
    await parser.parse(emptyCSV);
    console.error('❌ Should throw error for empty file');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.log('✅ Throws error for empty file');
  }

  // Test file with only headers
  try {
    const headersOnlyCSV = `Data,Valor,Descrição`;
    await parser.parse(headersOnlyCSV);
    console.error('❌ Should throw error for file with only headers');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.assert(
      (error as ImportError).code === ImportErrorCode.NO_TRANSACTIONS_FOUND,
      '❌ Should have NO_TRANSACTIONS_FOUND error code',
    );
    console.log('✅ Throws error for file with only headers');
  }

  console.log('✅ Empty file tests passed');
}

async function testZeroAmountFiltering() {
  console.log('\n🧪 Testing zero amount filtering...');

  const zeroAmountCSV = `Data,Valor,Descrição
01/11/2025,0.00,Zero Amount Transaction
02/11/2025,100.00,Valid Transaction
03/11/2025,0,Another Zero`;

  const transactions = await parser.parse(zeroAmountCSV);

  console.assert(transactions.length === 1, '❌ Should filter out zero-amount transactions');
  console.assert(transactions[0].amount === 100, '❌ Should only include non-zero transactions');
  console.log('✅ Zero-amount transactions filtered out');

  console.log('✅ Zero amount filtering tests passed');
}

async function testTransactionTypeDetection() {
  console.log('\n🧪 Testing transaction type detection...');

  // Test with type column
  const withTypeCSV = `Data,Valor,Descrição,Tipo
01/11/2025,100.00,Income Transaction,Receita
02/11/2025,50.00,Expense Transaction,Despesa`;

  const withTypeTransactions = await parser.parse(withTypeCSV);
  console.assert(withTypeTransactions[0].type === 'income', '❌ Should detect income from type column');
  console.assert(withTypeTransactions[1].type === 'expense', '❌ Should detect expense from type column');
  console.log('✅ Type detection from type column works');

  // Test without type column (based on amount sign)
  const withoutTypeCSV = `Data,Valor,Descrição
01/11/2025,100.00,Positive Amount
02/11/2025,-50.00,Negative Amount`;

  const withoutTypeTransactions = await parser.parse(withoutTypeCSV);
  console.assert(withoutTypeTransactions[0].type === 'income', '❌ Positive amount should be income');
  console.assert(withoutTypeTransactions[1].type === 'expense', '❌ Negative amount should be expense');
  console.log('✅ Type detection from amount sign works');

  console.log('✅ Transaction type detection tests passed');
}

async function testSpecialCharactersInDescription() {
  console.log('\n🧪 Testing special characters in description...');

  const specialCharsCSV = `Data,Valor,Descrição
01/11/2025,100.00,"Transaction with, comma"
02/11/2025,50.00,"Transaction with ""quotes"""
03/11/2025,75.00,Transaction with ç ã õ é`;

  const transactions = await parser.parse(specialCharsCSV);

  console.assert(transactions.length === 3, '❌ Should parse all transactions with special characters');
  console.assert(transactions[0].description.includes('comma'), '❌ Should handle commas in description');
  console.assert(transactions[1].description.includes('quotes'), '❌ Should handle quotes in description');
  console.assert(transactions[2].description.includes('ç'), '❌ Should handle accented characters');
  console.log('✅ Special characters in description handled correctly');

  console.log('✅ Special characters tests passed');
}

async function testRealWorldScenarios() {
  console.log('\n🧪 Testing real-world scenarios...');

  // Test Nubank-style CSV (from sample file)
  const nubankCSV = readSampleCSV();
  const nubankTransactions = await parser.parse(nubankCSV);

  console.assert(nubankTransactions.length > 0, '❌ Should parse Nubank CSV format');
  console.log(`✅ Nubank CSV format parsed: ${nubankTransactions.length} transactions`);

  // Verify specific Nubank transactions
  const transferReceived = nubankTransactions.find((t) => t.description.includes('Transferência Recebida'));
  if (transferReceived) {
    console.assert(transferReceived.type === 'income', '❌ Transferência Recebida should be income');
    console.assert(transferReceived.amount > 0, '❌ Should have positive amount');
    console.log('✅ Transferência Recebida parsed correctly');
  }

  const pixSent = nubankTransactions.find((t) => t.description.includes('Transferência enviada pelo Pix'));
  if (pixSent) {
    console.assert(pixSent.type === 'expense', '❌ Pix sent should be expense');
    console.assert(pixSent.amount > 0, '❌ Should have positive amount (absolute value)');
    console.log('✅ Pix sent parsed correctly');
  }

  const billPayment = nubankTransactions.find((t) => t.description.includes('Pagamento de fatura'));
  if (billPayment) {
    console.assert(billPayment.type === 'expense', '❌ Bill payment should be expense');
    console.log('✅ Bill payment parsed correctly');
  }

  console.log('✅ Real-world scenarios tests passed');
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  console.log('🚀 Starting CSV Parser Tests...\n');
  console.log('='.repeat(60));

  try {
    await testCanParse();
    await testParseRealCSVFile();
    await testDelimiterDetection();
    await testDateFormats();
    await testAmountFormats();
    await testColumnMapping();
    await testMissingColumns();
    await testEmptyFile();
    await testZeroAmountFiltering();
    await testTransactionTypeDetection();
    await testSpecialCharactersInDescription();
    await testRealWorldScenarios();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All CSV Parser tests passed!');
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
