'use server';

/**
 * Account Server Actions for React 19.2
 * Handles bank account operations
 */
import { requireAuth } from '@/lib/auth/session';
import { AccountService, type CreateAccountData, type UpdateAccountData } from '@/lib/services/account.service';
import { revalidatePath } from 'next/cache';

/**
 * Action state types for useActionState
 */
export interface AccountActionState {
  success: boolean;
  error?: string;
  account?: any;
}

/**
 * Create account action
 * Can be used with useActionState hook
 */
export async function createAccountAction(
  prevState: AccountActionState | null,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    // Require authentication
    const user = await requireAuth();

    // Extract form data
    const name = formData.get('name') as string;
    const accountType = formData.get('account_type') as 'checking' | 'savings' | 'investment' | 'vale' | 'other';
    const initialBalance = parseFloat(formData.get('initial_balance') as string) || 0;
    const bankId = formData.get('bank_id') as string;
    const lastDigits = formData.get('last_digits') as string;

    // Validation
    if (!name) {
      return {
        success: false,
        error: 'Account name is required',
      };
    }

    if (!accountType) {
      return {
        success: false,
        error: 'Account type is required',
      };
    }

    // Create account data
    const accountData: CreateAccountData = {
      name,
      account_type: accountType,
      initial_balance: initialBalance,
      is_manual: true,
      bank_id: bankId || undefined,
      last_digits: lastDigits || undefined,
      status: 'Manual',
    };

    // Create account
    const accountService = new AccountService();
    const account = await accountService.createAccount(user.sub, accountData);

    // Revalidate paths that display accounts
    revalidatePath('/accounts');
    revalidatePath('/overview');

    return {
      success: true,
      account: {
        id: account.$id,
        name: account.name,
        type: account.account_type,
        balance: account.balance,
      },
    };
  } catch (error) {
    console.error('Create account action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account',
    };
  }
}

/**
 * Update account action
 * Can be used with useActionState hook
 */
export async function updateAccountAction(
  accountId: string,
  prevState: AccountActionState | null,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    // Require authentication
    const user = await requireAuth();

    // Extract form data
    const name = formData.get('name') as string;
    const accountType = formData.get('account_type') as 'checking' | 'savings' | 'investment' | 'vale' | 'other';
    const bankId = formData.get('bank_id') as string;
    const lastDigits = formData.get('last_digits') as string;

    // Build update data
    const updateData: UpdateAccountData = {};

    if (name) updateData.name = name;
    if (accountType) updateData.account_type = accountType;
    if (bankId) updateData.bank_id = bankId;
    if (lastDigits) updateData.last_digits = lastDigits;

    // Update account
    const accountService = new AccountService();
    const account = await accountService.updateAccount(accountId, user.sub, updateData);

    // Revalidate paths that display accounts
    revalidatePath('/accounts');
    revalidatePath('/overview');

    return {
      success: true,
      account: {
        id: account.$id,
        name: account.name,
        type: account.account_type,
        balance: account.balance,
      },
    };
  } catch (error) {
    console.error('Update account action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account',
    };
  }
}

/**
 * Delete account action
 */
export async function deleteAccountAction(accountId: string): Promise<AccountActionState> {
  try {
    // Require authentication
    const user = await requireAuth();

    // Delete account
    const accountService = new AccountService();
    await accountService.deleteAccount(accountId, user.sub);

    // Revalidate paths that display accounts
    revalidatePath('/accounts');
    revalidatePath('/overview');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete account action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete account',
    };
  }
}

/**
 * Get accounts action - for use with React 19.2 'use' hook
 * Returns a promise that can be consumed by the 'use' hook
 */
export async function getAccountsAction() {
  try {
    // Require authentication
    const user = await requireAuth();

    // Get accounts
    const accountService = new AccountService();
    const accounts = await accountService.getAccountsByUserId(user.sub);

    return accounts.map((account) => ({
      id: account.$id,
      name: account.name,
      type: account.account_type,
      balance: account.balance,
      isManual: account.is_manual,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    }));
  } catch (error) {
    console.error('Get accounts action error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch accounts');
  }
}

/**
 * Get account by ID action
 */
export async function getAccountByIdAction(accountId: string) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Get account
    const accountService = new AccountService();
    const account = await accountService.getAccountById(accountId, user.sub);

    return {
      id: account.$id,
      name: account.name,
      type: account.account_type,
      balance: account.balance,
      isManual: account.is_manual,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };
  } catch (error) {
    console.error('Get account action error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch account');
  }
}

/**
 * Transfer balance between accounts action
 */
export async function transferBalanceAction(
  prevState: AccountActionState | null,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    // Require authentication
    const user = await requireAuth();

    // Extract form data
    const fromAccountId = formData.get('from_account_id') as string;
    const toAccountId = formData.get('to_account_id') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;

    // Validation
    if (!fromAccountId) {
      return {
        success: false,
        error: 'Conta de origem é obrigatória',
      };
    }

    if (!toAccountId) {
      return {
        success: false,
        error: 'Conta de destino é obrigatória',
      };
    }

    if (fromAccountId === toAccountId) {
      return {
        success: false,
        error: 'As contas de origem e destino devem ser diferentes',
      };
    }

    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'Valor da transferência deve ser maior que zero',
      };
    }

    // Perform transfer
    const accountService = new AccountService();
    await accountService.transferBalance(user.sub, {
      fromAccountId,
      toAccountId,
      amount,
      description,
    });

    // Revalidate paths that display accounts
    revalidatePath('/accounts');
    revalidatePath('/overview');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Transfer balance action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao transferir saldo',
    };
  }
}
