# Implementation Plan

- [x] 1. Create Google AI service module
  - Create `lib/services/google-ai.service.ts` with typed methods for shopping list generation, NFe parsing, and insights generation
  - Initialize Google AI client with API key from `GEMINI_API_KEY` environment variable
  - Implement error handling for Google AI API failures
  - Add response validation and transformation logic
  - _Requirements: 1.1, 2.1, 3.1, 4.3_

- [x] 2. Create shopping list generation API route
  - Create `app/api/shopping-list/generate/route.ts` with POST handler
  - Validate request body contains required `prompt` field
  - Call Google AI service to generate shopping list items
  - Return formatted response with items array and title
  - Handle errors and return appropriate status codes
  - _Requirements: 1.1, 1.2, 1.4, 4.2, 4.5, 5.1, 5.2_

- [x] 3. Create NFe parsing API route
  - Create `app/api/shopping-list/parse-nfe/route.ts` with POST handler
  - Validate request body contains required `nfeUrl` field
  - Call Google AI service to parse NFe data
  - Validate parsed response contains all required fields (storeName, purchaseDate, totalAmount, items)
  - Return formatted purchase data
  - Handle parsing errors with user-friendly messages
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 4.2, 4.5, 5.1, 5.2_

- [x] 4. Create insights generation API route
  - Create `app/api/shopping-list/insights/route.ts` with POST handler
  - Validate request body contains `purchaseHistory` array
  - Check that purchase history is not empty before calling AI
  - Call Google AI service to generate markdown insights
  - Return insights in response
  - Handle errors when insights generation fails
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.2, 4.5, 5.1, 5.2_

- [x] 5. Update client component to use API routes
  - Remove all Google AI imports from `app/(app)/shopping-list/page.tsx`
  - Replace `handleGenerateList` to call `/api/shopping-list/generate` endpoint
  - Replace `handleImportNFe` to call `/api/shopping-list/parse-nfe` endpoint
  - Replace `handleGenerateInsights` to call `/api/shopping-list/insights` endpoint
  - Update error handling to display user-friendly messages from API responses
  - Maintain existing loading states and UI behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3, 3.5, 4.1, 5.3, 5.4, 5.5_

- [x] 6. Remove insecure environment variable references
  - Remove any references to `NEXT_PUBLIC_GOOGLE_AI_API_KEY` from client code
  - Verify `GEMINI_API_KEY` is used only in server-side code
  - Update `.env.example` if needed to document the correct variable name
  - _Requirements: 4.1, 4.3_

- [x] 7. Add request/response type definitions
  - Create type definitions file for API request and response types
  - Define `GenerateListRequest`, `ParseNFeRequest`, `GenerateInsightsRequest` types
  - Define `GenerateListResponse`, `ParseNFeResponse`, `GenerateInsightsResponse` types
  - Define `ErrorResponse` type for consistent error handling
  - _Requirements: 4.4, 5.2_

- [x] 8. Verify security and functionality
  - Test shopping list generation feature works correctly
  - Test NFe parsing feature works correctly
  - Test insights generation feature works correctly
  - Verify API key is not exposed in browser DevTools Network tab
  - Verify API key is not in client-side JavaScript bundle
  - Test error scenarios return appropriate messages
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3, 3.5, 4.1, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_
