import type { FC, SVGProps } from 'react';

// ============================================
// Core Entity Types (Appwrite Database)
// ============================================

/**
 * User entity from Appwrite database
 */
export interface User {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  auth_user_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * User profile with additional information
 */
export interface UserProfile {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  address?: string; // JSON string
  birthdate?: string;
  created_at: string;
  updated_at: string;
}

/**
 * User preferences for UI and notifications
 */
export interface UserPreferences {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
  notifications: string; // JSON string
  created_at: string;
  updated_at: string;
}

/**
 * Sharing preferences for joint accounts
 */
export interface SharingPreferences {
  show_shared_data: boolean;
  include_shared_in_calculations: boolean;
  show_ownership_indicators: boolean;
}

/**
 * User security and privacy settings
 */
export interface UserSettings {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  two_factor_enabled: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  marketing_emails: boolean;
  privacy_settings: string; // JSON string
  created_at: string;
  updated_at: string;
}

// ============================================
// Account Types
// ============================================

export type AccountType = 'checking' | 'savings' | 'investment' | 'vale' | 'other';
export type AccountStatus = 'Connected' | 'Sync Error' | 'Disconnected' | 'Manual';

/**
 * Bank account entity
 */
export interface Account {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  balance: number;
  is_manual: boolean;
  data?: string; // JSON string containing AccountData
  created_at: string;
  updated_at: string;
  // Extended fields (parsed from data JSON)
  bank_id?: string;
  last_digits?: string;
  status?: AccountStatus;
  last_sync?: string;
  creditCards?: CreditCard[];
}

/**
 * Data structure stored in Account.data JSON field
 */
export interface AccountData {
  bank_id?: string;
  last_digits?: string;
  status: AccountStatus;
  last_sync?: string;
  integration_id?: string;
  integration_data?: any;
}

// ============================================
// Credit Card Types
// ============================================

export type CreditCardBrand = 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';

/**
 * Credit card entity
 */
export interface CreditCard {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  account_id: string;
  name: string;
  last_digits: string;
  credit_limit: number;
  used_limit: number;
  closing_day: number;
  due_day: number;
  data?: string; // JSON string containing CreditCardData
  created_at: string;
  updated_at: string;
  // Extended fields (parsed from data JSON)
  brand?: CreditCardBrand;
  network?: string;
  color?: string;
}

/**
 * Data structure stored in CreditCard.data JSON field
 */
export interface CreditCardData {
  brand?: CreditCardBrand;
  network?: string;
  color?: string;
}

// ============================================
// Transaction Types
// ============================================

export type TransactionType = 'income' | 'expense' | 'transfer' | 'salary';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type TransactionSource = 'manual' | 'integration' | 'import';

/**
 * Transaction entity
 */
export interface Transaction {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  amount: number; // Positive for 'in' direction, negative for 'out' direction
  type: TransactionType;
  date: string;
  status: TransactionStatus;
  account_id?: string;
  credit_card_id?: string;
  category?: string;
  description?: string;
  currency?: string;
  source?: TransactionSource;
  merchant?: string;
  tags?: string;
  is_recurring?: boolean;
  purchase_date?: string;
  installment?: number;
  installments?: number;
  credit_card_transaction_created_at?: string;
  direction: 'in' | 'out'; // Transaction direction: 'in' for income/salary/transfers in, 'out' for expense/transfers out
  data?: string; // JSON string containing additional data
  created_at: string;
  updated_at: string;
  // Extended fields for UI
  bankName?: string;
  icon?: FC<{ className?: string }>;
  notes?: string;
}

/**
 * Data structure stored in Transaction.data JSON field
 */
export interface TransactionData {
  category: string;
  description?: string;
  currency: string;
  source: TransactionSource;
  account_id?: string;
  merchant?: string;
  integration_id?: string;
  integration_data?: any;
  tags?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
}

// ============================================
// Category Types
// ============================================

/**
 * Transaction category
 */
export interface Category {
  $id: string;
  name: string;
  percentage?: number;
  transactionCount?: number;
  icon: FC<{ className?: string }>;
}

// ============================================
// Bank Types
// ============================================

/**
 * Bank information for integrations
 */
export interface Bank {
  id: string;
  name: string;
  logo: FC<SVGProps<SVGSVGElement>>;
}

// ============================================
// Invoice Types
// ============================================

export type InvoiceStatus = 'COMPLETED' | 'PROCESSING' | 'FAILED';

/**
 * Invoice/receipt document
 */
export interface Invoice {
  $id: string;
  fileName: string;
  uploadDate: string;
  status: InvoiceStatus;
}

// ============================================
// Notification Types
// ============================================

/**
 * User notification
 */
export interface Notification {
  $id: string;
  title: 'Warranty Expiring Soon' | 'Large Purchase Alert' | 'Weekly Summary Ready';
  description: string;
  date: string;
  read: boolean;
}

// ============================================
// Warranty Types
// ============================================

/**
 * Product warranty tracking
 */
export interface Warranty {
  $id: string;
  productName: string;
  purchaseDate: string;
  expiresAt: string;
  daysRemaining: number;
}

// ============================================
// Tax Types
// ============================================

export type TaxSectionStatus = 'COMPLETED' | 'NEEDS_REVIEW' | 'NOT_STARTED';

/**
 * Tax filing section
 */
export interface TaxSection {
  $id: string;
  title: string;
  status: TaxSectionStatus;
}

/**
 * Tax asset declaration
 */
export interface TaxAsset {
  $id: string;
  groupCode: string;
  groupName: string;
  itemCode: string;
  itemName: string;
  location: 'Brasil' | 'Exterior';
  description: string;
  value2023: number;
  value2024: number;
}

/**
 * Tax income declaration
 */
export interface TaxIncome {
  $id: string;
  type: 'EXEMPT' | 'EXCLUSIVE';
  code: string;
  description: string;
  value: number;
  sourceName: string;
  sourceCnpj: string;
}

// ============================================
// Financial Planning Types
// ============================================

/**
 * Financial goal tracking
 */
export interface FinancialGoal {
  $id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

/**
 * AI-suggested financial goal
 */
export interface SuggestedGoal {
  name: string;
  targetAmount: number;
  targetDate: string;
  justification: string;
}

/**
 * Retirement planning data
 */
export interface RetirementGoal {
  targetAge: number;
  targetSavings: number;
  currentSavings: number;
  monthlyContribution: number;
}

// ============================================
// Insurance Types
// ============================================

export type InsurancePolicyType = 'Life' | 'Home' | 'Auto';
export type InsurancePolicyStatus = 'Active' | 'Expiring Soon' | 'Expired';

/**
 * Insurance policy
 */
export interface InsurancePolicy {
  $id: string;
  type: InsurancePolicyType;
  provider: string;
  coverage: number;
  premium: number;
  status: InsurancePolicyStatus;
}

// ============================================
// Succession Planning Types
// ============================================

export type BeneficiaryStatus = 'Confirmed' | 'Pending';

/**
 * Estate planning beneficiary
 */
export interface Beneficiary {
  $id: string;
  name: string;
  relationship: string;
  allocation: string;
  status: BeneficiaryStatus;
}

// ============================================
// Integration Types
// ============================================

export type IntegrationCategory = 'Investments' | 'E-commerce' | 'Real Estate' | 'Rewards';

/**
 * Third-party integration
 */
export interface Integration {
  name: string;
  description: string;
  logo: FC<{ className?: string }>;
  connected: boolean;
  category: IntegrationCategory;
}

// ============================================
// Family Management Types
// ============================================

export type FamilyMemberRole = 'Admin' | 'Member' | 'Child';

/**
 * Family member in shared account
 */
export interface FamilyMember {
  $id: string;
  name: string;
  role: FamilyMemberRole;
}

// ============================================
// AI Insights Types
// ============================================

export type InsightType = 'SAVINGS_OPPORTUNITY' | 'UNUSUAL_SPENDING' | 'CASH_FLOW_FORECAST';

/**
 * AI-generated financial insight
 */
export interface FinancialInsight {
  $id: string;
  type: InsightType;
  title: string;
  description: string;
  actionText: string;
}

// ============================================
// Shopping List Types
// ============================================

/**
 * Shopping list item
 */
export interface ShoppingListItem {
  $id: string;
  name: string;
  checked: boolean;
}

/**
 * Shopping list
 */
export interface ShoppingList {
  $id: string;
  title: string;
  createdAt: string;
  items: ShoppingListItem[];
}

/**
 * Purchased item from receipt
 */
export interface PurchasedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
}

/**
 * Purchase record from receipt scanning
 */
export interface PurchaseRecord {
  $id: string;
  storeName: string;
  purchaseDate: string;
  items: PurchasedItem[];
  totalAmount: number;
  nfeUrl?: string;
}

// ============================================
// Chart Data Types
// ============================================

/**
 * Monthly financial chart data
 */
export interface MonthlyChartData {
  month: string;
  income: number;
  expenses: number;
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * API error response
 */
export interface APIError {
  message: string;
  code?: string;
  statusCode: number;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * API success response
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// ============================================
// DTO Types (Data Transfer Objects)
// ============================================

/**
 * Create account request
 */
export interface CreateAccountDto {
  name: string;
  account_type: AccountType;
  initial_balance?: number;
  is_manual?: boolean;
  bank_id?: string;
  last_digits?: string;
  status?: AccountStatus;
  integration_id?: string;
  integration_data?: any;
}

/**
 * Update account request
 */
export interface UpdateAccountDto {
  name?: string;
  account_type?: AccountType;
  bank_id?: string;
  last_digits?: string;
  status?: AccountStatus;
}

/**
 * Create credit card request
 */
export interface CreateCreditCardDto {
  account_id: string;
  name: string;
  last_digits: string;
  credit_limit: number;
  used_limit?: number;
  closing_day: number;
  due_day: number;
  brand?: CreditCardBrand;
  network?: string;
  color?: string;
}

/**
 * Update credit card request
 */
export interface UpdateCreditCardDto {
  name?: string;
  credit_limit?: number;
  used_limit?: number;
  closing_day?: number;
  due_day?: number;
  brand?: CreditCardBrand;
  network?: string;
  color?: string;
}

/**
 * Create transaction request
 */
export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  date: string;
  category: string;
  description?: string;
  account_id?: string;
  credit_card_id?: string;
  merchant?: string;
  currency?: string;
  tags?: string[];
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  tax_amount?: number; // Tax amount for salary transactions
}

/**
 * Update transaction request
 */
export interface UpdateTransactionDto {
  amount?: number;
  type?: TransactionType;
  date?: string;
  category?: string;
  description?: string;
  status?: TransactionStatus;
  account_id?: string;
}

/**
 * Sign in request
 */
export interface SignInDto {
  email: string;
  password: string;
}

/**
 * Sign up request
 */
export interface SignUpDto {
  email: string;
  password: string;
  name: string;
}

/**
 * User response (for authentication)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
}

// ============================================
// UI Types
// ============================================

export type UserRole = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Screen/route identifier (legacy, for migration reference)
 */
export type Screen =
  | 'landing'
  | 'login'
  | 'register'
  | 'welcome'
  | 'onboarding/select-bank'
  | 'onboarding/security'
  | 'onboarding/loading'
  | 'dashboard/overview'
  | 'dashboard/accounts'
  | 'dashboard/transactions'
  | 'dashboard/categories'
  | 'dashboard/invoices'
  | 'dashboard/warranties'
  | 'dashboard/taxes'
  | 'dashboard/notifications'
  | 'dashboard/settings'
  | 'dashboard/help'
  | 'dashboard/pricing'
  | 'dashboard/succession'
  | 'dashboard/insurance'
  | 'dashboard/credit'
  | 'dashboard/integrations'
  | 'dashboard/planning-goals'
  | 'dashboard/analytics'
  | 'dashboard/family'
  | 'dashboard/shopping-list'
  | 'dashboard/compliance';

/**
 * Category icon mapping
 */
export interface CategoryIcon {
  name: string;
  component: FC<{ className?: string }>;
}

// ============================================
// Shopping List API Types
// ============================================

// Re-export shopping list API types for convenience
export type {
  GenerateListRequest,
  ParseNFeRequest,
  GenerateInsightsRequest,
  GenerateListResponse,
  ParseNFeResponse,
  GenerateInsightsResponse,
  ErrorResponse,
} from './shopping-list-api.types';

export {
  isErrorResponse,
  isGenerateListResponse,
  isParseNFeResponse,
  isGenerateInsightsResponse,
} from './shopping-list-api.types';

// ============================================
// Sharing Types
// ============================================

// Re-export sharing types for joint accounts feature
export type {
  SharingRelationship,
  SharingRelationshipStatus,
  SharingRelationshipDetails,
  SharingInvitation,
  InvitationStatus,
  CreateInvitationDto,
  AcceptInvitationDto,
  RejectInvitationDto,
  TerminateRelationshipDto,
  SharedDataContext,
  WithOwnership,
  AccountWithOwnership,
  TransactionWithOwnership,
  CreditCardWithOwnership,
  InvoiceWithOwnership,
  ValidateInvitationResponse,
  GetRelationshipResponse,
  GetMembersResponse,
} from './sharing.types';

// ============================================
// Import Types
// ============================================

// Re-export import types for bank statement import feature
export type {
  ImportFileFormat,
  ImportStatus,
  ParsedTransaction,
  ImportRecord,
  ImportMetadata,
  ImportTransactionMetadata,
  ImportPreviewResult,
  ImportResult,
  ColumnMapping,
  OFXTransaction,
  OFXAccountInfo,
  OFXData,
  CSVRow,
  Parser,
  ImportPreviewRequest,
  ImportPreviewResponse,
  ImportProcessRequest,
  ImportProcessResponse,
  ImportHistoryResponse,
} from './import.types';

export { ImportErrorCode, ImportError, ERROR_MESSAGES } from './import.types';
