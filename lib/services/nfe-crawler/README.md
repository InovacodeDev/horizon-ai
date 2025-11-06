# NFe Web Crawler with AI Extraction

This module provides a robust system for extracting Brazilian fiscal invoice (NFe/NFCe) data from government portals using web crawling and AI-powered parsing.

## Architecture

The system consists of five main components:

### 1. Web Crawler Service (`web-crawler.service.ts`)

- Fetches HTML content from government portals
- Extracts 44-digit invoice keys from URLs and HTML
- Handles redirects and different portal formats
- Implements retry logic and timeout management

### 2. AI Parser Service (`ai-parser.service.ts`)

- Uses AI (Anthropic/OpenAI) to parse HTML into structured data
- Implements prompt caching optimization
- Extracts merchant info, items, and totals
- Returns data in standardized JSON format

### 3. Validator Service (`validator.service.ts`)

- Validates AI-extracted data
- Normalizes currency values and dates
- Verifies CNPJ format
- Checks totals match item sums

### 4. Cache Manager (`cache-manager.ts`)

- Caches parsed invoices with LRU eviction
- Supports TTL (24 hours default)
- Tracks cache hit/miss statistics
- Prevents redundant processing

### 5. Invoice Parser Service (orchestrator)

- Coordinates the complete extraction flow
- Handles errors from all services
- Manages cache operations
- Returns structured responses with metadata

## Directory Structure

```
lib/services/nfe-crawler/
├── README.md                    # This file
├── index.ts                     # Main export point
├── types.ts                     # TypeScript type definitions
├── interfaces.ts                # Service interface definitions
├── errors.ts                    # Custom error classes
├── constants.ts                 # Configuration constants
├── web-crawler.service.ts       # Web crawler implementation
├── ai-parser.service.ts         # AI parser implementation
├── validator.service.ts         # Validator implementation
└── cache-manager.ts             # Cache manager implementation
```

## Core Types

### ParsedInvoice

Complete invoice data structure with merchant info, items, totals, and metadata.

### AIParseResponse

Structured response from AI parser with merchant, invoice, items, and totals.

### ServiceResponse<T>

Union type for success/error responses with proper typing.

## Error Handling

All errors extend `InvoiceParserError` with structured error codes:

- `INVOICE_KEY_NOT_FOUND` - Could not extract invoice key
- `HTML_FETCH_ERROR` - Failed to fetch HTML
- `AI_PARSE_ERROR` - AI parsing failed
- `VALIDATION_ERROR` - Data validation failed
- `NETWORK_ERROR` - Network request failed
- `TIMEOUT_ERROR` - Request timed out

## Usage Example

```typescript
import { invoiceParserService } from '@/lib/services/nfe-crawler';

// Parse from URL
const result = await invoiceParserService.parseFromUrl('https://sat.sef.sc.gov.br/nfce/consulta?p=...');

if (result.success) {
  console.log('Invoice:', result.data);
  console.log('From cache:', result.metadata?.fromCache);
} else {
  console.error('Error:', result.error, result.code);
}

// Parse from QR code
const qrResult = await invoiceParserService.parseFromQRCode(qrData);

// Force refresh (bypass cache)
const freshResult = await invoiceParserService.parseFromUrl(url, true);
```

## Configuration

Configuration is managed through constants in `constants.ts`:

- `DEFAULT_CRAWLER_CONFIG` - Web crawler settings
- `DEFAULT_AI_CONFIG` - AI provider and model settings
- `DEFAULT_CACHE_TTL` - Cache time-to-live
- `VALIDATION_RULES` - Data validation rules

### Environment Variables

The following environment variables can be configured in your `.env` file:

#### AI Configuration

- **`AI_PROVIDER`** (optional)
  - AI provider to use for invoice parsing
  - Options: `anthropic` (default), `openai`
  - Default: `anthropic`

- **`AI_API_KEY`** (required)
  - API key for the selected AI provider
  - For Anthropic: Get from https://console.anthropic.com/
  - For OpenAI: Get from https://platform.openai.com/api-keys
  - Alternative: Use provider-specific keys (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`)

- **`AI_MODEL`** (optional)
  - AI model to use for parsing
  - For Anthropic: `claude-3-5-sonnet-20241022` (recommended), `claude-3-opus-20240229`, `claude-3-sonnet-20240229`
  - For OpenAI: `gpt-4-turbo-preview`, `gpt-4`, `gpt-3.5-turbo`
  - Default: `claude-3-5-sonnet-20241022`

#### Cache Configuration

- **`CACHE_TTL`** (optional)
  - Cache time-to-live for parsed invoices in milliseconds
  - Default: `86400000` (24 hours)
  - Set to `0` to disable caching

- **`MAX_CACHE_SIZE`** (optional)
  - Maximum number of invoices to cache in memory
  - Default: `1000`
  - Uses LRU eviction when limit is reached

#### Web Crawler Configuration

- **`CRAWLER_TIMEOUT`** (optional)
  - Maximum time to wait for a single HTTP request in milliseconds
  - Default: `30000` (30 seconds)

- **`CRAWLER_MAX_REDIRECTS`** (optional)
  - Maximum number of redirects to follow
  - Default: `5`

- **`CRAWLER_RETRY_ATTEMPTS`** (optional)
  - Number of retry attempts for failed requests
  - Default: `2`

- **`CRAWLER_RETRY_DELAY`** (optional)
  - Delay between retry attempts in milliseconds
  - Default: `1000` (1 second)

- **`MAX_HTML_SIZE`** (optional)
  - Maximum HTML content size to process in bytes
  - Default: `5242880` (5MB)
  - Prevents memory issues with extremely large pages

### Example Configuration

```env
# AI Configuration
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-api03-xxx
AI_MODEL=claude-3-5-sonnet-20241022

# Cache Configuration
CACHE_TTL=86400000
MAX_CACHE_SIZE=1000

# Web Crawler Configuration
CRAWLER_TIMEOUT=30000
CRAWLER_MAX_REDIRECTS=5
CRAWLER_RETRY_ATTEMPTS=2
CRAWLER_RETRY_DELAY=1000
MAX_HTML_SIZE=5242880
```

## Implementation Status

- [x] Task 1: Project structure and core interfaces ✅
- [x] Task 2: Web Crawler Service ✅
- [x] Task 3: AI Parser Service ✅
- [x] Task 4: Validator Service ✅
- [x] Task 5: Cache Manager ✅
- [x] Task 6: Invoice Parser Service orchestrator ✅
- [x] Task 7: Environment configuration ✅
- [ ] Task 8: API endpoint updates
- [ ] Task 9: Logging and monitoring
- [ ] Task 10: Integration tests

## Design Principles

1. **Separation of Concerns**: Each service has a single responsibility
2. **Type Safety**: Full TypeScript typing with strict interfaces
3. **Error Handling**: Structured errors with codes and details
4. **Caching**: Optimized for performance with prompt and data caching
5. **Extensibility**: Interfaces allow for easy testing and mocking
6. **Documentation**: Comprehensive JSDoc comments throughout

## Next Steps

Proceed to Task 2 to implement the Web Crawler Service with:

- `fetchWithRedirects` method with timeout and retry logic
- `extractInvoiceKey` method with multiple regex patterns
- `fetchInvoiceHtml` method with proper headers
