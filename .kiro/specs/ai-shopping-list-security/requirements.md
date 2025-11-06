# Requirements Document

## Introduction

The Shopping List page currently exposes the Google AI API key in the browser by using it directly in client-side code. This creates a critical security vulnerability where anyone can extract the API key from the browser and use it for unauthorized purposes. This feature will move all AI operations to secure server-side API routes, ensuring API keys remain protected while maintaining the same user experience.

## Glossary

- **Client Component**: A React component that runs in the browser and can use client-side features like useState and event handlers
- **Server-Side API Route**: A Next.js API endpoint that runs on the server and can safely access environment variables and secrets
- **Google AI API**: The Google Generative AI service (Gemini) used for generating shopping lists, parsing invoices, and creating insights
- **NFe (Nota Fiscal Eletrônica)**: Brazilian electronic invoice that contains purchase details
- **Shopping List System**: The application feature that allows users to create shopping lists, import purchases from invoices, and get AI-powered savings insights

## Requirements

### Requirement 1

**User Story:** As a user, I want to generate shopping lists using AI without exposing API keys in my browser, so that the application remains secure

#### Acceptance Criteria

1. WHEN a user submits a shopping list prompt, THE Shopping List System SHALL send the request to a server-side API endpoint
2. THE Shopping List System SHALL receive the generated list items from the server without exposing the API key to the browser
3. THE Shopping List System SHALL display the generated items in the same format as the current implementation
4. THE Shopping List System SHALL handle loading states during the API request
5. IF the server returns an error, THEN THE Shopping List System SHALL display a user-friendly error message

### Requirement 2

**User Story:** As a user, I want to import NFe invoices using AI without exposing API keys in my browser, so that my purchase data can be parsed securely

#### Acceptance Criteria

1. WHEN a user submits an NFe URL, THE Shopping List System SHALL send the URL to a server-side API endpoint for parsing
2. THE Shopping List System SHALL receive the parsed purchase data including store name, date, total amount, and items
3. THE Shopping List System SHALL validate that all required fields are present in the parsed data
4. THE Shopping List System SHALL display the parsed purchase in a preview card before saving
5. IF the parsing fails, THEN THE Shopping List System SHALL display an error message indicating the issue

### Requirement 3

**User Story:** As a user, I want to receive AI-generated savings insights based on my purchase history without exposing API keys, so that I can make informed decisions about my spending

#### Acceptance Criteria

1. WHEN a user requests savings insights, THE Shopping List System SHALL send the purchase history to a server-side API endpoint
2. THE Shopping List System SHALL receive markdown-formatted insights from the server
3. THE Shopping List System SHALL render the insights with proper formatting including headings, lists, and bold text
4. THE Shopping List System SHALL only allow insights generation when purchase history exists
5. IF the insights generation fails, THEN THE Shopping List System SHALL display an error message

### Requirement 4

**User Story:** As a developer, I want all Google AI API calls to be made from server-side code, so that API keys are never exposed to the client

#### Acceptance Criteria

1. THE Shopping List System SHALL remove all direct Google AI API instantiation from client components
2. THE Shopping List System SHALL create three separate API routes for shopping list generation, NFe parsing, and insights generation
3. THE Shopping List System SHALL access the Google AI API key only from server-side environment variables
4. THE Shopping List System SHALL validate all incoming requests to the API routes
5. THE Shopping List System SHALL return appropriate HTTP status codes for success and error cases

### Requirement 5

**User Story:** As a developer, I want proper error handling for all AI operations, so that users receive clear feedback when something goes wrong

#### Acceptance Criteria

1. WHEN an AI operation fails, THE Shopping List System SHALL log the error details on the server
2. THE Shopping List System SHALL return a sanitized error message to the client without exposing internal details
3. THE Shopping List System SHALL handle network timeouts with appropriate error messages
4. THE Shopping List System SHALL handle invalid API responses with appropriate error messages
5. THE Shopping List System SHALL maintain the application state correctly even when errors occur
