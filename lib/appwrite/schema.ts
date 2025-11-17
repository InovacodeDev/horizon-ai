/**
 * Appwrite Database Schema Configuration
 *
 * Este arquivo define as collections e atributos para o Appwrite Database.
 * Use o Appwrite Console ou CLI para criar estas collections.
 */

// Collection IDs - Use estes IDs ao criar no Appwrite Console
export const COLLECTIONS = {
  USERS: 'users',
  USER_PROFILES: 'user_profiles',
  USER_PREFERENCES: 'user_preferences',
  USER_SETTINGS: 'user_settings',
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
  CREDIT_CARDS: 'credit_cards',
  CREDIT_CARD_TRANSACTIONS: 'credit_card_transactions',
  INVOICES: 'invoices',
  INVOICE_ITEMS: 'invoice_items',
  PRODUCTS: 'products',
  PRICE_HISTORY: 'price_history',
  SHOPPING_LISTS: 'shopping_lists',
  SHOPPING_LIST_ITEMS: 'shopping_list_items',
  SHOPPING_LIST_REQUESTS: 'shopping_list_requests',
  NOTIFICATIONS: 'notifications',
  SHARING_RELATIONSHIPS: 'sharing_relationships',
  SHARING_INVITATIONS: 'sharing_invitations',
  SHARING_AUDIT_LOGS: 'sharing_audit_logs',
  IMPORT_HISTORY: 'import_history',
} as const;

// Database ID - Configure no Appwrite Console
// Note: This is evaluated when the module is first imported
// Make sure dotenv is loaded before importing this file in scripts
export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';

/**
 * Schema Definition for Appwrite Collections
 *
 * Para criar no Appwrite Console ou via CLI:
 * appwrite databases createCollection --databaseId=horizon_ai_db --collectionId=users --name=Users
 */

// ============================================
// Collection: users
// ============================================
export const usersSchema = {
  collectionId: COLLECTIONS.USERS,
  name: 'Users',
  // permissions and rowSecurity reflect the migration that created this table
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'auth_user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'email',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'name',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_auth_user_id',
      type: 'unique',
      attributes: ['auth_user_id'],
    },
    {
      key: 'idx_email',
      type: 'key',
      attributes: ['email'],
      orders: ['ASC'],
    },
  ],
};

// ============================================
// Collection: user_profiles
// ============================================
export const userProfilesSchema = {
  collectionId: COLLECTIONS.USER_PROFILES,
  name: 'User Profiles',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'bio',
      type: 'string',
      size: 1000,
      required: false,
    },
    {
      key: 'avatar_url',
      type: 'string',
      size: 1000,
      required: false,
    },
    {
      key: 'phone',
      type: 'string',
      size: 50,
      required: false,
    },
    {
      key: 'address',
      type: 'string',
      size: 5000,
      required: false,
    },
    {
      key: 'birthdate',
      type: 'datetime',
      required: false,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_user_id',
      type: 'unique',
      attributes: ['user_id'],
    },
  ],
};

// ============================================
// Collection: user_preferences
// ============================================
export const userPreferencesSchema = {
  collectionId: COLLECTIONS.USER_PREFERENCES,
  name: 'User Preferences',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'theme',
      type: 'enum',
      elements: ['light', 'dark', 'system'],
      required: true,
    },
    {
      key: 'language',
      type: 'string',
      size: 10,
      required: true,
    },
    {
      key: 'currency',
      type: 'string',
      size: 10,
      required: true,
    },
    {
      key: 'timezone',
      type: 'string',
      size: 100,
      required: true,
    },
    {
      key: 'notifications',
      type: 'string',
      size: 5000,
      required: true,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_user_id',
      type: 'unique',
      attributes: ['user_id'],
    },
  ],
};

// ============================================
// Collection: user_settings
// ============================================
export const userSettingsSchema = {
  collectionId: COLLECTIONS.USER_SETTINGS,
  name: 'User Settings',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'two_factor_enabled',
      type: 'boolean',
      required: true,
    },
    {
      key: 'email_verified',
      type: 'boolean',
      required: true,
    },
    {
      key: 'phone_verified',
      type: 'boolean',
      required: true,
    },
    {
      key: 'marketing_emails',
      type: 'boolean',
      required: true,
    },
    {
      key: 'privacy_settings',
      type: 'string',
      size: 5000,
      required: true,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_user_id',
      type: 'unique',
      attributes: ['user_id'],
    },
    {
      key: 'idx_two_factor_enabled',
      type: 'key',
      attributes: ['two_factor_enabled'],
    },
  ],
};

// ============================================
// Types for TypeScript
// ============================================

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
 * Sharing preferences stored in the notifications JSON field
 */
export interface SharingPreferences {
  show_shared_data: boolean;
  include_shared_in_calculations: boolean;
  show_ownership_indicators: boolean;
}

/**
 * Extended notifications structure with sharing preferences
 */
export interface NotificationsData {
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  notification_frequency?: string;
  dashboard_widgets?: {
    enabled: string[];
    order: string[];
  };
  sharing?: SharingPreferences;
}

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
// Collection: transactions
// ============================================
export const transactionsSchema = {
  collectionId: COLLECTIONS.TRANSACTIONS,
  name: 'Transactions',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'amount', type: 'float', required: true },
    { key: 'type', type: 'enum', elements: ['income', 'expense', 'transfer', 'salary'], required: true, array: false },
    { key: 'date', type: 'datetime', required: true },
    {
      key: 'status',
      type: 'enum',
      elements: ['pending', 'completed', 'failed', 'cancelled'],
      required: true,
      array: false,
    },
    { key: 'account_id', type: 'string', size: 255, required: false, array: false },
    { key: 'credit_card_id', type: 'string', size: 255, required: false, array: false },
    { key: 'category', type: 'string', size: 100, required: false, array: false },
    { key: 'description', type: 'string', size: 500, required: false, array: false },
    { key: 'currency', type: 'string', size: 10, required: false, array: false },
    { key: 'source', type: 'enum', elements: ['manual', 'integration', 'import'], required: false, array: false },
    { key: 'merchant', type: 'string', size: 255, required: false, array: false },
    { key: 'tags', type: 'string', size: 500, required: false, array: false },
    { key: 'is_recurring', type: 'boolean', required: false },
    { key: 'installment', type: 'integer', required: false, min: 1 },
    { key: 'installments', type: 'integer', required: false, min: 1 },
    { key: 'credit_card_transaction_created_at', type: 'datetime', required: false },
    { key: 'direction', type: 'enum', elements: ['in', 'out'], required: true, array: false },
    { key: 'data', type: 'string', size: 16000, required: false, array: false }, // JSON field for remaining data
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_date', type: 'key', attributes: ['date'], orders: ['DESC'] },
    { key: 'idx_type', type: 'key', attributes: ['type'] },
    { key: 'idx_status', type: 'key', attributes: ['status'] },
    { key: 'idx_account_id', type: 'key', attributes: ['account_id'], orders: ['ASC'] },
    { key: 'idx_credit_card_id', type: 'key', attributes: ['credit_card_id'], orders: ['ASC'] },
    { key: 'idx_category', type: 'key', attributes: ['category'] },
    { key: 'idx_source', type: 'key', attributes: ['source'] },
    { key: 'idx_merchant', type: 'key', attributes: ['merchant'] },
    { key: 'idx_installments', type: 'key', attributes: ['installments'], orders: ['ASC'] },
  ],
};

export interface Transaction {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  amount: number; // Positive for 'in' direction, negative for 'out' direction
  type: 'income' | 'expense' | 'transfer' | 'salary';
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  account_id?: string;
  credit_card_id?: string;
  category?: string;
  description?: string;
  currency?: string;
  source?: 'manual' | 'integration' | 'import';
  merchant?: string;
  tags?: string;
  is_recurring?: boolean;
  installment?: number; // Current installment number (1, 2, 3...)
  installments?: number; // Total number of installments (12 for 12x)
  credit_card_transaction_created_at?: string; // Original purchase date on credit card
  direction: 'in' | 'out'; // Transaction direction: 'in' for income/salary/transfers in, 'out' for expense/transfers out
  data?: string; // JSON string for remaining data (location, receipt_url, recurring_pattern, etc.)
  created_at: string;
  updated_at: string;
}

// Data structure stored in the data JSON field
export interface TransactionData {
  category: string;
  description?: string;
  currency: string;
  source: 'manual' | 'integration' | 'import';
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
// Collection: accounts
// ============================================
export const accountsSchema = {
  collectionId: COLLECTIONS.ACCOUNTS,
  name: 'Accounts',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'name', type: 'string', size: 255, required: true, array: false },
    {
      key: 'account_type',
      type: 'enum',
      elements: ['checking', 'savings', 'investment', 'vale', 'other'],
      required: true,
      array: false,
    },
    { key: 'balance', type: 'float', required: true },
    { key: 'is_manual', type: 'boolean', required: true },
    { key: 'synced_transaction_ids', type: 'string', size: 65535, required: false, array: false, default: '[]' }, // JSON array of synced transaction IDs
    { key: 'data', type: 'string', size: 16000, required: false, array: false }, // JSON field for bank_id, last_digits, status, etc.
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_is_manual', type: 'key', attributes: ['is_manual'] },
  ],
};

export interface Account {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  name: string;
  account_type: 'checking' | 'savings' | 'investment' | 'vale' | 'other';
  balance: number;
  is_manual: boolean;
  synced_transaction_ids?: string; // JSON array of synced transaction IDs
  data?: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface AccountData {
  bank_id?: string;
  last_digits?: string;
  status: 'Connected' | 'Sync Error' | 'Disconnected' | 'Manual';
  last_sync?: string;
  integration_id?: string;
  integration_data?: any;
}

// ============================================
// Collection: credit_cards
// ============================================
export const creditCardsSchema = {
  collectionId: COLLECTIONS.CREDIT_CARDS,
  name: 'Credit Cards',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'account_id', type: 'string', size: 255, required: true, array: false },
    { key: 'name', type: 'string', size: 255, required: true, array: false },
    { key: 'last_digits', type: 'string', size: 4, required: true, array: false },
    { key: 'credit_limit', type: 'float', required: true },
    { key: 'used_limit', type: 'float', required: true },
    { key: 'closing_day', type: 'integer', required: true },
    { key: 'due_day', type: 'integer', required: true },
    { key: 'data', type: 'string', size: 4000, required: false, array: false }, // JSON field for brand, etc.
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
  ],
  indexes: [{ key: 'idx_account_id', type: 'key', attributes: ['account_id'], orders: ['ASC'] }],
};

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
  data?: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface CreditCardData {
  brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
  network?: string;
  color?: string;
}

// ============================================
// Collection: credit_card_transactions
// ============================================
export const creditCardTransactionsSchema = {
  collectionId: COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
  name: 'Credit Card Transactions',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'credit_card_id', type: 'string', size: 255, required: true, array: false },
    { key: 'amount', type: 'float', required: true },
    { key: 'date', type: 'datetime', required: true },
    { key: 'purchase_date', type: 'datetime', required: true },
    { key: 'category', type: 'string', size: 100, required: false, array: false },
    { key: 'description', type: 'string', size: 500, required: false, array: false },
    { key: 'merchant', type: 'string', size: 255, required: false, array: false },
    { key: 'installment', type: 'integer', required: false, min: 1 },
    { key: 'installments', type: 'integer', required: false, min: 1 },
    { key: 'is_recurring', type: 'boolean', required: false, default: false },
    { key: 'status', type: 'enum', elements: ['pending', 'completed', 'cancelled'], required: true, array: false },
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_credit_card_id', type: 'key', attributes: ['credit_card_id'], orders: ['ASC'] },
    { key: 'idx_date', type: 'key', attributes: ['date'], orders: ['DESC'] },
    { key: 'idx_purchase_date', type: 'key', attributes: ['purchase_date'], orders: ['DESC'] },
    { key: 'idx_category', type: 'key', attributes: ['category'] },
    { key: 'idx_status', type: 'key', attributes: ['status'] },
    { key: 'idx_installments', type: 'key', attributes: ['installments'], orders: ['ASC'] },
    { key: 'idx_is_recurring', type: 'key', attributes: ['is_recurring'] },
  ],
};

export interface CreditCardTransaction {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  credit_card_id: string;
  amount: number;
  date: string; // Bill due date
  purchase_date: string; // Original purchase date
  category?: string;
  description?: string;
  merchant?: string;
  installment?: number; // Current installment (1, 2, 3...)
  installments?: number; // Total installments (12 for 12x)
  is_recurring?: boolean; // Is this a recurring subscription?
  status: 'pending' | 'completed' | 'cancelled';
  sync_status: 'pending' | 'synced'; // Bill synchronization status
  created_at: string;
  updated_at: string;
}

// ============================================
// Collection: invoices
// ============================================
export const invoicesSchema = {
  collectionId: COLLECTIONS.INVOICES,
  name: 'Invoices',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'invoice_key', type: 'string', size: 50, required: true, array: false },
    { key: 'invoice_number', type: 'string', size: 50, required: true, array: false },
    { key: 'issue_date', type: 'datetime', required: true },
    { key: 'merchant_cnpj', type: 'string', size: 20, required: true, array: false },
    { key: 'merchant_name', type: 'string', size: 255, required: true, array: false },
    { key: 'total_amount', type: 'float', required: true },
    {
      key: 'category',
      type: 'enum',
      elements: ['pharmacy', 'groceries', 'supermarket', 'restaurant', 'fuel', 'retail', 'services', 'other'],
      required: true,
      array: false,
    },
    { key: 'data', type: 'string', size: 4000, required: false, array: false }, // JSON field
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_invoice_key', type: 'unique', attributes: ['invoice_key'] },
    { key: 'idx_issue_date', type: 'key', attributes: ['issue_date'], orders: ['DESC'] },
    { key: 'idx_category', type: 'key', attributes: ['category'] },
    { key: 'idx_merchant_cnpj', type: 'key', attributes: ['merchant_cnpj'] },
    // Compound indexes for common query patterns
    { key: 'idx_user_issue_date', type: 'key', attributes: ['user_id', 'issue_date'], orders: ['ASC', 'DESC'] },
    { key: 'idx_user_category', type: 'key', attributes: ['user_id', 'category'], orders: ['ASC', 'ASC'] },
    { key: 'idx_user_merchant', type: 'key', attributes: ['user_id', 'merchant_cnpj'], orders: ['ASC', 'ASC'] },
  ],
};

export interface Invoice {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  invoice_key: string;
  invoice_number: string;
  issue_date: string;
  merchant_cnpj: string;
  merchant_name: string;
  total_amount: number;
  category: 'pharmacy' | 'groceries' | 'supermarket' | 'restaurant' | 'fuel' | 'retail' | 'services' | 'other';
  data?: string; // JSON string
  created_at: string;
  updated_at: string;
}

// Data structure stored in the data JSON field
export interface InvoiceData {
  series?: string;
  merchant_address?: string;
  discount_amount?: number;
  tax_amount?: number;
  custom_category?: string;
  source_url?: string;
  qr_code_data?: string;
  xml_data?: string;
  transaction_id?: string;
  account_id?: string;
}

// ============================================
// Collection: invoice_items
// ============================================
export const invoiceItemsSchema = {
  collectionId: COLLECTIONS.INVOICE_ITEMS,
  name: 'Invoice Items',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'invoice_id', type: 'string', size: 255, required: true, array: false },
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'product_id', type: 'string', size: 255, required: true, array: false },
    { key: 'product_code', type: 'string', size: 50, required: false, array: false },
    { key: 'ncm_code', type: 'string', size: 20, required: false, array: false },
    { key: 'description', type: 'string', size: 500, required: true, array: false },
    { key: 'quantity', type: 'float', required: true },
    { key: 'unit_price', type: 'float', required: true },
    { key: 'total_price', type: 'float', required: true },
    { key: 'discount_amount', type: 'float', required: false, default: 0 },
    { key: 'line_number', type: 'integer', required: true, min: 1 },
    { key: 'created_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_invoice_id', type: 'key', attributes: ['invoice_id'], orders: ['ASC'] },
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_product_id', type: 'key', attributes: ['product_id'], orders: ['ASC'] },
    // Compound indexes for common query patterns
    { key: 'idx_invoice_line', type: 'key', attributes: ['invoice_id', 'line_number'], orders: ['ASC', 'ASC'] },
    { key: 'idx_user_product', type: 'key', attributes: ['user_id', 'product_id'], orders: ['ASC', 'ASC'] },
  ],
};

export interface InvoiceItem {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  invoice_id: string;
  user_id: string;
  product_id: string;
  product_code?: string;
  ncm_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
  line_number: number;
  created_at: string;
}

// ============================================
// Collection: products
// ============================================
export const productsSchema = {
  collectionId: COLLECTIONS.PRODUCTS,
  name: 'Products',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'name', type: 'string', size: 255, required: true, array: false },
    { key: 'category', type: 'string', size: 100, required: true, array: false },
    { key: 'subcategory', type: 'string', size: 100, required: false, array: false },
    { key: 'brand', type: 'string', size: 100, required: false, array: false },
    { key: 'is_promotion', type: 'boolean', required: false, default: false, array: false },
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_category', type: 'key', attributes: ['category'] },
    { key: 'idx_brand', type: 'key', attributes: ['brand'] },
    // Compound indexes for common query patterns
    { key: 'idx_user_category', type: 'key', attributes: ['user_id', 'category'], orders: ['ASC', 'ASC'] },
    { key: 'idx_user_name', type: 'key', attributes: ['user_id', 'name'], orders: ['ASC', 'ASC'] },
  ],
};

export interface Product {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  is_promotion?: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Collection: price_history
// ============================================
export const priceHistorySchema = {
  collectionId: COLLECTIONS.PRICE_HISTORY,
  name: 'Price History',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'product_id', type: 'string', size: 255, required: true, array: false },
    { key: 'invoice_id', type: 'string', size: 255, required: true, array: false },
    { key: 'merchant_cnpj', type: 'string', size: 20, required: true, array: false },
    { key: 'merchant_name', type: 'string', size: 255, required: true, array: false },
    { key: 'purchase_date', type: 'datetime', required: true },
    { key: 'unit_price', type: 'float', required: true },
    { key: 'quantity', type: 'float', required: true },
    { key: 'created_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_product_id', type: 'key', attributes: ['product_id'], orders: ['ASC'] },
    { key: 'idx_purchase_date', type: 'key', attributes: ['purchase_date'], orders: ['DESC'] },
    { key: 'idx_product_date', type: 'key', attributes: ['product_id', 'purchase_date'], orders: ['ASC', 'DESC'] },
    // Compound indexes for common query patterns
    {
      key: 'idx_user_product_date',
      type: 'key',
      attributes: ['user_id', 'product_id', 'purchase_date'],
      orders: ['ASC', 'ASC', 'DESC'],
    },
    { key: 'idx_user_merchant', type: 'key', attributes: ['user_id', 'merchant_cnpj'], orders: ['ASC', 'ASC'] },
  ],
};

export interface PriceHistory {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  product_id: string;
  invoice_id: string;
  merchant_cnpj: string;
  merchant_name: string;
  purchase_date: string;
  unit_price: number;
  quantity: number;
  created_at: string;
}

// ============================================
// Collection: sharing_relationships
// ============================================
export const sharingRelationshipsSchema = {
  collectionId: COLLECTIONS.SHARING_RELATIONSHIPS,
  name: 'Sharing Relationships',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'responsible_user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'member_user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'status',
      type: 'enum',
      elements: ['active', 'terminated'],
      required: true,
      array: false,
    },
    {
      key: 'started_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'terminated_at',
      type: 'datetime',
      required: false,
    },
    {
      key: 'terminated_by',
      type: 'string',
      size: 255,
      required: false,
      array: false,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_responsible_user',
      type: 'key',
      attributes: ['responsible_user_id'],
      orders: ['ASC'],
    },
    {
      key: 'idx_member_user_status',
      type: 'unique',
      attributes: ['member_user_id', 'status'],
    },
    {
      key: 'idx_status',
      type: 'key',
      attributes: ['status'],
    },
  ],
};

export interface SharingRelationship {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  responsible_user_id: string;
  member_user_id: string;
  status: 'active' | 'terminated';
  started_at: string;
  terminated_at?: string;
  terminated_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Collection: sharing_invitations
// ============================================
export const sharingInvitationsSchema = {
  collectionId: COLLECTIONS.SHARING_INVITATIONS,
  name: 'Sharing Invitations',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'responsible_user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'invited_email',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'invited_user_id',
      type: 'string',
      size: 255,
      required: false,
      array: false,
    },
    {
      key: 'token',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'status',
      type: 'enum',
      elements: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
      required: true,
      array: false,
    },
    {
      key: 'expires_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'accepted_at',
      type: 'datetime',
      required: false,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_token',
      type: 'unique',
      attributes: ['token'],
    },
    {
      key: 'idx_responsible_user',
      type: 'key',
      attributes: ['responsible_user_id'],
      orders: ['ASC'],
    },
    {
      key: 'idx_invited_email',
      type: 'key',
      attributes: ['invited_email'],
    },
    {
      key: 'idx_status',
      type: 'key',
      attributes: ['status'],
    },
    {
      key: 'idx_expires_at',
      type: 'key',
      attributes: ['expires_at'],
      orders: ['ASC'],
    },
  ],
};

export interface SharingInvitation {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  responsible_user_id: string;
  invited_email: string;
  invited_user_id?: string;
  token: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Collection: sharing_audit_logs
// ============================================
export const sharingAuditLogsSchema = {
  collectionId: COLLECTIONS.SHARING_AUDIT_LOGS,
  name: 'Sharing Audit Logs',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'action',
      type: 'enum',
      elements: [
        'invitation_created',
        'invitation_accepted',
        'invitation_rejected',
        'invitation_cancelled',
        'relationship_terminated',
      ],
      required: true,
      array: false,
    },
    {
      key: 'resource_type',
      type: 'enum',
      elements: ['invitation', 'relationship'],
      required: true,
      array: false,
    },
    {
      key: 'resource_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'details',
      type: 'string',
      size: 4000,
      required: false,
      array: false,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_user_id',
      type: 'key',
      attributes: ['user_id'],
      orders: ['ASC'],
    },
    {
      key: 'idx_created_at',
      type: 'key',
      attributes: ['created_at'],
      orders: ['DESC'],
    },
    {
      key: 'idx_action',
      type: 'key',
      attributes: ['action'],
    },
    {
      key: 'idx_resource',
      type: 'key',
      attributes: ['resource_type', 'resource_id'],
      orders: ['ASC', 'ASC'],
    },
  ],
};

export interface SharingAuditLog {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  action:
    | 'invitation_created'
    | 'invitation_accepted'
    | 'invitation_rejected'
    | 'invitation_cancelled'
    | 'relationship_terminated';
  resource_type: 'invitation' | 'relationship';
  resource_id: string;
  details?: string;
  created_at: string;
}

// ============================================
// Collection: import_history
// ============================================
export const importHistorySchema = {
  collectionId: COLLECTIONS.IMPORT_HISTORY,
  name: 'Import History',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    {
      key: 'user_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'account_id',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'file_name',
      type: 'string',
      size: 255,
      required: true,
      array: false,
    },
    {
      key: 'file_format',
      type: 'enum',
      elements: ['ofx', 'csv', 'pdf'],
      required: true,
      array: false,
    },
    {
      key: 'transaction_count',
      type: 'integer',
      required: true,
      min: 0,
    },
    {
      key: 'import_date',
      type: 'datetime',
      required: true,
    },
    {
      key: 'status',
      type: 'enum',
      elements: ['completed', 'failed', 'partial'],
      required: true,
      array: false,
    },
    {
      key: 'error_message',
      type: 'string',
      size: 1000,
      required: false,
      array: false,
    },
    {
      key: 'metadata',
      type: 'string',
      size: 4000,
      required: false,
      array: false,
    },
    {
      key: 'created_at',
      type: 'datetime',
      required: true,
    },
    {
      key: 'updated_at',
      type: 'datetime',
      required: true,
    },
  ],
  indexes: [
    {
      key: 'idx_user_id',
      type: 'key',
      attributes: ['user_id'],
      orders: ['ASC'],
    },
    {
      key: 'idx_account_id',
      type: 'key',
      attributes: ['account_id'],
      orders: ['ASC'],
    },
    {
      key: 'idx_import_date',
      type: 'key',
      attributes: ['import_date'],
      orders: ['DESC'],
    },
    {
      key: 'idx_status',
      type: 'key',
      attributes: ['status'],
    },
    {
      key: 'idx_user_import_date',
      type: 'key',
      attributes: ['user_id', 'import_date'],
      orders: ['ASC', 'DESC'],
    },
  ],
};

export interface ImportHistory {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  account_id: string;
  file_name: string;
  file_format: 'ofx' | 'csv' | 'pdf';
  transaction_count: number;
  import_date: string;
  status: 'completed' | 'failed' | 'partial';
  error_message?: string;
  metadata?: string; // JSON string
  created_at: string;
  updated_at: string;
}

// ============================================
// Collection: shopping_lists
// ============================================
export const shoppingListsSchema = {
  collectionId: COLLECTIONS.SHOPPING_LISTS,
  name: 'Shopping Lists',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'title', type: 'string', size: 255, required: true, array: false },
    {
      key: 'category',
      type: 'enum',
      elements: ['pharmacy', 'groceries', 'supermarket', 'restaurant', 'fuel', 'retail', 'services', 'other'],
      required: true,
      array: false,
    },
    { key: 'generated_by_ai', type: 'boolean', required: true, default: false },
    { key: 'estimated_total', type: 'float', required: false },
    { key: 'actual_total', type: 'float', required: false },
    { key: 'completed', type: 'boolean', required: true, default: false },
    { key: 'completed_at', type: 'datetime', required: false },
    { key: 'metadata', type: 'string', size: 4000, required: false, array: false }, // JSON field for AI generation params
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_created_at', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    { key: 'idx_category', type: 'key', attributes: ['category'] },
    { key: 'idx_completed', type: 'key', attributes: ['completed'] },
    { key: 'idx_user_category', type: 'key', attributes: ['user_id', 'category'], orders: ['ASC', 'ASC'] },
    { key: 'idx_user_created', type: 'key', attributes: ['user_id', 'created_at'], orders: ['ASC', 'DESC'] },
  ],
};

export interface ShoppingList {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  title: string;
  category: 'pharmacy' | 'groceries' | 'supermarket' | 'restaurant' | 'fuel' | 'retail' | 'services' | 'other';
  generated_by_ai: boolean;
  estimated_total?: number;
  actual_total?: number;
  completed: boolean;
  completed_at?: string;
  metadata?: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface ShoppingListMetadata {
  ai_generation_params?: {
    historical_months: number;
    category: string;
    invoice_count: number;
  };
  best_merchant?: {
    merchant_name: string;
    merchant_cnpj: string;
    estimated_cost: number;
  };
}

// ============================================
// Collection: shopping_list_items
// ============================================
export const shoppingListItemsSchema = {
  collectionId: COLLECTIONS.SHOPPING_LIST_ITEMS,
  name: 'Shopping List Items',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'shopping_list_id', type: 'string', size: 255, required: true, array: false },
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'product_name', type: 'string', size: 500, required: true, array: false },
    { key: 'product_id', type: 'string', size: 255, required: false, array: false },
    { key: 'quantity', type: 'float', required: true },
    { key: 'unit', type: 'string', size: 50, required: false, array: false },
    { key: 'estimated_price', type: 'float', required: false },
    { key: 'actual_price', type: 'float', required: false },
    { key: 'checked', type: 'boolean', required: true, default: false },
    { key: 'category', type: 'string', size: 100, required: false, array: false },
    { key: 'subcategory', type: 'string', size: 100, required: false, array: false },
    { key: 'ai_confidence', type: 'float', required: false }, // Confidence score from AI (0-1)
    { key: 'ai_reasoning', type: 'string', size: 1000, required: false, array: false }, // Why AI suggested this item
    { key: 'created_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_shopping_list_id', type: 'key', attributes: ['shopping_list_id'], orders: ['ASC'] },
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_product_id', type: 'key', attributes: ['product_id'], orders: ['ASC'] },
    { key: 'idx_checked', type: 'key', attributes: ['checked'] },
    { key: 'idx_list_checked', type: 'key', attributes: ['shopping_list_id', 'checked'], orders: ['ASC', 'ASC'] },
  ],
};

export interface ShoppingListItem {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopping_list_id: string;
  user_id: string;
  product_name: string;
  product_id?: string;
  quantity: number;
  unit?: string;
  estimated_price?: number;
  actual_price?: number;
  checked: boolean;
  category?: string;
  subcategory?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
  created_at: string;
}

// ============================================
// Collection: shopping_list_requests
// ============================================
export const shoppingListRequestsSchema = {
  collectionId: COLLECTIONS.SHOPPING_LIST_REQUESTS,
  name: 'Shopping List Requests',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    {
      key: 'category',
      type: 'enum',
      elements: ['pharmacy', 'groceries', 'supermarket', 'restaurant', 'fuel', 'retail', 'services', 'other'],
      required: true,
      array: false,
    },
    {
      key: 'status',
      type: 'enum',
      elements: ['pending', 'generating', 'completed', 'error'],
      required: true,
      array: false,
    },
    { key: 'historical_months', type: 'integer', required: true, default: 12 },
    { key: 'shopping_list_id', type: 'string', size: 255, required: false, array: false },
    { key: 'error_message', type: 'string', size: 1000, required: false, array: false },
    { key: 'metadata', type: 'string', size: 4000, required: false, array: false },
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
    { key: 'completed_at', type: 'datetime', required: false },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_status', type: 'key', attributes: ['status'] },
    { key: 'idx_created_at', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    { key: 'idx_user_status', type: 'key', attributes: ['user_id', 'status'], orders: ['ASC', 'ASC'] },
    { key: 'idx_status_created', type: 'key', attributes: ['status', 'created_at'], orders: ['ASC', 'DESC'] },
  ],
};

export interface ShoppingListRequest {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  category: 'pharmacy' | 'groceries' | 'supermarket' | 'restaurant' | 'fuel' | 'retail' | 'services' | 'other';
  status: 'pending' | 'generating' | 'completed' | 'error';
  historical_months: number;
  shopping_list_id?: string;
  error_message?: string;
  metadata?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============================================
// Collection: notifications
// ============================================
export const notificationsSchema = {
  collectionId: COLLECTIONS.NOTIFICATIONS,
  name: 'Notifications',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    {
      key: 'type',
      type: 'enum',
      elements: ['shopping_list_completed', 'shopping_list_error', 'sharing_invitation', 'system'],
      required: true,
      array: false,
    },
    { key: 'title', type: 'string', size: 255, required: true, array: false },
    { key: 'message', type: 'string', size: 1000, required: true, array: false },
    { key: 'read', type: 'boolean', required: true, default: false },
    { key: 'read_at', type: 'datetime', required: false },
    { key: 'action_url', type: 'string', size: 500, required: false, array: false },
    { key: 'related_id', type: 'string', size: 255, required: false, array: false }, // shopping_list_id, invitation_id, etc
    { key: 'metadata', type: 'string', size: 2000, required: false, array: false },
    { key: 'created_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_read', type: 'key', attributes: ['read'] },
    { key: 'idx_created_at', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
    { key: 'idx_user_read', type: 'key', attributes: ['user_id', 'read'], orders: ['ASC', 'ASC'] },
    { key: 'idx_user_created', type: 'key', attributes: ['user_id', 'created_at'], orders: ['ASC', 'DESC'] },
  ],
};

export interface Notification {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  type: 'shopping_list_completed' | 'shopping_list_error' | 'sharing_invitation' | 'system';
  title: string;
  message: string;
  read: boolean;
  read_at?: string;
  action_url?: string;
  related_id?: string;
  metadata?: string;
  created_at: string;
}
