import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { Account, COLLECTIONS, CreditCard, DATABASE_ID, Invoice, Transaction } from '@/lib/appwrite/schema';
import {
  AccountWithOwnership,
  CreditCardWithOwnership,
  InvoiceWithOwnership,
  TransactionWithOwnership,
} from '@/lib/types/sharing.types';
import { Query } from 'node-appwrite';

import { SharingService } from './sharing.service';
import { UserService } from './user.service';

/**
 * Data Access Service
 * Provides unified data access for shared accounts in the joint accounts sharing system.
 * Handles fetching and merging data from both the current user and linked users,
 * adding ownership metadata to all returned data.
 */

export interface TransactionFilters {
  type?: 'income' | 'expense' | 'transfer' | 'salary';
  category?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  creditCardId?: string;
  accountId?: string;
}

export interface InvoiceFilters {
  category?: 'pharmacy' | 'groceries' | 'supermarket' | 'restaurant' | 'fuel' | 'retail' | 'services' | 'other';
  merchant?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export class DataAccessService {
  private dbAdapter: any;
  private sharingService: SharingService;
  private userService: UserService;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
    this.sharingService = new SharingService();
    this.userService = new UserService();
  }

  // ============================================
  // Public Data Access Methods
  // ============================================

  /**
   * Get all accounts accessible by a user (own + shared)
   * Includes ownership metadata for each account
   * Respects user's sharing preferences
   *
   * @param userId - ID of the current user
   * @returns Array of accounts with ownership information
   */
  async getAccessibleAccounts(userId: string): Promise<AccountWithOwnership[]> {
    try {
      // Get sharing preferences
      const sharingPrefs = await this.userService.getSharingPreferences(userId);

      // Get shared data context
      const context = await this.sharingService.getSharedDataContext(userId);

      // Fetch user's own accounts
      const ownAccountsResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
        Query.equal('user_id', userId),
        Query.orderDesc('created_at'),
      ]);

      const ownAccounts = (ownAccountsResponse.documents || []) as unknown as Account[];

      // If no active relationship or user disabled shared data, return only own accounts
      if (!context.hasActiveRelationship || !context.linkedUserId || !sharingPrefs.show_shared_data) {
        return this.addOwnershipToAccounts(ownAccounts, userId, userId, true);
      }

      // Fetch linked user's accounts
      const linkedAccountsResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
        Query.equal('user_id', context.linkedUserId),
        Query.orderDesc('created_at'),
      ]);

      const linkedAccounts = (linkedAccountsResponse.documents || []) as unknown as Account[];

      // Fetch user names for ownership labels
      const userNames = await this.fetchUserNames([userId, context.linkedUserId]);

      // Merge and add ownership metadata
      const ownAccountsWithOwnership = this.addOwnershipToAccounts(
        ownAccounts,
        userId,
        userId,
        true,
        userNames[userId],
      );

      const linkedAccountsWithOwnership = this.addOwnershipToAccounts(
        linkedAccounts,
        context.linkedUserId,
        userId,
        false,
        userNames[context.linkedUserId],
      );

      return [...ownAccountsWithOwnership, ...linkedAccountsWithOwnership];
    } catch (error) {
      console.error('Error fetching accessible accounts:', error);
      throw new Error('Failed to fetch accessible accounts');
    }
  }

  /**
   * Get all transactions accessible by a user (own + shared)
   * Includes ownership metadata and supports filtering
   * Respects user's sharing preferences
   *
   * @param userId - ID of the current user
   * @param filters - Optional filters for transactions
   * @returns Array of transactions with ownership information
   */
  async getAccessibleTransactions(userId: string, filters?: TransactionFilters): Promise<TransactionWithOwnership[]> {
    try {
      // Get sharing preferences
      const sharingPrefs = await this.userService.getSharingPreferences(userId);

      // Get shared data context
      const context = await this.sharingService.getSharedDataContext(userId);

      // Build queries for own transactions
      const ownQueries = this.buildTransactionQueries(userId, filters);
      const ownTransactionsResponse = await this.dbAdapter.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TRANSACTIONS,
        ownQueries,
      );

      const ownTransactions = (ownTransactionsResponse.documents || []) as unknown as Transaction[];

      // If no active relationship or user disabled shared data, return only own transactions
      if (!context.hasActiveRelationship || !context.linkedUserId || !sharingPrefs.show_shared_data) {
        return this.addOwnershipToTransactions(ownTransactions, userId, userId, true);
      }

      // Build queries for linked user's transactions
      const linkedQueries = this.buildTransactionQueries(context.linkedUserId, filters);
      const linkedTransactionsResponse = await this.dbAdapter.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TRANSACTIONS,
        linkedQueries,
      );

      const linkedTransactions = (linkedTransactionsResponse.documents || []) as unknown as Transaction[];

      // Fetch user names for ownership labels
      const userNames = await this.fetchUserNames([userId, context.linkedUserId]);

      // Merge and add ownership metadata
      const ownTransactionsWithOwnership = this.addOwnershipToTransactions(
        ownTransactions,
        userId,
        userId,
        true,
        userNames[userId],
      );

      const linkedTransactionsWithOwnership = this.addOwnershipToTransactions(
        linkedTransactions,
        context.linkedUserId,
        userId,
        false,
        userNames[context.linkedUserId],
      );

      // Merge and sort by date descending
      const allTransactions = [...ownTransactionsWithOwnership, ...linkedTransactionsWithOwnership];
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return allTransactions;
    } catch (error) {
      console.error('Error fetching accessible transactions:', error);
      throw new Error('Failed to fetch accessible transactions');
    }
  }

  /**
   * Get all credit cards accessible by a user (own + shared)
   * Includes ownership metadata
   * Respects user's sharing preferences
   *
   * @param userId - ID of the current user
   * @returns Array of credit cards with ownership information
   */
  async getAccessibleCreditCards(userId: string): Promise<CreditCardWithOwnership[]> {
    try {
      // Get sharing preferences
      const sharingPrefs = await this.userService.getSharingPreferences(userId);

      // Get shared data context
      const context = await this.sharingService.getSharedDataContext(userId);

      // Get accessible accounts first (to find credit cards)
      const accessibleAccounts = await this.getAccessibleAccounts(userId);
      const accountIds = accessibleAccounts.map((account) => account.$id);

      if (accountIds.length === 0) {
        return [];
      }

      // Fetch all credit cards for accessible accounts
      const creditCardsResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, [
        Query.equal('account_id', accountIds),
        Query.orderDesc('created_at'),
      ]);

      const creditCards = (creditCardsResponse.documents || []) as unknown as CreditCard[];

      // If no active relationship or user disabled shared data, return only own credit cards
      if (!context.hasActiveRelationship || !context.linkedUserId || !sharingPrefs.show_shared_data) {
        return this.addOwnershipToCreditCards(creditCards, userId, userId, true);
      }

      // Fetch user names for ownership labels
      const userNames = await this.fetchUserNames([userId, context.linkedUserId]);

      // Add ownership metadata based on account ownership
      const creditCardsWithOwnership = creditCards.map((card) => {
        const account = accessibleAccounts.find((acc) => acc.$id === card.account_id);
        const ownerId = account?.user_id || userId;
        const isOwn = ownerId === userId;
        const ownerName = userNames[ownerId] || 'Unknown';

        return {
          ...card,
          ownerId,
          ownerName,
          isOwn,
        };
      });

      return creditCardsWithOwnership;
    } catch (error) {
      console.error('Error fetching accessible credit cards:', error);
      throw new Error('Failed to fetch accessible credit cards');
    }
  }

  /**
   * Get all invoices accessible by a user (own + shared)
   * Includes ownership metadata and supports filtering
   * Respects user's sharing preferences
   *
   * @param userId - ID of the current user
   * @param filters - Optional filters for invoices
   * @returns Array of invoices with ownership information
   */
  async getAccessibleInvoices(userId: string, filters?: InvoiceFilters): Promise<InvoiceWithOwnership[]> {
    try {
      // Get sharing preferences
      const sharingPrefs = await this.userService.getSharingPreferences(userId);

      // Get shared data context
      const context = await this.sharingService.getSharedDataContext(userId);

      // Build queries for own invoices
      const ownQueries = this.buildInvoiceQueries(userId, filters);
      const ownInvoicesResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, ownQueries);

      const ownInvoices = (ownInvoicesResponse.documents || []) as unknown as Invoice[];

      // If no active relationship or user disabled shared data, return only own invoices
      if (!context.hasActiveRelationship || !context.linkedUserId || !sharingPrefs.show_shared_data) {
        return this.addOwnershipToInvoices(ownInvoices, userId, userId, true);
      }

      // Build queries for linked user's invoices
      const linkedQueries = this.buildInvoiceQueries(context.linkedUserId, filters);
      const linkedInvoicesResponse = await this.dbAdapter.listDocuments(
        DATABASE_ID,
        COLLECTIONS.INVOICES,
        linkedQueries,
      );

      const linkedInvoices = (linkedInvoicesResponse.documents || []) as unknown as Invoice[];

      // Fetch user names for ownership labels
      const userNames = await this.fetchUserNames([userId, context.linkedUserId]);

      // Merge and add ownership metadata
      const ownInvoicesWithOwnership = this.addOwnershipToInvoices(
        ownInvoices,
        userId,
        userId,
        true,
        userNames[userId],
      );

      const linkedInvoicesWithOwnership = this.addOwnershipToInvoices(
        linkedInvoices,
        context.linkedUserId,
        userId,
        false,
        userNames[context.linkedUserId],
      );

      // Merge and sort by issue date descending
      const allInvoices = [...ownInvoicesWithOwnership, ...linkedInvoicesWithOwnership];
      allInvoices.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());

      return allInvoices;
    } catch (error) {
      console.error('Error fetching accessible invoices:', error);
      throw new Error('Failed to fetch accessible invoices');
    }
  }

  /**
   * Calculate total balance across all accessible accounts
   * Includes both user's own accounts and shared accounts
   * Respects user's include_shared_in_calculations preference
   *
   * @param userId - ID of the current user
   * @returns Total balance across all accessible accounts
   */
  async getTotalAccessibleBalance(userId: string): Promise<number> {
    try {
      // Get sharing preferences
      const sharingPrefs = await this.userService.getSharingPreferences(userId);

      const accounts = await this.getAccessibleAccounts(userId);

      // If user disabled shared data in calculations, only include own accounts
      if (!sharingPrefs.include_shared_in_calculations) {
        return accounts.filter((account) => account.isOwn).reduce((total, account) => total + account.balance, 0);
      }

      return accounts.reduce((total, account) => total + account.balance, 0);
    } catch (error) {
      console.error('Error calculating total accessible balance:', error);
      throw new Error('Failed to calculate total accessible balance');
    }
  }

  /**
   * Verify if user can access a specific resource
   * Checks if the resource belongs to the user or their linked user
   *
   * @param userId - ID of the current user
   * @param resourceOwnerId - ID of the resource owner
   * @returns True if user can access the resource
   */
  async canAccessResource(userId: string, resourceOwnerId: string): Promise<boolean> {
    try {
      // User can always access their own resources
      if (userId === resourceOwnerId) {
        return true;
      }

      // Check if user has active relationship with resource owner
      const context = await this.sharingService.getSharedDataContext(userId);

      if (!context.hasActiveRelationship || !context.linkedUserId) {
        return false;
      }

      // User can access resource if it belongs to their linked user
      return context.linkedUserId === resourceOwnerId;
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Fetch user names for ownership display
   * Returns a map of user IDs to user names
   *
   * @param userIds - Array of user IDs to fetch names for
   * @returns Map of user ID to user name
   */
  private async fetchUserNames(userIds: string[]): Promise<Record<string, string>> {
    const userNames: Record<string, string> = {};

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await this.userService.findUserById(userId);
          userNames[userId] = user?.name || 'Unknown';
        } catch (error) {
          console.error(`Failed to fetch user name for ${userId}:`, error);
          userNames[userId] = 'Unknown';
        }
      }),
    );

    return userNames;
  }

  /**
   * Add ownership metadata to accounts
   *
   * @param accounts - Array of accounts
   * @param ownerId - ID of the account owner
   * @param currentUserId - ID of the current user
   * @param isOwn - Whether the accounts belong to the current user
   * @param ownerName - Name of the account owner (optional)
   * @returns Array of accounts with ownership metadata
   */
  private addOwnershipToAccounts(
    accounts: Account[],
    ownerId: string,
    currentUserId: string,
    isOwn: boolean,
    ownerName?: string,
  ): AccountWithOwnership[] {
    return accounts.map((account) => ({
      ...account,
      ownerId,
      ownerName: ownerName || (isOwn ? 'Sua' : 'Compartilhada'),
      isOwn,
    }));
  }

  /**
   * Add ownership metadata to transactions
   *
   * @param transactions - Array of transactions
   * @param ownerId - ID of the transaction owner
   * @param currentUserId - ID of the current user
   * @param isOwn - Whether the transactions belong to the current user
   * @param ownerName - Name of the transaction owner (optional)
   * @returns Array of transactions with ownership metadata
   */
  private addOwnershipToTransactions(
    transactions: Transaction[],
    ownerId: string,
    currentUserId: string,
    isOwn: boolean,
    ownerName?: string,
  ): TransactionWithOwnership[] {
    return transactions.map((transaction) => ({
      ...transaction,
      ownerId,
      ownerName: ownerName || (isOwn ? 'Sua' : 'Compartilhada'),
      isOwn,
    }));
  }

  /**
   * Add ownership metadata to credit cards
   *
   * @param creditCards - Array of credit cards
   * @param ownerId - ID of the credit card owner
   * @param currentUserId - ID of the current user
   * @param isOwn - Whether the credit cards belong to the current user
   * @param ownerName - Name of the credit card owner (optional)
   * @returns Array of credit cards with ownership metadata
   */
  private addOwnershipToCreditCards(
    creditCards: CreditCard[],
    ownerId: string,
    currentUserId: string,
    isOwn: boolean,
    ownerName?: string,
  ): CreditCardWithOwnership[] {
    return creditCards.map((card) => ({
      ...card,
      ownerId,
      ownerName: ownerName || (isOwn ? 'Sua' : 'Compartilhada'),
      isOwn,
    }));
  }

  /**
   * Add ownership metadata to invoices
   *
   * @param invoices - Array of invoices
   * @param ownerId - ID of the invoice owner
   * @param currentUserId - ID of the current user
   * @param isOwn - Whether the invoices belong to the current user
   * @param ownerName - Name of the invoice owner (optional)
   * @returns Array of invoices with ownership metadata
   */
  private addOwnershipToInvoices(
    invoices: Invoice[],
    ownerId: string,
    currentUserId: string,
    isOwn: boolean,
    ownerName?: string,
  ): InvoiceWithOwnership[] {
    return invoices.map((invoice) => ({
      ...invoice,
      ownerId,
      ownerName: ownerName || (isOwn ? 'Sua' : 'Compartilhada'),
      isOwn,
    }));
  }

  /**
   * Build Appwrite queries for transactions with filters
   *
   * @param userId - ID of the user
   * @param filters - Optional transaction filters
   * @returns Array of Appwrite queries
   */
  private buildTransactionQueries(userId: string, filters?: TransactionFilters): any[] {
    const queries: any[] = [Query.equal('user_id', userId)];

    if (filters) {
      if (filters.type) {
        queries.push(Query.equal('type', filters.type));
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
      if (filters.minAmount !== undefined) {
        queries.push(Query.greaterThanEqual('amount', filters.minAmount));
      }
      if (filters.maxAmount !== undefined) {
        queries.push(Query.lessThanEqual('amount', filters.maxAmount));
      }
      if (filters.search) {
        queries.push(Query.search('description', filters.search));
      }
      if (filters.creditCardId) {
        queries.push(Query.equal('credit_card_id', filters.creditCardId));
      }
      if (filters.accountId) {
        queries.push(Query.equal('account_id', filters.accountId));
      }
    }

    // Sort by date descending
    queries.push(Query.orderDesc('date'));

    // Limit to reasonable number for performance
    queries.push(Query.limit(1000));

    return queries;
  }

  /**
   * Build Appwrite queries for invoices with filters
   *
   * @param userId - ID of the user
   * @param filters - Optional invoice filters
   * @returns Array of Appwrite queries
   */
  private buildInvoiceQueries(userId: string, filters?: InvoiceFilters): any[] {
    const queries: any[] = [Query.equal('user_id', userId)];

    if (filters) {
      if (filters.category) {
        queries.push(Query.equal('category', filters.category));
      }
      if (filters.merchant) {
        queries.push(Query.search('merchant_name', filters.merchant));
      }
      if (filters.startDate) {
        queries.push(Query.greaterThanEqual('issue_date', filters.startDate));
      }
      if (filters.endDate) {
        queries.push(Query.lessThanEqual('issue_date', filters.endDate));
      }
      if (filters.minAmount !== undefined) {
        queries.push(Query.greaterThanEqual('total_amount', filters.minAmount));
      }
      if (filters.maxAmount !== undefined) {
        queries.push(Query.lessThanEqual('total_amount', filters.maxAmount));
      }
      if (filters.search) {
        queries.push(Query.search('merchant_name', filters.search));
      }
    }

    // Sort by issue date descending
    queries.push(Query.orderDesc('issue_date'));

    // Limit to reasonable number for performance
    queries.push(Query.limit(1000));

    return queries;
  }
}
