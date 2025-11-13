import type { CSVRow, ColumnMapping, ParsedTransaction, Parser } from '@/lib/types';
import { ImportError, ImportErrorCode } from '@/lib/types';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

/**
 * CSV Parser - Parses Comma-Separated Values (CSV) files
 * Supports multiple delimiters (comma, semicolon, tab)
 * Handles various date and amount formats
 */
export class CSVParser implements Parser {
  // Common column name variations for fuzzy matching
  private readonly DATE_COLUMNS = ['data', 'date', 'data da transação', 'data transacao', 'dt'];
  private readonly AMOUNT_COLUMNS = ['valor', 'amount', 'value', 'montante', 'vlr'];
  private readonly DESCRIPTION_COLUMNS = ['descrição', 'descricao', 'description', 'histórico', 'historico', 'desc'];
  private readonly TYPE_COLUMNS = ['tipo', 'type', 'categoria', 'category'];
  private readonly ID_COLUMNS = ['identificador', 'id', 'transaction id', 'fitid'];

  /**
   * Check if this parser can handle the file
   */
  canParse(file: File): boolean {
    return file.name.toLowerCase().endsWith('.csv');
  }

  /**
   * Parse CSV file and extract transactions
   */
  async parse(fileContent: string | Buffer): Promise<ParsedTransaction[]> {
    try {
      const content = typeof fileContent === 'string' ? fileContent : fileContent.toString('utf-8');

      // Detect delimiter
      const delimiter = this.detectDelimiter(content);

      // Parse CSV
      const parseResult = Papa.parse<CSVRow>(content, {
        delimiter,
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
      });

      if (parseResult.errors.length > 0) {
        throw new ImportError(
          `CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(', ')}`,
          ImportErrorCode.PARSE_ERROR,
          { errors: parseResult.errors },
        );
      }

      if (!parseResult.data || parseResult.data.length === 0) {
        throw new ImportError('No data found in CSV file', ImportErrorCode.NO_TRANSACTIONS_FOUND);
      }

      // Map columns to transaction fields
      const columnMapping = this.mapColumns(parseResult.meta.fields || []);

      // Validate required columns
      this.validateColumns(columnMapping);

      // Parse each row
      const transactions = this.parseRows(parseResult.data, columnMapping);

      if (transactions.length === 0) {
        throw new ImportError('No valid transactions found in CSV file', ImportErrorCode.NO_TRANSACTIONS_FOUND);
      }

      return transactions;
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }

      throw new ImportError(
        `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ImportErrorCode.PARSE_ERROR,
        { originalError: error },
      );
    }
  }

  /**
   * Detect delimiter by counting occurrences in first few lines
   */
  private detectDelimiter(content: string): string {
    const lines = content.split('\n').slice(0, 5); // Check first 5 lines
    const delimiters = [',', ';', '\t'];
    const counts: Record<string, number> = {};

    for (const delimiter of delimiters) {
      counts[delimiter] = 0;
      for (const line of lines) {
        counts[delimiter] += (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      }
    }

    // Find delimiter with highest count
    let maxCount = 0;
    let detectedDelimiter = ',';

    for (const [delimiter, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        detectedDelimiter = delimiter;
      }
    }

    return detectedDelimiter;
  }

  /**
   * Map CSV columns to transaction fields using fuzzy matching
   */
  private mapColumns(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};

    for (let i = 0; i < headers.length; i++) {
      const header = this.normalizeColumnName(headers[i]);

      // Match date column
      if (!mapping.date && this.DATE_COLUMNS.some((col) => header.includes(col))) {
        mapping.date = i;
      }

      // Match amount column
      if (!mapping.amount && this.AMOUNT_COLUMNS.some((col) => header.includes(col))) {
        mapping.amount = i;
      }

      // Match description column
      if (!mapping.description && this.DESCRIPTION_COLUMNS.some((col) => header.includes(col))) {
        mapping.description = i;
      }

      // Match type column (optional)
      if (!mapping.type && this.TYPE_COLUMNS.some((col) => header.includes(col))) {
        mapping.type = i;
      }

      // Match ID column (optional)
      if (!mapping.externalId && this.ID_COLUMNS.some((col) => header.includes(col))) {
        mapping.externalId = i;
      }
    }

    return mapping;
  }

  /**
   * Normalize column name for fuzzy matching
   * - Convert to lowercase
   * - Remove accents
   * - Remove special characters
   */
  private normalizeColumnName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .trim();
  }

  /**
   * Validate that required columns are present
   */
  private validateColumns(mapping: ColumnMapping): void {
    const missing: string[] = [];

    if (mapping.date === undefined) {
      missing.push('Data/Date');
    }

    if (mapping.amount === undefined) {
      missing.push('Valor/Amount');
    }

    if (mapping.description === undefined) {
      missing.push('Descrição/Description');
    }

    if (missing.length > 0) {
      throw new ImportError(
        `Missing required columns: ${missing.join(', ')}`,
        ImportErrorCode.MISSING_REQUIRED_COLUMNS,
        { missing },
      );
    }
  }

  /**
   * Parse CSV rows into ParsedTransaction objects
   */
  private parseRows(rows: CSVRow[], mapping: ColumnMapping): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const headers = Object.keys(rows[0] || {});

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];

      try {
        // Get values by column index
        const dateValue = headers[mapping.date!] ? row[headers[mapping.date!]] : '';
        const amountValue = headers[mapping.amount!] ? row[headers[mapping.amount!]] : '';
        const descriptionValue = headers[mapping.description!] ? row[headers[mapping.description!]] : '';
        const typeValue = mapping.type !== undefined && headers[mapping.type] ? row[headers[mapping.type]] : '';
        const externalIdValue =
          mapping.externalId !== undefined && headers[mapping.externalId] ? row[headers[mapping.externalId]] : '';

        // Skip empty rows
        if (!dateValue && !amountValue && !descriptionValue) {
          continue;
        }

        // Parse date
        const date = this.parseDate(dateValue);

        // Parse amount
        const amount = this.parseAmount(amountValue);

        // Skip zero amounts
        if (amount === 0) {
          continue;
        }

        // Determine transaction type
        const type = this.determineType(amount, typeValue);

        // Create parsed transaction
        const transaction: ParsedTransaction = {
          id: uuidv4(),
          date,
          amount: Math.abs(amount),
          type,
          description: descriptionValue || 'Transação sem descrição',
          externalId: externalIdValue || undefined,
          metadata: {
            rowIndex,
            originalAmount: amountValue,
            originalDate: dateValue,
          },
        };

        transactions.push(transaction);
      } catch (error) {
        // Log error but continue processing other rows
        console.error(`Failed to parse row ${rowIndex + 1}:`, error, row);
      }
    }

    return transactions;
  }

  /**
   * Parse date in multiple formats
   * Supports: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
   */
  private parseDate(dateStr: string): string {
    if (!dateStr || !dateStr.trim()) {
      throw new ImportError('Missing date value', ImportErrorCode.INVALID_DATE_FORMAT);
    }

    const cleaned = dateStr.trim();

    // Try DD/MM/YYYY format
    const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (this.isValidDate(isoDate)) {
        return isoDate;
      }
    }

    // Try YYYY-MM-DD format (already ISO)
    const yyyymmddMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (this.isValidDate(isoDate)) {
        return isoDate;
      }
    }

    // Try DD-MM-YYYY format
    const ddmmyyyyDashMatch = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyDashMatch) {
      const [, day, month, year] = ddmmyyyyDashMatch;
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (this.isValidDate(isoDate)) {
        return isoDate;
      }
    }

    throw new ImportError(`Invalid date format: ${dateStr}`, ImportErrorCode.INVALID_DATE_FORMAT, {
      originalDate: dateStr,
    });
  }

  /**
   * Validate ISO date string
   */
  private isValidDate(isoDate: string): boolean {
    const date = new Date(isoDate);
    return !isNaN(date.getTime());
  }

  /**
   * Parse amount with different decimal separators
   * Handles: 1234.56, 1.234,56, -1234.56, (1234.56)
   */
  private parseAmount(amountStr: string): number {
    if (!amountStr || !amountStr.trim()) {
      throw new ImportError('Missing amount value', ImportErrorCode.INVALID_AMOUNT_FORMAT);
    }

    let cleaned = amountStr.trim();

    // Handle parentheses as negative (accounting format)
    const isNegativeParens = cleaned.startsWith('(') && cleaned.endsWith(')');
    if (isNegativeParens) {
      cleaned = cleaned.slice(1, -1);
    }

    // Remove currency symbols and spaces
    cleaned = cleaned.replace(/[R$\s€£¥]/g, '');

    // Determine decimal separator
    // If there's a comma after the last period, comma is decimal
    // If there's a period after the last comma, period is decimal
    const lastComma = cleaned.lastIndexOf(',');
    const lastPeriod = cleaned.lastIndexOf('.');

    let normalized = cleaned;

    if (lastComma > lastPeriod) {
      // Comma is decimal separator (e.g., 1.234,56)
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastPeriod > lastComma) {
      // Period is decimal separator (e.g., 1,234.56)
      normalized = cleaned.replace(/,/g, '');
    } else if (lastComma !== -1) {
      // Only comma present, assume it's decimal
      normalized = cleaned.replace(',', '.');
    }
    // If only period present, it's already correct

    // Parse as float
    const amount = parseFloat(normalized);

    if (isNaN(amount)) {
      throw new ImportError(`Invalid amount format: ${amountStr}`, ImportErrorCode.INVALID_AMOUNT_FORMAT, {
        originalAmount: amountStr,
      });
    }

    // Apply negative sign if parentheses format
    return isNegativeParens ? -amount : amount;
  }

  /**
   * Determine transaction type based on amount sign and type column
   */
  private determineType(amount: number, typeValue?: string): 'income' | 'expense' {
    // If type column is provided, use it
    if (typeValue) {
      const normalized = this.normalizeColumnName(typeValue);
      if (normalized.includes('receita') || normalized.includes('income') || normalized.includes('credito')) {
        return 'income';
      }
      if (normalized.includes('despesa') || normalized.includes('expense') || normalized.includes('debito')) {
        return 'expense';
      }
    }

    // Otherwise, use amount sign
    // Negative amounts are expenses, positive are income
    return amount < 0 ? 'expense' : 'income';
  }
}
