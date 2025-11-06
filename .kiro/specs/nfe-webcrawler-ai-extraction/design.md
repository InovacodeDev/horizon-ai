# Design Document

## Overview

The NFe Web Crawler with AI Extraction system provides a robust solution for extracting Brazilian fiscal invoice data from government portals. The system consists of three main components: a web crawler that fetches HTML content, an AI parser that extracts structured data, and a validation layer that ensures data quality. The design prioritizes prompt caching optimization by structuring AI prompts with static instructions first and variable input last.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   API Endpoint  │
│  /api/invoices  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     Invoice Parser Service              │
│  (Orchestrates the extraction flow)     │
└────────┬────────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Web Crawler  │ │  AI Parser   │ │  Validator   │ │ Cache Manager│
│   Service    │ │   Service    │ │   Service    │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Component Responsibilities

1. **Invoice Parser Service**: Main orchestrator that coordinates the extraction flow
2. **Web Crawler Service**: Fetches HTML content from government portals
3. **AI Parser Service**: Uses AI to extract structured data from HTML
4. **Validator Service**: Validates and normalizes extracted data
5. **Cache Manager**: Handles caching of parsed invoices

## Components and Interfaces

### 1. Web Crawler Service

**Purpose**: Fetch HTML content from government portals and extract invoice keys

**Interface**:

```typescript
interface WebCrawlerService {
  // Extract invoice key from URL by fetching and parsing HTML
  extractInvoiceKey(url: string): Promise<string>;

  // Fetch full invoice page HTML
  fetchInvoiceHtml(url: string): Promise<string>;

  // Follow redirects and handle different portal formats
  fetchWithRedirects(url: string, maxRedirects: number): Promise<string>;
}
```

**Key Methods**:

- `extractInvoiceKey()`: Fetches the page and searches for the 44-digit key using regex patterns
- `fetchInvoiceHtml()`: Retrieves the complete HTML content with proper headers and timeout
- `fetchWithRedirects()`: Handles redirect chains common in government portals

**Configuration**:

```typescript
const CRAWLER_CONFIG = {
  timeout: 30000, // 30 seconds
  maxRedirects: 5,
  userAgent: 'Mozilla/5.0 (compatible; InvoiceParser/1.0)',
  retryAttempts: 2,
  retryDelay: 1000, // 1 second
};
```

### 2. AI Parser Service

**Purpose**: Use AI to extract structured invoice data from HTML content

**Interface**:

```typescript
interface AIParserService {
  // Parse HTML content into structured invoice data
  parseInvoiceHtml(html: string, invoiceKey: string): Promise<ParsedInvoice>;

  // Build optimized prompt with caching
  buildPrompt(html: string): string;
}
```

**Prompt Structure** (optimized for caching):

```
[STATIC SECTION - Cached]
You are an expert at extracting structured data from Brazilian fiscal invoices (NFe/NFCe).

Your task is to extract invoice information from HTML content and return it in the following JSON format:

{
  "merchant": {
    "cnpj": "string (14 digits, numbers only)",
    "name": "string",
    "tradeName": "string (optional)",
    "address": "string",
    "city": "string",
    "state": "string (2 letters)"
  },
  "invoice": {
    "number": "string",
    "series": "string",
    "issueDate": "string (ISO 8601 format: YYYY-MM-DD)"
  },
  "items": [
    {
      "description": "string",
      "productCode": "string (optional)",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "discountAmount": number
    }
  ],
  "totals": {
    "subtotal": number,
    "discount": number,
    "tax": number,
    "total": number
  }
}

IMPORTANT RULES:
1. Extract ALL items from the invoice, do not skip any
2. Convert all currency values to numbers (remove R$, dots for thousands, use dot for decimal)
3. Convert dates from DD/MM/YYYY to YYYY-MM-DD format
4. Remove all formatting from CNPJ (dots, slashes, hyphens)
5. If a field is not found, use null for optional fields or empty string for required fields
6. Ensure all numeric calculations are correct
7. Return ONLY valid JSON, no additional text

EXAMPLE INPUT:
<html>
  <div class="txtTopo">SUPERMERCADO EXEMPLO LTDA</div>
  <div>CNPJ: 12.345.678/0001-90</div>
  <div>Número: 123456 Série: 1 Emissão: 03/11/2025</div>
  <table id="tabResult">
    <tr id="Item + 1">
      <td><span class="txtTit">ARROZ 5KG</span></td>
      <td><span class="valor">25,90</span></td>
    </tr>
  </table>
  <div>Valor total R$: 25,90</div>
</html>

EXAMPLE OUTPUT:
{
  "merchant": {
    "cnpj": "12345678000190",
    "name": "SUPERMERCADO EXEMPLO LTDA",
    "tradeName": null,
    "address": "",
    "city": "",
    "state": ""
  },
  "invoice": {
    "number": "123456",
    "series": "1",
    "issueDate": "2025-11-03"
  },
  "items": [
    {
      "description": "ARROZ 5KG",
      "productCode": null,
      "quantity": 1,
      "unitPrice": 25.90,
      "totalPrice": 25.90,
      "discountAmount": 0
    }
  ],
  "totals": {
    "subtotal": 25.90,
    "discount": 0,
    "tax": 0,
    "total": 25.90
  }
}

[VARIABLE SECTION - Not Cached]
Now extract data from this HTML:

{HTML_CONTENT_HERE}
```

**AI Provider Configuration**:

```typescript
const AI_CONFIG = {
  provider: 'anthropic', // or 'openai'
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0, // Deterministic output
  maxTokens: 4096,
  cacheControl: {
    type: 'ephemeral', // Enable prompt caching
  },
};
```

### 3. Validator Service

**Purpose**: Validate and normalize AI-extracted data

**Interface**:

```typescript
interface ValidatorService {
  // Validate complete parsed invoice
  validate(data: ParsedInvoice): ValidationResult;

  // Normalize currency values
  normalizeCurrency(value: string | number): number;

  // Validate CNPJ format
  validateCNPJ(cnpj: string): boolean;

  // Validate date format
  validateDate(date: string): boolean;

  // Verify totals match item sum
  verifyTotals(items: ParsedInvoiceItem[], totals: InvoiceTotals): boolean;
}
```

**Validation Rules**:

```typescript
const VALIDATION_RULES = {
  merchant: {
    cnpj: { required: true, pattern: /^\d{14}$/ },
    name: { required: true, minLength: 3 },
    state: { pattern: /^[A-Z]{2}$/ },
  },
  invoice: {
    number: { required: true },
    series: { required: true },
    issueDate: { required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
  },
  items: {
    minItems: 1,
    description: { required: true },
    quantity: { required: true, min: 0 },
    unitPrice: { required: true, min: 0 },
    totalPrice: { required: true, min: 0 },
  },
  totals: {
    total: { required: true, min: 0 },
  },
};
```

### 4. Cache Manager

**Purpose**: Cache parsed invoices to improve performance

**Interface**:

```typescript
interface CacheManager {
  // Get cached invoice
  get(invoiceKey: string): ParsedInvoice | null;

  // Set cached invoice
  set(invoiceKey: string, data: ParsedInvoice, ttl: number): void;

  // Clear cache for specific invoice
  clear(invoiceKey: string): void;

  // Check if invoice is cached
  has(invoiceKey: string): boolean;
}
```

**Cache Strategy**:

- Use in-memory cache with LRU eviction
- TTL: 24 hours (86400000 ms)
- Max cache size: 1000 invoices
- Cache key format: `parsed_invoice:{invoiceKey}`

## Data Models

### ParsedInvoice

```typescript
interface ParsedInvoice {
  invoiceKey: string;
  invoiceNumber: string;
  series: string;
  issueDate: Date;
  merchant: MerchantInfo;
  items: ParsedInvoiceItem[];
  totals: InvoiceTotals;
  xmlData: string; // Store original HTML for reference
  category?: InvoiceCategory;
  metadata?: {
    parsedAt: Date;
    fromCache: boolean;
    parsingMethod: 'ai' | 'xml' | 'html';
  };
}
```

### AIParseResponse

```typescript
interface AIParseResponse {
  merchant: {
    cnpj: string;
    name: string;
    tradeName?: string | null;
    address: string;
    city: string;
    state: string;
  };
  invoice: {
    number: string;
    series: string;
    issueDate: string; // ISO 8601 format
  };
  items: Array<{
    description: string;
    productCode?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountAmount: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
}
```

## Error Handling

### Error Types

```typescript
enum InvoiceParserErrorCode {
  INVOICE_KEY_NOT_FOUND = 'INVOICE_KEY_NOT_FOUND',
  HTML_FETCH_ERROR = 'HTML_FETCH_ERROR',
  AI_PARSE_ERROR = 'AI_PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: string; // Human-readable message
  code: InvoiceParserErrorCode;
  details?: {
    url?: string;
    step?: 'key_extraction' | 'html_fetch' | 'ai_parse' | 'validation';
    validationErrors?: string[];
    [key: string]: any;
  };
}
```

## Testing Strategy

### Unit Tests

- Test web crawler with mocked fetch responses
- Test AI parser prompt building
- Test validator with various valid/invalid inputs
- Test cache manager operations

### Integration Tests

- Test complete flow from URL to parsed invoice
- Test with real HTML samples from different portals
- Test error scenarios (network failures, invalid HTML, AI errors)
- Test cache hit/miss scenarios

### E2E Tests

- Test with real government portal URLs (use test invoices)
- Verify AI parsing accuracy with known invoices
- Test performance and caching effectiveness

## Performance Considerations

1. **Prompt Caching**: Static prompt section (~2000 tokens) will be cached, reducing API costs by ~90% for repeated requests
2. **Response Caching**: Parsed invoices cached for 24 hours, eliminating redundant processing
3. **Parallel Processing**: Multiple invoices can be processed concurrently
4. **Timeout Management**: 30-second timeout prevents hanging requests
5. **Retry Logic**: 2 retry attempts with exponential backoff for transient failures

## Security Considerations

1. **Input Validation**: Validate all URLs before fetching
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Error Sanitization**: Don't expose internal paths or API keys in errors
4. **SSRF Protection**: Validate that URLs point to known government portals
5. **Content Size Limits**: Limit HTML content size to prevent memory issues (max 5MB)

## Deployment Considerations

1. **Environment Variables**:
   - `AI_PROVIDER`: 'anthropic' or 'openai'
   - `AI_API_KEY`: API key for AI provider
   - `AI_MODEL`: Model to use for parsing
   - `CACHE_TTL`: Cache TTL in milliseconds
   - `CRAWLER_TIMEOUT`: Timeout for web requests

2. **Monitoring**:
   - Track AI parsing success rate
   - Monitor cache hit rate
   - Track average response time
   - Alert on high error rates

3. **Logging**:
   - Log all invoice parsing attempts
   - Log AI prompt tokens used
   - Log validation failures with details
   - Log cache operations
