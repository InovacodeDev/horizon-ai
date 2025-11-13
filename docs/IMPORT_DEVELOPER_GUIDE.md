# Developer Guide: Bank Statement Import System

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Parser Interface](#parser-interface)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Extending the System](#extending-the-system)
- [Testing](#testing)
- [Security Considerations](#security-considerations)

## Architecture Overview

The import system follows a modular pipeline architecture:

```
User Upload → API → Import Service → Parser → Mapper → Database
```

### Key Components

1. **API Layer** (`app/api/transactions/import/`)
   - Handles file uploads
   - Validates requests
   - Coordinates service calls

2. **Import Service** (`lib/services/import.service.ts`)
   - Orchestrates the import process
   - Manages duplicate detection
   - Creates import records

3. **Parsers** (`lib/services/parsers/`)
   - Extract data from specific file formats
   - Implement common `Parser` interface

4. **Transaction Mapper** (`lib/services/mappers/transaction.mapper.ts`)
   - Normalizes parsed data
   - Validates fields
   - Assigns categories

5. **UI Components** (`components/transactions/`)
   - File upload interface
   - Preview and confirmation
   - Progress tracking

## Parser Interface

All parsers must implement the `Parser` interface:

```typescript
interface Parser {
  /**
   * Check if this parser can handle the given file
   * @param file - The file to check
   * @returns true if this parser can handle the file
   */
  canParse(file: File): boolean;

  /**
   * Parse the file and extract transactions
   * @param fileContent - File content as string or Buffer
   * @returns Array of parsed transactions
   * @throws ImportError if parsing fails
   */
  parse(fileContent: string | Buffer): Promise<ParsedTransaction[]>;
}
```

### ParsedTransaction Type

```typescript
interface ParsedTransaction {
  id: string; // Temporary ID for preview (use crypto.randomUUID())
  date: string; // ISO 8601 format (YYYY-MM-DD)
  amount: number; // Absolute value (always positive)
  type: 'income' | 'expense';
  description: string; // Transaction description
  category?: string; // Optional category hint
  externalId?: string; // External identifier (FITID, etc.)
  metadata?: Record<string, any>; // Additional data
}
```

### Example: Creating a Custom Parser

```typescript
import { ImportError, ImportErrorCode, ParsedTransaction, Parser } from '@/lib/types';

export class CustomParser implements Parser {
  canParse(file: File): boolean {
    return file.name.toLowerCase().endsWith('.custom');
  }

  async parse(fileContent: string): Promise<ParsedTransaction[]> {
    try {
      // Parse your custom format
      const lines = fileContent.split('\n');
      const transactions: ParsedTransaction[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        const [date, description, amount] = line.split('|');

        transactions.push({
          id: crypto.randomUUID(),
          date: this.parseDate(date),
          amount: Math.abs(parseFloat(amount)),
          type: parseFloat(amount) < 0 ? 'expense' : 'income',
          description: description.trim(),
        });
      }

      return transactions;
    } catch (error) {
      throw new ImportError('Failed to parse custom format', ImportErrorCode.PARSE_ERROR, { originalError: error });
    }
  }

  private parseDate(dateStr: string): string {
    // Convert to ISO 8601
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}
```

### Registering a Parser

Add your parser to the Import Service:

```typescript
// lib/services/import.service.ts
import { CustomParser } from './parsers/custom.parser';

export class ImportService {
  private parsers: Parser[] = [
    new OFXParser(),
    new CSVParser(),
    new PDFParser(),
    new CustomParser(), // Add your parser
  ];

  // ...
}
```

## API Endpoints

### POST /api/transactions/import/preview

Preview transactions from uploaded file without creating them.

**Request**:

```typescript
// FormData
{
  file: File,        // The uploaded file
  accountId: string  // Target account ID
}
```

**Response**:

```typescript
{
  success: boolean;
  data?: {
    transactions: ParsedTransaction[];
    duplicates: string[];  // IDs of potential duplicates
    summary: {
      total: number;
      income: number;
      expense: number;
      duplicateCount: number;
      totalAmount: number;
    };
    matchedAccountId?: string;  // Auto-detected account (OFX only)
    accountInfo?: any;          // Account metadata (OFX only)
  };
  error?: string;
}
```

**Example**:

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('accountId', accountId);

const response = await fetch('/api/transactions/import/preview', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

---

### POST /api/transactions/import

Create transactions from preview.

**Request**:

```typescript
{
  accountId: string;
  transactions: ParsedTransaction[];
  fileName: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  data?: {
    imported: number;  // Number of successfully imported transactions
    failed: number;    // Number of failed transactions
    importId: string;  // Import record ID
  };
  error?: string;
}
```

**Example**:

```typescript
const response = await fetch('/api/transactions/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    accountId,
    transactions: selectedTransactions,
    fileName: file.name,
  }),
});

const result = await response.json();
```

---

### GET /api/transactions/import/history

Get import history for the authenticated user.

**Response**:

```typescript
{
  success: boolean;
  data?: ImportRecord[];
  error?: string;
}

interface ImportRecord {
  $id: string;
  $createdAt: string;
  user_id: string;
  account_id: string;
  file_name: string;
  file_format: 'ofx' | 'csv' | 'pdf';
  transaction_count: number;
  import_date: string;
  status: 'completed' | 'failed' | 'partial';
  error_message?: string;
}
```

**Example**:

```typescript
const response = await fetch('/api/transactions/import/history');
const result = await response.json();
```

## Error Handling

### Error Codes

```typescript
enum ImportErrorCode {
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NO_TRANSACTIONS_FOUND = 'NO_TRANSACTIONS_FOUND',
  DUPLICATE_IMPORT = 'DUPLICATE_IMPORT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
}
```

### ImportError Class

```typescript
class ImportError extends Error {
  constructor(
    message: string,
    public code: ImportErrorCode,
    public details?: any,
  ) {
    super(message);
    this.name = 'ImportError';
  }
}
```

### Error Messages

User-friendly messages in Portuguese:

```typescript
const ERROR_MESSAGES: Record<ImportErrorCode, string> = {
  INVALID_FILE_FORMAT: 'Formato de arquivo não suportado. Use .ofx, .csv ou .pdf',
  FILE_TOO_LARGE: 'Arquivo muito grande. O tamanho máximo é 10MB',
  PARSE_ERROR: 'Erro ao processar o arquivo. Verifique se o formato está correto',
  VALIDATION_ERROR: 'Dados inválidos encontrados no arquivo',
  NO_TRANSACTIONS_FOUND: 'Nenhuma transação encontrada no arquivo',
  DUPLICATE_IMPORT: 'Este arquivo já foi importado anteriormente',
  DATABASE_ERROR: 'Erro ao salvar as transações. Tente novamente',
  AI_SERVICE_ERROR: 'Erro ao processar PDF. Tente novamente mais tarde',
};
```

### Throwing Errors

```typescript
// In parser
if (transactions.length === 0) {
  throw new ImportError('No transactions found in file', ImportErrorCode.NO_TRANSACTIONS_FOUND);
}

// In service
try {
  await database.createTransaction(transaction);
} catch (error) {
  throw new ImportError('Failed to save transaction', ImportErrorCode.DATABASE_ERROR, { originalError: error });
}
```

### Handling Errors in API

```typescript
// app/api/transactions/import/preview/route.ts
try {
  const result = await importService.previewImport(file, accountId, userId);
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  if (error instanceof ImportError) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error.code, true) },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Extending the System

### Adding a New File Format

1. **Create the Parser**

```typescript
// lib/services/parsers/qif.parser.ts
import { ImportError, ImportErrorCode, ParsedTransaction, Parser } from '@/lib/types';

export class QIFParser implements Parser {
  canParse(file: File): boolean {
    return file.name.toLowerCase().endsWith('.qif');
  }

  async parse(fileContent: string): Promise<ParsedTransaction[]> {
    const transactions: ParsedTransaction[] = [];
    const entries = fileContent.split('^\n');

    for (const entry of entries) {
      if (!entry.trim()) continue;

      const transaction = this.parseEntry(entry);
      if (transaction) {
        transactions.push(transaction);
      }
    }

    if (transactions.length === 0) {
      throw new ImportError('No transactions found', ImportErrorCode.NO_TRANSACTIONS_FOUND);
    }

    return transactions;
  }

  private parseEntry(entry: string): ParsedTransaction | null {
    const lines = entry.split('\n');
    let date = '';
    let amount = 0;
    let description = '';

    for (const line of lines) {
      const code = line.charAt(0);
      const value = line.substring(1).trim();

      switch (code) {
        case 'D': // Date
          date = this.parseDate(value);
          break;
        case 'T': // Amount
          amount = parseFloat(value);
          break;
        case 'P': // Payee
          description = value;
          break;
      }
    }

    if (!date || !description) return null;

    return {
      id: crypto.randomUUID(),
      date,
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      description,
    };
  }

  private parseDate(dateStr: string): string {
    // QIF format: MM/DD/YYYY or MM/DD/YY
    const parts = dateStr.split('/');
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    let year = parts[2];

    if (year.length === 2) {
      year = '20' + year;
    }

    return `${year}-${month}-${day}`;
  }
}
```

2. **Register the Parser**

```typescript
// lib/services/import.service.ts
import { QIFParser } from './parsers/qif.parser';

export class ImportService {
  private parsers: Parser[] = [
    new OFXParser(),
    new CSVParser(),
    new PDFParser(),
    new QIFParser(), // Add here
  ];
}
```

3. **Update File Validation**

```typescript
// components/transactions/ImportTransactionsModal.tsx
const validateFile = (file: File): string | null => {
  const validExtensions = ['.ofx', '.csv', '.pdf', '.qif']; // Add .qif
  // ...
};
```

4. **Update UI**

```typescript
// Update help text
<p className="text-xs text-text-tertiary">
  Formatos suportados: OFX, CSV, QIF, PDF (máx. 10MB)
</p>
```

5. **Add Tests**

```typescript
// tests/qif-parser.test.ts
import { QIFParser } from '@/lib/services/parsers/qif.parser';

describe('QIFParser', () => {
  const parser = new QIFParser();

  it('should parse QIF file', async () => {
    const content = `!Type:Bank
D01/15/2025
T-50.00
PGrocery Store
^
D01/16/2025
T100.00
PSalary
^`;

    const transactions = await parser.parse(content);

    expect(transactions).toHaveLength(2);
    expect(transactions[0].type).toBe('expense');
    expect(transactions[1].type).toBe('income');
  });
});
```

### Adding Custom Category Rules

```typescript
// lib/services/mappers/transaction.mapper.ts
export class TransactionMapper {
  private categoryRules: Array<{
    pattern: RegExp;
    category: string;
  }> = [
    { pattern: /pix recebido/i, category: 'income' },
    { pattern: /pix/i, category: 'transfer' },
    { pattern: /netflix|spotify|amazon prime/i, category: 'subscriptions' },
    { pattern: /uber|99|taxi/i, category: 'transportation' },
    // Add your custom rules here
  ];

  private assignCategory(description: string): string {
    for (const rule of this.categoryRules) {
      if (rule.pattern.test(description)) {
        return rule.category;
      }
    }
    return 'other';
  }
}
```

### Customizing Duplicate Detection

```typescript
// lib/services/import.service.ts
export class ImportService {
  async detectDuplicates(transactions: ParsedTransaction[], accountId: string, userId: string): Promise<Set<string>> {
    const duplicates = new Set<string>();

    for (const transaction of transactions) {
      // Check by external ID
      if (transaction.externalId) {
        const existing = await this.findByExternalId(transaction.externalId, accountId, userId);
        if (existing) {
          duplicates.add(transaction.id);
          continue;
        }
      }

      // Fuzzy matching
      const dateRange = this.getDateRange(transaction.date, 2); // ±2 days
      const amountRange = {
        min: transaction.amount - 0.01,
        max: transaction.amount + 0.01,
      };

      const existing = await this.findSimilarTransaction(
        accountId,
        userId,
        dateRange,
        amountRange,
        transaction.description,
      );

      if (existing) {
        duplicates.add(transaction.id);
      }
    }

    return duplicates;
  }

  // Customize date range
  private getDateRange(date: string, days: number) {
    const d = new Date(date);
    return {
      start: new Date(d.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(d.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}
```

## Testing

### Unit Tests

#### Testing Parsers

```typescript
// tests/ofx-parser.test.ts
import { OFXParser } from '@/lib/services/parsers/ofx.parser';

describe('OFXParser', () => {
  const parser = new OFXParser();

  describe('canParse', () => {
    it('should accept .ofx files', () => {
      const file = new File([''], 'statement.ofx', { type: 'application/x-ofx' });
      expect(parser.canParse(file)).toBe(true);
    });

    it('should reject non-ofx files', () => {
      const file = new File([''], 'statement.csv', { type: 'text/csv' });
      expect(parser.canParse(file)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse valid OFX file', async () => {
      const content = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20251101</DTPOSTED>
            <TRNAMT>-50.00</TRNAMT>
            <FITID>12345</FITID>
            <NAME>Test Transaction</NAME>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

      const transactions = await parser.parse(content);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        amount: 50.0,
        type: 'expense',
        description: 'Test Transaction',
        externalId: '12345',
      });
    });

    it('should throw error for malformed OFX', async () => {
      const content = 'invalid ofx content';

      await expect(parser.parse(content)).rejects.toThrow();
    });
  });
});
```

#### Testing Transaction Mapper

```typescript
// tests/transaction-mapper.test.ts
import { TransactionMapper } from '@/lib/services/mappers/transaction.mapper';

describe('TransactionMapper', () => {
  const mapper = new TransactionMapper();

  describe('mapToDto', () => {
    it('should convert parsed transaction to DTO', () => {
      const parsed = {
        id: 'temp-123',
        date: '2025-11-01',
        amount: 50.0,
        type: 'expense' as const,
        description: 'Test',
        externalId: 'ext-123',
      };

      const dto = mapper.mapToDto(parsed, 'account-id', 'user-id');

      expect(dto).toMatchObject({
        user_id: 'user-id',
        account_id: 'account-id',
        amount: 50.0,
        type: 'expense',
        date: '2025-11-01',
        description: 'Test',
        source: 'import',
        status: 'completed',
      });
      expect(dto.integration_data?.externalId).toBe('ext-123');
    });
  });

  describe('validate', () => {
    it('should validate correct transaction', () => {
      const transaction = {
        id: '123',
        date: '2025-11-01',
        amount: 50.0,
        type: 'expense' as const,
        description: 'Test',
      };

      expect(mapper.validate(transaction)).toBe(true);
    });

    it('should reject transaction with zero amount', () => {
      const transaction = {
        id: '123',
        date: '2025-11-01',
        amount: 0,
        type: 'expense' as const,
        description: 'Test',
      };

      expect(mapper.validate(transaction)).toBe(false);
    });
  });
});
```

### Integration Tests

```typescript
// tests/import-integration.test.ts
import { ImportService } from '@/lib/services/import.service';

describe('Import Integration', () => {
  const importService = new ImportService();

  it('should complete full import flow', async () => {
    // 1. Preview
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const preview = await importService.previewImport(file, 'account-id', 'user-id');

    expect(preview.transactions.length).toBeGreaterThan(0);

    // 2. Import
    const result = await importService.processImport(preview.transactions, 'account-id', 'user-id', 'test.csv');

    expect(result.imported).toBe(preview.transactions.length);
    expect(result.failed).toBe(0);

    // 3. Verify history
    const history = await importService.getImportHistory('user-id');
    expect(history.length).toBeGreaterThan(0);
  });
});
```

### API Tests

```typescript
// tests/import-api.test.ts
import { POST } from '@/app/api/transactions/import/preview/route';

describe('Import API', () => {
  it('should preview transactions', async () => {
    const formData = new FormData();
    formData.append('file', new File([csvContent], 'test.csv'));
    formData.append('accountId', 'account-id');

    const request = new Request('http://localhost/api/transactions/import/preview', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.transactions).toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/ofx-parser.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Security Considerations

### File Upload Security

#### 1. File Validation

```typescript
// Validate file type
const validateFile = (file: File): string | null => {
  // Check extension
  const validExtensions = ['.ofx', '.csv', '.pdf'];
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

  if (!validExtensions.includes(extension)) {
    return 'Invalid file format';
  }

  // Check MIME type
  const validMimeTypes = ['application/x-ofx', 'text/csv', 'application/csv', 'application/pdf'];

  if (!validMimeTypes.includes(file.type) && file.type !== '') {
    return 'Invalid MIME type';
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'File too large';
  }

  return null;
};
```

#### 2. Content Validation

```typescript
// Scan for malicious content
const scanContent = (content: string): boolean => {
  // Check for script tags
  if (/<script/i.test(content)) {
    return false;
  }

  // Check for SQL injection patterns
  if (/(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b).*\bTABLE\b/i.test(content)) {
    return false;
  }

  // Check for command injection
  if (/[;&|`$()]/.test(content)) {
    return false;
  }

  return true;
};
```

#### 3. Temporary File Handling

```typescript
// Store files securely
const storeTemporaryFile = async (file: File): Promise<string> => {
  // Generate unique, non-guessable filename
  const filename = `${crypto.randomUUID()}-${Date.now()}`;
  const filepath = path.join(os.tmpdir(), 'imports', filename);

  // Ensure directory exists
  await fs.mkdir(path.dirname(filepath), { recursive: true });

  // Write file
  const buffer = await file.arrayBuffer();
  await fs.writeFile(filepath, Buffer.from(buffer));

  // Schedule cleanup (1 hour)
  setTimeout(
    async () => {
      try {
        await fs.unlink(filepath);
      } catch (error) {
        console.error('Failed to cleanup temp file:', error);
      }
    },
    60 * 60 * 1000,
  );

  return filepath;
};
```

### Authentication & Authorization

#### 1. Require Authentication

```typescript
// app/api/transactions/import/preview/route.ts
export async function POST(request: Request) {
  // Verify user is authenticated
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // ... rest of handler
}
```

#### 2. Verify Account Ownership

```typescript
// Verify user owns the account
const verifyAccountOwnership = async (accountId: string, userId: string): Promise<boolean> => {
  const account = await database.getAccount(accountId);

  if (!account) {
    return false;
  }

  // Check direct ownership
  if (account.user_id === userId) {
    return true;
  }

  // Check shared access
  const hasAccess = await database.checkSharedAccess(accountId, userId);
  return hasAccess;
};
```

#### 3. Rate Limiting

```typescript
// Implement rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
});

export async function POST(request: Request) {
  const session = await getSession();
  const { success } = await ratelimit.limit(session.userId);

  if (!success) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  // ... rest of handler
}
```

### Data Privacy

#### 1. Sanitize Logs

```typescript
// Never log sensitive data
const logImport = (userId: string, fileName: string, count: number) => {
  // ✅ Good - no sensitive data
  console.log(`Import completed: user=${userId}, count=${count}`);

  // ❌ Bad - contains transaction data
  // console.log(`Import completed:`, transactions);
};
```

#### 2. Secure Error Messages

```typescript
// Don't expose internal details
try {
  await database.createTransaction(transaction);
} catch (error) {
  // ✅ Good - generic message
  throw new ImportError('Failed to save transaction', ImportErrorCode.DATABASE_ERROR);

  // ❌ Bad - exposes database details
  // throw new Error(`Database error: ${error.message}`);
}
```

#### 3. HTTPS Only

```typescript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
  return NextResponse.json(
    { success: false, error: 'HTTPS required' },
    { status: 403 }
  );
}
```

### Audit Logging

```typescript
// Log all import operations
const auditLog = async (userId: string, action: string, details: Record<string, any>) => {
  await database.createAuditLog({
    user_id: userId,
    action,
    details: JSON.stringify(details),
    timestamp: new Date().toISOString(),
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
  });
};

// Usage
await auditLog(userId, 'import_preview', {
  fileName: file.name,
  fileSize: file.size,
  accountId,
});

await auditLog(userId, 'import_complete', {
  importId: result.importId,
  transactionCount: result.imported,
  failed: result.failed,
});
```

## Performance Optimization

### 1. Batch Operations

```typescript
// Create transactions in batches
const BATCH_SIZE = 100;

for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
  const batch = transactions.slice(i, i + BATCH_SIZE);
  await database.createTransactionsBatch(batch);
}
```

### 2. Streaming Large Files

```typescript
// Stream large CSV files
import { parse } from 'csv-parse';

const parseCSVStream = async (fileStream: ReadableStream): Promise<ParsedTransaction[]> => {
  const transactions: ParsedTransaction[] = [];

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
  });

  for await (const record of parser) {
    transactions.push(this.parseRecord(record));
  }

  return transactions;
};
```

### 3. Caching

```typescript
// Cache duplicate detection queries
import { LRUCache } from 'lru-cache';

const duplicateCache = new LRUCache<string, boolean>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
});

const isDuplicate = async (transaction: ParsedTransaction): Promise<boolean> => {
  const cacheKey = `${transaction.date}-${transaction.amount}-${transaction.description}`;

  const cached = duplicateCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = await checkDuplicate(transaction);
  duplicateCache.set(cacheKey, result);

  return result;
};
```

## Troubleshooting

### Common Issues

#### Parser Not Found

**Problem**: File is uploaded but no parser can handle it

**Solution**:

- Verify parser is registered in ImportService
- Check `canParse()` method logic
- Ensure file extension matches

#### Transactions Not Saving

**Problem**: Preview works but import fails

**Solution**:

- Check database connection
- Verify user permissions
- Check transaction validation
- Review error logs

#### Slow Performance

**Problem**: Import takes too long

**Solution**:

- Implement batch operations
- Use streaming for large files
- Add caching for duplicate detection
- Optimize database queries

## Resources

- [OFX Specification](https://www.ofx.net/downloads.html)
- [CSV RFC 4180](https://tools.ietf.org/html/rfc4180)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## Contributing

When contributing to the import system:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test with real bank files
5. Consider security implications
6. Add error handling
7. Update user guide if needed

---

**Last Updated**: November 2025  
**Version**: 1.0
