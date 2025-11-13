# Implementation Plan

- [x] 1. Set up project dependencies and type definitions
  - Install required npm packages (fast-xml-parser, papaparse, pdf-parse)
  - Create type definitions for parsed transactions and import records
  - Add ImportErrorCode enum and error handling types
  - _Requirements: 1.1, 1.3_

- [x] 2. Implement OFX Parser
  - [x] 2.1 Create OFXParser class with canParse and parse methods
    - Implement OFX version detection (SGML vs XML)
    - Parse OFX header and extract bank account information
    - Extract transactions from BANKTRANLIST section
    - _Requirements: 2.1, 2.2, 2.7_

  - [x] 2.2 Implement OFX field mapping and conversion
    - Map TRNTYPE to transaction type (CREDIT/DEBIT to income/expense)
    - Parse DTPOSTED dates and convert to ISO 8601 format
    - Extract amount, description (NAME + MEMO), and FITID
    - Handle malformed XML with proper error messages
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 2.3 Write unit tests for OFX parser
    - Test with sample OFX file from /public/assets
    - Test with malformed OFX data
    - Test date parsing edge cases
    - Test both OFX v1 and v2 formats
    - _Requirements: 2.1, 2.2, 2.7_

- [x] 3. Implement CSV Parser
  - [x] 3.1 Create CSVParser class with delimiter detection
    - Implement delimiter detection (comma, semicolon, tab)
    - Parse CSV and identify header row
    - Create column mapping logic for common field names
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.2 Implement CSV field parsing and validation
    - Parse dates in multiple formats (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
    - Parse amounts with different decimal separators
    - Handle negative amounts as expenses, positive as income
    - Validate required columns and return clear error messages
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [x] 3.3 Write unit tests for CSV parser
    - Test with sample CSV file from /public/assets
    - Test with different delimiters
    - Test with various date and amount formats
    - Test missing column scenarios
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Implement Transaction Mapper
  - [x] 4.1 Create TransactionMapper class with validation
    - Implement mapToDto method to convert ParsedTransaction to CreateTransactionDto
    - Add validation for date, amount, description, and type
    - Set transaction source to "import" and status to "completed"
    - Store external IDs and metadata
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7_

  - [x] 4.2 Implement category assignment logic
    - Create keyword-based category assignment (Pix, boleto, cartão, Uber, etc.)
    - Assign default category for unmatched descriptions
    - Filter out zero-amount transactions
    - _Requirements: 5.3, 5.4_

  - [x] 4.3 Write unit tests for transaction mapper
    - Test DTO conversion with various inputs
    - Test category assignment logic
    - Test validation rules
    - Test edge cases (zero amounts, invalid dates)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 5. Implement Import Service
  - [x] 5.1 Create ImportService class with core methods
    - Implement previewImport method to parse and return preview data
    - Implement processImport method to create transactions
    - Add file format detection logic
    - Coordinate parser selection based on file type
    - _Requirements: 1.3, 1.4_

  - [x] 5.2 Implement duplicate detection logic
    - Create detectDuplicates method to find matching transactions
    - Check for matches by external ID (FITID, Identificador)
    - Check for matches by date (±2 days), amount (±0.01), and description
    - Return set of duplicate transaction IDs
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [x] 5.3 Implement import history management
    - Create import_history collection in Appwrite
    - Implement createImportRecord method
    - Implement getImportHistory method
    - Store import metadata (file name, format, count, status)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 5.4 Write integration tests for import service
    - Test end-to-end import flow with OFX file
    - Test end-to-end import flow with CSV file
    - Test duplicate detection scenarios
    - Test error handling
    - _Requirements: 1.1, 1.3, 6.1, 6.2, 6.3, 10.1, 10.2_

- [x] 6. Create API endpoints
  - [x] 6.1 Implement POST /api/transactions/import/preview
    - Handle file upload with FormData
    - Validate file format and size (max 10MB)
    - Call ImportService.previewImport
    - Return parsed transactions and duplicate information
    - Handle errors with appropriate status codes
    - _Requirements: 1.1, 1.2, 1.5, 7.1, 9.3_

  - [x] 6.2 Implement POST /api/transactions/import
    - Validate request body with selected transactions
    - Verify user owns the target account
    - Call ImportService.processImport
    - Return import results (success count, failed count, import ID)
    - _Requirements: 7.7, 8.6, 9.6_

  - [x] 6.3 Implement GET /api/transactions/import/history
    - Authenticate user
    - Call ImportService.getImportHistory
    - Return list of past imports
    - _Requirements: 10.3, 10.4_

  - [x] 6.4 Write API endpoint tests
    - Test preview endpoint with valid and invalid files
    - Test import endpoint with various scenarios
    - Test history endpoint
    - Test authentication and authorization
    - _Requirements: 1.1, 1.2, 1.5, 7.7, 8.6, 9.3, 9.6, 10.3_

- [x] 7. Build Import UI Components
  - [x] 7.1 Create ImportTransactionsModal component
    - Implement file upload with drag-and-drop support
    - Add account selection dropdown
    - Show file validation errors
    - Display progress indicator during upload and parsing
    - Implement multi-step flow (upload → preview → importing → complete)
    - _Requirements: 1.1, 1.2, 7.3, 8.1, 8.2, 9.1, 9.2, 12.1, 12.2, 12.3, 12.7_

  - [x] 7.2 Create ImportPreview component
    - Display table of parsed transactions with date, description, amount, type, category
    - Add checkbox selection for each transaction
    - Highlight potential duplicates with warning indicator
    - Show summary statistics (total count, total amount, duplicate count)
    - Implement "Select All" and "Deselect All" functionality
    - Add confirm and cancel buttons
    - _Requirements: 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 7.3 Create ImportHistory component
    - Display list of past imports in reverse chronological order
    - Show import details (date, file name, transaction count, account)
    - Add link to view imported transactions
    - _Requirements: 10.3, 10.4, 10.5_

  - [x] 7.4 Add accessibility features to all components
    - Implement keyboard navigation
    - Add ARIA labels for screen readers
    - Ensure proper focus management
    - Test with keyboard-only navigation
    - _Requirements: 12.4, 12.5, 12.6_

  - [x] 7.5 Write component tests
    - Test ImportTransactionsModal with user interactions
    - Test ImportPreview selection logic
    - Test ImportHistory display
    - Test accessibility features
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 10.3, 10.4, 12.4, 12.5, 12.6_

- [x] 8. Implement account association logic
  - [x] 8.1 Add account selection to import flow
    - Display user's accounts in dropdown
    - Implement account matching for OFX files (BANKID, BRANCHID, ACCTID)
    - Pre-select matched account when found
    - Require account confirmation before proceeding
    - Associate all imported transactions with selected account
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 9. Implement error handling and user feedback
  - [x] 9.1 Create error message mapping
    - Define user-friendly error messages in Portuguese for all error codes
    - Add suggestions for fixing common errors
    - _Requirements: 9.3, 9.4_

  - [x] 9.2 Add progress tracking and status messages
    - Show upload progress
    - Show parsing status with loading indicator
    - Show import progress bar with percentage
    - Display success message with transaction count
    - Display partial success summary (successful vs failed)
    - _Requirements: 9.1, 9.2, 9.5, 9.6, 9.7_

- [x] 10. Implement security measures
  - [x] 10.1 Add file validation and security checks
    - Validate file extension and MIME type
    - Validate file size (max 10MB)
    - Implement basic malicious content detection
    - _Requirements: 1.1, 1.2, 11.3_

  - [x] 10.2 Implement temporary file cleanup
    - Store uploaded files in memory or temp directory
    - Delete files within 1 hour after processing
    - Use unique, non-guessable filenames
    - _Requirements: 1.4, 11.1, 11.4_

  - [x] 10.3 Add authentication and authorization checks
    - Require authentication for all import endpoints
    - Validate user owns target account before import
    - Implement rate limiting (max 10 imports per hour per user)
    - Add security audit logging for all import operations
    - _Requirements: 11.2, 11.5, 11.6_

- [x] 11. Implement PDF Parser (Beta - Feature Flagged)
  - [x] 11.1 Create PDFParser class with text extraction
    - Implement canParse method with feature flag check
    - Extract text from PDF using pdf-parse
    - Handle multi-page PDFs
    - _Requirements: 4.1, 4.7_

  - [x] 11.2 Integrate AI service for transaction extraction
    - Create AI prompt for transaction extraction
    - Send extracted text to Google AI service
    - Parse and validate AI response
    - Convert AI response to ParsedTransaction format
    - _Requirements: 4.2, 4.3, 4.4, 11.7_

  - [x] 11.3 Add PDF-specific error handling
    - Handle PDFs with no recognizable transactions
    - Display beta warning message
    - Show "coming soon" message when feature is disabled
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 11.4 Write tests for PDF parser
    - Test with sample PDF from /public/assets
    - Test with various PDF formats
    - Test AI service integration
    - Test error scenarios
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 12. Integration and final testing
  - [x] 12.1 Test complete import flow with all file formats
    - Test OFX import end-to-end
    - Test CSV import end-to-end
    - Test PDF import end-to-end (when enabled)
    - Verify transactions are created correctly
    - Verify account balances are updated
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 7.7, 8.6_

  - [x] 12.2 Test duplicate detection scenarios
    - Import same file twice and verify duplicates are detected
    - Test fuzzy matching (date ±2 days, amount ±0.01)
    - Test external ID matching
    - Verify user can choose to import or skip duplicates
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 12.3 Test error scenarios and edge cases
    - Test with invalid file formats
    - Test with corrupted files
    - Test with empty files
    - Test with very large files
    - Test with files containing no transactions
    - Verify error messages are clear and helpful
    - _Requirements: 1.5, 9.3, 9.4_

  - [x] 12.4 Verify security measures
    - Test file validation
    - Verify temporary file cleanup
    - Test authentication and authorization
    - Verify rate limiting
    - Check audit logging
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 12.5 Perform accessibility audit
    - Test keyboard navigation
    - Test with screen reader
    - Verify ARIA labels
    - Check color contrast
    - Test focus management
    - _Requirements: 12.4, 12.5, 12.6_

- [x] 13. Documentation and polish
  - [x] 13.1 Add user documentation
    - Create help text for import modal
    - Document supported file formats
    - Add examples of valid files
    - Create troubleshooting guide
    - _Requirements: 12.2, 12.5_

  - [x] 13.2 Add developer documentation
    - Document parser interfaces
    - Document API endpoints
    - Add code examples for extending parsers
    - Document error codes and handling
    - _Requirements: All_

  - [x] 13.3 Final UI polish
    - Improve loading states and animations
    - Refine error message presentation
    - Add success animations
    - Optimize mobile responsiveness
    - _Requirements: 9.1, 9.2, 9.7, 12.1, 12.2, 12.3_
