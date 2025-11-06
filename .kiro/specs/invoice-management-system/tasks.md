# Implementation Plan - Invoice Management System

- [x] 1. Set up database schema and migrations
  - Create Appwrite collections for invoices, invoice_items, products, and price_history
  - Define collection attributes matching the design schema
  - Set up indexes for userId, invoiceKey, productId, and purchaseDate
  - Configure collection permissions for user-scoped access
  - _Requirements: 1.5, 4.1, 7.1_

- [x] 2. Implement invoice parser service
  - [x] 2.1 Create invoice parser service with URL and QR code support
    - Write `lib/services/invoice-parser.service.ts` with methods for parsing invoice URLs
    - Implement QR code decoding to extract invoice access key
    - Add HTTP client to fetch XML from government portal (https://sat.sef.sc.gov.br)
    - Implement XML parsing for NFe/NFCe formats
    - Extract merchant information (CNPJ, name, address)
    - Extract line items with product details, quantities, and prices
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Implement merchant category detection
    - Create category detection logic based on merchant name keywords
    - Add NCM code-based category detection for products
    - Implement fallback to "other" category when detection fails
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 2.3 Add product normalization logic
    - Create product name normalization function (remove extra spaces, standardize case)
    - Implement product matching algorithm to link similar products
    - Handle EAN/GTIN codes for product identification
    - _Requirements: 4.2, 4.3_

  - [x] 2.4 Write unit tests for parser service
    - Test XML parsing with sample NFe/NFCe files
    - Test category detection with various merchant types
    - Test product normalization edge cases
    - Test error handling for malformed data
    - _Requirements: 1.1, 1.2, 2.1_

- [x] 3. Create invoice storage service
  - [x] 3.1 Implement invoice service with CRUD operations
    - Write `lib/services/invoice.service.ts` with create, read, update, delete methods
    - Implement duplicate detection using invoice access key
    - Add method to store parsed invoice data to Appwrite
    - Create invoice items in batch for performance
    - Link invoice to user account
    - _Requirements: 1.5, 3.1_

  - [x] 3.2 Implement product catalog management
    - Create or update product entries when processing invoices
    - Update product statistics (total purchases, average price, last purchase date)
    - Link invoice items to normalized products
    - _Requirements: 4.2, 4.3, 4.5_

  - [x] 3.3 Add price history recording
    - Record price entry for each invoice item
    - Store merchant, date, and pricing information
    - Index by productId for efficient queries
    - _Requirements: 7.1, 7.2_

  - [x] 3.4 Write unit tests for invoice service
    - Test invoice creation and retrieval
    - Test duplicate detection
    - Test product catalog updates
    - Test price history recording
    - _Requirements: 1.5, 4.2, 7.1_

- [x] 4. Build invoice API endpoints
  - [x] 4.1 Create POST /api/invoices endpoint
    - Accept invoice URL or QR code data in request body
    - Call invoice parser service to extract data
    - Validate parsed data before storage
    - Store invoice and related items using invoice service
    - Return created invoice with ID
    - Handle errors (invalid format, parsing errors, duplicates)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Create GET /api/invoices endpoint
    - Support pagination with limit and offset
    - Implement filtering by date range, category, merchant
    - Add search functionality for invoice number, merchant name, product names
    - Return invoice list with summary information
    - Include total count for pagination
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 4.3 Create GET /api/invoices/[id] endpoint
    - Fetch invoice by ID with all line items
    - Validate user ownership
    - Return complete invoice details including merchant and products
    - Handle not found errors
    - _Requirements: 3.4, 4.1_

  - [x] 4.4 Create DELETE /api/invoices/[id] endpoint
    - Validate user ownership before deletion
    - Delete invoice and cascade to invoice items
    - Update product statistics after deletion
    - Return success confirmation
    - _Requirements: 3.4_

  - [x] 4.5 Create GET /api/invoices/categories endpoint
    - Return list of available invoice categories
    - Include count of invoices per category for current user
    - _Requirements: 2.2, 3.2_

  - [x] 4.6 Write integration tests for invoice APIs
    - Test complete invoice registration flow
    - Test filtering and search functionality
    - Test error handling for invalid data
    - Test authorization checks
    - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [x] 5. Implement analytics service
  - [x] 5.1 Create analytics service with insights generation
    - Write `lib/services/analytics.service.ts` with insights methods
    - Implement spending pattern analysis (average per category, frequency)
    - Calculate top merchants by visit count and spending
    - Identify most purchased products
    - Generate monthly spending trends
    - Check for minimum 3 invoices before generating insights
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 5.2 Implement spending prediction algorithm
    - Calculate 3-month moving average for baseline
    - Apply trend adjustment based on historical data
    - Factor in current month's partial spending
    - Calculate confidence levels based on variance
    - Generate predictions per category
    - Require minimum 3 months of data
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.3 Add anomaly detection
    - Detect spending that exceeds 2 standard deviations from mean
    - Flag unusual merchant visits
    - Identify category spending spikes
    - Detect potential duplicate invoices
    - _Requirements: 5.4_

  - [x] 5.4 Implement budget tracking
    - Store user-defined spending limits per category
    - Calculate current spending vs limits
    - Generate alerts at 80% and 100% thresholds
    - Provide recommendations based on historical patterns
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 5.5 Write unit tests for analytics service
    - Test prediction algorithm with known datasets
    - Test anomaly detection with edge cases
    - Test insights generation with various data volumes
    - Test budget tracking calculations
    - _Requirements: 5.1, 6.1, 9.1_

- [x] 6. Build analytics API endpoints
  - [x] 6.1 Create GET /api/invoices/insights endpoint
    - Call analytics service to generate insights
    - Return spending patterns, top merchants, category breakdown
    - Include monthly trends and predictions
    - Return message if insufficient data (< 3 invoices)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.2 Create GET /api/invoices/predictions endpoint
    - Generate monthly spending predictions per category
    - Include confidence levels and current progress
    - Compare predicted vs actual spending
    - Return empty array if insufficient historical data
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.3 Create POST /api/invoices/budgets endpoint
    - Accept category and limit amount in request body
    - Store budget limit for user and category
    - Validate limit is positive number
    - _Requirements: 9.1_

  - [x] 6.4 Create GET /api/invoices/budgets endpoint
    - Return all budget limits for current user
    - Include current spending and progress percentage
    - Flag budgets that are exceeded or near limit
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 6.5 Write integration tests for analytics APIs
    - Test insights generation with various data scenarios
    - Test predictions with different time ranges
    - Test budget CRUD operations
    - Test insufficient data handling
    - _Requirements: 5.1, 6.1, 9.1_

- [x] 7. Implement price tracking service
  - [x] 7.1 Create price tracking service
    - Write `lib/services/price-tracking.service.ts` with price methods
    - Implement price history retrieval by product and date range
    - Calculate average price per merchant
    - Identify lowest and highest prices
    - Detect significant price changes (> 10% threshold)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.2 Implement price comparison logic
    - Group prices by merchant for each product
    - Calculate price differences and percentages
    - Rank merchants by price for specific products
    - Calculate savings potential
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 7.3 Add shopping list optimization
    - Accept list of product IDs
    - Find best merchant for each product
    - Calculate total cost per merchant
    - Recommend optimal shopping strategy
    - _Requirements: 8.4, 8.5_

  - [x] 7.4 Write unit tests for price tracking service
    - Test price history retrieval and calculations
    - Test price comparison with multiple merchants
    - Test shopping list optimization
    - Test price change detection
    - _Requirements: 7.1, 8.1, 8.3_

- [x] 8. Build price tracking API endpoints
  - [x] 8.1 Create GET /api/products endpoint
    - Return paginated list of products for current user
    - Support filtering by category
    - Include product statistics (purchase count, average price)
    - Add search by product name
    - _Requirements: 4.5_

  - [x] 8.2 Create GET /api/products/[id]/price-history endpoint
    - Fetch price history for specific product
    - Support date range filtering (default 90 days)
    - Return prices grouped by merchant
    - Include price change indicators
    - _Requirements: 7.2, 7.5_

  - [x] 8.3 Create GET /api/products/[id]/compare endpoint
    - Compare prices across all merchants for product
    - Return lowest, highest, and average prices
    - Calculate savings potential
    - Include last purchase date per merchant
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 8.4 Create POST /api/products/shopping-list endpoint
    - Accept array of product IDs
    - Calculate best prices per merchant
    - Return optimized shopping recommendations
    - Include total cost estimates
    - _Requirements: 8.4, 8.5_

  - [x] 8.5 Write integration tests for price tracking APIs
    - Test product listing and search
    - Test price history retrieval
    - Test price comparison calculations
    - Test shopping list optimization
    - _Requirements: 7.2, 8.1, 8.4_

- [x] 9. Create invoice input UI components
  - [x] 9.1 Build AddInvoiceModal component
    - Create modal component at `components/modals/AddInvoiceModal.tsx`
    - Add tab interface for "URL" and "QR Code" input methods
    - Implement URL input field with validation
    - Add QR code scanner using device camera (use react-qr-reader or similar)
    - Show loading state during invoice parsing
    - Display preview of parsed invoice data before saving
    - Allow category override if auto-detection is incorrect
    - Handle errors with user-friendly messages and retry option
    - Call POST /api/invoices on submit
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4_

  - [x] 9.2 Create invoice input form validation
    - Validate URL format matches government portal pattern
    - Validate QR code data format (44-digit access key)
    - Show inline validation errors
    - Disable submit until valid input provided
    - _Requirements: 1.3_

  - [x] 9.3 Write component tests for invoice input
    - Test URL input validation
    - Test QR code scanning flow
    - Test error handling display
    - Test successful submission
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 10. Build invoice list and details UI
  - [x] 10.1 Create invoices page
    - Create page at `app/(app)/invoices/page.tsx`
    - Display paginated list of invoices with infinite scroll
    - Show summary cards (total spent, invoice count, top category)
    - Add "Add Invoice" button to open AddInvoiceModal
    - Implement loading states with skeletons
    - Handle empty state with helpful message
    - _Requirements: 3.1, 3.5_

  - [x] 10.2 Implement invoice filters and search
    - Add date range picker for filtering
    - Add category dropdown filter
    - Add merchant search/filter
    - Add amount range filter
    - Implement search input for invoice number, merchant, products
    - Update URL params for shareable filtered views
    - _Requirements: 3.2, 3.3_

  - [x] 10.3 Create InvoiceCard component
    - Display invoice summary (date, merchant, amount, category)
    - Add category badge with color coding
    - Show invoice number and merchant logo/icon
    - Add click handler to open details modal
    - Include quick actions (view, delete)
    - _Requirements: 3.5_

  - [x] 10.4 Build InvoiceDetailsModal component
    - Create modal at `components/modals/InvoiceDetailsModal.tsx`
    - Display complete merchant information
    - Show all line items in a table (product, quantity, unit price, total)
    - Display totals breakdown (subtotal, discounts, taxes, total)
    - Add link to original invoice URL
    - Include delete invoice action with confirmation
    - Show product price history links for each item
    - _Requirements: 3.4, 4.1, 4.4_

  - [x] 10.5 Write component tests for invoice list
    - Test invoice list rendering
    - Test filtering and search functionality
    - Test pagination
    - Test invoice card interactions
    - Test details modal display
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 11. Create insights dashboard UI
  - [x] 11.1 Build insights dashboard page
    - Create page at `app/(app)/invoices/insights/page.tsx`
    - Display message if user has fewer than 3 invoices
    - Show spending by category pie chart (use recharts or similar)
    - Display monthly spending trend line chart
    - Show top merchants bar chart
    - Include key metrics cards (total spent, average invoice, most frequent category)
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 11.2 Implement predictions display
    - Create predictions section showing monthly forecasts per category
    - Display confidence levels with visual indicators
    - Show current spending vs predicted spending
    - Add progress bars for each category
    - Highlight categories on track vs over budget
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 11.3 Add anomaly alerts section
    - Display detected anomalies with severity indicators
    - Show unusual spending patterns
    - Highlight potential duplicate invoices
    - Add dismiss action for reviewed anomalies
    - _Requirements: 5.4_

  - [x] 11.4 Create budget management UI
    - Add section to set spending limits per category
    - Display current spending vs limits with progress bars
    - Show alerts for budgets at 80% and 100%
    - Include recommendations for budget adjustments
    - Allow editing and deleting budget limits
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 11.5 Write component tests for insights dashboard
    - Test chart rendering with data
    - Test insufficient data message
    - Test predictions display
    - Test budget management interactions
    - _Requirements: 5.1, 6.1, 9.1_

- [x] 12. Build price comparison UI
  - [x] 12.1 Create products page
    - Create page at `app/(app)/invoices/products/page.tsx`
    - Display list of all products from user's invoices
    - Show product statistics (purchase count, average price, last purchase)
    - Add search and category filters
    - Include click handler to view price details
    - _Requirements: 4.5_

  - [x] 12.2 Implement PriceHistoryChart component
    - Create component at `components/invoices/PriceHistoryChart.tsx`
    - Display line chart showing price over time
    - Use different colors for different merchants
    - Add tooltips showing exact price and date
    - Highlight lowest and highest prices
    - _Requirements: 7.2_

  - [x] 12.3 Build PriceComparisonTable component
    - Create component at `components/invoices/PriceComparisonTable.tsx`
    - Display table comparing prices across merchants
    - Show current price, last updated date, price change
    - Highlight best price in green
    - Calculate and show savings potential
    - Add sort functionality by price, merchant, date
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 12.4 Create shopping list builder
    - Add UI to select multiple products
    - Show estimated cost per merchant
    - Recommend optimal shopping strategy
    - Allow saving and sharing shopping lists
    - _Requirements: 8.4, 8.5_

  - [x] 12.5 Write component tests for price comparison
    - Test product list rendering
    - Test price history chart
    - Test price comparison table
    - Test shopping list builder
    - _Requirements: 7.2, 8.1, 8.4_

- [x] 13. Implement export functionality
  - [x] 13.1 Create export service
    - Write `lib/services/export.service.ts` with export methods
    - Implement CSV export for invoice data
    - Implement PDF report generation with charts
    - Support date range and category filtering for exports
    - Include all invoice details in exports
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 13.2 Build export API endpoint
    - Create GET /api/invoices/export endpoint
    - Accept format parameter (csv or pdf)
    - Accept filter parameters (date range, categories)
    - Generate export file using export service
    - Return file download response
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 13.3 Add export UI controls
    - Add export button to invoices page
    - Create export options modal (format, filters)
    - Show download progress indicator
    - Handle export errors gracefully
    - _Requirements: 10.1, 10.2_

  - [x] 13.4 Write tests for export functionality
    - Test CSV generation with various data
    - Test PDF generation
    - Test filtering in exports
    - Test API endpoint responses
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 14. Add navigation and integration
  - [x] 14.1 Update app navigation
    - Add "Invoices" menu item to main navigation
    - Add "Insights" submenu under Invoices
    - Add "Products" submenu under Invoices
    - Update navigation icons and labels
    - _Requirements: 3.1, 5.5_

  - [x] 14.2 Integrate with transaction system
    - Add option to create transaction from invoice
    - Link invoice to account when creating transaction
    - Update transaction list to show invoice link
    - Allow viewing invoice from transaction details
    - _Requirements: 1.5_

  - [x] 14.3 Add real-time updates
    - Implement Appwrite realtime subscriptions for invoices
    - Update invoice list when new invoices added
    - Refresh insights when data changes
    - Update price comparisons in real-time
    - _Requirements: 3.1, 5.5_

  - [x] 14.4 Write integration tests for navigation
    - Test navigation between invoice pages
    - Test invoice-transaction linking
    - Test real-time updates
    - _Requirements: 3.1, 5.5_

- [x] 15. Performance optimization and polish
  - [x] 15.1 Implement caching strategies
    - Cache parsed invoices for 1 hour
    - Cache insights calculations for 1 hour
    - Cache price comparisons for 30 minutes
    - Implement cache invalidation on data changes
    - _Requirements: 5.5, 7.2, 8.1_

  - [x] 15.2 Optimize database queries
    - Add compound indexes for common query patterns
    - Implement pagination for large datasets
    - Use database aggregation for analytics
    - Optimize price history queries with date range limits
    - _Requirements: 3.1, 5.1, 7.2_

  - [x] 15.3 Add loading states and error boundaries
    - Implement skeleton loaders for all async content
    - Add error boundaries for component failures
    - Show retry options for failed operations
    - Implement optimistic UI updates where appropriate
    - _Requirements: 1.4, 3.1, 5.5_

  - [x] 15.4 Improve mobile responsiveness
    - Optimize invoice list for mobile screens
    - Make charts responsive and touch-friendly
    - Improve QR code scanner for mobile cameras
    - Test all features on mobile devices
    - _Requirements: 1.2, 3.1, 5.5_

  - [x] 15.5 Write performance tests
    - Test with large datasets (100+ invoices)
    - Measure page load times
    - Test cache effectiveness
    - Profile database query performance
    - _Requirements: 3.1, 5.1, 7.2_
