import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, Transaction } from '@/lib/appwrite/schema';
import { dateToUserTimezone } from '@/lib/utils/timezone';
import { ID, Query } from 'node-appwrite';

/**
 * Transaction Service
 * Handles transaction CRUD operations and statistics
 */

export interface CreateTransactionData {
  userId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'salary';
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
  installment?: number; // Current installment number (1, 2, 3...)
  installments?: number; // Total number of installments (12 for 12x)
  creditCardTransactionCreatedAt?: string; // Original purchase date on credit card
  taxAmount?: number; // Tax amount for salary transactions
  linkedTransactionId?: string; // ID of linked transaction (e.g., tax transaction linked to salary)
}

export interface CreateIntegrationTransactionData extends CreateTransactionData {
  integrationId?: string;
  integrationData?: any;
}

export interface UpdateTransactionData {
  amount?: number;
  type?: 'income' | 'expense' | 'transfer' | 'salary';
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
  installment?: number; // Current installment number
  installments?: number; // Total number of installments
  creditCardTransactionCreatedAt?: string; // Original purchase date
  taxAmount?: number; // Tax amount for salary transactions
  linkedTransactionId?: string; // ID of linked transaction
}

export interface TransactionFilter {
  userId?: string;
  type?: 'income' | 'expense' | 'transfer' | 'salary';
  category?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  source?: 'manual' | 'integration' | 'import';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  creditCardId?: string;
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

    // Build data object only for fields that don't have dedicated columns
    const transactionData: any = {};
    if (data.location) transactionData.location = data.location;
    if (data.receiptUrl) transactionData.receipt_url = data.receiptUrl;
    if (data.recurringPattern) transactionData.recurring_pattern = data.recurringPattern;
    if (data.linkedTransactionId) transactionData.linked_transaction_id = data.linkedTransactionId;

    // Convert date to user's timezone (ensures consistency)
    const dateInUserTimezone = data.date.includes('T') ? data.date : dateToUserTimezone(data.date);

    // For salary transactions, automatically set as recurring monthly without end date
    let isRecurring = data.isRecurring || false;
    let recurringPattern = data.recurringPattern;

    if (data.type === 'salary') {
      isRecurring = true;
      recurringPattern = {
        frequency: 'monthly',
        interval: 1,
        // No endDate - salary is indefinite
      };
      transactionData.recurring_pattern = recurringPattern;
    }

    const payload: any = {
      user_id: data.userId,
      amount: data.amount,
      type: data.type,
      date: dateInUserTimezone,
      status: data.status || 'completed',
      category: data.category,
      description: data.description,
      currency: data.currency,
      source: 'manual',
      merchant: data.merchant,
      tags: data.tags ? data.tags.join(',') : undefined,
      is_recurring: isRecurring,
      data: Object.keys(transactionData).length > 0 ? this.stringifyJSON(transactionData) : undefined,
      created_at: now,
      updated_at: now,
    };

    // Add account_id and credit_card_id as dedicated columns
    if (data.accountId) {
      payload.account_id = data.accountId;
    }
    if (data.creditCardId) {
      payload.credit_card_id = data.creditCardId;
    }

    // Add installment fields if provided
    if (data.installment !== undefined) {
      payload.installment = data.installment;
    }
    if (data.installments !== undefined) {
      payload.installments = data.installments;
    }
    if (data.creditCardTransactionCreatedAt) {
      // Convert purchase date to user's timezone
      const purchaseDateInUserTimezone = data.creditCardTransactionCreatedAt.includes('T')
        ? data.creditCardTransactionCreatedAt
        : dateToUserTimezone(data.creditCardTransactionCreatedAt);
      payload.credit_card_transaction_created_at = purchaseDateInUserTimezone;
    }

    const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, id, payload);

    // If this is a salary transaction with tax, create the tax transaction
    if (data.type === 'salary' && data.taxAmount && data.taxAmount > 0) {
      try {
        const taxId = ID.unique();
        const taxTransactionData: any = {
          linked_transaction_id: id, // Link back to salary
        };

        const taxPayload: any = {
          user_id: data.userId,
          amount: data.taxAmount,
          type: 'expense',
          date: dateInUserTimezone,
          status: data.status || 'completed',
          category: 'Impostos',
          description: `Imposto sobre salário - ${data.description || 'Salário'}`,
          currency: data.currency,
          source: 'manual',
          is_recurring: true, // Tax is also recurring
          data: this.stringifyJSON(taxTransactionData),
          created_at: now,
          updated_at: now,
        };

        if (data.accountId) {
          taxPayload.account_id = data.accountId;
        }

        await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, taxId, taxPayload);

        // Update the salary transaction to link to the tax transaction
        const updatedSalaryData = this.parseJSON(document.data, {});
        updatedSalaryData.linked_transaction_id = taxId;
        await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, id, {
          data: this.stringifyJSON(updatedSalaryData),
        });

        // Sync account balance for tax transaction if needed
        if (data.accountId) {
          try {
            const { BalanceSyncService } = await import('./balance-sync.service');
            const balanceSyncService = new BalanceSyncService();
            await balanceSyncService.syncAfterCreate(data.accountId, taxId);
          } catch (error: any) {
            console.error('Failed to sync account balance after tax transaction creation:', error);
          }
        }
      } catch (error: any) {
        console.error('Failed to create tax transaction for salary:', error);
        // Don't fail the salary creation if tax transaction fails
      }
    }

    // Sync account balance if transaction is linked to an account (but not a credit card)
    if (data.accountId && !data.creditCardId) {
      try {
        const { BalanceSyncService } = await import('./balance-sync.service');
        const balanceSyncService = new BalanceSyncService();
        await balanceSyncService.syncAfterCreate(data.accountId, id);
      } catch (error: any) {
        console.error('Failed to sync account balance after transaction creation:', error);
        // Don't fail the transaction creation if balance sync fails
      }
    }

    // Sync credit card used limit if transaction is linked to a credit card
    if (data.creditCardId) {
      try {
        const { CreditCardService } = await import('./credit-card.service');
        const creditCardService = new CreditCardService();
        await creditCardService.syncUsedLimit(data.creditCardId);
      } catch (error: any) {
        console.error('Failed to sync credit card used limit after transaction creation:', error);
        // Don't fail the transaction creation if sync fails
      }
    }

    return this.formatTransaction(document);
  }

  /**
   * Create a transaction from integration
   */
  async createIntegrationTransaction(data: CreateIntegrationTransactionData): Promise<Transaction> {
    const id = ID.unique();
    const now = new Date().toISOString();

    // Build data object with ALL fields except core indexed ones
    const transactionData: any = {};

    if (data.integrationId) transactionData.integration_id = data.integrationId;
    if (data.integrationData) transactionData.integration_data = data.integrationData;
    if (data.tags) transactionData.tags = data.tags;
    if (data.location) transactionData.location = data.location;
    if (data.receiptUrl) transactionData.receipt_url = data.receiptUrl;
    if (data.recurringPattern) transactionData.recurring_pattern = data.recurringPattern;

    // Convert date to user's timezone
    const dateInUserTimezone = data.date.includes('T') ? data.date : dateToUserTimezone(data.date);

    const payload: any = {
      user_id: data.userId,
      amount: data.amount,
      type: data.type,
      date: dateInUserTimezone,
      status: data.status || 'completed',
      data: this.stringifyJSON(transactionData),
      created_at: now,
      updated_at: now,
      category: data.category,
      description: data.description,
      currency: data.currency,
      source: 'integration',
      accountId: data.accountId,
      creditCardId: data.creditCardId,
      merchant: data.merchant,
      tags: data.tags,
      location: data.location,
      receiptUrl: data.receiptUrl,
      isRecurring: data.isRecurring,
      recurringPattern: data.recurringPattern,
    };

    // Add account_id as a dedicated column
    if (data.accountId) {
      payload.account_id = data.accountId;
    }

    const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, id, payload);

    // Sync account balance if transaction is linked to an account
    if (data.accountId && !data.creditCardId) {
      try {
        const { BalanceSyncService } = await import('./balance-sync.service');
        const balanceSyncService = new BalanceSyncService();
        await balanceSyncService.syncAfterCreate(data.accountId, id);
      } catch (error: any) {
        console.error('Failed to sync account balance after transaction creation:', error);
        // Don't fail the transaction creation if balance sync fails
      }
    }

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

      // Get existing transaction to merge data and track account changes
      const existing = await this.getTransactionById(transactionId);
      if (!existing) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      const oldAccountId = existing.account_id;

      // Parse existing data
      const existingData = this.parseJSON(existing.data, {});

      // Build updated data object
      const updatedData: any = { ...existingData };

      // Core fields that can be updated
      if (data.category !== undefined) updatedData.category = data.category;
      if (data.description !== undefined) updatedData.description = data.description;
      if (data.currency !== undefined) updatedData.currency = data.currency;

      // Optional fields (except account_id which is now a column)
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
      if (data.date !== undefined) {
        // Convert date to user's timezone
        updatePayload.date = data.date.includes('T') ? data.date : dateToUserTimezone(data.date);
      }
      if (data.status !== undefined) updatePayload.status = data.status;

      // Update account_id if changed
      if (data.accountId !== undefined) {
        updatePayload.account_id = data.accountId;
      }

      // Update installment fields if provided
      if (data.installment !== undefined) {
        updatePayload.installment = data.installment;
      }
      if (data.installments !== undefined) {
        updatePayload.installments = data.installments;
      }
      if (data.creditCardTransactionCreatedAt !== undefined) {
        // Convert purchase date to user's timezone
        const purchaseDateInUserTimezone = data.creditCardTransactionCreatedAt.includes('T')
          ? data.creditCardTransactionCreatedAt
          : dateToUserTimezone(data.creditCardTransactionCreatedAt);
        updatePayload.credit_card_transaction_created_at = purchaseDateInUserTimezone;
      }

      // Handle tax amount update for salary transactions
      if (existing.type === 'salary' && data.taxAmount !== undefined) {
        const linkedTaxId = existingData.linked_transaction_id;

        if (linkedTaxId) {
          // Update existing tax transaction
          try {
            await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, linkedTaxId, {
              amount: data.taxAmount,
              updated_at: now,
            });

            // Sync account balance for updated tax transaction
            const accountId = data.accountId !== undefined ? data.accountId : oldAccountId;
            if (accountId) {
              try {
                const { BalanceSyncService } = await import('./balance-sync.service');
                const balanceSyncService = new BalanceSyncService();
                await balanceSyncService.syncAfterUpdate(accountId, linkedTaxId);
              } catch (error: any) {
                console.error('Failed to sync account balance after tax transaction update:', error);
              }
            }
          } catch (error: any) {
            console.error('Failed to update linked tax transaction:', error);
          }
        } else if (data.taxAmount > 0) {
          // Create new tax transaction if it doesn't exist
          try {
            const taxId = ID.unique();
            const taxTransactionData: any = {
              linked_transaction_id: transactionId,
            };

            const dateInUserTimezone = data.date
              ? data.date.includes('T')
                ? data.date
                : dateToUserTimezone(data.date)
              : existing.date;

            const taxPayload: any = {
              user_id: existing.user_id,
              amount: data.taxAmount,
              type: 'expense',
              date: dateInUserTimezone,
              status: existing.status,
              category: 'Impostos',
              description: `Imposto sobre salário - ${data.description || existing.description || 'Salário'}`,
              currency: data.currency || existing.currency || 'BRL',
              source: 'manual',
              is_recurring: true,
              data: this.stringifyJSON(taxTransactionData),
              created_at: now,
              updated_at: now,
            };

            const accountId = data.accountId !== undefined ? data.accountId : oldAccountId;
            if (accountId) {
              taxPayload.account_id = accountId;
            }

            await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, taxId, taxPayload);

            // Link the tax transaction to the salary
            updatedData.linked_transaction_id = taxId;

            // Sync account balance for new tax transaction
            if (accountId) {
              try {
                const { BalanceSyncService } = await import('./balance-sync.service');
                const balanceSyncService = new BalanceSyncService();
                await balanceSyncService.syncAfterCreate(accountId, taxId);
              } catch (error: any) {
                console.error('Failed to sync account balance after tax transaction creation:', error);
              }
            }
          } catch (error: any) {
            console.error('Failed to create tax transaction for salary:', error);
          }
        }
      }

      // Update data JSON field
      updatePayload.data = this.stringifyJSON(updatedData);

      const document = await this.dbAdapter.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TRANSACTIONS,
        transactionId,
        updatePayload,
      );

      // Sync account balance if transaction is linked to an account
      const newAccountId = data.accountId !== undefined ? data.accountId : oldAccountId;

      // Check if it's not a credit card transaction
      const isCreditCardTransaction = updatedData.credit_card_id || existingData.credit_card_id;

      if (!isCreditCardTransaction) {
        try {
          const { BalanceSyncService } = await import('./balance-sync.service');
          const balanceSyncService = new BalanceSyncService();

          // If account changed, sync both old and new accounts
          if (oldAccountId && newAccountId && oldAccountId !== newAccountId) {
            await balanceSyncService.syncAfterUpdate(oldAccountId, transactionId);
            await balanceSyncService.syncAfterUpdate(newAccountId, transactionId);
          } else if (newAccountId) {
            // Same account or only one account, sync it
            await balanceSyncService.syncAfterUpdate(newAccountId, transactionId);
          }
        } catch (error: any) {
          console.error('Failed to sync account balance after transaction update:', error);
          // Don't fail the transaction update if balance sync fails
        }
      }

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
      // Get transaction before deleting to sync account balance
      const existing = await this.getTransactionById(transactionId);
      const accountId = existing?.account_id;

      // If this is a salary transaction, also delete the linked tax transaction
      if (existing && existing.type === 'salary') {
        const existingData = this.parseJSON(existing.data, {});
        const linkedTaxId = existingData.linked_transaction_id;

        if (linkedTaxId) {
          try {
            await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, linkedTaxId);

            // Sync account balance for deleted tax transaction
            if (accountId) {
              try {
                const { BalanceSyncService } = await import('./balance-sync.service');
                const balanceSyncService = new BalanceSyncService();
                await balanceSyncService.syncAfterDelete(accountId, linkedTaxId);
              } catch (error: any) {
                console.error('Failed to sync account balance after tax transaction deletion:', error);
              }
            }
          } catch (error: any) {
            console.error('Failed to delete linked tax transaction:', error);
            // Continue with salary deletion even if tax deletion fails
          }
        }
      }

      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, transactionId);

      // Sync account balance if transaction was linked to an account
      if (accountId && existing) {
        // Check if it's not a credit card transaction
        const existingData = this.parseJSON(existing.data, {});
        const isCreditCardTransaction = existingData.credit_card_id;

        if (!isCreditCardTransaction) {
          try {
            const { BalanceSyncService } = await import('./balance-sync.service');
            const balanceSyncService = new BalanceSyncService();
            await balanceSyncService.syncAfterDelete(accountId, transactionId);
          } catch (error: any) {
            console.error('Failed to sync account balance after transaction deletion:', error);
            // Don't fail the transaction deletion if balance sync fails
          }
        }
      }
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

      // Credit card filter - now using dedicated column
      if (filters.creditCardId) {
        queries.push(Query.equal('credit_card_id', filters.creditCardId));
      }

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));

      // Sort by date descending
      queries.push(Query.orderDesc('date'));

      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, queries);

      const transactions = response.documents.map((doc: any) => this.formatTransaction(doc));

      return {
        transactions,
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
      account_id: document.account_id,
      credit_card_id: document.credit_card_id,
      category: document.category,
      description: document.description,
      currency: document.currency,
      source: document.source,
      merchant: document.merchant,
      tags: document.tags,
      is_recurring: document.is_recurring,
      installment: document.installment,
      installments: document.installments,
      credit_card_transaction_created_at: document.credit_card_transaction_created_at,
      data: document.data,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
