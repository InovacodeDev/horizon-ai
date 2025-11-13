import { GoogleAIService, GoogleAIServiceError } from '@/lib/services/google-ai.service';
import type { ParsedTransaction, Parser } from '@/lib/types';
import { ImportError, ImportErrorCode } from '@/lib/types';
import { GoogleGenAI, Type } from '@google/genai';
import { PDFParse } from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';

/**
 * PDF Parser - Parses PDF bank statements using AI
 * This is a beta feature that uses Google AI to extract transaction data from PDF text
 */
export class PDFParser implements Parser {
  private aiService?: GoogleAIService;
  private aiClient?: GoogleGenAI;
  private enabled: boolean;

  constructor() {
    // Check if PDF parsing is enabled via feature flag
    this.enabled = process.env.NEXT_PUBLIC_ENABLE_PDF_IMPORT === 'true';

    // Only initialize AI service if enabled
    if (this.enabled) {
      try {
        this.aiService = new GoogleAIService();
        // Access the client through a public getter if available, or initialize directly
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          this.aiClient = new GoogleGenAI({ apiKey });
        }
      } catch (error) {
        console.error('Failed to initialize AI service for PDF parsing:', error);
        this.enabled = false;
      }
    }
  }

  /**
   * Check if this parser can handle the file
   * Returns true only if PDF parsing is enabled and file is a PDF
   */
  canParse(file: File): boolean {
    console.log({ endsWithPdf: file.name.toLowerCase().endsWith('.pdf'), enabled: this.enabled });
    return file.name.toLowerCase().endsWith('.pdf') && this.enabled;
  }

  /**
   * Parse PDF file and extract transactions using AI
   */
  async parse(fileContent: string | Buffer): Promise<ParsedTransaction[]> {
    try {
      // Check if feature is enabled
      if (!this.enabled) {
        throw new ImportError(
          'PDF import is currently disabled. This feature is coming soon.',
          ImportErrorCode.INVALID_FILE_FORMAT,
          { featureFlag: 'NEXT_PUBLIC_ENABLE_PDF_IMPORT' },
        );
      }

      // Ensure we have a Buffer
      const buffer = typeof fileContent === 'string' ? Buffer.from(fileContent, 'utf-8') : fileContent;

      // Extract text from PDF
      const text = await this.extractText(buffer);

      if (!text || text.trim().length === 0) {
        throw new ImportError('No text content found in PDF file', ImportErrorCode.NO_TRANSACTIONS_FOUND);
      }

      // Use AI to extract transactions from text
      const transactions = await this.extractTransactions(text);

      if (transactions.length === 0) {
        throw new ImportError('No transactions found in PDF file', ImportErrorCode.NO_TRANSACTIONS_FOUND);
      }

      return transactions;
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }

      throw new ImportError(
        `Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Extract text content from PDF using pdf-parse
   * Handles multi-page PDFs
   */
  private async extractText(pdfBuffer: Buffer): Promise<string> {
    try {
      // Use PDFParse to extract text from PDF
      const pdfParse = new PDFParse({ data: pdfBuffer });
      const result = await pdfParse.getText();

      // Check if we got any text
      if (!result.text || result.text.trim().length === 0) {
        throw new Error('PDF contains no readable text');
      }

      return result.text;
    } catch (error) {
      throw new ImportError(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        {
          originalError: error,
          hint: 'The PDF may be corrupted, password-protected, or contain only images',
        },
      );
    }
  }

  /**
   * Use AI to extract structured transaction data from PDF text
   */
  private async extractTransactions(text: string): Promise<ParsedTransaction[]> {
    try {
      const prompt = `
You are an expert at extracting financial transaction data from bank statement text.

Extract all transactions from the following bank statement text. For each transaction, extract:
- date: Transaction date in YYYY-MM-DD format
- amount: Transaction amount as a positive number (remove currency symbols)
- description: Transaction description or merchant name
- type: "income" for deposits/credits, "expense" for withdrawals/debits

Important rules:
1. Only extract actual transactions (ignore headers, footers, balances, totals)
2. Convert all dates to YYYY-MM-DD format
3. All amounts should be positive numbers
4. Determine type based on context (deposits/credits = income, withdrawals/debits = expense)
5. If you cannot determine the type, default to "expense"
6. Skip any entries that are clearly not transactions (like "Saldo Anterior", "Saldo do dia", etc.)

Return a JSON array of transactions. If no transactions are found, return an empty array.

Bank statement text:
${text}
`;

      if (!this.aiClient) {
        throw new GoogleAIServiceError('AI client not initialized', 'MISSING_CLIENT');
      }

      const response = await this.aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
              },
              required: ['date', 'amount', 'description', 'type'],
            },
          },
        },
      });

      if (!response.text) {
        throw new GoogleAIServiceError('Empty response from AI', 'EMPTY_RESPONSE');
      }

      const aiTransactions = JSON.parse(response.text);

      // Validate and convert to ParsedTransaction format
      return this.convertAIResponse(aiTransactions);
    } catch (error) {
      if (error instanceof GoogleAIServiceError) {
        throw new ImportError('AI service failed to extract transactions from PDF', ImportErrorCode.AI_SERVICE_ERROR, {
          originalError: error,
        });
      }

      throw new ImportError(
        `Failed to extract transactions from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Convert AI response to ParsedTransaction format with validation
   */
  private convertAIResponse(aiTransactions: any[]): ParsedTransaction[] {
    if (!Array.isArray(aiTransactions)) {
      throw new ImportError('Invalid AI response format', ImportErrorCode.VALIDATION_ERROR, {
        expected: 'array',
        received: typeof aiTransactions,
      });
    }

    const parsedTransactions: ParsedTransaction[] = [];

    for (const aiTrn of aiTransactions) {
      try {
        // Validate required fields
        if (!aiTrn.date || !aiTrn.amount || !aiTrn.description || !aiTrn.type) {
          console.warn('Skipping transaction with missing fields:', aiTrn);
          continue;
        }

        // Validate date format
        const date = this.validateDate(aiTrn.date);

        // Validate amount
        const amount = this.validateAmount(aiTrn.amount);

        // Skip zero amounts
        if (amount === 0) {
          continue;
        }

        // Validate type
        const type = this.validateType(aiTrn.type);

        // Create parsed transaction
        const transaction: ParsedTransaction = {
          id: uuidv4(),
          date,
          amount,
          type,
          description: aiTrn.description.trim() || 'Transação sem descrição',
          metadata: {
            source: 'pdf',
            aiExtracted: true,
          },
        };

        parsedTransactions.push(transaction);
      } catch (error) {
        // Log error but continue processing other transactions
        console.error('Failed to convert AI transaction:', error, aiTrn);
      }
    }

    return parsedTransactions;
  }

  /**
   * Validate and normalize date string
   */
  private validateDate(dateStr: string): string {
    if (!dateStr || typeof dateStr !== 'string') {
      throw new Error('Invalid date value');
    }

    // Try to parse as ISO date (YYYY-MM-DD)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return dateStr;
      }
    }

    // Try other common formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Convert to ISO format
      return date.toISOString().split('T')[0];
    }

    throw new Error(`Invalid date format: ${dateStr}`);
  }

  /**
   * Validate and normalize amount
   */
  private validateAmount(amount: any): number {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (typeof num !== 'number' || isNaN(num)) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    return Math.abs(num);
  }

  /**
   * Validate and normalize transaction type
   */
  private validateType(type: string): 'income' | 'expense' {
    if (!type || typeof type !== 'string') {
      return 'expense'; // Default to expense
    }

    const normalized = type.toLowerCase().trim();

    if (normalized === 'income' || normalized.includes('receita') || normalized.includes('credit')) {
      return 'income';
    }

    if (normalized === 'expense' || normalized.includes('despesa') || normalized.includes('debit')) {
      return 'expense';
    }

    // Default to expense if unclear
    return 'expense';
  }
}
