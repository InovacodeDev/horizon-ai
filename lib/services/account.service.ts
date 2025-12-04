import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { Account, COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { ID, Query } from 'node-appwrite';

import AppwriteDBAdapter from '../appwrite/adapter';

/**
 * Account Service
 * Handles bank account CRUD operations
 */

export interface CreateAccountData {
  name: string;
  account_type: 'checking' | 'savings' | 'investment' | 'vale' | 'other';
  initial_balance?: number;
  is_manual?: boolean;
  bank_id?: string;
  last_digits?: string;
  status?: 'Connected' | 'Sync Error' | 'Disconnected' | 'Manual';
  integration_id?: string;
  integration_data?: any;
}

export interface UpdateAccountData {
  name?: string;
  account_type?: 'checking' | 'savings' | 'investment' | 'vale' | 'other';
  bank_id?: string;
  last_digits?: string;
  status?: 'Connected' | 'Sync Error' | 'Disconnected' | 'Manual';
}

export class AccountService {
  private dbAdapter: AppwriteDBAdapter;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  /**
   * Create a new account for a user
   */
  async createAccount(userId: string, data: CreateAccountData): Promise<Account> {
    try {
      const { dateToUserTimezone } = await import('@/lib/utils/timezone');
      const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

      const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, ID.unique(), {
        user_id: userId,
        name: data.name,
        account_type: data.account_type,
        balance: 0,
        is_manual: data.is_manual ?? true,
        bank_id: data.bank_id,
        last_digits: data.last_digits,
        status: data.status || 'Manual',
        created_at: now,
        updated_at: now,
      });

      const account = this.deserializeAccount(document);

      if (data.initial_balance && data.initial_balance > 0) {
        try {
          const { TransactionService } = await import('./transaction.service');
          const transactionService = new TransactionService();
          await transactionService.createManualTransaction({
            userId: userId,
            amount: data.initial_balance,
            type: 'income',
            category: 'balance',
            description: `Saldo inicial da conta ${data.name}`,
            date: now,
            currency: 'BRL',
            accountId: account.$id,
            status: 'pending',
          });
        } catch (error: any) {
          console.error('Failed to create initial balance transaction:', error);
        }
      }

      return account;
    } catch (error: any) {
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Get all accounts for a user
   * @param userId - User ID to fetch accounts for
   * @param includeShared - Whether to include shared accounts from linked users (default: false)
   */
  async getAccountsByUserId(userId: string, includeShared: boolean = false): Promise<Account[]> {
    try {
      if (!includeShared) {
        const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
          Query.equal('user_id', userId),
          Query.orderDesc('created_at'),
        ]);

        const documents = result.documents || [];
        const accounts = documents.map((doc: any) => this.deserializeAccount(doc));

        return accounts;
      }

      const { DataAccessService } = await import('./data-access.service');
      const dataAccessService = new DataAccessService();
      const accountsWithOwnership = await dataAccessService.getAccessibleAccounts(userId);

      return accountsWithOwnership.map((account) => {
        const { ownerId, ownerName, isOwn, ...plainAccount } = account;
        return plainAccount;
      });
    } catch (error: any) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  /**
   * Get all accounts with sharing information
   * Returns accounts with ownership metadata (ownerId, ownerName, isOwn)
   * This method uses DataAccessService to fetch both own and shared accounts
   */
  async getAccountsWithSharing(userId: string) {
    try {
      const { DataAccessService } = await import('./data-access.service');
      const dataAccessService = new DataAccessService();
      return await dataAccessService.getAccessibleAccounts(userId);
    } catch (error: any) {
      throw new Error(`Failed to fetch accounts with sharing: ${error.message}`);
    }
  }

  /**
   * Get a specific account by ID
   */
  async getAccountById(accountId: string, userId: string): Promise<Account> {
    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);

      if (document?.user_id !== userId) {
        throw new Error(`Account not found`);
      }

      return this.deserializeAccount(document);
    } catch (error: any) {
      throw new Error(`Failed to fetch account: ${error.message}`);
    }
  }

  /**
   * Update an account
   */
  async updateAccount(accountId: string, userId: string, data: UpdateAccountData): Promise<Account> {
    try {
      const existingAccount = await this.getAccountById(accountId, userId);

      const { dateToUserTimezone } = await import('@/lib/utils/timezone');
      const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

      const updateData: Record<string, any> = {
        updated_at: now,
      };

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.account_type !== undefined) {
        updateData.account_type = data.account_type;
      }

      if (data.bank_id !== undefined) {
        updateData.bank_id = data.bank_id;
      }

      if (data.last_digits !== undefined) {
        updateData.last_digits = data.last_digits;
      }

      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      const document = await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId, updateData);

      return this.deserializeAccount(document);
    } catch (error: any) {
      throw new Error(`Failed to update account: ${error.message}`);
    }
  }

  /**
   * Delete an account
   */
  async deleteAccount(accountId: string, userId: string): Promise<void> {
    try {
      await this.getAccountById(accountId, userId);

      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);
    } catch (error: any) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  /**
   * Get account balance
   * Balance is automatically synced by Appwrite Function when transactions change
   */
  async getAccountBalance(accountId: string): Promise<number> {
    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);
      return document?.balance;
    } catch (error: any) {
      throw new Error(`Account not found`);
    }
  }

  /**
   * Manually trigger balance sync for an account
   *
   * @deprecated This method is deprecated as of the serverless architecture refactor.
   * Balance synchronization is now handled automatically by the Appwrite Balance Sync Function.
   *
   * The Balance Sync Function:
   * - Automatically recalculates balances when transactions change (via event triggers)
   * - Runs daily at 20:00 to process due transactions (via schedule trigger)
   *
   * For emergency manual recalculation:
   * 1. Go to Appwrite Console
   * 2. Navigate to Functions > balance-sync
   * 3. Click "Execute" with payload: { "accountId": "your-account-id" }
   *
   * @param accountId - The account ID to sync
   * @returns Promise with the current balance (fetched from database, not recalculated)
   */
  async syncAccountBalance(accountId: string): Promise<number> {
    console.warn(
      '[DEPRECATED] AccountService.syncAccountBalance() is deprecated. ' +
        'Balance sync is now automatic via Appwrite Functions.',
    );

    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);
      return document?.balance;
    } catch (error: any) {
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Transfer balance between accounts
   */
  async transferBalance(
    userId: string,
    data: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description?: string;
    },
  ): Promise<void> {
    try {
      const fromAccount = await this.getAccountById(data.fromAccountId, userId);
      const toAccount = await this.getAccountById(data.toAccountId, userId);

      if (fromAccount.balance < data.amount) {
        throw new Error('Saldo insuficiente na conta de origem');
      }

      const now = new Date().toISOString();

      await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
        user_id: userId,
        account_id: data.fromAccountId,
        amount: data.amount,
        direction: 'out',
        type: 'transfer',
        date: now,
        status: 'pending',
        description: data.description || `Transferência para ${toAccount.name}`,
        created_at: now,
        updated_at: now,
      });

      await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
        user_id: userId,
        account_id: data.toAccountId,
        amount: data.amount,
        direction: 'in',
        type: 'transfer',
        date: now,
        status: 'pending',
        description: data.description || `Transferência de ${fromAccount.name}`,
        created_at: now,
        updated_at: now,
      });

      console.log('Transfer transactions created');

      console.log('Transfer completed - balances will be updated automatically by Appwrite Function');
    } catch (error: any) {
      console.error('Transfer balance error:', error);
      throw new Error(`Falha ao transferir saldo: ${error.message}`);
    }
  }

  /**
   * Deserialize Appwrite document to Account type
   */
  private deserializeAccount(document: any): Account {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      user_id: document.user_id,
      name: document.name,
      account_type: document.account_type,
      balance: document.balance,
      is_manual: document.is_manual,
      synced_transaction_ids: document.synced_transaction_ids,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
