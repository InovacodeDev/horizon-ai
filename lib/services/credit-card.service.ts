import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, CreditCard, DATABASE_ID } from '@/lib/appwrite/schema';
import { Query } from 'node-appwrite';

import AppwriteDBAdapter from '../appwrite/adapter';

/**
 * Credit Card Service
 * Handles credit card operations and limit calculations
 */

export class CreditCardService {
  private dbAdapter: AppwriteDBAdapter;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  /**
   * Get credit card by ID
   */
  async getCreditCardById(creditCardId: string): Promise<CreditCard | null> {
    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, creditCardId);
      return this.formatCreditCard(document);
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Calculate available limit for a credit card
   * Limit = credit_limit - sum of all transactions linked to this card
   */
  async calculateAvailableLimit(creditCardId: string): Promise<{
    creditLimit: number;
    usedLimit: number;
    availableLimit: number;
  }> {
    try {
      // Get credit card
      const creditCard = await this.getCreditCardById(creditCardId);
      if (!creditCard) {
        throw new Error('Credit card not found');
      }

      // Get all transactions for this credit card
      const transactionsResponse = await this.dbAdapter.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CREDIT_CARD_TRANSACTIONS,
        [
          Query.equal('credit_card_id', creditCardId),
          Query.equal('status', 'completed'),
          Query.limit(10000), // Get all transactions
        ],
      );

      // Calculate used limit (sum of all transaction amounts)
      const usedLimit = transactionsResponse.documents.reduce((sum: number, doc: any) => {
        return sum + (doc.amount || 0);
      }, 0);

      const availableLimit = creditCard.credit_limit - usedLimit;

      return {
        creditLimit: creditCard.credit_limit,
        usedLimit,
        availableLimit,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update credit card used limit
   * This should be called after creating/updating/deleting transactions
   */
  async syncUsedLimit(creditCardId: string): Promise<void> {
    try {
      const { usedLimit } = await this.calculateAvailableLimit(creditCardId);

      await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, creditCardId, {
        used_limit: usedLimit,
        updated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to sync credit card used limit:', error);
      throw error;
    }
  }

  /**
   * Get all credit cards for a user (via account)
   */
  async getCreditCardsByAccountId(accountId: string): Promise<CreditCard[]> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, [
        Query.equal('account_id', accountId),
        Query.orderDesc('created_at'),
      ]);

      return response.documents.map((doc: any) => this.formatCreditCard(doc));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all credit cards for a user
   * Note: This requires fetching all accounts first, then all cards for those accounts
   */
  async getAllCreditCards(userId: string): Promise<CreditCard[]> {
    try {
      // First, get all accounts for the user
      const accountsResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
        Query.equal('user_id', userId),
      ]);

      if (accountsResponse.documents.length === 0) {
        return [];
      }

      // Get all credit cards for all accounts
      const accountIds = accountsResponse.documents.map((doc: any) => doc.$id);
      const cardsPromises = accountIds.map((accountId: string) => this.getCreditCardsByAccountId(accountId));
      const cardsArrays = await Promise.all(cardsPromises);

      return cardsArrays.flat();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all credit cards with sharing information
   * Returns credit cards with ownership metadata (ownerId, ownerName, isOwn)
   * This method uses DataAccessService to fetch both own and shared credit cards
   */
  async getCreditCardsWithSharing(userId: string) {
    try {
      const { DataAccessService } = await import('./data-access.service');
      const dataAccessService = new DataAccessService();
      return await dataAccessService.getAccessibleCreditCards(userId);
    } catch (error: any) {
      throw new Error(`Failed to fetch credit cards with sharing: ${error.message}`);
    }
  }

  /**
   * Create a new credit card
   * Always assigns credit card to the current user's account
   */
  async createCreditCard(data: {
    account_id: string;
    name: string;
    last_digits: string;
    credit_limit: number;
    used_limit?: number;
    closing_day: number;
    due_day: number;
    brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
    network?: string;
    color?: string;
  }): Promise<CreditCard> {
    try {
      const now = new Date().toISOString();
      const { ID } = await import('node-appwrite');

      // Note: Credit card is always created for the account specified in account_id
      // The account ownership validation should be done at the API layer

      const payload: any = {
        account_id: data.account_id,
        name: data.name,
        last_digits: data.last_digits,
        credit_limit: data.credit_limit,
        used_limit: data.used_limit || 0,
        closing_day: data.closing_day,
        due_day: data.due_day,
        brand: data.brand,
        network: data.network,
        color: data.color,
        created_at: now,
        updated_at: now,
      };

      const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, ID.unique(), payload);

      return this.formatCreditCard(document);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a credit card
   * Validates that the credit card belongs to the user's account before allowing updates
   * Prevents modification of shared credit cards
   */
  async updateCreditCard(
    creditCardId: string,
    data: {
      name?: string;
      last_digits?: string;
      credit_limit?: number;
      used_limit?: number;
      closing_day?: number;
      due_day?: number;
      brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
      network?: string;
      color?: string;
    },
    userId?: string,
  ): Promise<CreditCard> {
    try {
      const now = new Date().toISOString();

      // Get existing card to merge data
      const existing = await this.getCreditCardById(creditCardId);
      if (!existing) {
        throw new Error('Credit card not found');
      }

      // Validate ownership if userId is provided
      if (userId) {
        // Get the account to check ownership
        const account = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, existing.account_id);
        if (account.user_id !== userId) {
          throw new Error('You cannot modify credit cards that belong to another user');
        }
      }

      const updatePayload: any = {
        updated_at: now,
      };

      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.last_digits !== undefined) updatePayload.last_digits = data.last_digits;
      if (data.credit_limit !== undefined) updatePayload.credit_limit = data.credit_limit;
      if (data.used_limit !== undefined) updatePayload.used_limit = data.used_limit;
      if (data.closing_day !== undefined) updatePayload.closing_day = data.closing_day;
      if (data.due_day !== undefined) updatePayload.due_day = data.due_day;
      if (data.brand !== undefined) updatePayload.brand = data.brand;
      if (data.network !== undefined) updatePayload.network = data.network;
      if (data.color !== undefined) updatePayload.color = data.color;

      const document = await this.dbAdapter.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CREDIT_CARDS,
        creditCardId,
        updatePayload,
      );

      return this.formatCreditCard(document);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a credit card
   * Validates that the credit card belongs to the user's account before allowing deletion
   * Prevents deletion of shared credit cards
   */
  async deleteCreditCard(creditCardId: string, userId?: string): Promise<void> {
    try {
      // Validate ownership if userId is provided
      if (userId) {
        const existing = await this.getCreditCardById(creditCardId);
        if (!existing) {
          throw new Error('Credit card not found');
        }

        // Get the account to check ownership
        const account = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, existing.account_id);
        if (account.user_id !== userId) {
          throw new Error('You cannot delete credit cards that belong to another user');
        }
      }

      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, creditCardId);
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error('Credit card not found');
      }
      throw error;
    }
  }

  /**
   * Format credit card document
   */
  private formatCreditCard(document: any): CreditCard {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      account_id: document.account_id,
      name: document.name,
      last_digits: document.last_digits,
      credit_limit: document.credit_limit,
      used_limit: document.used_limit,
      closing_day: document.closing_day,
      due_day: document.due_day,
      data: document.data,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
