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
  CREDIT_CARD_BILLS: 'credit_card_bills',
  TRANSFER_LOGS: 'transfer_logs',
  INVOICES: 'invoices',
  INVOICE_ITEMS: 'invoice_items',
  PRODUCTS: 'products',
  PRICE_HISTORY: 'price_history',
} as const;

// Database ID - Configure no Appwrite Console
// Note: This is evaluated when the module is first imported
// Make sure dotenv is loaded before importing this file in scripts
export const DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'horizon_ai_db';

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
  amount: number;
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
      elements: ['checking', 'savings', 'investment', 'other'],
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
  account_type: 'checking' | 'savings' | 'investment' | 'other';
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
  created_at: string;
  updated_at: string;
}

// ============================================
// Collection: transfer_logs
// ============================================
export const transferLogsSchema = {
  collectionId: COLLECTIONS.TRANSFER_LOGS,
  name: 'Transfer Logs',
  permissions: ['read("any")', 'write("any")'],
  rowSecurity: true,
  attributes: [
    { key: 'user_id', type: 'string', size: 255, required: true, array: false },
    { key: 'from_account_id', type: 'string', size: 255, required: true, array: false },
    { key: 'to_account_id', type: 'string', size: 255, required: true, array: false },
    { key: 'amount', type: 'float', required: true },
    { key: 'description', type: 'string', size: 500, required: false, array: false },
    { key: 'status', type: 'enum', elements: ['completed', 'failed'], required: true, array: false },
    { key: 'created_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_from_account_id', type: 'key', attributes: ['from_account_id'], orders: ['ASC'] },
    { key: 'idx_to_account_id', type: 'key', attributes: ['to_account_id'], orders: ['ASC'] },
    { key: 'idx_created_at', type: 'key', attributes: ['created_at'], orders: ['DESC'] },
  ],
};

export interface TransferLog {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  status: 'completed' | 'failed';
  created_at: string;
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
    { key: 'product_code', type: 'string', size: 50, required: false, array: false },
    { key: 'ncm_code', type: 'string', size: 20, required: false, array: false },
    { key: 'category', type: 'string', size: 100, required: true, array: false },
    { key: 'subcategory', type: 'string', size: 100, required: false, array: false },
    { key: 'total_purchases', type: 'integer', required: true, min: 0 },
    { key: 'average_price', type: 'float', required: true },
    { key: 'last_purchase_date', type: 'datetime', required: false },
    { key: 'created_at', type: 'datetime', required: true },
    { key: 'updated_at', type: 'datetime', required: true },
  ],
  indexes: [
    { key: 'idx_user_id', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
    { key: 'idx_product_code', type: 'key', attributes: ['product_code'] },
    { key: 'idx_category', type: 'key', attributes: ['category'] },
    { key: 'idx_last_purchase_date', type: 'key', attributes: ['last_purchase_date'], orders: ['DESC'] },
    // Compound indexes for common query patterns
    { key: 'idx_user_category', type: 'key', attributes: ['user_id', 'category'], orders: ['ASC', 'ASC'] },
    { key: 'idx_user_purchases', type: 'key', attributes: ['user_id', 'total_purchases'], orders: ['ASC', 'DESC'] },
    { key: 'idx_user_name', type: 'key', attributes: ['user_id', 'name'], orders: ['ASC', 'ASC'] },
  ],
};

export interface Product {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  name: string;
  product_code?: string;
  ncm_code?: string;
  category: string;
  subcategory?: string;
  total_purchases: number;
  average_price: number;
  last_purchase_date?: string;
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
