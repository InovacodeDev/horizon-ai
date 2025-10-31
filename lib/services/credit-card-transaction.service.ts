import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, CreditCardTransaction, DATABASE_ID } from '@/lib/appwrite/schema';
import { dateToUserTimezone } from '@/lib/utils/timezone';
import { ID, Query } from 'node-appwrite';

import AppwriteDBAdapter from '../appwrite/adapter';

/**
 * Credit Card Transaction Service
 * Handles credit card transaction CRUD operations
 *
 * This is separate from regular transactions to keep credit card purchases
 * independent from account balance calculations.
 */

export interface CreateCreditCardTransactionData {
  userId: string;
  creditCardId: string;
  amount: number;
  date: string; // Bill due date
  purchaseDate: string; // Original purchase date
  category: string;
  description?: string;
  merchant?: string;
  installment?: number;
  installments?: number;
  isRecurring?: boolean;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface UpdateCreditCardTransactionData {
  amount?: number;
  date?: string;
  category?: string;
  description?: string;
  merchant?: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface CreditCardTransactionFilter {
  userId?: string;
  creditCardId?: string;
  category?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  startPurchaseDate?: string;
  endPurchaseDate?: string;
  minAmount?: number;
  maxAmount?: number;
  isRecurring?: boolean;
  limit?: number;
  offset?: number;
}

export class CreditCardTransactionService {
  private dbAdapter: AppwriteDBAdapter;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  /**
   * Create a credit card transaction
   */
  async createTransaction(data: CreateCreditCardTransactionData): Promise<CreditCardTransaction> {
    const id = ID.unique();
    const now = new Date().toISOString();

    // Convert dates to ISO format, preserving the date as-is
    // If the date already has time (includes 'T'), use it as-is
    // Otherwise, treat it as YYYY-MM-DD and convert to start of day in user timezone
    const dateInUserTimezone = data.date.includes('T') ? data.date : dateToUserTimezone(data.date);
    const purchaseDateInUserTimezone = data.purchaseDate.includes('T')
      ? data.purchaseDate
      : dateToUserTimezone(data.purchaseDate);

    const payload: any = {
      user_id: data.userId,
      credit_card_id: data.creditCardId,
      amount: data.amount,
      date: dateInUserTimezone,
      purchase_date: purchaseDateInUserTimezone,
      category: data.category,
      description: data.description,
      merchant: data.merchant,
      installment: data.installment,
      installments: data.installments,
      is_recurring: data.isRecurring || false,
      status: data.status || 'completed',
      created_at: now,
      updated_at: now,
    };

    const document = await this.dbAdapter.createDocument(
      DATABASE_ID,
      COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      id,
      payload,
    );

    // Sync credit card used limit
    try {
      const { CreditCardService } = await import('./credit-card.service');
      const creditCardService = new CreditCardService();
      await creditCardService.syncUsedLimit(data.creditCardId);
    } catch (error: any) {
      console.error('Failed to sync credit card used limit:', error);
    }

    return this.formatTransaction(document);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<CreditCardTransaction | undefined> {
    try {
      const document = await this.dbAdapter.getDocument(
        DATABASE_ID,
        COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
        transactionId,
      );
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
  async updateTransaction(
    transactionId: string,
    data: UpdateCreditCardTransactionData,
  ): Promise<CreditCardTransaction> {
    const now = new Date().toISOString();

    const updatePayload: any = {
      updated_at: now,
    };

    if (data.amount !== undefined) updatePayload.amount = data.amount;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.merchant !== undefined) updatePayload.merchant = data.merchant;
    if (data.status !== undefined) updatePayload.status = data.status;

    if (data.date !== undefined) {
      updatePayload.date = data.date.includes('T') ? data.date : dateToUserTimezone(data.date);
    }

    const document = await this.dbAdapter.updateDocument(
      DATABASE_ID,
      COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
      transactionId,
      updatePayload,
    );

    // Sync credit card used limit
    const transaction = this.formatTransaction(document);
    try {
      const { CreditCardService } = await import('./credit-card.service');
      const creditCardService = new CreditCardService();
      await creditCardService.syncUsedLimit(transaction.credit_card_id);
    } catch (error: any) {
      console.error('Failed to sync credit card used limit:', error);
    }

    return transaction;
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    const existing = await this.getTransactionById(transactionId);

    await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, transactionId);

    // Sync credit card used limit
    if (existing) {
      try {
        const { CreditCardService } = await import('./credit-card.service');
        const creditCardService = new CreditCardService();
        await creditCardService.syncUsedLimit(existing.credit_card_id);
      } catch (error: any) {
        console.error('Failed to sync credit card used limit:', error);
      }
    }
  }

  /**
   * List transactions with filters
   */
  async listTransactions(filters: CreditCardTransactionFilter): Promise<{
    transactions: CreditCardTransaction[];
    total: number;
  }> {
    const queries: any[] = [];

    if (filters.userId) {
      queries.push(Query.equal('user_id', filters.userId));
    }

    if (filters.creditCardId) {
      queries.push(Query.equal('credit_card_id', filters.creditCardId));
    }

    if (filters.category) {
      queries.push(Query.equal('category', filters.category));
    }

    if (filters.status) {
      queries.push(Query.equal('status', filters.status));
    }

    if (filters.startDate) {
      queries.push(Query.greaterThanEqual('date', filters.startDate));
    }

    if (filters.endDate) {
      queries.push(Query.lessThanEqual('date', filters.endDate));
    }

    if (filters.startPurchaseDate) {
      queries.push(Query.greaterThanEqual('purchase_date', filters.startPurchaseDate));
    }

    if (filters.endPurchaseDate) {
      queries.push(Query.lessThanEqual('purchase_date', filters.endPurchaseDate));
    }

    if (filters.minAmount !== undefined) {
      queries.push(Query.greaterThanEqual('amount', filters.minAmount));
    }

    if (filters.maxAmount !== undefined) {
      queries.push(Query.lessThanEqual('amount', filters.maxAmount));
    }

    if (filters.isRecurring !== undefined) {
      queries.push(Query.equal('is_recurring', filters.isRecurring));
    }

    const limit = filters.limit || 1000;
    const offset = filters.offset || 0;
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    queries.push(Query.orderDesc('date'));

    const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, queries);

    const transactions = response.documents.map((doc: any) => this.formatTransaction(doc));

    return {
      transactions,
      total: response.total || 0,
    };
  }

  /**
   * Bulk create credit card transactions
   */
  async bulkCreateTransactions(transactions: CreateCreditCardTransactionData[]): Promise<CreditCardTransaction[]> {
    const createdTransactions: CreditCardTransaction[] = [];
    const now = new Date().toISOString();

    // Prepare all documents
    const documents = transactions.map((data) => {
      const id = ID.unique();

      // Convert dates to user timezone
      const dateInUserTimezone = data.date.includes('T') ? data.date : dateToUserTimezone(data.date);
      const purchaseDateInUserTimezone = data.purchaseDate.includes('T')
        ? data.purchaseDate
        : dateToUserTimezone(data.purchaseDate);

      return {
        id,
        payload: {
          user_id: data.userId,
          credit_card_id: data.creditCardId,
          amount: data.amount,
          date: dateInUserTimezone,
          purchase_date: purchaseDateInUserTimezone,
          category: data.category,
          description: data.description,
          merchant: data.merchant,
          installment: data.installment,
          installments: data.installments,
          is_recurring: data.isRecurring || false,
          status: data.status || 'completed',
          created_at: now,
          updated_at: now,
        },
      };
    });

    // Create all documents
    for (const { id, payload } of documents) {
      try {
        const document = await this.dbAdapter.createDocument(
          DATABASE_ID,
          COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
          id,
          payload,
        );
        createdTransactions.push(this.formatTransaction(document));
      } catch (error: any) {
        console.error(`Failed to create transaction ${id}:`, error);
        // Continue with other transactions
      }
    }

    // Sync credit card used limit once after all transactions
    if (transactions.length > 0 && transactions[0].creditCardId) {
      try {
        const { CreditCardService } = await import('./credit-card.service');
        const creditCardService = new CreditCardService();
        await creditCardService.syncUsedLimit(transactions[0].creditCardId);
      } catch (error: any) {
        console.error('Failed to sync credit card used limit:', error);
      }
    }

    return createdTransactions;
  }

  /**
   * Get total amount for current month (unpaid bills)
   */
  async getCurrentMonthTotal(userId: string, creditCardId?: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const filters: CreditCardTransactionFilter = {
      userId,
      startDate: startOfMonth,
      endDate: endOfMonth,
      status: 'completed',
      limit: 10000,
    };

    if (creditCardId) {
      filters.creditCardId = creditCardId;
    }

    const { transactions } = await this.listTransactions(filters);
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  private formatTransaction(document: any): CreditCardTransaction {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      user_id: document.user_id,
      credit_card_id: document.credit_card_id,
      amount: document.amount,
      date: document.date,
      purchase_date: document.purchase_date,
      category: document.category,
      description: document.description,
      merchant: document.merchant,
      installment: document.installment,
      installments: document.installments,
      is_recurring: document.is_recurring,
      status: document.status,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
