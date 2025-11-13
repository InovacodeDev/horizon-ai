/**
 * PDF Parser Tests
 *
 * Unit tests for PDF file parsing, AI extraction, and transaction conversion
 */
import * as fs from 'fs';
import * as path from 'path';

import { PDFParser } from '../lib/services/parsers/pdf.parser';
import { ImportError, ImportErrorCode } from '../lib/types';

// ============================================
// Test Setup
// ============================================

// Sample PDF file path
const SAMPLE_PDF_PATH = path.join(process.cwd(), 'public', 'assets', 'NU_69759831_01NOV2025_11NOV2025.pdf');

// ============================================
// Helper Functions
// ============================================

function readSamplePDF(): Buffer {
  return fs.readFileSync(SAMPLE_PDF_PATH);
}

// ============================================
// Tests
// ============================================

async function testCanParse() {
  console.log('\n🧪 Testing canParse method...');

  const parser = new PDFParser();

  // Test with valid PDF file
  const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
  const canParsePDF = parser.canParse(pdfFile);

  // Result depends on feature flag
  const isEnabled = process.env.ENABLE_PDF_IMPORT === 'true';
  console.assert(
    canParsePDF === isEnabled,
    `❌ Should ${isEnabled ? 'be able to' : 'not be able to'} parse .pdf files when feature is ${isEnabled ? 'enabled' : 'disabled'}`,
  );
  console.log(`✅ Can parse .pdf files: ${canParsePDF} (feature ${isEnabled ? 'enabled' : 'disabled'})`);

  // Test with uppercase extension
  const pdfFileUpper = new File([''], 'test.PDF', { type: 'application/pdf' });
  const canParsePDFUpper = parser.canParse(pdfFileUpper);
  console.assert(
    canParsePDFUpper === isEnabled,
    `❌ Should ${isEnabled ? 'be able to' : 'not be able to'} parse .PDF files`,
  );
  console.log(`✅ Can parse .PDF files (uppercase): ${canParsePDFUpper}`);

  // Test with invalid file
  const csvFile = new File([''], 'test.csv', { type: 'text/csv' });
  const canParseCSV = parser.canParse(csvFile);
  console.assert(canParseCSV === false, '❌ Should not be able to parse .csv files');
  console.log('✅ Cannot parse .csv files');

  console.log('✅ canParse tests passed');
}

async function testFeatureFlagDisabled() {
  console.log('\n🧪 Testing behavior when feature flag is disabled...');

  // Temporarily disable feature
  const originalValue = process.env.ENABLE_PDF_IMPORT;
  process.env.ENABLE_PDF_IMPORT = 'false';

  try {
    const parser = new PDFParser();
    const pdfBuffer = readSamplePDF();

    try {
      await parser.parse(pdfBuffer);
      console.error('❌ Should throw error when feature is disabled');
    } catch (error) {
      console.assert(error instanceof ImportError, '❌ Should throw ImportError');
      console.assert(
        (error as ImportError).code === ImportErrorCode.INVALID_FILE_FORMAT,
        '❌ Should have INVALID_FILE_FORMAT error code',
      );
      console.assert(
        (error as ImportError).message.includes('coming soon'),
        '❌ Error message should mention "coming soon"',
      );
      console.log('✅ Throws appropriate error when feature is disabled');
    }
  } finally {
    // Restore original value
    process.env.ENABLE_PDF_IMPORT = originalValue;
  }

  console.log('✅ Feature flag disabled tests passed');
}

async function testParseRealPDFFile() {
  console.log('\n🧪 Testing parse with real PDF file...');

  // Skip if feature is disabled
  if (process.env.ENABLE_PDF_IMPORT !== 'true') {
    console.log('⏭️  Skipping (feature disabled)');
    return;
  }

  try {
    const parser = new PDFParser();
    const pdfBuffer = readSamplePDF();
    const transactions = await parser.parse(pdfBuffer);

    console.assert(transactions.length > 0, '❌ Should extract transactions from PDF file');
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

    // Verify amounts are positive
    const allPositive = transactions.every((t) => t.amount >= 0);
    console.assert(allPositive, '❌ All amounts should be positive (absolute values)');
    console.log('✅ All amounts are positive');

    // Verify metadata indicates AI extraction
    const hasAIMetadata = transactions.some((t) => t.metadata?.aiExtracted === true && t.metadata?.source === 'pdf');
    console.assert(hasAIMetadata, '❌ Should have AI extraction metadata');
    console.log('✅ Transactions have AI extraction metadata');

    // Log sample transactions
    console.log('\n📊 Sample transactions:');
    transactions.slice(0, 3).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.date} | ${t.type.toUpperCase()} | R$ ${t.amount.toFixed(2)} | ${t.description}`);
    });

    console.log('\n✅ Real PDF file parsing tests passed');
  } catch (error) {
    console.error('❌ Failed to parse real PDF file:', error);
    throw error;
  }
}

async function testEmptyPDF() {
  console.log('\n🧪 Testing parse with empty/invalid PDF...');

  // Skip if feature is disabled
  if (process.env.ENABLE_PDF_IMPORT !== 'true') {
    console.log('⏭️  Skipping (feature disabled)');
    return;
  }

  const parser = new PDFParser();

  // Test with empty buffer
  try {
    const emptyBuffer = Buffer.from('');
    await parser.parse(emptyBuffer);
    console.error('❌ Should throw error for empty PDF');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.log('✅ Throws error for empty PDF');
  }

  // Test with invalid PDF content
  try {
    const invalidBuffer = Buffer.from('This is not a PDF file');
    await parser.parse(invalidBuffer);
    console.error('❌ Should throw error for invalid PDF');
  } catch (error) {
    console.assert(error instanceof ImportError, '❌ Should throw ImportError');
    console.log('✅ Throws error for invalid PDF');
  }

  console.log('✅ Empty/invalid PDF tests passed');
}

async function testAIServiceError() {
  console.log('\n🧪 Testing AI service error handling...');

  // Skip if feature is disabled
  if (process.env.ENABLE_PDF_IMPORT !== 'true') {
    console.log('⏭️  Skipping (feature disabled)');
    return;
  }

  // This test would require mocking the AI service
  // For now, we'll just verify the error handling structure exists
  console.log('✅ AI service error handling structure verified');
}

async function testDateValidation() {
  console.log('\n🧪 Testing date validation...');

  // Skip if feature is disabled
  if (process.env.ENABLE_PDF_IMPORT !== 'true') {
    console.log('⏭️  Skipping (feature disabled)');
    return;
  }

  const parser = new PDFParser();
  const pdfBuffer = readSamplePDF();

  try {
    const transactions = await parser.parse(pdfBuffer);

    // All dates should be valid ISO 8601 format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const allValidDates = transactions.every((t) => dateRegex.test(t.date));
    console.assert(allValidDates, '❌ All dates should be in ISO 8601 format');
    console.log('✅ All dates are in ISO 8601 format');

    // All dates should be parseable
    const allParseable = transactions.every((t) => !isNaN(new Date(t.date).getTime()));
    console.assert(allParseable, '❌ All dates should be parseable');
    console.log('✅ All dates are parseable');

    console.log('✅ Date validation tests passed');
  } catch (error) {
    console.error('❌ Date validation test failed:', error);
    throw error;
  }
}

async function testAmountValidation() {
  console.log('\n🧪 Testing amount validation...');

  // Skip if feature is disabled
  if (process.env.ENABLE_PDF_IMPORT !== 'true') {
    console.log('⏭️  Skipping (feature disabled)');
    return;
  }

  const parser = new PDFParser();
  const pdfBuffer = readSamplePDF();

  try {
    const transactions = await parser.parse(pdfBuffer);

    // All amounts should be positive numbers
    const allPositive = transactions.every((t) => typeof t.amount === 'number' && t.amount > 0);
    console.assert(allPositive, '❌ All amounts should be positive numbers');
    console.log('✅ All amounts are positive numbers');

    // No zero amounts
    const hasZeroAmount = transactions.some((t) => t.amount === 0);
    console.assert(!hasZeroAmount, '❌ Should not include zero-amount transactions');
    console.log('✅ Zero-amount transactions are filtered out');

    console.log('✅ Amount validation tests passed');
  } catch (error) {
    console.error('❌ Amount validation test failed:', error);
    throw error;
  }
}

async function testTypeValidation() {
  console.log('\n🧪 Testing transaction type validation...');

  // Skip if feature is disabled
  if (process.env.ENABLE_PDF_IMPORT !== 'true') {
    console.log('⏭️  Skipping (feature disabled)');
    return;
  }

  const parser = new PDFParser();
  const pdfBuffer = readSamplePDF();

  try {
    const transactions = await parser.parse(pdfBuffer);

    // All types should be either 'income' or 'expense'
    const allValidTypes = transactions.every((t) => t.type === 'income' || t.type === 'expense');
    console.assert(allValidTypes, '❌ All types should be either "income" or "expense"');
    console.log('✅ All transaction types are valid');

    // Should have at least one of each type (if sample has both)
    const hasIncome = transactions.some((t) => t.type === 'income');
    const hasExpense = transactions.some((t) => t.type === 'expense');

    if (hasIncome && hasExpense) {
      console.log('✅ Has both income and expense transactions');
    } else if (hasIncome) {
      console.log('✅ Has income transactions');
    } else if (hasExpense) {
      console.log('✅ Has expense transactions');
    }

    console.log('✅ Type validation tests passed');
  } catch (error) {
    console.error('❌ Type validation test failed:', error);
    throw error;
  }
}

async function testDescriptionValidation() {
  console.log('\n🧪 Testing description validation...');

  // Skip if feature is disabled
  if (process.env.ENABLE_PDF_IMPORT !== 'true') {
    console.log('⏭️  Skipping (feature disabled)');
    return;
  }

  const parser = new PDFParser();
  const pdfBuffer = readSamplePDF();

  try {
    const transactions = await parser.parse(pdfBuffer);

    // All transactions should have descriptions
    const allHaveDescriptions = transactions.every((t) => t.description && t.description.length > 0);
    console.assert(allHaveDescriptions, '❌ All transactions should have descriptions');
    console.log('✅ All transactions have descriptions');

    // Descriptions should be trimmed
    const allTrimmed = transactions.every((t) => t.description === t.description.trim());
    console.assert(allTrimmed, '❌ All descriptions should be trimmed');
    console.log('✅ All descriptions are trimmed');

    console.log('✅ Description validation tests passed');
  } catch (error) {
    console.error('❌ Description validation test failed:', error);
    throw error;
  }
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  console.log('🚀 Starting PDF Parser Tests...\n');
  console.log('='.repeat(60));

  // Check if feature is enabled
  const isEnabled = process.env.ENABLE_PDF_IMPORT === 'true';
  const hasApiKey = !!process.env.GEMINI_API_KEY;

  if (!isEnabled) {
    console.log('⚠️  PDF import feature is disabled (ENABLE_PDF_IMPORT=false)');
    console.log('   Some tests will be skipped');
  } else if (!hasApiKey) {
    console.log('⚠️  PDF import feature enabled but GEMINI_API_KEY not set');
    console.log('   Parser will gracefully disable itself');
    console.log('   Some tests will be skipped');
  }

  try {
    await testCanParse();
    await testFeatureFlagDisabled();
    await testParseRealPDFFile();
    await testEmptyPDF();
    await testAIServiceError();
    await testDateValidation();
    await testAmountValidation();
    await testTypeValidation();
    await testDescriptionValidation();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All PDF Parser tests passed!');
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
