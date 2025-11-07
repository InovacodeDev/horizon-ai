import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { Account, AccountData, COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { ID, Query } from 'node-appwrite';

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
  private dbAdapter: any;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  /**
   * Create a new account for a user
   */
  async createAccount(userId: string, data: CreateAccountData): Promise<Account> {
    try {
      const accountData: AccountData = {
        status: data.status || 'Manual',
        bank_id: data.bank_id,
        last_digits: data.last_digits,
        integration_id: data.integration_id,
        integration_data: data.integration_data,
      };

      const { dateToUserTimezone } = await import('@/lib/utils/timezone');
      const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

      const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, ID.unique(), {
        user_id: userId,
        name: data.name,
        account_type: data.account_type,
        balance: 0, // Balance sempre começa em 0 e é calculado pelas transações
        is_manual: data.is_manual ?? true,
        data: JSON.stringify(accountData),
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
   */
  async getAccountsByUserId(userId: string): Promise<Account[]> {
    try {
      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
        Query.equal('user_id', userId),
        Query.orderDesc('created_at'),
      ]);

      const documents = result.documents || [];
      const accounts = documents.map((doc: any) => this.deserializeAccount(doc));

      // Balance is now automatically synced via BalanceSyncService
      // No need to recalculate here
      return accounts;
    } catch (error: any) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
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

      // Update data JSON field if any data fields changed
      if (data.bank_id !== undefined || data.last_digits !== undefined || data.status !== undefined) {
        const currentData = existingAccount.data
          ? typeof existingAccount.data === 'string'
            ? JSON.parse(existingAccount.data)
            : existingAccount.data
          : {};

        const newData: AccountData = {
          ...currentData,
          ...(data.bank_id && { bank_id: data.bank_id }),
          ...(data.last_digits && { last_digits: data.last_digits }),
          ...(data.status && { status: data.status }),
        };
        updateData.data = JSON.stringify(newData);
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

      // Create transfer log
      const { COLLECTIONS, DATABASE_ID } = await import('@/lib/appwrite/schema');
      const { dateToUserTimezone } = await import('@/lib/utils/timezone');
      const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

      await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSFER_LOGS, ID.unique(), {
        user_id: userId,
        from_account_id: data.fromAccountId,
        to_account_id: data.toAccountId,
        amount: data.amount,
        description: data.description || `Transferência de ${fromAccount.name} para ${toAccount.name}`,
        status: 'completed',
        created_at: now,
      });

      // Sync balances using BalanceSyncService
      try {
        const { BalanceSyncService } = await import('./balance-sync.service');
        const balanceSyncService = new BalanceSyncService();

        // Sync both accounts
        await balanceSyncService.syncAccountBalance(data.fromAccountId);
        await balanceSyncService.syncAccountBalance(data.toAccountId);
      } catch (syncError: any) {
        console.error('Failed to sync account balances after transfer:', syncError);
        // Don't fail the transfer if balance sync fails
      }
    } catch (error: any) {
      // Log failed transfer
      try {
        const { COLLECTIONS, DATABASE_ID } = await import('@/lib/appwrite/schema');
        const { dateToUserTimezone } = await import('@/lib/utils/timezone');
        const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

        await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.TRANSFER_LOGS, ID.unique(), {
          user_id: userId,
          from_account_id: data.fromAccountId,
          to_account_id: data.toAccountId,
          amount: data.amount,
          description: data.description || 'Transferência',
          status: 'failed',
          created_at: now,
        });
      } catch (logError) {
        console.error('Failed to log transfer error:', logError);
      }

      throw new Error(`Falha ao transferir saldo: ${error.message}`);
    }
  }

  /**
   * Deserialize Appwrite document to Account type
   */
  private deserializeAccount(document: any): Account {
    let data: AccountData | undefined;

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
      user_id: document.user_id,
      name: document.name,
      account_type: document.account_type,
      balance: document.balance,
      is_manual: document.is_manual,
      synced_transaction_ids: document.synced_transaction_ids,
      data: data ? JSON.stringify(data) : undefined,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
