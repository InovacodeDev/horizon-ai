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
} as const;

// Database ID - Configure no Appwrite Console
export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';

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
    { key: 'type', type: 'enum', elements: ['income', 'expense', 'transfer'], required: true, array: false },
    { key: 'date', type: 'datetime', required: true },
    {
      key: 'status',
      type: 'enum',
      elements: ['pending', 'completed', 'failed', 'cancelled'],
      required: true,
      array: false,
    },
    { key: 'account_id', type: 'string', size: 255, required: false, array: false },
    { key: 'category', type: 'string', size: 100, required: false, array: false },
    { key: 'description', type: 'string', size: 500, required: false, array: false },
    { key: 'currency', type: 'string', size: 10, required: false, array: false },
    { key: 'source', type: 'enum', elements: ['manual', 'integration', 'import'], required: false, array: false },
    { key: 'merchant', type: 'string', size: 255, required: false, array: false },
    { key: 'tags', type: 'string', size: 500, required: false, array: false },
    { key: 'is_recurring', type: 'boolean', required: false },
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
    { key: 'idx_category', type: 'key', attributes: ['category'] },
    { key: 'idx_source', type: 'key', attributes: ['source'] },
    { key: 'idx_merchant', type: 'key', attributes: ['merchant'] },
  ],
};

export interface Transaction {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  account_id?: string;
  category?: string;
  description?: string;
  currency?: string;
  source?: 'manual' | 'integration' | 'import';
  merchant?: string;
  tags?: string;
  is_recurring?: boolean;
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
