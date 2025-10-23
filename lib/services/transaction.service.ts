import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, Transaction } from '@/lib/appwrite/schema';
import { ID, Query } from 'node-appwrite';

/**
 * Transaction Service
 * Handles transaction CRUD operations and statistics
 */

export interface CreateTransactionData {
  userId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  category: string;
  description?: string;
  currency: string;
  accountId?: string;
  creditCardId?: string;
  merchant?: string;
  tags?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface CreateIntegrationTransactionData extends CreateTransactionData {
  integrationId?: string;
  integrationData?: any;
}

export interface UpdateTransactionData {
  amount?: number;
  type?: 'income' | 'expense' | 'transfer';
  date?: string;
  category?: string;
  description?: string;
  currency?: string;
  accountId?: string;
  merchant?: string;
  tags?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface TransactionFilter {
  userId?: string;
  type?: 'income' | 'expense' | 'transfer';
  category?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  source?: 'manual' | 'integration' | 'import';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export class TransactionService {
  private dbAdapter: any;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  // ============================================
  // Helper Methods for JSON Parsing
  // ============================================

  private parseJSON(value: string | undefined, defaultValue: any): any {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as any;
    } catch {
      return defaultValue;
    }
  }

  private stringifyJSON(value: any): string {
    return JSON.stringify(value);
  }

  // ============================================
  // Transaction Operations
  // ============================================

  /**
   * Create a manual transaction (from frontend)
   */
  async createManualTransaction(data: CreateTransactionData): Promise<Transaction> {
    const id = ID.unique();
    const now = new Date().toISOString();

    // Build data object with ALL fields except core indexed ones
    const transactionData: any = {
      category: data.category,
      description: data.description,
      currency: data.currency,
      source: 'manual',
    };

    // Add optional fields if present
    if (data.accountId) transactionData.account_id = data.accountId;
    if (data.creditCardId) transactionData.credit_card_id = data.creditCardId;
    if (data.merchant) transactionData.merchant = data.merchant;
    if (data.tags) transactionData.tags = data.tags;
    if (data.location) transactionData.location = data.location;
    if (data.receiptUrl) transactionData.receipt_url = data.receiptUrl;
    if (data.isRecurring) transactionData.is_recurring = data.isRecurring;
    if (data.recurringPattern) transactionData.recurring_pattern = data.recurringPattern;

    const payload = {
      user_id: data.userId,
      amount: data.amount,
      type: data.type,
      date: data.date,
      status: data.status || 'completed',
      data: this.stringifyJSON(transactionData),
      created_at: now,
      updated_at: now,
    };

    const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, id, payload);

    return this.formatTransaction(document);
  }

  /**
   * Create a transaction from integration
   */
  async createIntegrationTransaction(data: CreateIntegrationTransactionData): Promise<Transaction> {
    const id = ID.unique();
    const now = new Date().toISOString();

    // Build data object with ALL fields except core indexed ones
    const transactionData: any = {
      category: data.category,
      description: data.description,
      currency: data.currency,
      source: 'integration',
    };

    // Add optional/integration fields if present
    if (data.accountId) transactionData.account_id = data.accountId;
    if (data.merchant) transactionData.merchant = data.merchant;
    if (data.integrationId) transactionData.integration_id = data.integrationId;
    if (data.integrationData) transactionData.integration_data = data.integrationData;
    if (data.tags) transactionData.tags = data.tags;
    if (data.location) transactionData.location = data.location;
    if (data.receiptUrl) transactionData.receipt_url = data.receiptUrl;
    if (data.isRecurring) transactionData.is_recurring = data.isRecurring;
    if (data.recurringPattern) transactionData.recurring_pattern = data.recurringPattern;

    const payload = {
      user_id: data.userId,
      amount: data.amount,
      type: data.type,
      date: data.date,
      status: data.status || 'completed',
      data: this.stringifyJSON(transactionData),
      created_at: now,
      updated_at: now,
    };

    const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, id, payload);

    return this.formatTransaction(document);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction | undefined> {
    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, transactionId);
      return this.formatTransaction(document);
    } catch (error: any) {
      if (error.code === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(transactionId: string, data: UpdateTransactionData): Promise<Transaction> {
    try {
      const now = new Date().toISOString();

      // Get existing transaction to merge data
      const existing = await this.getTransactionById(transactionId);
      if (!existing) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      // Parse existing data
      const existingData = this.parseJSON(existing.data, {});

      // Build updated data object
      const updatedData: any = { ...existingData };

      // Core fields that can be updated
      if (data.category !== undefined) updatedData.category = data.category;
      if (data.description !== undefined) updatedData.description = data.description;
      if (data.currency !== undefined) updatedData.currency = data.currency;

      // Optional fields
      if (data.accountId !== undefined) updatedData.account_id = data.accountId;
      if (data.merchant !== undefined) updatedData.merchant = data.merchant;
      if (data.tags !== undefined) updatedData.tags = data.tags;
      if (data.location !== undefined) updatedData.location = data.location;
      if (data.receiptUrl !== undefined) updatedData.receipt_url = data.receiptUrl;
      if (data.isRecurring !== undefined) updatedData.is_recurring = data.isRecurring;
      if (data.recurringPattern !== undefined) updatedData.recurring_pattern = data.recurringPattern;

      const updatePayload: any = {
        updated_at: now,
      };

      // Core indexed fields that can be updated directly
      if (data.amount !== undefined) updatePayload.amount = data.amount;
      if (data.type !== undefined) updatePayload.type = data.type;
      if (data.date !== undefined) updatePayload.date = data.date;
      if (data.status !== undefined) updatePayload.status = data.status;

      // Update data JSON field
      updatePayload.data = this.stringifyJSON(updatedData);

      const document = await this.dbAdapter.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TRANSACTIONS,
        transactionId,
        updatePayload,
      );

      return this.formatTransaction(document);
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Transaction with id ${transactionId} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, transactionId);
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Transaction with id ${transactionId} not found`);
      }
      throw error;
    }
  }

  /**
   * List transactions with filters
   */
  async listTransactions(filters: TransactionFilter): Promise<{
    transactions: Transaction[];
    total: number;
  }> {
    try {
      const queries: any[] = [];

      // Apply filters
      if (filters.userId) {
        queries.push(Query.equal('user_id', filters.userId));
      }

      if (filters.type) {
        queries.push(Query.equal('type', filters.type));
      }

      if (filters.category) {
        queries.push(Query.equal('category', filters.category));
      }

      if (filters.status) {
        queries.push(Query.equal('status', filters.status));
      }

      if (filters.source) {
        queries.push(Query.equal('source', filters.source));
      }

      if (filters.startDate) {
        queries.push(Query.greaterThanEqual('date', filters.startDate));
      }

      if (filters.endDate) {
        queries.push(Query.lessThanEqual('date', filters.endDate));
      }

      if (filters.minAmount !== undefined) {
        queries.push(Query.greaterThanEqual('amount', filters.minAmount));
      }

      if (filters.maxAmount !== undefined) {
        queries.push(Query.lessThanEqual('amount', filters.maxAmount));
      }

      if (filters.search) {
        queries.push(Query.search('description', filters.search));
      }

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));

      // Sort by date descending
      queries.push(Query.orderDesc('date'));

      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, queries);

      return {
        transactions: response.documents.map((doc: any) => this.formatTransaction(doc)),
        total: response.total || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transaction statistics for a user
   */
  async getTransactionStats(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const filters: TransactionFilter = {
      userId,
      startDate,
      endDate,
      limit: 10000, // Get all transactions for stats
    };

    const { transactions } = await this.listTransactions(filters);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpense += transaction.amount;
      }

      // Parse data to get category
      const transactionData = this.parseJSON(transaction.data, {});
      const category = transactionData.category || 'uncategorized';

      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = 0;
      }
      categoryBreakdown[category] += transaction.amount;
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      categoryBreakdown,
    };
  }

  /**
   * Bulk create transactions from integration
   */
  async bulkCreateIntegrationTransactions(transactions: CreateIntegrationTransactionData[]): Promise<Transaction[]> {
    const created: Transaction[] = [];

    for (const transactionData of transactions) {
      try {
        const transaction = await this.createIntegrationTransaction(transactionData);
        created.push(transaction);
      } catch (error) {
        console.error('Error creating transaction:', error);
        // Continue with other transactions
      }
    }

    return created;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private formatTransaction(document: any): Transaction {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      user_id: document.user_id,
      amount: document.amount,
      type: document.type,
      date: document.date,
      status: document.status,
      data: document.data,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
