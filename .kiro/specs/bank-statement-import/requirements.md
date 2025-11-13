# Requirements Document

## Introduction

This document defines the requirements for implementing a bank statement import feature that allows users to import their financial transactions from multiple file formats (OFX, CSV, and PDF). The system will parse these files, extract transaction data, and create transactions in the user's account automatically, reducing manual data entry and improving data accuracy.

## Glossary

- **Import System**: The complete feature that handles file upload, parsing, validation, and transaction creation from bank statements
- **OFX Parser**: Component responsible for parsing Open Financial Exchange (OFX) format files
- **CSV Parser**: Component responsible for parsing Comma-Separated Values (CSV) format files
- **PDF Parser**: Component responsible for extracting transaction data from PDF bank statements using AI
- **Transaction Mapper**: Component that converts parsed data into the application's Transaction format
- **Import Session**: A single import operation that tracks the file, parsing status, and created transactions
- **Duplicate Detection**: Logic that identifies transactions that may already exist in the system
- **Import Preview**: UI component that shows parsed transactions before final import
- **User**: The authenticated person importing bank statements into their account

## Requirements

### Requirement 1: File Upload and Format Detection

**User Story:** As a User, I want to upload bank statement files in different formats, so that I can import my transactions regardless of which bank I use

#### Acceptance Criteria

1. WHEN the User selects a file for upload, THE Import System SHALL validate that the file extension is one of .ofx, .csv, or .pdf
2. WHEN the file size exceeds 10MB, THE Import System SHALL reject the upload and display an error message
3. WHEN the User uploads a valid file, THE Import System SHALL detect the file format based on file extension and content
4. THE Import System SHALL store the uploaded file temporarily during the import session
5. WHEN the file format cannot be determined, THE Import System SHALL display an error message indicating unsupported format

### Requirement 2: OFX File Parsing

**User Story:** As a User, I want to import OFX files from my bank, so that I can automatically create transactions from my bank statement

#### Acceptance Criteria

1. WHEN the Import System receives an OFX file, THE OFX Parser SHALL extract all transaction records from the BANKTRANLIST section
2. THE OFX Parser SHALL extract the following fields from each transaction: TRNTYPE, DTPOSTED, TRNAMT, FITID, NAME, and MEMO
3. THE OFX Parser SHALL convert TRNTYPE values to the application's TransactionType (CREDIT to income, DEBIT to expense)
4. THE OFX Parser SHALL parse date values in DTPOSTED format and convert them to ISO 8601 format
5. THE OFX Parser SHALL extract bank account information from BANKACCTFROM section (BANKID, BRANCHID, ACCTID)
6. WHEN the OFX file contains malformed XML, THE OFX Parser SHALL return a parsing error with details
7. THE OFX Parser SHALL handle both OFX version 1.0 (SGML) and version 2.0 (XML) formats

### Requirement 3: CSV File Parsing

**User Story:** As a User, I want to import CSV files from my bank, so that I can use the most common export format

#### Acceptance Criteria

1. WHEN the Import System receives a CSV file, THE CSV Parser SHALL detect the delimiter (comma, semicolon, or tab)
2. THE CSV Parser SHALL identify header row and map columns to transaction fields
3. THE CSV Parser SHALL support common column names in Portuguese and English (Data/Date, Valor/Amount, Descrição/Description)
4. WHEN a required column is missing, THE CSV Parser SHALL return an error indicating which columns are required
5. THE CSV Parser SHALL parse date values in multiple formats (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
6. THE CSV Parser SHALL parse amount values with different decimal separators (comma and period)
7. THE CSV Parser SHALL handle negative amounts as expenses and positive amounts as income

### Requirement 4: PDF File Parsing with AI

**User Story:** As a User, I want to import PDF bank statements, so that I can use statements that are only available in PDF format

#### Acceptance Criteria

1. WHEN the Import System receives a PDF file, THE PDF Parser SHALL extract text content from all pages
2. THE PDF Parser SHALL send the extracted text to an AI service for structured data extraction
3. THE PDF Parser SHALL request the AI to identify and extract transaction records with date, amount, description, and type
4. THE PDF Parser SHALL validate that the AI response contains valid transaction data
5. WHEN the PDF contains no recognizable transactions, THE PDF Parser SHALL return an error message
6. THE Import System SHALL display a warning that PDF parsing is in beta and may require manual review
7. WHERE the PDF parsing feature is disabled, THE Import System SHALL show a message that this feature is coming soon

### Requirement 5: Transaction Mapping and Validation

**User Story:** As a User, I want parsed transactions to be validated and mapped correctly, so that imported data is accurate and consistent

#### Acceptance Criteria

1. THE Transaction Mapper SHALL convert parsed data into CreateTransactionDto format
2. THE Transaction Mapper SHALL validate that each transaction has a valid date, amount, and description
3. THE Transaction Mapper SHALL assign a default category based on transaction description keywords
4. WHEN the amount is zero, THE Transaction Mapper SHALL exclude the transaction from import
5. THE Transaction Mapper SHALL set the transaction source field to "import"
6. THE Transaction Mapper SHALL preserve the original transaction identifier (FITID for OFX, Identificador for CSV) in metadata
7. THE Transaction Mapper SHALL set transaction status to "completed" for historical transactions

### Requirement 6: Duplicate Detection

**User Story:** As a User, I want the system to detect duplicate transactions, so that I don't accidentally import the same transactions multiple times

#### Acceptance Criteria

1. WHEN processing imported transactions, THE Import System SHALL check for existing transactions with matching date, amount, and description
2. THE Import System SHALL check for existing transactions with matching external identifier (FITID or Identificador)
3. WHEN a potential duplicate is found, THE Import System SHALL mark the transaction as "possible duplicate" in the preview
4. THE Import System SHALL allow the User to choose whether to import potential duplicates
5. THE Import System SHALL use a date range of ±2 days when checking for duplicate dates
6. THE Import System SHALL consider amounts within 0.01 difference as matching for duplicate detection

### Requirement 7: Import Preview and Confirmation

**User Story:** As a User, I want to preview imported transactions before they are created, so that I can review and adjust them if needed

#### Acceptance Criteria

1. WHEN parsing is complete, THE Import System SHALL display a preview table showing all parsed transactions
2. THE Import Preview SHALL display transaction date, description, amount, type, and category for each transaction
3. THE Import Preview SHALL highlight potential duplicate transactions with a warning indicator
4. THE Import Preview SHALL allow the User to deselect individual transactions to exclude them from import
5. THE Import Preview SHALL display a summary showing total transactions, total amount, and number of duplicates
6. THE Import Preview SHALL provide a "Select All" and "Deselect All" option for transaction selection
7. WHEN the User confirms the import, THE Import System SHALL create only the selected transactions

### Requirement 8: Account Association

**User Story:** As a User, I want to associate imported transactions with a specific account, so that my account balances are updated correctly

#### Acceptance Criteria

1. WHEN starting an import, THE Import System SHALL prompt the User to select a target account
2. THE Import System SHALL display all the User's accounts in a dropdown or selection list
3. WHEN the OFX file contains account information, THE Import System SHALL attempt to match it with existing accounts
4. WHEN a matching account is found, THE Import System SHALL pre-select it as the target account
5. THE Import System SHALL require the User to confirm or change the selected account before proceeding
6. THE Import System SHALL associate all imported transactions with the selected account
7. WHEN no account is selected, THE Import System SHALL prevent the import from proceeding

### Requirement 9: Import Progress and Error Handling

**User Story:** As a User, I want to see the progress of my import and understand any errors, so that I know what is happening and can fix issues

#### Acceptance Criteria

1. WHEN file upload starts, THE Import System SHALL display a progress indicator
2. WHEN parsing is in progress, THE Import System SHALL display a loading state with status message
3. WHEN parsing fails, THE Import System SHALL display a clear error message explaining what went wrong
4. THE Import System SHALL provide suggestions for fixing common errors (invalid format, missing columns, corrupted file)
5. WHEN transaction creation is in progress, THE Import System SHALL display a progress bar showing percentage complete
6. WHEN some transactions fail to import, THE Import System SHALL display a summary of successful and failed imports
7. WHEN the import is complete, THE Import System SHALL display a success message with the number of transactions imported

### Requirement 10: Import History and Audit Trail

**User Story:** As a User, I want to see a history of my imports, so that I can track what files I've imported and when

#### Acceptance Criteria

1. THE Import System SHALL create an import record for each import session
2. THE Import System SHALL store the filename, import date, number of transactions, and target account for each import
3. THE Import System SHALL provide a view showing all past imports for the User
4. WHEN the User views import history, THE Import System SHALL display imports in reverse chronological order
5. THE Import System SHALL allow the User to view details of a past import including which transactions were created
6. THE Import System SHALL store the import source in transaction metadata for audit purposes
7. THE Import System SHALL retain import history for at least 90 days

### Requirement 11: Security and Privacy

**User Story:** As a User, I want my bank statement files to be handled securely, so that my financial data remains private

#### Acceptance Criteria

1. THE Import System SHALL delete uploaded files from temporary storage within 1 hour after import completion
2. THE Import System SHALL ensure that only the authenticated User can access their uploaded files
3. THE Import System SHALL validate file content to prevent malicious file uploads
4. THE Import System SHALL not store raw file content in the database
5. THE Import System SHALL log all import operations for security audit purposes
6. THE Import System SHALL use secure file upload mechanisms with HTTPS
7. WHEN PDF parsing uses AI, THE Import System SHALL not send personally identifiable information beyond transaction data

### Requirement 12: User Interface and Accessibility

**User Story:** As a User, I want an intuitive import interface, so that I can easily import my bank statements without confusion

#### Acceptance Criteria

1. THE Import System SHALL provide a clear "Import Transactions" button or menu item in the transactions page
2. THE Import System SHALL display supported file formats prominently in the upload interface
3. THE Import System SHALL support drag-and-drop file upload in addition to file selection
4. THE Import System SHALL provide keyboard navigation for all import interface elements
5. THE Import System SHALL display clear labels and instructions at each step of the import process
6. THE Import System SHALL use appropriate ARIA labels for screen reader accessibility
7. THE Import System SHALL provide a "Cancel" option at any point before final import confirmation
