import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, CreditCard, CreditCardData, DATABASE_ID } from '@/lib/appwrite/schema';
import { ID, Query } from 'node-appwrite';

/**
 * Credit Card Service
 * Handles credit card CRUD operations
 */

export interface CreateCreditCardData {
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
}

export interface UpdateCreditCardData {
  name?: string;
  credit_limit?: number;
  used_limit?: number;
  closing_day?: number;
  due_day?: number;
  brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
  network?: string;
  color?: string;
}

export class CreditCardService {
  private dbAdapter: any;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  /**
   * Create a new credit card for an account
   */
  async createCreditCard(data: CreateCreditCardData): Promise<CreditCard> {
    try {
      const cardData: CreditCardData = {
        brand: data.brand,
        network: data.network,
        color: data.color,
      };

      const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, ID.unique(), {
        account_id: data.account_id,
        name: data.name,
        last_digits: data.last_digits,
        credit_limit: data.credit_limit,
        used_limit: data.used_limit || 0,
        closing_day: data.closing_day,
        due_day: data.due_day,
        data: JSON.stringify(cardData),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return this.deserializeCreditCard(document);
    } catch (error: any) {
      throw new Error(`Failed to create credit card: ${error.message}`);
    }
  }

  /**
   * Get all credit cards for a user
   */
  async getAllCreditCards(userId: string): Promise<CreditCard[]> {
    try {
      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, [
        Query.orderDesc('created_at'),
      ]);

      const documents = result.documents || [];
      return documents.map((doc: any) => this.deserializeCreditCard(doc));
    } catch (error: any) {
      throw new Error(`Failed to fetch credit cards: ${error.message}`);
    }
  }

  /**
   * Get credit cards by account (alias for getCreditCardsByAccountId)
   */
  async getCreditCardsByAccount(accountId: string): Promise<CreditCard[]> {
    return this.getCreditCardsByAccountId(accountId);
  }

  /**
   * Get all credit cards for an account
   */
  async getCreditCardsByAccountId(accountId: string): Promise<CreditCard[]> {
    try {
      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, [
        Query.equal('account_id', accountId),
        Query.orderDesc('created_at'),
      ]);

      const documents = result.documents || [];
      const creditCards = documents.map((doc: any) => this.deserializeCreditCard(doc));

      // Calculate real used limit based on transactions for each credit card
      for (const card of creditCards) {
        const realUsedLimit = await this.calculateUsedLimit(card.$id, card.account_id);
        card.used_limit = realUsedLimit;
      }

      return creditCards;
    } catch (error: any) {
      throw new Error(`Failed to fetch credit cards: ${error.message}`);
    }
  }

  /**
   * Calculate credit card used limit based on transactions
   */
  async calculateUsedLimit(creditCardId: string, accountId: string): Promise<number> {
    try {
      // Get the account to get user_id
      const accountDoc = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);

      // Get all transactions for this user
      const transactionsResult = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
        Query.equal('user_id', accountDoc.user_id),
        Query.limit(10000), // Get all transactions
      ]);

      let usedLimit = 0;

      for (const transaction of transactionsResult.documents || []) {
        // Parse transaction data to check if it's for this credit card
        let transactionData: any = {};
        if (transaction.data) {
          try {
            transactionData = typeof transaction.data === 'string' ? JSON.parse(transaction.data) : transaction.data;
          } catch {
            transactionData = {};
          }
        }

        // Only include expense transactions for this credit card
        if (transactionData.credit_card_id === creditCardId && transaction.type === 'expense') {
          usedLimit += transaction.amount;
        }
      }

      return usedLimit;
    } catch (error: any) {
      console.error(`Error calculating used limit for credit card ${creditCardId}:`, error);
      // Return the stored used_limit as fallback
      try {
        const cardDoc = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, creditCardId);
        return cardDoc.used_limit || 0;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Get a specific credit card by ID
   */
  async getCreditCardById(creditCardId: string): Promise<CreditCard> {
    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, creditCardId);

      return this.deserializeCreditCard(document);
    } catch (error: any) {
      throw new Error(`Credit card not found`);
    }
  }

  /**
   * Update a credit card
   */
  async updateCreditCard(creditCardId: string, data: UpdateCreditCardData): Promise<CreditCard> {
    try {
      // First verify the credit card exists
      const existingCard = await this.getCreditCardById(creditCardId);

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.credit_limit !== undefined) {
        updateData.credit_limit = data.credit_limit;
      }

      if (data.used_limit !== undefined) {
        updateData.used_limit = data.used_limit;
      }

      if (data.closing_day !== undefined) {
        updateData.closing_day = data.closing_day;
      }

      if (data.due_day !== undefined) {
        updateData.due_day = data.due_day;
      }

      // Update data JSON field if any data fields changed
      if (data.brand !== undefined || data.network !== undefined || data.color !== undefined) {
        const currentData = existingCard.data
          ? typeof existingCard.data === 'string'
            ? JSON.parse(existingCard.data)
            : existingCard.data
          : {};

        const newData: CreditCardData = {
          ...currentData,
          ...(data.brand && { brand: data.brand }),
          ...(data.network && { network: data.network }),
          ...(data.color && { color: data.color }),
        };
        updateData.data = JSON.stringify(newData);
      }

      const document = await this.dbAdapter.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CREDIT_CARDS,
        creditCardId,
        updateData,
      );

      return this.deserializeCreditCard(document);
    } catch (error: any) {
      throw new Error(`Failed to update credit card: ${error.message}`);
    }
  }

  /**
   * Delete a credit card
   */
  async deleteCreditCard(creditCardId: string): Promise<void> {
    try {
      // First verify the credit card exists
      await this.getCreditCardById(creditCardId);

      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, creditCardId);
    } catch (error: any) {
      throw new Error(`Failed to delete credit card: ${error.message}`);
    }
  }

  /**
   * Update credit card used limit (used by transactions)
   */
  async updateUsedLimit(creditCardId: string, newUsedLimit: number): Promise<CreditCard> {
    try {
      const document = await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.CREDIT_CARDS, creditCardId, {
        used_limit: newUsedLimit,
        updated_at: new Date().toISOString(),
      });

      return this.deserializeCreditCard(document);
    } catch (error: any) {
      throw new Error(`Failed to update used limit: ${error.message}`);
    }
  }

  /**
   * Deserialize Appwrite document to CreditCard type
   */
  private deserializeCreditCard(document: any): CreditCard {
    let data: CreditCardData | undefined;

    if (document.data) {
      try {
        data = typeof document.data === 'string' ? JSON.parse(document.data) : document.data;
      } catch {
        data = undefined;
      }
    }

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
      data: data ? JSON.stringify(data) : undefined,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
