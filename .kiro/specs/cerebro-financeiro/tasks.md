# Implementation Plan

- [ ] 1. Research and select investment data aggregator
  - Evaluate Pluggy, Belvo, and Finconnect for Brazilian broker coverage
  - Test API quality, transaction history depth, and security compliance
  - Document decision with pros/cons and pricing analysis
  - _Requirements: 1.1, 1.2, 7.1, 7.2_

- [ ] 2. Set up database schema for investments
  - [ ] 2.1 Create investment-related enums and tables in schema.ts
    - Add assetTypeEnum, transactionTypeEnum, connectionStatusEnum
    - Create investmentConnections, investmentAssets, investmentTransactions tables
    - Create capitalGainsCache table for performance optimization
    - Add proper indexes for query performance
    - _Requirements: 1.3, 2.1, 8.3_

  - [ ] 2.2 Create and run database migrations
    - Generate migration files using Drizzle Kit
    - Test migrations in development environment
    - Verify all constraints and indexes are created
    - _Requirements: 1.3, 2.1_

- [ ] 3. Implement encryption utilities for sensitive data
  - [ ] 3.1 Create encryption/decryption functions
    - Implement AES-256-GCM encryption in src/lib/crypto/encryption.ts
    - Add functions for encrypting and decrypting broker tokens
    - Include proper error handling and validation
    - _Requirements: 7.1, 7.2_

  - [ ]\* 3.2 Write unit tests for encryption utilities
    - Test encryption/decryption round-trip
    - Test with various input sizes
    - Verify authentication tag validation
    - _Requirements: 7.1_

- [ ] 4. Build investment data aggregator integration
  - [ ] 4.1 Create aggregator client interface
    - Define TypeScript interfaces for aggregator API in src/lib/integrations/aggregator-client.ts
    - Implement OAuth flow initiation
    - Implement token exchange and refresh
    - Add methods for fetching transactions and positions
    - _Requirements: 1.1, 1.2, 2.1_

  - [ ] 4.2 Implement data transformation layer
    - Create functions to transform aggregator data to internal schema
    - Handle different broker data formats
    - Implement validation with Zod schemas
    - _Requirements: 2.2, 2.3_

  - [ ]\* 4.3 Write integration tests for aggregator client
    - Mock aggregator API responses
    - Test OAuth flow
    - Test data transformation
    - Test error handling
    - _Requirements: 1.6, 2.4_

- [ ] 5. Create investment connection API endpoints
  - [ ] 5.1 Implement POST /api/v1/investments/connect
    - Validate institution ID
    - Initiate OAuth flow with aggregator
    - Create connection record in database
    - Return authorization URL
    - _Requirements: 1.1, 1.2_

  - [ ] 5.2 Implement POST /api/v1/investments/exchange
    - Exchange authorization code for access token
    - Encrypt and store tokens securely
    - Trigger initial data sync
    - Update connection status
    - _Requirements: 1.3, 7.1_

  - [ ] 5.3 Implement GET /api/v1/investments/connections
    - Fetch user's connections with sync status
    - Include last sync timestamp and error messages
    - Filter by status if requested
    - _Requirements: 1.4_

  - [ ] 5.4 Implement DELETE /api/v1/investments/connections/:id
    - Verify connection ownership
    - Delete connection and cascade to related data
    - Return success response
    - _Requirements: 1.5, 7.5_

  - [ ] 5.5 Implement POST /api/v1/investments/connections/:id/sync
    - Trigger manual sync for specific connection
    - Return 202 Accepted with job status
    - Queue sync job for background processing
    - _Requirements: 2.2, 2.5_

- [ ] 6. Build investment sync service
  - [ ] 6.1 Create InvestmentSyncService class
    - Implement syncConnection method in src/lib/services/investment-sync-service.ts
    - Handle token refresh when expired
    - Fetch new transactions since lastSyncAt
    - Transform and validate data
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 6.2 Implement transaction upsert logic
    - Use externalId to prevent duplicates
    - Update existing transactions if data changed
    - Insert new transactions
    - Update asset positions after each transaction
    - _Requirements: 2.3, 2.4_

  - [ ] 6.3 Add error handling and retry logic
    - Implement exponential backoff for API failures
    - Update connection status on errors
    - Log errors without breaking other syncs
    - _Requirements: 2.4, 8.5_

  - [ ]\* 6.4 Write unit tests for sync service
    - Test successful sync flow
    - Test token refresh
    - Test duplicate prevention
    - Test error handling
    - _Requirements: 2.2, 2.4_

- [ ] 7. Set up background sync jobs
  - [ ] 7.1 Create cron job for periodic sync
    - Configure Vercel Cron or QStash for 6-hour intervals
    - Create API route for cron trigger at /api/cron/sync-investments
    - Fetch all active connections
    - Process syncs in parallel with concurrency limit
    - _Requirements: 2.2, 8.1, 8.4_

  - [ ] 7.2 Implement sync job monitoring
    - Log sync results (success/failure counts)
    - Track sync duration metrics
    - Update connection lastSyncAt timestamps
    - _Requirements: 2.5, 8.3_

- [ ] 8. Create portfolio API endpoints
  - [ ] 8.1 Implement GET /api/v1/portfolio/summary
    - Calculate total portfolio value across all assets
    - Calculate total cost basis
    - Calculate total gains and gain percentage
    - Implement caching with 5-minute TTL
    - _Requirements: 3.1, 3.2, 8.6_

  - [ ] 8.2 Implement GET /api/v1/portfolio/positions
    - Fetch all user's investment assets
    - Include current quantity, average cost, and market value
    - Support filtering by asset type
    - Implement pagination for large portfolios
    - _Requirements: 3.3, 3.4_

  - [ ] 8.3 Implement GET /api/v1/portfolio/positions/:assetId
    - Fetch detailed asset information
    - Include full transaction history
    - Calculate average cost and current position
    - _Requirements: 3.3_

  - [ ] 8.4 Implement GET /api/v1/portfolio/allocation
    - Calculate allocation breakdown by asset type
    - Return value and percentage for each type
    - Use cached portfolio data
    - _Requirements: 3.2_

- [ ] 9. Build IRPF calculation engine
  - [ ] 9.1 Implement average cost calculator
    - Create calculateAverageCost function in src/lib/tax/average-cost-calculator.ts
    - Fetch all BUY transactions up to specified date
    - Calculate weighted average including fees
    - Handle partial sells using FIFO method
    - _Requirements: 4.1, 4.2, 4.6_

  - [ ] 9.2 Implement capital gains calculator
    - Create calculateCapitalGains function in src/lib/tax/capital-gains-calculator.ts
    - Process SELL transactions month by month
    - Calculate gain/loss using average cost
    - Apply exemption rules (R$ 20k for stocks, none for FIIs)
    - Calculate tax due (15% on gains)
    - Support loss carryforward
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.2, 10.3_

  - [ ] 9.3 Implement declarable position builder
    - Create buildDeclarablePositions function in src/lib/tax/declarable-position-builder.ts
    - Calculate position for each asset on reference date (Dec 31)
    - Fetch market prices for valuation
    - Format according to Receita Federal requirements
    - _Requirements: 6.3_

  - [ ] 9.4 Create main IRPF engine orchestrator
    - Create calculateIrpf function in src/lib/tax/irpf-engine.ts
    - Orchestrate calls to sub-calculators
    - Aggregate results into complete report
    - Return structured output for frontend
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]\* 9.5 Write comprehensive unit tests for tax calculations
    - Test average cost with multiple scenarios
    - Test capital gains with exemptions and losses
    - Test position calculations
    - Verify accuracy against manual calculations
    - Achieve >95% code coverage
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 6.8_

- [ ] 10. Create tax reporting API endpoints
  - [ ] 10.1 Implement GET /api/v1/tax/irpf-report
    - Verify user has Premium role
    - Validate year parameter
    - Check cache for existing report
    - Call IRPF engine if cache miss
    - Store result in cache with 24-hour TTL
    - Return structured report data
    - _Requirements: 6.1, 6.2, 6.5, 6.8, 8.6_

  - [ ] 10.2 Implement POST /api/v1/tax/irpf-report/export
    - Verify Premium role
    - Generate formatted PDF from report data
    - Include all required sections (Bens e Direitos, Renda Variável)
    - Return PDF file for download
    - _Requirements: 6.6, 6.7_

  - [ ] 10.3 Implement GET /api/v1/tax/capital-gains
    - Fetch capital gains for specified year/month
    - Support filtering by asset type
    - Return monthly breakdown
    - _Requirements: 5.5, 5.6_

  - [ ] 10.4 Implement GET /api/v1/tax/darf-preview
    - Verify Premium role
    - Generate DARF payment slip preview
    - Include all required tax information
    - _Requirements: 9.1, 9.2_

- [ ] 11. Build frontend connections management page
  - [ ] 11.1 Create connections page component
    - Create page at src/app/(app)/investments/connections/page.tsx
    - Display list of connected brokers
    - Show sync status and last sync time for each
    - Add button to connect new broker
    - Add button to disconnect existing broker
    - _Requirements: 1.4, 1.5_

  - [ ] 11.2 Implement connection flow UI
    - Create modal/dialog for broker selection
    - Handle OAuth redirect flow
    - Show loading state during connection
    - Display success/error messages
    - _Requirements: 1.1, 1.2, 1.6_

  - [ ] 11.3 Add manual sync functionality
    - Add sync button for each connection
    - Show sync progress indicator
    - Update UI when sync completes
    - Display sync errors clearly
    - _Requirements: 2.2, 2.5, 2.6_

- [ ] 12. Build portfolio dashboard page
  - [ ] 12.1 Create portfolio summary component
    - Create page at src/app/(app)/portfolio/page.tsx
    - Display total portfolio value card
    - Show total gains and gain percentage
    - Add allocation pie chart by asset type
    - _Requirements: 3.1, 3.2, 3.6_

  - [ ] 12.2 Create positions table component
    - Display all positions in sortable table
    - Show ticker, quantity, average cost, current value, gain/loss
    - Support filtering by asset type
    - Implement sorting by different columns
    - Add pagination for large portfolios
    - _Requirements: 3.3, 3.4, 10.4_

  - [ ] 12.3 Add position detail modal
    - Show detailed asset information
    - Display full transaction history
    - Show average cost calculation breakdown
    - Link to original broker connection
    - _Requirements: 3.3_

  - [ ] 12.4 Implement real-time data updates
    - Use TanStack Query with polling
    - Refetch data when user returns to page
    - Show last update timestamp
    - _Requirements: 3.5, 8.3_

- [ ] 13. Build tax assistant page
  - [ ] 13.1 Create IRPF report page component
    - Create page at src/app/(app)/tax/irpf/page.tsx
    - Add Premium feature gate with upgrade prompt
    - Add year selector dropdown
    - Show loading state during report generation
    - _Requirements: 6.1, 6.7_

  - [ ] 13.2 Create Bens e Direitos tab
    - Display assets table formatted like Receita Federal form
    - Show ticker, name, CNPJ, quantity, and value on Dec 31
    - Add copy buttons for each field
    - _Requirements: 6.3, 6.5_

  - [ ] 13.3 Create Renda Variável tab
    - Display monthly gains summary table
    - Show total sales, profit, and tax due for each month
    - Highlight months with tax obligations
    - _Requirements: 6.4, 6.5_

  - [ ] 13.4 Implement PDF export functionality
    - Add export button with loading state
    - Trigger PDF generation API call
    - Download generated PDF file
    - _Requirements: 6.6_

- [ ] 14. Build capital gains tracking page
  - [ ] 14.1 Create capital gains page component
    - Create page at src/app/(app)/tax/capital-gains/page.tsx
    - Display monthly gains table for current year
    - Show total sales, gains, losses, and tax due
    - Add year selector
    - _Requirements: 5.5, 9.1_

  - [ ] 14.2 Add DARF generator component
    - Show DARF preview for selected month
    - Include all required payment information
    - Add button to generate printable DARF
    - _Requirements: 9.1, 9.2_

  - [ ] 14.3 Create loss carryforward tracker
    - Display accumulated losses by asset type
    - Show how losses offset gains
    - Track loss expiration dates
    - _Requirements: 5.4, 9.3_

  - [ ] 14.4 Add tax calendar component
    - Show upcoming DARF payment deadlines
    - Highlight overdue payments
    - Display estimated tax amounts
    - _Requirements: 9.1, 9.4_

- [ ] 15. Implement fiscal insights and notifications
  - [ ] 15.1 Create notification system for tax obligations
    - Detect when monthly sales exceed R$ 20k
    - Generate notification for user
    - Store notification in database
    - _Requirements: 9.1, 9.5_

  - [ ] 15.2 Build insights engine
    - Analyze transaction patterns
    - Generate tax optimization suggestions
    - Identify loss harvesting opportunities
    - _Requirements: 9.3, 9.6_

  - [ ] 15.3 Create notifications UI component
    - Display active notifications in dashboard
    - Show notification badges
    - Mark notifications as read
    - _Requirements: 9.1, 9.4_

- [ ] 16. Add market price integration
  - [ ] 16.1 Create market data service
    - Integrate with B3 or Yahoo Finance API
    - Fetch current prices for tickers
    - Implement caching with 15-minute TTL
    - Handle API failures gracefully
    - _Requirements: 3.5, 8.3_

  - [ ] 16.2 Update portfolio values with market prices
    - Fetch prices for all user's assets
    - Update lastPrice and lastPriceUpdatedAt
    - Recalculate portfolio summary
    - _Requirements: 3.5_

- [ ] 17. Implement caching layer
  - [ ] 17.1 Set up Redis cache utilities
    - Create cache helper functions in src/lib/cache/redis.ts
    - Implement getCachedOrCalculate pattern
    - Add cache invalidation utilities
    - _Requirements: 8.6_

  - [ ] 17.2 Add caching to expensive operations
    - Cache IRPF reports with 24-hour TTL
    - Cache portfolio summary with 5-minute TTL
    - Cache market prices with 15-minute TTL
    - Implement cache invalidation on data changes
    - _Requirements: 6.8, 8.3, 8.6_

- [ ] 18. Add comprehensive error handling
  - [ ] 18.1 Create error classes and handlers
    - Define custom error classes for different scenarios
    - Implement error response formatting
    - Add error logging with sensitive data redaction
    - _Requirements: 7.4_

  - [ ] 18.2 Add user-friendly error messages
    - Map technical errors to user-friendly messages
    - Provide actionable next steps
    - Add retry mechanisms where appropriate
    - _Requirements: 1.6, 2.4, 9.5_

- [ ] 19. Implement security measures
  - [ ] 19.1 Add rate limiting to API endpoints
    - Implement rate limiting middleware
    - Set limits per endpoint (100 req/min per user)
    - Return appropriate error responses
    - _Requirements: 7.4_

  - [ ] 19.2 Add audit logging for sensitive operations
    - Log connection creation/deletion
    - Log IRPF report generation
    - Log data exports
    - _Requirements: 7.5_

  - [ ] 19.3 Implement LGPD compliance features
    - Add data export functionality
    - Implement complete data deletion
    - Create privacy policy page
    - _Requirements: 7.5_

- [ ] 20. Performance optimization and monitoring
  - [ ] 20.1 Add performance monitoring
    - Implement logging for slow operations
    - Track API response times
    - Monitor cache hit rates
    - _Requirements: 8.3, 8.6_

  - [ ] 20.2 Optimize database queries
    - Add missing indexes based on query patterns
    - Implement query result pagination
    - Use database-level aggregations
    - _Requirements: 8.3, 8.4_

  - [ ] 20.3 Optimize frontend performance
    - Implement code splitting
    - Add lazy loading for heavy components
    - Optimize bundle size
    - _Requirements: 8.3_

- [ ] 21. Integration testing and validation
  - [ ] 21.1 Create integration test suite
    - Test complete connection flow
    - Test sync job execution
    - Test IRPF report generation
    - Test Premium feature gating
    - _Requirements: All_

  - [ ] 21.2 Perform security testing
    - Test authorization on all endpoints
    - Verify encryption implementation
    - Test for SQL injection vulnerabilities
    - Validate input sanitization
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 21.3 Conduct performance testing
    - Load test with 100 concurrent users
    - Test IRPF calculation with 1000+ transactions
    - Verify cache effectiveness
    - Measure API response times
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 22. Documentation and deployment
  - [ ] 22.1 Create API documentation
    - Document all endpoints with OpenAPI spec
    - Include request/response examples
    - Document error codes and messages
    - _Requirements: All_

  - [ ] 22.2 Write user documentation
    - Create guide for connecting brokers
    - Document IRPF report usage
    - Explain tax calculations methodology
    - _Requirements: 6.5, 9.6_

  - [ ] 22.3 Deploy to production
    - Run database migrations
    - Configure environment variables
    - Deploy application code
    - Monitor for errors
    - _Requirements: All_

  - [ ] 22.4 Set up monitoring and alerts
    - Configure error tracking
    - Set up performance monitoring
    - Create alerts for critical failures
    - _Requirements: 8.5_
