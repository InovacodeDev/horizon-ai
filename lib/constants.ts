/**
 * Application Constants
 *
 * This file contains all constant values used throughout the application,
 * migrated from apps/web/src/constants.ts
 */
import type {
  Bank,
  Beneficiary,
  Category,
  CategoryIcon,
  FamilyMember,
  FinancialGoal,
  FinancialInsight,
  InsurancePolicy,
  Integration,
  Invoice,
  MonthlyChartData,
  Notification,
  PurchaseRecord,
  RetirementGoal,
  ShoppingList,
  TaxAsset,
  TaxIncome,
  TaxSection,
  Transaction,
  User,
  Warranty,
} from './types';

// Note: Icon and Logo imports will need to be updated once components are migrated
// For now, these are placeholder references

// ============================================
// Bank Configuration
// ============================================

export const BANKS: Bank[] = [
  { id: 'itau', name: 'Itaú Unibanco', logo: null as any }, // Will be: ItauLogo
  { id: 'nubank', name: 'Nubank', logo: null as any }, // Will be: NubankLogo
  { id: 'bradesco', name: 'Bradesco', logo: null as any }, // Will be: BradescoLogo
  { id: 'santander', name: 'Santander', logo: null as any }, // Will be: SantanderLogo
  { id: 'inter', name: 'Banco Inter', logo: null as any }, // Will be: InterLogo
  { id: 'bb', name: 'Banco do Brasil', logo: null as any }, // Will be: BbLogo
];

export const AVAILABLE_CATEGORY_ICONS: CategoryIcon[] = [
  { name: 'Balance', component: null as any },
  { name: 'Shopping', component: null as any },
  { name: 'Dining', component: null as any },
  { name: 'Transport', component: null as any },
  { name: 'Health', component: null as any },
  { name: 'Travel', component: null as any },
  { name: 'Work', component: null as any },
  { name: 'Home', component: null as any },
  { name: 'Gifts', component: null as any },
  { name: 'Bills', component: null as any },
  { name: 'Investments', component: null as any },
  { name: 'Family', component: null as any },
  { name: 'Other', component: null as any },
];

// ============================================
// Application Configuration
// ============================================

/**
 * Default currency for the application
 */
export const DEFAULT_CURRENCY = 'BRL';

/**
 * Default locale for formatting
 */
export const DEFAULT_LOCALE = 'pt-BR';

/**
 * Pagination defaults
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Date format patterns
 */
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

/**
 * API configuration
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * File upload limits
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/xml',
  'text/xml',
];

// ============================================
// Mock Data (for pages that haven't been migrated yet)
// ============================================

export const MOCK_CATEGORIES: Category[] = [];

export const MOCK_INTEGRATIONS: Integration[] = [];

export const MOCK_NOTIFICATIONS: Notification[] = [];

export const MOCK_FINANCIAL_GOALS: FinancialGoal[] = [];

export const MOCK_RETIREMENT_GOAL: RetirementGoal = {
  targetAge: 65,
  targetSavings: 0,
  currentSavings: 0,
  monthlyContribution: 0,
};

export const MOCK_BALANCE = 0;

export const MOCK_MONTHLY_INCOME = 0;

export const MOCK_MONTHLY_EXPENSES = 0;

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const MOCK_SHOPPING_LISTS: ShoppingList[] = [];

export const MOCK_PURCHASE_HISTORY: PurchaseRecord[] = [];
