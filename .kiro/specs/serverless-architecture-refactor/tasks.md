# Implementation Plan

- [-] 1. Verify and configure existing Appwrite Functions
  - Verify Balance Sync Function deployment and configuration
  - Verify Recurring Transactions Function deployment and configuration
  - Test both functions manually to ensure they work correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 1.1 Verify Balance Sync Function configuration
  - Check that the function exists in Appwrite Console
  - Verify event triggers are configured: `databases.*.collections.transactions.documents.*.create`, `databases.*.collections.transactions.documents.*.update`, `databases.*.collections.transactions.documents.*.delete`
  - Verify schedule trigger is configured: `0 20 * * *` (Daily at 20:00)
  - Verify environment variables are set: `APPWRITE_ENDPOINT`, `APPWRITE_DATABASE_ID`, `APPWRITE_API_KEY`
  - _Requirements: 5.1, 5.2_

- [-] 1.2 Test Balance Sync Function manually
  - Execute function manually via Appwrite Console with test payload: `{ "userId": "test-user-id" }`
  - Verify function logs show successful execution
  - Create a test transaction and verify the function triggers automatically
  - Verify account balance is updated correctly
  - _Requirements: 5.3, 5.4_

- [x] 1.3 Verify Recurring Transactions Function configuration
  - Check that the function exists in Appwrite Console
  - Verify schedule trigger is configured: `0 0 1 * *` (1st of month at 00:00)
  - Verify environment variables are set
  - _Requirements: 4.1, 4.2_

- [ ] 1.4 Test Recurring Transactions Function manually
  - Create a test recurring transaction in the database with `is_recurring: true`
  - Execute function manually via Appwrite Console
  - Verify new transaction is created for current month
  - Verify `recurring_parent_id` is set correctly
  - Verify no duplicate transactions are created
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 2. Create and deploy Expire Invitations Appwrite Function
  - Create function directory structure
  - Implement invitation expiration logic
  - Configure schedule trigger
  - Deploy and test the function
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Create function directory and files
  - Create directory `functions/expire-invitations/`
  - Create `functions/expire-invitations/src/index.ts` with function implementation
  - Create `functions/expire-invitations/package.json` with dependencies
  - Create `functions/expire-invitations/tsconfig.json` for TypeScript configuration
  - Create `functions/expire-invitations/README.md` with documentation
  - _Requirements: 3.1_

- [x] 2.2 Implement invitation expiration logic
  - Write function to query pending invitations with expired dates
  - Implement logic to update invitation status to "expired"
  - Add pagination support for large datasets
  - Add error handling and logging
  - Return count of expired invitations
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 2.3 Configure and deploy Expire Invitations Function
  - Deploy function to Appwrite via Console or CLI
  - Configure schedule trigger: `0 0 * * *` (Daily at 00:00)
  - Set environment variables: `APPWRITE_ENDPOINT`, `APPWRITE_DATABASE_ID`, `APPWRITE_API_KEY`
  - Verify deployment is successful
  - _Requirements: 3.1_

- [x] 2.4 Test Expire Invitations Function
  - Create test invitations with past expiration dates
  - Execute function manually via Appwrite Console
  - Verify invitations are marked as expired
  - Check function logs for any errors
  - Verify function returns correct count
  - _Requirements: 3.4, 3.5_

- [x] 3. Refactor Next.js transaction API to pure CRUD
  - Remove balance calculation logic from transaction API routes
  - Remove calls to BalanceSyncService
  - Ensure API routes only perform database operations
  - Update error handling to be CRUD-focused
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3.1 Refactor POST /api/transactions route
  - Open `app/api/transactions/route.ts`
  - Remove any balance calculation or sync logic from POST handler
  - Ensure the route only creates the transaction record
  - Return immediately after database operation
  - Test that transaction creation works without balance updates
  - _Requirements: 7.1, 7.5_

- [x] 3.2 Refactor PUT/PATCH /api/transactions/:id route
  - Locate transaction update route (may be in `app/api/transactions/[id]/route.ts`)
  - Remove any balance recalculation logic from update handler
  - Ensure the route only updates the transaction record
  - Return immediately after database operation
  - _Requirements: 7.2, 7.5_

- [x] 3.3 Refactor DELETE /api/transactions/:id route
  - Locate transaction delete route
  - Remove any balance adjustment logic from delete handler
  - Ensure the route only deletes the transaction record
  - Return immediately after database operation
  - _Requirements: 7.3, 7.5_

- [x] 3.4 Verify GET /api/transactions route is pure
  - Review GET handler to ensure it only fetches data
  - Verify no business logic is executed during read operations
  - Ensure filtering and pagination work correctly
  - _Requirements: 7.4_

- [x] 4. Refactor transaction server actions to pure CRUD
  - Remove or deprecate balance-related actions
  - Update transaction actions to only perform CRUD
  - Add deprecation warnings where appropriate
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4.1 Deprecate processDueTransactionsAction
  - Open `actions/transaction.actions.ts`
  - Mark `processDueTransactionsAction` as deprecated with JSDoc comment
  - Update function to return error message explaining it's now handled by Appwrite Functions
  - Add migration guide in comment
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 4.2 Deprecate reprocessAllBalancesAction
  - Mark `reprocessAllBalancesAction` as deprecated
  - Update function to return error message or trigger Appwrite Function
  - Add clear documentation about automatic balance sync
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 4.3 Review and clean createTransactionAction
  - Ensure `createTransactionAction` only creates transaction record
  - Remove any balance sync calls
  - Keep revalidatePath calls for UI updates
  - _Requirements: 7.1_

- [x] 4.4 Review and clean updateTransactionAction
  - Ensure `updateTransactionAction` only updates transaction record
  - Remove any balance recalculation calls
  - Keep revalidatePath calls for UI updates
  - _Requirements: 7.2_

- [x] 4.5 Review and clean deleteTransactionAction
  - Ensure `deleteTransactionAction` only deletes transaction record
  - Remove any balance adjustment calls
  - Keep revalidatePath calls for UI updates
  - _Requirements: 7.3_

- [x] 5. Deprecate balance sync actions
  - Mark all balance sync actions as deprecated
  - Add clear migration messages
  - Update documentation
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5.1 Deprecate all actions in balance-sync.actions.ts
  - Open `actions/balance-sync.actions.ts`
  - Add deprecation JSDoc comments to all exported functions
  - Update function implementations to return deprecation messages
  - Explain that balance sync is now automatic via Appwrite Functions
  - _Requirements: 6.1, 6.2_

- [x] 5.2 Update syncAccountBalanceAction
  - Mark as deprecated but keep functional for emergency use
  - Optionally implement manual trigger to Appwrite Function
  - Add clear warning that automatic sync should be used
  - _Requirements: 6.3_

- [x] 5.3 Update recalculateAllBalancesAction
  - Mark as deprecated
  - Return message directing users to Appwrite Console for manual triggers
  - _Requirements: 6.1, 6.2_

- [x] 6. Remove Next.js cron API routes
  - Delete cron route files
  - Remove cron configurations from vercel.json
  - Verify no code references deleted routes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6.1 Delete process-recurring cron route
  - Delete file `app/api/cron/process-recurring/route.ts`
  - Search codebase for any imports or references to this route
  - Remove any found references
  - _Requirements: 1.1, 1.4_

- [x] 6.2 Delete expire-invitations cron route
  - Delete file `app/api/cron/expire-invitations/route.ts`
  - Search codebase for any imports or references to this route
  - Remove any found references
  - _Requirements: 1.1, 1.4_

- [x] 6.3 Delete cron directory if empty
  - Check if `app/api/cron/` directory is empty
  - Delete the directory if no other files exist
  - _Requirements: 10.1_

- [x] 6.4 Remove cron configurations from vercel.json
  - Open `vercel.json`
  - Remove the entire `crons` array
  - Verify JSON is still valid after removal
  - _Requirements: 1.5, 10.2_

- [x] 7. Implement Realtime UI updates for accounts
  - Create custom hook for account balance subscriptions
  - Update account UI components to use the hook
  - Test automatic balance updates
  - _Requirements: 8.1, 8.2_

- [x] 7.1 Create useAccountBalance custom hook
  - Create file `hooks/useAccountBalance.ts` (or appropriate location)
  - Implement Appwrite Realtime subscription for account document updates
  - Handle subscription lifecycle (subscribe on mount, unsubscribe on unmount)
  - Fetch initial balance on mount
  - Update state when balance changes
  - Add error handling for subscription failures
  - _Requirements: 8.1, 8.2_

- [x] 7.2 Update account UI components to use realtime hook
  - Identify components that display account balances
  - Replace manual balance fetching with `useAccountBalance` hook
  - Remove manual refresh logic if present
  - Test that balances update automatically when changed
  - _Requirements: 8.2_

- [x] 8. Implement Realtime UI updates for transactions
  - Create custom hook for transaction list subscriptions
  - Update transaction UI components to use the hook
  - Test automatic transaction list updates
  - _Requirements: 8.3, 8.4_

- [x] 8.1 Create useTransactions custom hook
  - Create file `hooks/useTransactions.ts`
  - Implement Appwrite Realtime subscription for transaction collection changes
  - Handle create, update, and delete events
  - Fetch initial transactions on mount
  - Update state when transactions change
  - Add error handling and reconnection logic
  - _Requirements: 8.3, 8.4_

- [x] 8.2 Update transaction UI components to use realtime hook
  - Identify components that display transaction lists
  - Replace manual transaction fetching with `useTransactions` hook
  - Remove manual refresh logic
  - Test that transaction lists update automatically
  - _Requirements: 8.4_

- [x] 9. Implement Realtime UI updates for invitations
  - Create custom hook for invitation subscriptions
  - Update invitation UI components to use the hook
  - Test automatic invitation status updates
  - _Requirements: 8.5_

- [x] 9.1 Create useInvitations custom hook
  - Create file `hooks/useInvitations.ts`
  - Implement Appwrite Realtime subscription for invitation collection changes
  - Handle status update events
  - Fetch initial invitations on mount
  - Update state when invitation status changes
  - _Requirements: 8.5_

- [x] 9.2 Update invitation UI components to use realtime hook
  - Identify components that display invitations
  - Replace manual invitation fetching with `useInvitations` hook
  - Test that expired invitations update automatically
  - _Requirements: 8.5_

- [x] 10. Update documentation
  - Create architecture documentation
  - Update function READMEs
  - Document migration process
  - Add examples and diagrams
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10.1 Create serverless architecture documentation
  - Create file `docs/SERVERLESS_ARCHITECTURE.md`
  - Document the separation between Next.js and Appwrite Functions
  - Include architecture diagrams showing data flow
  - Explain when to use Next.js vs Appwrite Functions
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 10.2 Update Expire Invitations Function README
  - Ensure `functions/expire-invitations/README.md` is complete
  - Document function purpose, triggers, and configuration
  - Add deployment instructions
  - Include testing examples
  - _Requirements: 9.1_

- [x] 10.3 Update main project README
  - Update `README.md` to reflect serverless architecture
  - Add section about Appwrite Functions
  - Link to detailed architecture documentation
  - _Requirements: 9.1, 9.2_

- [x] 10.4 Create migration guide
  - Create file `docs/MIGRATION_TO_SERVERLESS.md`
  - Document the changes made during refactoring
  - Explain deprecated APIs and their replacements
  - Provide examples of how to add new business logic
  - _Requirements: 9.5_

- [x] 11. Clean up deprecated code and verify architecture
  - Review and remove unused imports
  - Verify no business logic remains in Next.js
  - Run tests to ensure everything works
  - Monitor Appwrite Function executions
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11.1 Search for and remove unused imports
  - Search for imports of `BalanceSyncService` in Next.js code
  - Remove unused imports from transaction actions and API routes
  - Verify no compilation errors after removal
  - _Requirements: 10.3_

- [x] 11.2 Verify no business logic in Next.js API routes
  - Review all API routes in `app/api/`
  - Ensure routes only perform CRUD operations
  - Check that no calculations or complex logic exists
  - _Requirements: 10.5_

- [x] 11.3 Verify no business logic in server actions
  - Review all server actions in `actions/`
  - Ensure actions only perform CRUD operations or are properly deprecated
  - Check for any remaining balance calculation code
  - _Requirements: 10.5_

- [x] 11.4 Run end-to-end tests
  - Test transaction creation flow (create → balance updates automatically)
  - Test transaction update flow (update → balance recalculates automatically)
  - Test transaction deletion flow (delete → balance adjusts automatically)
  - Test recurring transactions (verify new transactions created on schedule)
  - Test invitation expiration (verify invitations expire on schedule)
  - _Requirements: 10.5_

- [x] 11.5 Monitor Appwrite Function executions
  - Check Appwrite Console for function execution logs
  - Verify Balance Sync Function triggers on transaction changes
  - Verify scheduled functions execute at correct times
  - Check for any errors or performance issues
  - _Requirements: 10.5_

- [x] 11.6 Verify Realtime updates work correctly
  - Open application in multiple browser tabs
  - Create/update/delete transactions in one tab
  - Verify changes appear automatically in other tabs
  - Test with slow network conditions
  - Verify reconnection after network interruption
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
