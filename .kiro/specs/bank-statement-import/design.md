# Design Document: Bank Statement Import System

## Overview

The Bank Statement Import System enables users to import financial transactions from multiple file formats (OFX, CSV, and PDF). The system follows a pipeline architecture with distinct stages: file upload, format detection, parsing, validation, duplicate detection, preview, and transaction creation. The design emphasizes modularity, allowing each parser to be developed and tested independently while sharing common validation and mapping logic.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ File Upload  │  │   Preview    │  │  Import History      │  │
│  │  Component   │  │  Component   │  │    Component         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/transactions/import                           │   │
│  │  POST /api/transactions/import/preview                   │   │
│  │  GET  /api/transactions/import/history                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ImportService                                           │   │
│  │  - processImport()                                       │   │
│  │  - previewImport()                                       │   │
│  │  - detectDuplicates()                                    │   │
│  │  - createImportRecord()                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Parser Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ OFX Parser   │  │  CSV Parser  │  │    PDF Parser        │  │
│  │              │  │              │  │  (AI-powered)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Transaction Mapper                            │
│  - Normalize parsed data                                        │
│  - Validate fields                                              │
│  - Assign categories                                            │
│  - Convert to CreateTransactionDto                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Database (Appwrite)                           │
│  - Transactions collection                                      │
│  - Import history collection                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

1. **UI Components**: Handle file selection, display preview, show progress, and manage user interactions
2. **API Routes**: Validate requests, handle file uploads, coordinate service calls, return responses
3. **Import Service**: Orchestrate the import process, manage state, coordinate parsers and mappers
4. **Parsers**: Extract transaction data from specific file formats
5. **Transaction Mapper**: Normalize and validate parsed data into application format
6. **Database**: Persist transactions and import history

## Components and Interfaces

### 1. File Upload Component

**Location**: `components/transactions/ImportTransactionsModal.tsx`

**Purpose**: Provide UI for file selection and upload

**Key Features**:

- Drag-and-drop file upload
- File format validation (client-side)
- File size validation (max 10MB)
- Account selection dropdown
- Progress indicator
- Error display

**Props**:

```typescript
interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
  accounts: Account[];
}
```

**State**:

```typescript
interface ImportState {
  step: 'upload' | 'preview' | 'importing' | 'complete';
  file: File | null;
  selectedAccount: string | null;
  parsedTransactions: ParsedTransaction[];
  selectedTransactions: Set<string>;
  duplicates: Set<string>;
  error: string | null;
  progress: number;
}
```

### 2. Import Preview Component

**Location**: `components/transactions/ImportPreview.tsx`

**Purpose**: Display parsed transactions for review before import

**Key Features**:

- Table view of transactions
- Checkbox selection for each transaction
- Duplicate highlighting
- Summary statistics
- Category display and editing
- Select all/deselect all

**Props**:

```typescript
interface ImportPreviewProps {
  transactions: ParsedTransaction[];
  duplicates: Set<string>;
  selectedTransactions: Set<string>;
  onToggleTransaction: (id: string) => void;
  onToggleAll: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### 3. Import History Component

**Location**: `components/transactions/ImportHistory.tsx`

**Purpose**: Display past imports

**Key Features**:

- List of past imports
- Import details (date, file, count, account)
- Link to view imported transactions

**Props**:

```typescript
interface ImportHistoryProps {
  imports: ImportRecord[];
  onViewDetails: (importId: string) => void;
}
```

### 4. API Routes

#### POST /api/transactions/import/preview

**Purpose**: Parse file and return preview data

**Request**:

```typescript
// FormData with:
// - file: File
// - accountId: string
```

**Response**:

```typescript
interface ImportPreviewResponse {
  success: boolean;
  data?: {
    transactions: ParsedTransaction[];
    duplicates: string[]; // IDs of potential duplicates
    summary: {
      total: number;
      income: number;
      expense: number;
      duplicateCount: number;
    };
  };
  error?: string;
}
```

#### POST /api/transactions/import

**Purpose**: Create transactions from selected preview items

**Request**:

```typescript
interface ImportRequest {
  accountId: string;
  transactions: ParsedTransaction[];
  fileName: string;
}
```

**Response**:

```typescript
interface ImportResponse {
  success: boolean;
  data?: {
    imported: number;
    failed: number;
    importId: string;
  };
  error?: string;
}
```

#### GET /api/transactions/import/history

**Purpose**: Retrieve import history

**Response**:

```typescript
interface ImportHistoryResponse {
  success: boolean;
  data?: ImportRecord[];
  error?: string;
}
```

### 5. Import Service

**Location**: `lib/services/import.service.ts`

**Purpose**: Orchestrate the import process

**Key Methods**:

```typescript
class ImportService {
  /**
   * Parse file and return preview data
   */
  async previewImport(file: File, accountId: string, userId: string): Promise<ImportPreviewResult>;

  /**
   * Create transactions from preview
   */
  async processImport(
    transactions: ParsedTransaction[],
    accountId: string,
    userId: string,
    fileName: string,
  ): Promise<ImportResult>;

  /**
   * Detect duplicate transactions
   */
  async detectDuplicates(transactions: ParsedTransaction[], accountId: string, userId: string): Promise<Set<string>>;

  /**
   * Get import history for user
   */
  async getImportHistory(userId: string): Promise<ImportRecord[]>;

  /**
   * Create import record
   */
  private async createImportRecord(
    userId: string,
    fileName: string,
    accountId: string,
    transactionCount: number,
  ): Promise<string>;
}
```

### 6. Parser Interfaces

**Base Parser Interface**:

```typescript
interface Parser {
  /**
   * Check if this parser can handle the file
   */
  canParse(file: File): boolean;

  /**
   * Parse file and extract transactions
   */
  parse(fileContent: string | Buffer): Promise<ParsedTransaction[]>;
}
```

**Parsed Transaction Format**:

```typescript
interface ParsedTransaction {
  id: string; // Temporary ID for preview
  date: string; // ISO 8601 format
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category?: string;
  externalId?: string; // FITID, Identificador, etc.
  metadata?: Record<string, any>;
}
```

### 7. OFX Parser

**Location**: `lib/services/parsers/ofx.parser.ts`

**Dependencies**:

- `fast-xml-parser` (to be added) - for XML parsing
- Or custom SGML parser for OFX 1.0

**Key Logic**:

```typescript
class OFXParser implements Parser {
  canParse(file: File): boolean {
    return file.name.toLowerCase().endsWith('.ofx');
  }

  async parse(fileContent: string): Promise<ParsedTransaction[]> {
    // 1. Detect OFX version (SGML vs XML)
    // 2. Parse header
    // 3. Extract BANKTRANLIST
    // 4. Parse each STMTTRN
    // 5. Convert to ParsedTransaction format
    // 6. Return array
  }

  private parseOFXv1(content: string): any {
    // Parse SGML format
  }

  private parseOFXv2(content: string): any {
    // Parse XML format using fast-xml-parser
  }

  private convertTransaction(stmttrn: any): ParsedTransaction {
    // Convert OFX transaction to ParsedTransaction
  }
}
```

**OFX Field Mapping**:

- `TRNTYPE` → `type` (CREDIT=income, DEBIT=expense)
- `DTPOSTED` → `date` (convert to ISO 8601)
- `TRNAMT` → `amount` (absolute value)
- `NAME` + `MEMO` → `description`
- `FITID` → `externalId`

### 8. CSV Parser

**Location**: `lib/services/parsers/csv.parser.ts`

**Dependencies**:

- `papaparse` (to be added) - for CSV parsing

**Key Logic**:

```typescript
class CSVParser implements Parser {
  canParse(file: File): boolean {
    return file.name.toLowerCase().endsWith('.csv');
  }

  async parse(fileContent: string): Promise<ParsedTransaction[]> {
    // 1. Detect delimiter
    // 2. Parse CSV
    // 3. Identify header row
    // 4. Map columns to fields
    // 5. Parse each row
    // 6. Convert to ParsedTransaction format
    // 7. Return array
  }

  private detectDelimiter(content: string): string {
    // Count occurrences of common delimiters
  }

  private mapColumns(headers: string[]): ColumnMapping {
    // Map CSV columns to transaction fields
  }

  private parseDate(dateStr: string): string {
    // Parse various date formats to ISO 8601
  }

  private parseAmount(amountStr: string): number {
    // Handle different decimal separators
  }
}
```

**Column Mapping Strategy**:

- Fuzzy match column names (case-insensitive, accent-insensitive)
- Support common variations:
  - Date: "Data", "Date", "Data da Transação"
  - Amount: "Valor", "Amount", "Value"
  - Description: "Descrição", "Description", "Histórico"
  - ID: "Identificador", "ID", "Transaction ID"

### 9. PDF Parser

**Location**: `lib/services/parsers/pdf.parser.ts`

**Dependencies**:

- `pdf-parse` (to be added) - for PDF text extraction
- Google AI service (existing) - for structured data extraction

**Key Logic**:

```typescript
class PDFParser implements Parser {
  private aiService: GoogleAIService;
  private enabled: boolean;

  constructor() {
    this.aiService = getGoogleAIService();
    this.enabled = process.env.ENABLE_PDF_IMPORT === 'true';
  }

  canParse(file: File): boolean {
    return file.name.toLowerCase().endsWith('.pdf') && this.enabled;
  }

  async parse(fileContent: Buffer): Promise<ParsedTransaction[]> {
    // 1. Extract text from PDF
    // 2. Send to AI for structured extraction
    // 3. Validate AI response
    // 4. Convert to ParsedTransaction format
    // 5. Return array
  }

  private async extractText(pdfBuffer: Buffer): Promise<string> {
    // Use pdf-parse to extract text
  }

  private async extractTransactions(text: string): Promise<any[]> {
    // Use AI to extract structured data
  }
}
```

**AI Prompt Design**:

```typescript
const prompt = `
You are a financial data extraction expert. Extract transaction data from the following bank statement text.

For each transaction, extract:
- date: Transaction date in YYYY-MM-DD format
- amount: Transaction amount as a number (positive for income, negative for expenses)
- description: Transaction description
- type: "income" or "expense"

Return a JSON array of transactions. If no transactions are found, return an empty array.

Bank statement text:
${text}
`;
```

### 10. Transaction Mapper

**Location**: `lib/services/mappers/transaction.mapper.ts`

**Purpose**: Convert parsed data to application format

**Key Logic**:

```typescript
class TransactionMapper {
  /**
   * Map parsed transaction to CreateTransactionDto
   */
  mapToDto(parsed: ParsedTransaction, accountId: string, userId: string): CreateTransactionDto {
    return {
      user_id: userId,
      amount: Math.abs(parsed.amount),
      type: parsed.type,
      date: parsed.date,
      category: this.assignCategory(parsed.description),
      description: parsed.description,
      account_id: accountId,
      currency: 'BRL',
      source: 'import',
      status: 'completed',
      // Store original data in metadata
      integration_data: {
        externalId: parsed.externalId,
        originalDescription: parsed.description,
        importDate: new Date().toISOString(),
        ...parsed.metadata,
      },
    };
  }

  /**
   * Assign category based on description keywords
   */
  private assignCategory(description: string): string {
    const desc = description.toLowerCase();

    // Pix transfers
    if (desc.includes('pix')) {
      return desc.includes('recebido') ? 'income' : 'transfer';
    }

    // Bills and utilities
    if (desc.includes('boleto') || desc.includes('conta') || desc.includes('celesc') || desc.includes('energia')) {
      return 'utilities';
    }

    // Card purchases
    if (desc.includes('cartão') || desc.includes('card')) {
      return 'shopping';
    }

    // Transportation
    if (desc.includes('uber') || desc.includes('99')) {
      return 'transportation';
    }

    // Default
    return 'other';
  }

  /**
   * Validate parsed transaction
   */
  validate(parsed: ParsedTransaction): boolean {
    if (!parsed.date || !this.isValidDate(parsed.date)) {
      return false;
    }

    if (typeof parsed.amount !== 'number' || parsed.amount === 0) {
      return false;
    }

    if (!parsed.description || parsed.description.trim().length === 0) {
      return false;
    }

    if (!['income', 'expense'].includes(parsed.type)) {
      return false;
    }

    return true;
  }

  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
}
```

## Data Models

### Import Record

**Collection**: `import_history`

```typescript
interface ImportRecord {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  account_id: string;
  file_name: string;
  file_format: 'ofx' | 'csv' | 'pdf';
  transaction_count: number;
  import_date: string;
  status: 'completed' | 'failed' | 'partial';
  error_message?: string;
  metadata?: string; // JSON string
}
```

### Transaction Metadata Extension

Add to existing Transaction.data JSON:

```typescript
interface ImportMetadata {
  source: 'import';
  externalId?: string; // FITID, Identificador
  importId?: string; // Reference to import record
  importDate: string;
  originalDescription?: string;
  fileFormat?: 'ofx' | 'csv' | 'pdf';
}
```

## Error Handling

### Error Types

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

### Error Messages

User-friendly error messages in Portuguese:

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

## Testing Strategy

### Unit Tests

1. **Parser Tests**:
   - Test each parser with valid files
   - Test with malformed files
   - Test edge cases (empty files, single transaction, many transactions)
   - Test date parsing variations
   - Test amount parsing variations

2. **Mapper Tests**:
   - Test category assignment logic
   - Test validation rules
   - Test DTO conversion

3. **Duplicate Detection Tests**:
   - Test exact matches
   - Test fuzzy matches (date ±2 days, amount ±0.01)
   - Test with external IDs

### Integration Tests

1. **End-to-End Import Flow**:
   - Upload file → Parse → Preview → Import → Verify
   - Test with each file format
   - Test with duplicate transactions
   - Test with invalid data

2. **API Tests**:
   - Test all endpoints
   - Test error responses
   - Test authentication/authorization

### Test Data

Use the existing sample files in `/public/assets`:

- `Extrato conta corrente - 112025.ofx`
- `NU_69759831_01NOV2025_11NOV2025.csv`
- `NU_69759831_01NOV2025_11NOV2025.pdf`

## Security Considerations

### File Upload Security

1. **File Validation**:
   - Validate file extension
   - Validate MIME type
   - Validate file size
   - Scan for malicious content

2. **Temporary Storage**:
   - Store uploaded files in memory or temporary directory
   - Delete files after processing (max 1 hour retention)
   - Use unique, non-guessable filenames
   - Restrict file access to owner only

3. **Data Privacy**:
   - Never log sensitive transaction data
   - Sanitize error messages
   - Use HTTPS for all uploads
   - Don't send full file content to AI (only extracted text)

### Authentication & Authorization

1. **API Protection**:
   - Require authentication for all import endpoints
   - Validate user owns the target account
   - Rate limit import requests (max 10 per hour per user)

2. **Data Access**:
   - Users can only import to their own accounts
   - Users can only view their own import history
   - Validate account ownership before import

## Performance Considerations

### File Processing

1. **Streaming**:
   - Process large files in chunks when possible
   - Use streaming parsers for CSV and XML

2. **Batch Operations**:
   - Create transactions in batches (100 at a time)
   - Use Appwrite batch operations when available

3. **Caching**:
   - Cache parsed data during preview phase
   - Use session storage for preview state

### Optimization

1. **Lazy Loading**:
   - Load parsers only when needed
   - Lazy load AI service for PDF parsing

2. **Progress Tracking**:
   - Report progress during long operations
   - Allow cancellation of in-progress imports

## Dependencies to Add

```json
{
  "dependencies": {
    "fast-xml-parser": "^4.3.2",
    "papaparse": "^5.4.1",
    "pdf-parse": "^1.1.1"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14",
    "@types/pdf-parse": "^1.1.4"
  }
}
```

## Future Enhancements

1. **Automatic Bank Detection**:
   - Detect bank from OFX file metadata
   - Auto-match to existing accounts

2. **Smart Category Learning**:
   - Learn from user's category assignments
   - Improve category suggestions over time

3. **Scheduled Imports**:
   - Allow users to schedule recurring imports
   - Email notifications when new statements are available

4. **Multi-Account Import**:
   - Import transactions for multiple accounts from single file
   - Split transactions by account automatically

5. **Import Templates**:
   - Save CSV column mappings as templates
   - Reuse templates for future imports from same bank

6. **Advanced Duplicate Detection**:
   - Use ML to improve duplicate detection
   - Consider merchant name, location, time of day

7. **Import Reconciliation**:
   - Compare imported transactions with manual entries
   - Suggest merging or marking as duplicates

## Implementation Notes

### Phase 1: Core Infrastructure

- Set up file upload API
- Implement OFX parser
- Implement CSV parser
- Create transaction mapper
- Build basic UI

### Phase 2: Preview & Validation

- Implement duplicate detection
- Build preview component
- Add validation logic
- Create import history

### Phase 3: PDF Support (Beta)

- Implement PDF parser
- Integrate AI service
- Add feature flag
- Test with various PDF formats

### Phase 4: Polish & Optimization

- Improve error messages
- Add progress indicators
- Optimize performance
- Add comprehensive tests
