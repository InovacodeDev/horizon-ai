# Requirements Document

## Introduction

This document outlines the requirements for refactoring the application architecture to follow a serverless-first approach. The goal is to move all business logic from Next.js API routes and cron jobs to Appwrite Functions, ensuring that the Next.js application acts purely as a presentation layer that performs basic CRUD operations. All business logic, calculations, and scheduled tasks should be handled by Appwrite Functions, with the UI updating reactively via Appwrite Realtime subscriptions.

## Glossary

- **Next.js Application**: The frontend application responsible for UI rendering and basic CRUD operations
- **Appwrite Functions**: Serverless functions that handle business logic, calculations, and scheduled tasks
- **Appwrite Realtime**: WebSocket-based system for real-time database change notifications
- **Cron Job**: Scheduled task that runs at specific intervals
- **Business Logic**: Any calculation, validation, or data transformation beyond simple CRUD operations
- **CRUD Operations**: Create, Read, Update, Delete operations on database entities
- **Balance Sync**: Process of calculating and updating account balances based on transactions
- **Recurring Transactions**: Transactions that repeat at regular intervals
- **Invitation Expiration**: Process of marking old invitations as expired

## Requirements

### Requirement 1: Remove Business Logic from Next.js Cron Routes

**User Story:** As a system architect, I want all scheduled business logic removed from Next.js cron routes, so that the application follows a clean serverless architecture.

#### Acceptance Criteria

1. WHEN the system identifies existing cron routes in `/app/api/cron/`, THEN the system SHALL migrate their business logic to dedicated Appwrite Functions
2. WHEN a cron route exists for processing recurring transactions, THEN the system SHALL verify that an equivalent Appwrite Function exists or create one
3. WHEN a cron route exists for expiring invitations, THEN the system SHALL verify that an equivalent Appwrite Function exists or create one
4. WHEN all business logic is migrated to Appwrite Functions, THEN the system SHALL delete the Next.js cron route files
5. WHEN cron configurations exist in `vercel.json`, THEN the system SHALL remove them after migration is complete

### Requirement 2: Remove Balance Calculation from Transaction Operations

**User Story:** As a developer, I want transaction creation/update/deletion to not trigger immediate balance calculations, so that balance updates are handled asynchronously by Appwrite Functions.

#### Acceptance Criteria

1. WHEN a transaction is created via Next.js API, THEN the system SHALL only insert the transaction record without updating account balance
2. WHEN a transaction is updated via Next.js API, THEN the system SHALL only update the transaction record without recalculating account balance
3. WHEN a transaction is deleted via Next.js API, THEN the system SHALL only delete the transaction record without adjusting account balance
4. WHEN the Balance Sync Appwrite Function detects a transaction change event, THEN the function SHALL recalculate the affected account balance
5. WHEN balance recalculation completes, THEN the UI SHALL update automatically via Appwrite Realtime subscription

### Requirement 3: Create Invitation Expiration Appwrite Function

**User Story:** As a system administrator, I want invitation expiration to be handled by an Appwrite Function, so that the Next.js application does not need to manage scheduled tasks.

#### Acceptance Criteria

1. WHEN the system creates an Invitation Expiration Function, THEN the function SHALL be configured to run daily at midnight UTC
2. WHEN the Invitation Expiration Function executes, THEN the function SHALL query all invitations with status "pending" and expiration date in the past
3. WHEN expired invitations are found, THEN the function SHALL update their status to "expired"
4. WHEN the function completes execution, THEN the function SHALL return a count of expired invitations
5. WHEN invitation status changes to expired, THEN the UI SHALL update automatically via Appwrite Realtime subscription

### Requirement 4: Verify Recurring Transactions Function

**User Story:** As a developer, I want to verify that the Recurring Transactions Function is properly configured, so that recurring transactions are created automatically without Next.js involvement.

#### Acceptance Criteria

1. WHEN the system checks for a Recurring Transactions Function, THEN the function SHALL exist in the Appwrite Functions directory
2. WHEN the Recurring Transactions Function is configured, THEN the function SHALL have a schedule trigger set to run on the 1st day of each month at midnight UTC
3. WHEN the function executes, THEN the function SHALL create new transactions for all recurring transaction templates
4. WHEN new recurring transactions are created, THEN the UI SHALL update automatically via Appwrite Realtime subscription
5. WHEN the Next.js cron route for recurring transactions exists, THEN the system SHALL remove it after verifying the Appwrite Function works correctly

### Requirement 5: Verify Balance Sync Function Configuration

**User Story:** As a developer, I want to verify that the Balance Sync Function is properly configured with both event and schedule triggers, so that account balances are always accurate.

#### Acceptance Criteria

1. WHEN the system checks the Balance Sync Function, THEN the function SHALL have database event triggers for transaction create, update, and delete operations
2. WHEN the Balance Sync Function is configured, THEN the function SHALL have a schedule trigger to run daily at 20:00 (8 PM) in the configured timezone
3. WHEN a transaction is created, updated, or deleted, THEN the Balance Sync Function SHALL execute automatically via event trigger
4. WHEN the scheduled execution runs, THEN the function SHALL process all due transactions that have reached their date
5. WHEN balance updates complete, THEN the UI SHALL reflect the new balances via Appwrite Realtime subscription

### Requirement 6: Remove Manual Balance Recalculation Actions

**User Story:** As a developer, I want to remove or deprecate manual balance recalculation actions from Next.js, so that balance management is fully automated via Appwrite Functions.

#### Acceptance Criteria

1. WHEN the system identifies manual balance recalculation actions in `actions/balance-sync.actions.ts`, THEN the system SHALL evaluate if they are still needed
2. WHEN manual recalculation actions are no longer needed, THEN the system SHALL mark them as deprecated with clear documentation
3. WHEN a manual recalculation is absolutely necessary, THEN the action SHALL trigger the Appwrite Balance Sync Function instead of performing calculations directly
4. WHEN the `reprocessAllBalancesAction` is called, THEN the system SHALL invoke the Balance Sync Function with the user ID
5. WHEN the `processDueTransactionsAction` is called, THEN the system SHALL invoke the Balance Sync Function instead of using the local service

### Requirement 7: Update Next.js Transaction API to Pure CRUD

**User Story:** As a developer, I want the Next.js transaction API to perform only CRUD operations, so that all business logic is handled by Appwrite Functions.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/transactions`, THEN the system SHALL create the transaction record and return immediately without balance calculations
2. WHEN a PUT/PATCH request is made to `/api/transactions/:id`, THEN the system SHALL update the transaction record and return immediately without balance calculations
3. WHEN a DELETE request is made to `/api/transactions/:id`, THEN the system SHALL delete the transaction record and return immediately without balance calculations
4. WHEN a GET request is made to `/api/transactions`, THEN the system SHALL return transaction records with optional filtering and pagination
5. WHEN any transaction mutation occurs, THEN the Appwrite Function SHALL handle balance updates asynchronously

### Requirement 8: Implement Realtime UI Updates

**User Story:** As a user, I want the UI to update automatically when data changes, so that I always see the most current information without manual refresh.

#### Acceptance Criteria

1. WHEN the user views the accounts page, THEN the system SHALL subscribe to account document changes via Appwrite Realtime
2. WHEN an account balance is updated by an Appwrite Function, THEN the UI SHALL reflect the new balance immediately without page refresh
3. WHEN the user views the transactions page, THEN the system SHALL subscribe to transaction collection changes via Appwrite Realtime
4. WHEN a new transaction is created by an Appwrite Function, THEN the UI SHALL display the new transaction immediately
5. WHEN an invitation status changes to expired, THEN the UI SHALL update the invitation list automatically

### Requirement 9: Document Serverless Architecture

**User Story:** As a developer, I want clear documentation of the serverless architecture, so that I understand which components handle which responsibilities.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THEN the system SHALL provide documentation listing all Appwrite Functions and their purposes
2. WHEN documentation is created, THEN the documentation SHALL clearly state that Next.js handles only CRUD operations and UI rendering
3. WHEN documentation is created, THEN the documentation SHALL explain how Appwrite Functions handle all business logic and scheduled tasks
4. WHEN documentation is created, THEN the documentation SHALL include diagrams showing the data flow between Next.js, Appwrite Functions, and the database
5. WHEN documentation is created, THEN the documentation SHALL provide examples of how to add new business logic as Appwrite Functions

### Requirement 10: Clean Up Deprecated Code

**User Story:** As a developer, I want all deprecated cron routes and business logic removed from Next.js, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN all Appwrite Functions are verified and working, THEN the system SHALL delete the `/app/api/cron/` directory
2. WHEN cron routes are deleted, THEN the system SHALL remove cron configurations from `vercel.json`
3. WHEN balance calculation logic exists in transaction services, THEN the system SHALL remove or deprecate it with clear comments
4. WHEN manual balance sync actions are deprecated, THEN the system SHALL add deprecation warnings and migration guides
5. WHEN cleanup is complete, THEN the system SHALL verify that no business logic remains in Next.js API routes or actions
