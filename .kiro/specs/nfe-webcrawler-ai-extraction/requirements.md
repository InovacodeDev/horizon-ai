# Requirements Document

## Introduction

This feature implements a robust web crawler system for extracting Brazilian fiscal invoice (NFe/NFCe) data from government portals. The system will crawl invoice pages, extract HTML content, and use AI to parse and structure the invoice data intelligently. The AI prompt will be optimized for caching by placing variable input at the end.

## Glossary

- **NFe/NFCe**: Brazilian electronic fiscal invoices (Nota Fiscal Eletrônica/Nota Fiscal de Consumidor Eletrônica)
- **Invoice Key**: A 44-digit unique identifier for each Brazilian fiscal invoice
- **Web Crawler**: A system that fetches and extracts data from web pages
- **AI Parser**: An AI-based system that converts unstructured HTML/text into structured invoice data
- **Government Portal**: Official Brazilian state tax authority websites that host invoice data
- **Prompt Caching**: Optimization technique where static parts of AI prompts are cached to reduce costs and latency

## Requirements

### Requirement 1

**User Story:** As a user, I want to submit an encrypted NFCe URL and have the system automatically extract the invoice key, so that I can access invoice data without manual key extraction

#### Acceptance Criteria

1. WHEN a user submits an encrypted government portal URL, THE System SHALL fetch the HTML page content
2. WHEN the HTML page is fetched, THE System SHALL extract the 44-digit invoice key from the page content
3. IF the invoice key is found in a formatted pattern (with spaces), THEN THE System SHALL remove all spaces to create a valid 44-digit key
4. IF the invoice key cannot be extracted, THEN THE System SHALL return an error with code INVOICE_KEY_NOT_FOUND

### Requirement 2

**User Story:** As a user, I want the system to crawl the invoice page and extract all visible data, so that I can access complete invoice information even when XML is not available

#### Acceptance Criteria

1. WHEN the invoice key is extracted, THE System SHALL attempt to fetch the invoice page HTML
2. WHEN the HTML is fetched, THE System SHALL extract all relevant invoice sections including merchant info, items table, and totals
3. THE System SHALL handle different HTML structures from various state portals (Santa Catarina, Rio Grande do Sul, São Paulo, etc.)
4. IF the page requires multiple requests or redirects, THE System SHALL follow them up to a maximum of 5 redirects
5. THE System SHALL set appropriate timeout of 30 seconds per request

### Requirement 3

**User Story:** As a user, I want the system to use AI to parse the extracted HTML into structured invoice data, so that I can receive consistent data regardless of portal format variations

#### Acceptance Criteria

1. WHEN HTML content is extracted, THE System SHALL send it to an AI parser with a structured prompt
2. THE AI prompt SHALL place all variable input (HTML content) at the end to enable prompt caching
3. THE AI parser SHALL extract merchant information including CNPJ, name, and address
4. THE AI parser SHALL extract invoice metadata including number, series, and issue date
5. THE AI parser SHALL extract all line items with description, quantity, unit price, and total price
6. THE AI parser SHALL extract totals including subtotal, discounts, taxes, and final amount
7. THE AI parser SHALL return data in a predefined JSON schema
8. IF the AI cannot parse required fields, THEN THE System SHALL return an error with code AI_PARSE_ERROR

### Requirement 4

**User Story:** As a user, I want the system to validate and normalize the AI-extracted data, so that I can trust the accuracy of the parsed information

#### Acceptance Criteria

1. WHEN AI returns parsed data, THE System SHALL validate that all required fields are present
2. THE System SHALL validate that numeric values (prices, quantities) are valid numbers
3. THE System SHALL validate that the CNPJ format is correct (14 digits)
4. THE System SHALL validate that dates are in valid format
5. THE System SHALL normalize currency values to remove formatting and convert to numbers
6. THE System SHALL calculate and verify that item totals match the sum of individual items
7. IF validation fails, THEN THE System SHALL return an error with code VALIDATION_ERROR and details about which fields failed

### Requirement 5

**User Story:** As a user, I want the system to cache parsed invoices, so that repeated requests for the same invoice are fast and don't waste resources

#### Acceptance Criteria

1. WHEN an invoice is successfully parsed, THE System SHALL cache the result using the invoice key as cache key
2. THE System SHALL set cache TTL to 24 hours
3. WHEN a cached invoice is requested, THE System SHALL return the cached data without re-crawling or re-parsing
4. THE System SHALL include cache metadata in the response indicating if data was from cache
5. THE System SHALL provide a way to bypass cache with a force-refresh parameter

### Requirement 6

**User Story:** As a user, I want detailed error messages when invoice extraction fails, so that I can understand what went wrong and potentially fix the issue

#### Acceptance Criteria

1. WHEN any step fails, THE System SHALL return a structured error with error code and message
2. THE System SHALL include the failing URL in error details
3. THE System SHALL include the step that failed (key extraction, HTML fetch, AI parsing, validation)
4. THE System SHALL log detailed error information for debugging
5. THE System SHALL not expose sensitive information (API keys, internal paths) in error messages

### Requirement 7

**User Story:** As a developer, I want the AI prompt to be optimized for caching, so that we minimize API costs and improve response times

#### Acceptance Criteria

1. THE AI prompt SHALL have a static instruction section that defines the task and output format
2. THE AI prompt SHALL place all variable content (HTML input) at the end of the prompt
3. THE static instruction section SHALL be at least 1024 tokens to qualify for prompt caching
4. THE System SHALL use the same prompt structure for all invoices to maximize cache hits
5. THE System SHALL include JSON schema definition in the static section
6. THE System SHALL include example outputs in the static section for few-shot learning
