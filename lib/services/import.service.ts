import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import type {
  ImportFileFormat,
  ImportPreviewResult,
  ImportRecord,
  ImportResult,
  ParsedTransaction,
  Parser,
} from '@/lib/types';
import { ImportError, ImportErrorCode } from '@/lib/types';
import { validateFile } from '@/lib/utils/file-security';
import { dateToUserTimezone } from '@/lib/utils/timezone';
import { ID, Query } from 'node-appwrite';

import { CSVParser } from './parsers/csv.parser';
import { OFXParser } from './parsers/ofx.parser';
import { PDFParser } from './parsers/pdf.parser';
import { type CreateTransactionData, TransactionService } from './transaction.service';

/**
 * Import Service
 * Orchestrates the bank statement import process
 * Handles file parsing, duplicate detection, and transaction creation
 *
 * Security Notes:
 * - Files are processed in memory and never stored on disk
 * - File content is only kept in memory during the request lifecycle
 * - Automatic cleanup happens when the request completes
 * - Maximum file size is enforced (10MB)
 * - File validation includes MIME type and malicious content detection
 */
export class ImportService {
  private parsers: Parser[];
  private transactionService: TransactionService;
  private dbAdapter: any;

  constructor() {
    // Initialize parsers (order matters - try OFX first, then CSV, then PDF as fallback)
    this.parsers = [new OFXParser(), new CSVParser(), new PDFParser()];

    // Initialize transaction service
    this.transactionService = new TransactionService();

    // Initialize database adapter
    this.dbAdapter = getAppwriteDatabases();
  }

  /**
   * Preview import - Parse file and return preview data
   * Does not create transactions, only parses and detects duplicates
   */
  async previewImport(
    file: File,
    accountId: string,
    userId: string,
    userAccounts: any[],
  ): Promise<ImportPreviewResult> {
    try {
      // Validate file (extension, MIME type, size, malicious content)
      await validateFile(file);

      // Detect file format and select parser
      const parser = this.selectParser(file);
      if (!parser) {
        throw new ImportError(
          'Unsupported file format. Please use .ofx, .csv, or .pdf files',
          ImportErrorCode.INVALID_FILE_FORMAT,
          { fileName: file.name },
        );
      }

      // Read file content
      const fileContent = await this.readFile(file);

      // Try to extract account info from OFX file for matching
      let accountInfo: any = undefined;
      let matchedAccountId: string | undefined = undefined;

      if (parser instanceof OFXParser) {
        accountInfo = await parser.getAccountInfo(fileContent);

        // Try to match account based on OFX account info
        if (accountInfo) {
          matchedAccountId = this.matchAccount(accountInfo, userAccounts);
        }
      }

      // Parse file
      const transactions = await parser.parse(fileContent);

      if (transactions.length === 0) {
        throw new ImportError('No transactions found in file', ImportErrorCode.NO_TRANSACTIONS_FOUND);
      }

      // Detect duplicates
      const duplicates = await this.detectDuplicates(transactions, accountId, userId);

      // Calculate summary
      const summary = this.calculateSummary(transactions, duplicates);

      return {
        transactions,
        duplicates,
        summary,
        matchedAccountId,
        accountInfo,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof ImportError) {
        throw error;
      }

      throw new ImportError(
        `Failed to preview import: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Match account based on OFX account information
   * Matches by BANKID, BRANCHID, and ACCTID stored in account.data
   */
  private matchAccount(ofxAccountInfo: any, userAccounts: any[]): string | undefined {
    if (!ofxAccountInfo || !userAccounts || userAccounts.length === 0) {
      return undefined;
    }

    // Try to find matching account
    for (const account of userAccounts) {
      try {
        // Parse account data JSON if it exists
        let accountData: any = {};
        if (account.data) {
          try {
            accountData = typeof account.data === 'string' ? JSON.parse(account.data) : account.data;
          } catch {
            continue;
          }
        }

        // Check if integration_data contains OFX account info
        const integrationData = accountData.integration_data || {};

        // Match by BANKID, BRANCHID, and ACCTID
        const bankIdMatch =
          !ofxAccountInfo.BANKID || !integrationData.BANKID || ofxAccountInfo.BANKID === integrationData.BANKID;

        const branchIdMatch =
          !ofxAccountInfo.BRANCHID || !integrationData.BRANCHID || ofxAccountInfo.BRANCHID === integrationData.BRANCHID;

        const acctIdMatch =
          !ofxAccountInfo.ACCTID || !integrationData.ACCTID || ofxAccountInfo.ACCTID === integrationData.ACCTID;

        // If all available fields match, consider it a match
        if (bankIdMatch && branchIdMatch && acctIdMatch) {
          // At least one field must be present and match
          if (
            (ofxAccountInfo.BANKID && integrationData.BANKID) ||
            (ofxAccountInfo.BRANCHID && integrationData.BRANCHID) ||
            (ofxAccountInfo.ACCTID && integrationData.ACCTID)
          ) {
            return account.$id;
          }
        }

        // Also try matching by last_digits if available
        if (ofxAccountInfo.ACCTID && accountData.last_digits) {
          const ofxLastDigits = ofxAccountInfo.ACCTID.slice(-4);
          if (ofxLastDigits === accountData.last_digits) {
            return account.$id;
          }
        }
      } catch (error) {
        console.error('Error matching account:', error);
        continue;
      }
    }

    return undefined;
  }

  /**
   * Process import - Create transactions from preview
   * Creates transactions in the database
   */
  async processImport(
    transactions: ParsedTransaction[],
    accountId: string,
    userId: string,
    fileName: string,
  ): Promise<ImportResult> {
    try {
      let imported = 0;
      let failed = 0;
      const errors: Array<{ transaction: ParsedTransaction; error: string }> = [];

      // Create transactions
      for (const parsedTransaction of transactions) {
        try {
          // Map parsed transaction to CreateTransactionData
          const transactionData: CreateTransactionData = {
            userId,
            amount: parsedTransaction.amount,
            type: parsedTransaction.type,
            date: parsedTransaction.date,
            category: parsedTransaction.category || 'other',
            description: parsedTransaction.description,
            currency: 'BRL',
            accountId,
            status: 'completed',
            // Store import metadata
            // Note: We'll need to extend CreateTransactionData to support integration_data
          };

          // Create transaction
          await this.transactionService.createManualTransaction(transactionData);
          imported++;
        } catch (error) {
          failed++;
          errors.push({
            transaction: parsedTransaction,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          console.error('Failed to create transaction:', error, parsedTransaction);
        }
      }

      // Create import record
      const importId = await this.createImportRecord(
        userId,
        fileName,
        accountId,
        imported,
        failed > 0 ? 'partial' : 'completed',
        this.detectFileFormat(fileName),
        undefined,
        {
          duplicateCount: 0,
          failedCount: failed,
          successCount: imported,
          parsedCount: transactions.length,
        },
      );

      return {
        imported,
        failed,
        importId,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      throw new ImportError(
        `Failed to process import: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.DATABASE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Detect file format based on file extension
   */
  private detectFileFormat(fileName: string): ImportFileFormat {
    const extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
      case 'ofx':
        return 'ofx';
      case 'csv':
        return 'csv';
      case 'pdf':
        return 'pdf';
      default:
        return 'csv'; // Default fallback
    }
  }

  /**
   * Select appropriate parser based on file type
   */
  private selectParser(file: File): Parser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(file)) {
        return parser;
      }
    }
    return null;
  }

  /**
   * Read file content as string or buffer
   */
  private async readFile(file: File): Promise<string | Buffer> {
    // Check if we're in a browser environment
    if (typeof FileReader !== 'undefined') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else if (result instanceof ArrayBuffer) {
            resolve(Buffer.from(result));
          } else {
            reject(new Error('Failed to read file'));
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        // Read as text for OFX and CSV, as array buffer for PDF
        if (file.name.toLowerCase().endsWith('.pdf')) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      });
    } else {
      // Server-side: use arrayBuffer and TextDecoder/Buffer
      const arrayBuffer = await file.arrayBuffer();

      if (file.name.toLowerCase().endsWith('.pdf')) {
        return Buffer.from(arrayBuffer);
      } else {
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(arrayBuffer);
      }
    }
  }

  /**
   * Calculate summary statistics for preview
   */
  private calculateSummary(
    transactions: ParsedTransaction[],
    duplicates: Set<string>,
  ): {
    total: number;
    income: number;
    expense: number;
    duplicateCount: number;
    totalAmount: number;
  } {
    let income = 0;
    let expense = 0;
    let totalAmount = 0;

    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        income++;
      } else {
        expense++;
      }
      totalAmount += transaction.amount;
    }

    return {
      total: transactions.length,
      income,
      expense,
      duplicateCount: duplicates.size,
      totalAmount,
    };
  }

  /**
   * Detect duplicate transactions
   * Checks for matches by external ID and by date/amount/description fuzzy matching
   */
  private async detectDuplicates(
    transactions: ParsedTransaction[],
    accountId: string,
    userId: string,
  ): Promise<Set<string>> {
    const duplicates = new Set<string>();

    try {
      // Get existing transactions for the account
      // We'll look back 90 days to find potential duplicates
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const startDate = ninetyDaysAgo.toISOString().split('T')[0];

      const { transactions: existingTransactions } = await this.transactionService.listTransactions({
        userId,
        startDate,
        limit: 10000, // Get all recent transactions
      });

      // Check each parsed transaction for duplicates
      for (const parsedTransaction of transactions) {
        let isDuplicate = false;

        // Check for external ID match (FITID, Identificador)
        if (parsedTransaction.externalId) {
          const externalIdMatch = existingTransactions.find((existing) => {
            // Check if integration_data contains the external ID
            if (existing.data) {
              try {
                const data = JSON.parse(existing.data);
                return data.integration_data?.externalId === parsedTransaction.externalId;
              } catch {
                return false;
              }
            }
            return false;
          });

          if (externalIdMatch) {
            isDuplicate = true;
          }
        }

        // Check for fuzzy match by date (±2 days), amount (±0.01), and description
        if (!isDuplicate) {
          const parsedDate = new Date(parsedTransaction.date);
          const parsedAmount = parsedTransaction.amount;
          const parsedDescription = this.normalizeDescription(parsedTransaction.description);

          const fuzzyMatch = existingTransactions.find((existing) => {
            // Check date within ±2 days
            const existingDate = new Date(existing.date);
            const daysDiff = Math.abs((existingDate.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff > 2) {
              return false;
            }

            // Check amount within ±0.01
            const amountDiff = Math.abs(existing.amount - parsedAmount);
            if (amountDiff > 0.01) {
              return false;
            }

            // Check description similarity
            const existingDescription = this.normalizeDescription(existing.description || '');
            if (existingDescription !== parsedDescription) {
              return false;
            }

            return true;
          });

          if (fuzzyMatch) {
            isDuplicate = true;
          }
        }

        if (isDuplicate) {
          duplicates.add(parsedTransaction.id);
        }
      }

      return duplicates;
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      // Return empty set on error - better to allow potential duplicates than fail the import
      return new Set<string>();
    }
  }

  /**
   * Normalize description for comparison
   * Removes extra whitespace, converts to lowercase, removes special characters
   */
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s]/g, ''); // Remove special characters
  }

  /**
   * Create import record in database
   */
  private async createImportRecord(
    userId: string,
    fileName: string,
    accountId: string,
    transactionCount: number,
    status: 'completed' | 'failed' | 'partial',
    fileFormat: ImportFileFormat,
    errorMessage?: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    try {
      const id = ID.unique();
      const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

      const payload: any = {
        user_id: userId,
        account_id: accountId,
        file_name: fileName,
        file_format: fileFormat,
        transaction_count: transactionCount,
        import_date: now,
        status,
        created_at: now,
        updated_at: now,
      };

      if (errorMessage) {
        payload.error_message = errorMessage;
      }

      if (metadata) {
        payload.metadata = JSON.stringify(metadata);
      }

      const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.IMPORT_HISTORY, id, payload);

      return document.$id;
    } catch (error) {
      console.error('Failed to create import record:', error);
      throw new ImportError('Failed to create import record', ImportErrorCode.DATABASE_ERROR, { originalError: error });
    }
  }

  /**
   * Get import history for a user
   */
  async getImportHistory(userId: string, limit: number = 50): Promise<ImportRecord[]> {
    try {
      const queries = [Query.equal('user_id', userId), Query.orderDesc('import_date'), Query.limit(limit)];

      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.IMPORT_HISTORY, queries);

      return response.documents.map((doc: any) => this.formatImportRecord(doc));
    } catch (error) {
      console.error('Failed to get import history:', error);
      throw new ImportError('Failed to retrieve import history', ImportErrorCode.DATABASE_ERROR, {
        originalError: error,
      });
    }
  }

  /**
   * Format import record from database document
   */
  private formatImportRecord(document: any): ImportRecord {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      user_id: document.user_id,
      account_id: document.account_id,
      file_name: document.file_name,
      file_format: document.file_format,
      transaction_count: document.transaction_count,
      import_date: document.import_date,
      status: document.status,
      error_message: document.error_message,
      metadata: document.metadata,
    };
  }
}
