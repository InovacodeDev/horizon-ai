# Design Document

## Overview

This design moves all Google AI API operations from the client-side Shopping List page to secure server-side API routes. The solution creates three new API endpoints that handle shopping list generation, NFe parsing, and savings insights generation. The client component will be refactored to make HTTP requests to these endpoints instead of directly calling the Google AI API.

The design follows the existing API route patterns in the codebase, including authentication verification, error handling, and response formatting. This ensures consistency with the rest of the application while addressing the critical security vulnerability.

## Architecture

### High-Level Flow

```
Client Component (shopping-list/page.tsx)
    ↓ HTTP POST
Server API Routes (/api/shopping-list/*)
    ↓ Uses Google AI API (server-side only)
Google Generative AI Service (Gemini)
    ↓ Returns AI-generated content
Server API Routes
    ↓ HTTP Response (JSON)
Client Component (displays results)
```

### Component Responsibilities

1. **Client Component** (`app/(app)/shopping-list/page.tsx`)
   - Manages UI state (loading, errors, form inputs)
   - Collects user input (prompts, URLs, purchase history)
   - Makes HTTP requests to API routes
   - Displays results and handles user interactions
   - Does NOT access Google AI API directly

2. **API Routes** (`app/api/shopping-list/*`)
   - Validates incoming requests
   - Verifies user authentication (optional, based on requirements)
   - Constructs prompts for Google AI
   - Calls Google AI API with server-side API key
   - Parses and validates AI responses
   - Returns formatted JSON responses
   - Handles errors and logging

3. **Google AI Service** (new utility module)
   - Encapsulates Google AI API initialization
   - Provides reusable methods for different AI operations
   - Manages API key access from environment variables
   - Handles common error scenarios

## Components and Interfaces

### API Routes

#### 1. POST /api/shopping-list/generate

Generates a shopping list from a user prompt.

**Request Body:**

```typescript
{
  prompt: string; // User's shopping list request
}
```

**Response (Success - 200):**

```typescript
{
  items: string[]; // Array of shopping list item names
  title: string;   // Suggested list title (same as prompt)
}
```

**Response (Error - 400/500):**

```typescript
{
  error: string; // Error code
  message: string; // User-friendly error message
}
```

#### 2. POST /api/shopping-list/parse-nfe

Parses an NFe URL to extract purchase details.

**Request Body:**

```typescript
{
  nfeUrl: string; // URL of the Brazilian electronic invoice
}
```

**Response (Success - 200):**

```typescript
{
  storeName: string;
  purchaseDate: string; // ISO 8601 format
  totalAmount: number;
  items: Array<{
    name: string;
    brand?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}
```

**Response (Error - 400/500):**

```typescript
{
  error: string;
  message: string;
}
```

#### 3. POST /api/shopping-list/insights

Generates savings insights from purchase history.

**Request Body:**

```typescript
{
  purchaseHistory: Array<{
    $id: string;
    storeName: string;
    purchaseDate: string;
    totalAmount: number;
    items: Array<{
      name: string;
      brand?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    nfeUrl?: string;
  }>;
}
```

**Response (Success - 200):**

```typescript
{
  insights: string; // Markdown-formatted insights
}
```

**Response (Error - 400/500):**

```typescript
{
  error: string;
  message: string;
}
```

### Google AI Service Module

Location: `lib/services/google-ai.service.ts`

```typescript
interface GoogleAIService {
  generateShoppingList(prompt: string): Promise<string[]>;
  parseNFe(nfeUrl: string): Promise<ParsedPurchase>;
  generateInsights(purchaseHistory: PurchaseRecord[]): Promise<string>;
}
```

This service will:

- Initialize the Google AI client once with the API key from environment
- Provide typed methods for each AI operation
- Handle Google AI-specific errors
- Validate responses from the AI

## Data Models

### Types (existing in the codebase)

```typescript
interface ShoppingListItem {
  $id: string;
  name: string;
  checked: boolean;
}

interface PurchasedItem {
  name: string;
  brand?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseRecord {
  $id: string;
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  items: PurchasedItem[];
  nfeUrl?: string;
}
```

### Request/Response Types (new)

```typescript
// Request types
interface GenerateListRequest {
  prompt: string;
}

interface ParseNFeRequest {
  nfeUrl: string;
}

interface GenerateInsightsRequest {
  purchaseHistory: PurchaseRecord[];
}

// Response types
interface GenerateListResponse {
  items: string[];
  title: string;
}

interface ParseNFeResponse {
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  items: PurchasedItem[];
}

interface GenerateInsightsResponse {
  insights: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}
```

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Missing required fields
   - Invalid data formats
   - Empty arrays when data is required

2. **Authentication Errors (401)** - Optional
   - Missing or invalid authentication token
   - Expired session

3. **AI Service Errors (500)**
   - Google AI API failures
   - Network timeouts
   - Invalid API responses
   - Rate limiting

4. **Server Errors (500)**
   - Unexpected exceptions
   - Configuration issues (missing API key)

### Error Response Format

All errors follow a consistent format:

```typescript
{
  error: "ERROR_CODE",        // Machine-readable error code
  message: "User message",    // Human-readable description
  details?: string            // Optional technical details (dev mode only)
}
```

### Client-Side Error Handling

The client component will:

1. Display loading states during API calls
2. Show user-friendly error messages in the UI
3. Log detailed errors to console for debugging
4. Maintain application state even when errors occur
5. Allow users to retry failed operations

## Testing Strategy

### Unit Tests

1. **Google AI Service Tests**
   - Test each service method with mocked Google AI responses
   - Verify error handling for API failures
   - Validate response parsing and transformation

2. **API Route Tests**
   - Test request validation
   - Test successful responses
   - Test error scenarios (missing fields, invalid data)
   - Test authentication (if implemented)

### Integration Tests

1. **End-to-End Flow Tests**
   - Test shopping list generation flow
   - Test NFe parsing flow
   - Test insights generation flow
   - Verify client-server communication

### Manual Testing

1. **Security Verification**
   - Confirm API key is not exposed in browser DevTools
   - Verify API key is not in client-side bundle
   - Check network requests don't contain sensitive data

2. **Functionality Testing**
   - Test all three AI features work as before
   - Verify error messages are user-friendly
   - Test loading states and UI feedback

## Security Considerations

### API Key Protection

1. **Environment Variables**
   - API key stored in server-only environment variable (not NEXT*PUBLIC*\*)
   - Use `GEMINI_API_KEY` (already in .env.example)
   - Never log or expose the API key in responses

2. **Client-Side Code**
   - Remove all Google AI imports from client components
   - Remove all direct API instantiation
   - Only use fetch/HTTP requests to internal API routes

### Request Validation

1. **Input Sanitization**
   - Validate all request body fields
   - Limit string lengths to prevent abuse
   - Validate URL formats for NFe URLs
   - Limit array sizes for purchase history

2. **Rate Limiting** (Future Enhancement)
   - Consider implementing rate limiting per user
   - Prevent abuse of AI API quota

### Authentication (Optional)

The design allows for optional authentication:

- If authentication is required, use `verifyRequestAuth` middleware (already in codebase)
- If not required, skip authentication for public access
- Decision can be made during implementation based on requirements

## Migration Strategy

### Phase 1: Create Server Infrastructure

1. Create Google AI service module
2. Create three API routes
3. Add request/response types

### Phase 2: Update Client Component

1. Replace Google AI calls with fetch requests
2. Update error handling
3. Update loading states
4. Test each feature individually

### Phase 3: Cleanup

1. Remove Google AI imports from client code
2. Remove unused environment variables (NEXT_PUBLIC_GOOGLE_AI_API_KEY)
3. Update .env.example if needed
4. Verify API key is not in client bundle

### Phase 4: Testing & Validation

1. Run manual tests for all features
2. Verify security (no API key exposure)
3. Test error scenarios
4. Performance testing

## Performance Considerations

1. **API Response Times**
   - Google AI calls may take 2-10 seconds
   - Client should show loading indicators
   - Consider timeout handling (30 seconds)

2. **Payload Sizes**
   - Purchase history can be large
   - Consider limiting history to recent purchases (e.g., last 50)
   - Implement pagination if needed

3. **Caching** (Future Enhancement)
   - Consider caching insights for same purchase history
   - Cache shopping lists for identical prompts
   - Use short TTL (5-10 minutes)

## Dependencies

### Existing Dependencies

- `@google/genai` (v1.25.0) - Already installed
- `next` (v16.0.0) - For API routes
- `zod` (v3.23.8) - For request validation (optional)

### New Dependencies

- None required

## Configuration

### Environment Variables

Required:

```bash
# Server-side only (no NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=your-gemini-api-key
```

Optional (if authentication is implemented):

```bash
JWT_SECRET=your-jwt-secret
```

### Next.js Configuration

No changes required to `next.config.js`.

## Rollback Plan

If issues arise:

1. Keep the old client-side code in a backup file
2. Can quickly revert by restoring the original component
3. Remove new API routes
4. Restore NEXT_PUBLIC_GOOGLE_AI_API_KEY temporarily

However, this should only be a temporary measure as the security vulnerability must be fixed.
