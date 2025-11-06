# Design Document - Invoice Management System

## Overview

The Invoice Management System is a comprehensive feature that enables users to digitally manage Brazilian fiscal invoices (Notas Fiscais Eletrônicas - NFe/NFCe), track spending patterns, and receive intelligent insights about their consumption habits. The system integrates with existing transaction management, leveraging invoice data to provide enhanced financial analytics and price comparison capabilities.

### Key Capabilities

- Parse and store fiscal invoices from QR codes or government portal URLs
- Extract detailed product information and pricing
- Automatically categorize purchases by merchant type
- Generate spending insights and predictions based on historical data
- Maintain price history for products across different merchants
- Provide price comparison and shopping recommendations
- Alert users about budget limits and unusual spending patterns

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Invoice Input UI  │  Invoice List  │  Insights Dashboard   │
│  (QR/URL Scanner)  │  & Details     │  & Price Comparison   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes Layer                        │
├─────────────────────────────────────────────────────────────┤
│  /api/invoices/*   │  /api/products/*  │  /api/insights/*   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Services Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Invoice Parser    │  Analytics       │  Price Tracking     │
│  Service           │  Service         │  Service            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer (Appwrite)                   │
├─────────────────────────────────────────────────────────────┤
│  Invoices  │  Invoice Items  │  Products  │  Price History  │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Transaction System**: Invoices can optionally create corresponding transactions
2. **Account System**: Invoice spending can be linked to specific accounts
3. **Category System**: Leverages existing transaction categories
4. **User Context**: All invoices are user-scoped with proper authentication

## Components and Interfaces

### 1. Invoice Parser Service

**Purpose**: Extract and normalize invoice data from Brazilian government portals

**Key Methods**:

```typescript
interface InvoiceParserService {
  parseFromUrl(url: string): Promise<ParsedInvoice>;
  parseFromQRCode(qrData: string): Promise<ParsedInvoice>;
  validateInvoiceFormat(data: string): boolean;
  extractProducts(invoiceXml: string): Product[];
  identifyMerchantCategory(merchantData: MerchantInfo): InvoiceCategory;
}
```

**Implementation Details**:

- Use HTTP client to fetch invoice XML from government portal URLs
- Parse XML structure following NFe/NFCe schema standards
- Extract merchant CNPJ, name, address, and tax information
- Parse line items including product codes (NCM/CEST), descriptions, quantities, and prices
- Handle different invoice formats (NFe, NFCe, SAT-CF-e)
- Implement retry logic for network failures
- Cache parsed invoices to avoid redundant requests

**Category Detection Logic**:

- Pharmacy: Keywords in merchant name (farmácia, drogaria) or NCM codes for medicines
- Groceries/Supermarket: Keywords (mercado, supermercado, hortifruti) or food NCM codes
- Restaurant: Keywords (restaurante, lanchonete, bar) or prepared food codes
- Fuel: Keywords (posto, combustível) or fuel NCM codes
- General Retail: Default category when others don't match

### 2. Invoice Storage Schema

**Invoices Collection**:

```typescript
interface Invoice {
  $id: string;
  userId: string;
  invoiceKey: string; // Chave de acesso (44 digits)
  invoiceNumber: string;
  series: string;
  issueDate: string; // ISO 8601

  // Merchant Information
  merchantCnpj: string;
  merchantName: string;
  merchantAddress: string;

  // Financial Data
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;

  // Categorization
  category: InvoiceCategory;
  customCategory?: string;

  // Metadata
  sourceUrl?: string;
  qrCodeData?: string;
  xmlData?: string; // Compressed/encrypted

  // Linking
  transactionId?: string; // Optional link to transaction
  accountId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

**Invoice Items Collection**:

```typescript
interface InvoiceItem {
  $id: string;
  invoiceId: string;
  userId: string;

  // Product Information
  productId: string; // Link to normalized product
  productCode?: string; // EAN/GTIN
  ncmCode?: string;
  description: string;

  // Pricing
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;

  // Metadata
  lineNumber: number;
  createdAt: string;
}
```

**Products Collection** (Normalized):

```typescript
interface Product {
  $id: string;
  userId: string;

  // Identification
  name: string; // Normalized name
  productCode?: string; // EAN/GTIN
  ncmCode?: string;

  // Categorization
  category: string;
  subcategory?: string;

  // Aggregated Data
  totalPurchases: number;
  averagePrice: number;
  lastPurchaseDate: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

**Price History Collection**:

```typescript
interface PriceHistory {
  $id: string;
  userId: string;
  productId: string;

  // Purchase Context
  invoiceId: string;
  merchantCnpj: string;
  merchantName: string;
  purchaseDate: string;

  // Pricing
  unitPrice: number;
  quantity: number;

  // Metadata
  createdAt: string;
}
```

### 3. Analytics Service

**Purpose**: Generate insights, predictions, and spending analysis

**Key Methods**:

```typescript
interface AnalyticsService {
  generateInsights(userId: string): Promise<SpendingInsights>;
  predictMonthlySpending(userId: string): Promise<SpendingPrediction[]>;
  detectAnomalies(userId: string): Promise<SpendingAnomaly[]>;
  calculateCategoryTrends(userId: string, category: string): Promise<Trend>;
  getTopMerchants(userId: string, limit: number): Promise<MerchantStats[]>;
}
```

**Insights Generation Logic**:

1. **Spending Patterns** (requires 3+ invoices):
   - Calculate average spending per category
   - Identify most frequent merchants
   - Determine typical purchase frequency
   - Calculate average basket size

2. **Monthly Predictions** (requires 3+ months):
   - Use moving average for baseline prediction
   - Apply seasonal adjustments (e.g., December typically higher)
   - Factor in current month's partial data
   - Calculate confidence intervals based on historical variance

3. **Anomaly Detection**:
   - Flag purchases exceeding 2 standard deviations from mean
   - Detect unusual merchant visits
   - Identify category spending spikes
   - Alert on duplicate invoices

**Prediction Algorithm**:

```typescript
function predictCategorySpending(historicalData: MonthlySpending[], currentMonthData: Invoice[]): Prediction {
  // Calculate 3-month moving average
  const recentMonths = historicalData.slice(-3);
  const baselinePrediction = average(recentMonths.map((m) => m.total));

  // Apply trend adjustment
  const trend = calculateTrend(recentMonths);
  const trendAdjusted = baselinePrediction * (1 + trend);

  // Factor in current month progress
  const daysElapsed = getCurrentDayOfMonth();
  const daysInMonth = getDaysInMonth();
  const currentSpending = sum(currentMonthData.map((i) => i.totalAmount));
  const projectedFromCurrent = (currentSpending / daysElapsed) * daysInMonth;

  // Weighted average (70% historical, 30% current projection)
  const finalPrediction = trendAdjusted * 0.7 + projectedFromCurrent * 0.3;

  // Calculate confidence based on variance
  const variance = calculateVariance(recentMonths.map((m) => m.total));
  const confidence = 1 - variance / baselinePrediction;

  return {
    amount: finalPrediction,
    confidence: Math.max(0.5, Math.min(0.95, confidence)),
    baseline: baselinePrediction,
    trend: trend,
  };
}
```

### 4. Price Tracking Service

**Purpose**: Maintain price history and provide comparison capabilities

**Key Methods**:

```typescript
interface PriceTrackingService {
  recordPrice(productId: string, invoiceItem: InvoiceItem): Promise<void>;
  getPriceHistory(productId: string, days: number): Promise<PricePoint[]>;
  comparePrice(productId: string, merchants: string[]): Promise<PriceComparison>;
  findBestPrices(productIds: string[]): Promise<BestPriceResult[]>;
  detectPriceChanges(productId: string, threshold: number): Promise<PriceAlert[]>;
}
```

**Price Comparison Logic**:

- Group prices by merchant for each product
- Calculate average price per merchant (last 30 days)
- Identify lowest, highest, and median prices
- Calculate savings potential
- Consider purchase frequency when recommending merchants

### 5. Frontend Components

#### Invoice Input Component

```typescript
// components/invoices/AddInvoiceModal.tsx
interface AddInvoiceModalProps {
  onSuccess: (invoice: Invoice) => void;
  onClose: () => void;
}

// Features:
// - Tab interface: "URL" or "QR Code"
// - URL input with validation
// - QR code scanner using device camera
// - Loading state during parsing
// - Error handling with retry option
// - Preview parsed data before saving
// - Optional category override
// - Optional link to account/transaction
```

#### Invoice List Component

```typescript
// app/(app)/invoices/page.tsx

// Features:
// - Paginated list with infinite scroll
// - Filter by date range, category, merchant
// - Search by invoice number, merchant, products
// - Sort by date, amount, merchant
// - Summary cards: total spent, invoice count, top category
// - Quick actions: view details, delete, export
```

#### Invoice Details Component

```typescript
// components/invoices/InvoiceDetailsModal.tsx

// Features:
// - Merchant information display
// - Complete line items table
// - Total breakdown (subtotal, discounts, taxes)
// - Link to original invoice URL
// - Option to create transaction
// - Product price history links
// - Delete invoice action
```

#### Insights Dashboard Component

```typescript
// app/(app)/invoices/insights/page.tsx

// Features:
// - Spending by category (pie chart)
// - Monthly spending trend (line chart)
// - Top merchants (bar chart)
// - Predictions vs actual (comparison chart)
// - Anomaly alerts
// - Budget progress bars
// - Actionable recommendations
```

#### Price Comparison Component

```typescript
// components/invoices/PriceComparisonView.tsx

// Features:
// - Product search/filter
// - Price history chart per product
// - Merchant comparison table
// - Best price highlights
// - Savings calculator
// - Shopping list builder
```

## Data Models

### Enums and Types

```typescript
enum InvoiceCategory {
  PHARMACY = 'pharmacy',
  GROCERIES = 'groceries',
  SUPERMARKET = 'supermarket',
  RESTAURANT = 'restaurant',
  FUEL = 'fuel',
  RETAIL = 'retail',
  SERVICES = 'services',
  OTHER = 'other',
}

interface ParsedInvoice {
  invoiceKey: string;
  invoiceNumber: string;
  series: string;
  issueDate: Date;
  merchant: MerchantInfo;
  items: ParsedInvoiceItem[];
  totals: InvoiceTotals;
  xmlData: string;
}

interface MerchantInfo {
  cnpj: string;
  name: string;
  tradeName?: string;
  address: string;
  city: string;
  state: string;
}

interface ParsedInvoiceItem {
  description: string;
  productCode?: string;
  ncmCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
}

interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface SpendingInsights {
  totalInvoices: number;
  totalSpent: number;
  averageInvoiceAmount: number;
  categoryBreakdown: CategorySpending[];
  topMerchants: MerchantStats[];
  frequentProducts: ProductStats[];
  monthlyTrend: MonthlySpending[];
  predictions: SpendingPrediction[];
  anomalies: SpendingAnomaly[];
}

interface CategorySpending {
  category: InvoiceCategory;
  totalAmount: number;
  invoiceCount: number;
  percentage: number;
  averageAmount: number;
}

interface MerchantStats {
  merchantName: string;
  merchantCnpj: string;
  visitCount: number;
  totalSpent: number;
  averageSpent: number;
  lastVisit: string;
}

interface SpendingPrediction {
  category: InvoiceCategory;
  predictedAmount: number;
  confidence: number;
  currentSpending: number;
  daysRemaining: number;
  onTrack: boolean;
}

interface PriceComparison {
  productId: string;
  productName: string;
  merchants: MerchantPrice[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  savingsPotential: number;
}

interface MerchantPrice {
  merchantName: string;
  currentPrice: number;
  lastUpdated: string;
  priceChange: number;
  priceChangePercent: number;
}
```

## Error Handling

### Invoice Parsing Errors

1. **Invalid URL/QR Code**:
   - Validate format before attempting to fetch
   - Display user-friendly error: "Invalid invoice URL or QR code"
   - Provide example of valid format

2. **Network Errors**:
   - Implement retry logic (3 attempts with exponential backoff)
   - Cache successful responses
   - Display: "Unable to connect to government portal. Please try again."

3. **Parsing Errors**:
   - Log detailed error for debugging
   - Display: "Unable to read invoice data. The invoice may be corrupted."
   - Offer manual entry option

4. **Duplicate Invoice**:
   - Check invoice key before saving
   - Display: "This invoice has already been registered on [date]"
   - Offer option to view existing invoice

### Analytics Errors

1. **Insufficient Data**:
   - Display message: "Register at least 3 invoices to see insights"
   - Show progress indicator

2. **Calculation Errors**:
   - Use fallback values (e.g., median instead of mean)
   - Log error for investigation
   - Display partial insights with disclaimer

### API Error Responses

```typescript
interface ApiError {
  error: string;
  message: string;
  code: string;
  details?: any;
}

// Error Codes:
// INVOICE_INVALID_FORMAT
// INVOICE_PARSE_ERROR
// INVOICE_DUPLICATE
// INVOICE_NOT_FOUND
// INSUFFICIENT_DATA
// ANALYTICS_ERROR
```

## Testing Strategy

### Unit Tests

1. **Invoice Parser Service**:
   - Test XML parsing with sample NFe/NFCe files
   - Test category detection logic
   - Test product normalization
   - Test error handling for malformed data

2. **Analytics Service**:
   - Test prediction algorithm with known datasets
   - Test anomaly detection with edge cases
   - Test trend calculations
   - Test confidence score calculations

3. **Price Tracking Service**:
   - Test price recording and retrieval
   - Test comparison logic
   - Test best price identification
   - Test price change detection

### Integration Tests

1. **Invoice Registration Flow**:
   - Test complete flow from URL input to database storage
   - Test QR code scanning and parsing
   - Test transaction creation from invoice
   - Test duplicate detection

2. **Insights Generation**:
   - Test with various data volumes (3, 10, 100+ invoices)
   - Test prediction accuracy with historical data
   - Test category breakdown calculations
   - Test merchant statistics

3. **Price Comparison**:
   - Test with products from multiple merchants
   - Test price history retrieval
   - Test savings calculations
   - Test shopping list optimization

### E2E Tests

1. **User Journey - First Invoice**:
   - Add first invoice via URL
   - View invoice details
   - Verify data accuracy
   - Check that insights show "insufficient data" message

2. **User Journey - Insights**:
   - Add 3+ invoices across different categories
   - Navigate to insights dashboard
   - Verify charts and statistics display
   - Check predictions are generated

3. **User Journey - Price Comparison**:
   - Add invoices with same products from different merchants
   - View product price history
   - Compare prices across merchants
   - Verify best price recommendations

### Performance Considerations

1. **Invoice Parsing**:
   - Cache parsed XML to avoid redundant processing
   - Parse asynchronously to avoid blocking UI
   - Implement timeout for government portal requests (30s)

2. **Analytics Calculations**:
   - Cache insights for 1 hour
   - Calculate incrementally when new invoices added
   - Use database aggregation queries instead of in-memory processing

3. **Price History**:
   - Index by productId and purchaseDate
   - Limit history queries to reasonable timeframes (90 days default)
   - Paginate large result sets

## Security Considerations

1. **Data Privacy**:
   - All invoice data is user-scoped
   - Encrypt sensitive XML data at rest
   - Never expose other users' invoice data

2. **URL Validation**:
   - Whitelist government portal domains
   - Sanitize URLs before fetching
   - Prevent SSRF attacks

3. **Rate Limiting**:
   - Limit invoice parsing requests (10 per minute per user)
   - Prevent abuse of government portal APIs

4. **Authentication**:
   - Require authentication for all invoice endpoints
   - Validate user ownership before operations

## Migration and Rollout

### Phase 1: Core Infrastructure (Week 1-2)

- Create database collections
- Implement invoice parser service
- Build basic API endpoints
- Create invoice input UI

### Phase 2: Invoice Management (Week 3)

- Implement invoice list and details views
- Add search and filter capabilities
- Implement category detection
- Add transaction linking

### Phase 3: Analytics (Week 4-5)

- Implement analytics service
- Build insights dashboard
- Create prediction algorithms
- Add anomaly detection

### Phase 4: Price Tracking (Week 6)

- Implement price history tracking
- Build price comparison UI
- Add merchant recommendations
- Create shopping list feature

### Phase 5: Polish and Optimization (Week 7)

- Performance optimization
- Error handling improvements
- User feedback integration
- Documentation

## Future Enhancements

1. **OCR Support**: Allow users to photograph paper receipts
2. **Shared Shopping Lists**: Collaborate with family members
3. **Merchant Ratings**: Rate and review merchants
4. **Product Recommendations**: Suggest alternatives based on price/quality
5. **Budget Automation**: Auto-adjust budgets based on predictions
6. **Export to Accounting Software**: Integration with accounting tools
7. **Tax Deduction Tracking**: Identify tax-deductible purchases
8. **Loyalty Program Integration**: Track points and rewards
