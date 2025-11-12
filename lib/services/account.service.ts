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
        balance: 0, // Balance sempre começa em 0 e é calculado pelas transações
        is_manual: data.is_manual ?? true,
        bank_id: data.bank_id,
        last_digits: data.last_digits,
        status: data.status || 'Manual',
        created_at: now,
        updated_at: now,
      });

      const account = this.deserializeAccount(document);

      // Create initial transaction if there's an initial balance
      // This will automatically sync the balance via BalanceSyncService
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
            status: 'completed',
          });
        } catch (error: any) {
          console.error('Failed to create initial balance transaction:', error);
          // Don't fail the account creation if transaction fails
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
      // If includeShared is false, return only user's own accounts
      if (!includeShared) {
        const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
          Query.equal('user_id', userId),
          Query.orderDesc('created_at'),
        ]);

        const documents = result.documents || [];
        const accounts = documents.map((doc: any) => this.deserializeAccount(doc));

        // Balance is now automatically synced via BalanceSyncService
        // No need to recalculate here
        return accounts;
      }

      // If includeShared is true, use DataAccessService to get all accessible accounts
      const { DataAccessService } = await import('./data-access.service');
      const dataAccessService = new DataAccessService();
      const accountsWithOwnership = await dataAccessService.getAccessibleAccounts(userId);

      // Strip ownership metadata to return plain Account objects
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

      // Verify the account belongs to the user
      if (document.user_id !== userId) {
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
      // First verify the account exists and belongs to the user
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

      // Update individual columns if any data fields changed
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
      // First verify the account exists and belongs to the user
      await this.getAccountById(accountId, userId);

      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);
    } catch (error: any) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  /**
   * Get account balance
   * Balance is automatically synced via BalanceSyncService when transactions change
   */
  async getAccountBalance(accountId: string): Promise<number> {
    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);
      return document.balance;
    } catch (error: any) {
      throw new Error(`Account not found`);
    }
  }

  /**
   * Manually trigger balance sync for an account
   * Useful for debugging or manual corrections
   */
  async syncAccountBalance(accountId: string): Promise<number> {
    try {
      const { BalanceSyncService } = await import('./balance-sync.service');
      const balanceSyncService = new BalanceSyncService();
      return await balanceSyncService.syncAccountBalance(accountId);
    } catch (error: any) {
      throw new Error(`Failed to sync account balance: ${error.message}`);
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
      // Verify both accounts exist and belong to the user
      const fromAccount = await this.getAccountById(data.fromAccountId, userId);
      const toAccount = await this.getAccountById(data.toAccountId, userId);

      // Check if source account has sufficient balance
      if (fromAccount.balance < data.amount) {
        throw new Error('Saldo insuficiente na conta de origem');
      }

      const { dateToUserTimezone } = await import('@/lib/utils/timezone');
      const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

      // Criar duas transações tipo "transfer" (uma para cada conta)
      // Essas transações não aparecem na UI, apenas afetam o saldo

      // Transação de saída (diminui saldo da conta origem)
      await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
        user_id: userId,
        account_id: data.fromAccountId,
        amount: data.amount,
        direction: 'out',
        type: 'transfer',
        date: now,
        status: 'completed',
        description: data.description || `Transferência para ${toAccount.name}`,
        created_at: now,
        updated_at: now,
      });

      // Transação de entrada (aumenta saldo da conta destino)
      await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
        user_id: userId,
        account_id: data.toAccountId,
        amount: data.amount,
        direction: 'in',
        type: 'transfer',
        date: now,
        status: 'completed',
        description: data.description || `Transferência de ${fromAccount.name}`,
        created_at: now,
        updated_at: now,
      });

      console.log('Transfer transactions created');

      // Sync balances using BalanceSyncService
      const { BalanceSyncService } = await import('./balance-sync.service');
      const balanceSyncService = new BalanceSyncService();

      // Sync both accounts - this will recalculate from scratch including the new transfer
      const fromBalance = await balanceSyncService.syncAccountBalance(data.fromAccountId);
      const toBalance = await balanceSyncService.syncAccountBalance(data.toAccountId);

      console.log(`Transfer completed - From account balance: ${fromBalance}, To account balance: ${toBalance}`);
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
