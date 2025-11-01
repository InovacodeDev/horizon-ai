'use server';

/**
 * Transaction Server Actions for React 19.2
 * Handles transaction operations
 */
import { requireAuth } from '@/lib/auth/session';
import {
  type CreateTransactionData,
  type TransactionFilter,
  TransactionService,
  type UpdateTransactionData,
} from '@/lib/services/transaction.service';
import { revalidatePath } from 'next/cache';

/**
 * Action state types for useActionState
 */
export interface TransactionActionState {
  success: boolean;
  error?: string;
  transaction?: any;
}

/**
 * Create transaction action
 * Can be used with useActionState hook
 */
export async function createTransactionAction(
  prevState: TransactionActionState | null,
  formData: FormData,
): Promise<TransactionActionState> {
  try {
    // Require authentication
    const user = await requireAuth();

    // Extract form data
    const amount = parseFloat(formData.get('amount') as string);
    const type = formData.get('type') as 'income' | 'expense' | 'transfer' | 'salary';
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const accountId = formData.get('account_id') as string;
    const merchant = formData.get('merchant') as string;
    const taxAmount = formData.get('tax_amount') ? parseFloat(formData.get('tax_amount') as string) : undefined;

    // Validation
    if (!amount || isNaN(amount)) {
      return {
        success: false,
        error: 'Valid amount is required',
      };
    }

    if (!type) {
      return {
        success: false,
        error: 'Transaction type is required',
      };
    }

    if (!category) {
      return {
        success: false,
        error: 'Category is required',
      };
    }

    if (!date) {
      return {
        success: false,
        error: 'Date is required',
      };
    }

    // Validate tax amount for salary transactions
    if (type === 'salary' && taxAmount !== undefined && (isNaN(taxAmount) || taxAmount < 0)) {
      return {
        success: false,
        error: 'Valid tax amount is required for salary transactions',
      };
    }

    // Create transaction data
    const transactionData: CreateTransactionData = {
      userId: user.sub,
      amount: Math.abs(amount),
      type,
      category,
      description: description || undefined,
      date,
      currency: 'BRL',
      accountId: accountId || undefined,
      merchant: merchant || undefined,
      status: 'completed',
      taxAmount: taxAmount !== undefined ? Math.abs(taxAmount) : undefined,
    };

    // Create transaction
    const transactionService = new TransactionService();
    const transaction = await transactionService.createManualTransaction(transactionData);

    // Revalidate paths that display transactions
    revalidatePath('/transactions');
    revalidatePath('/overview');
    revalidatePath('/accounts');

    return {
      success: true,
      transaction: {
        id: transaction.$id,
        amount: transaction.amount,
        type: transaction.type,
        category,
        description,
        date: transaction.date,
      },
    };
  } catch (error) {
    console.error('Create transaction action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    };
  }
}

/**
 * Update transaction action
 * Can be used with useActionState hook
 */
export async function updateTransactionAction(
  transactionId: string,
  prevState: TransactionActionState | null,
  formData: FormData,
): Promise<TransactionActionState> {
  try {
    // Require authentication
    await requireAuth();

    // Extract form data
    const amount = formData.get('amount') as string;
    const type = formData.get('type') as 'income' | 'expense' | 'transfer' | 'salary';
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const accountId = formData.get('account_id') as string;
    const merchant = formData.get('merchant') as string;
    const taxAmount = formData.get('tax_amount') ? parseFloat(formData.get('tax_amount') as string) : undefined;

    // Build update data
    const updateData: UpdateTransactionData = {};

    if (amount) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount)) {
        updateData.amount = Math.abs(parsedAmount);
      }
    }

    if (type) updateData.type = type;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (date) updateData.date = date;
    if (accountId) updateData.accountId = accountId;
    if (merchant) updateData.merchant = merchant;
    if (taxAmount !== undefined && !isNaN(taxAmount)) {
      updateData.taxAmount = Math.abs(taxAmount);
    }

    // Update transaction
    const transactionService = new TransactionService();
    const transaction = await transactionService.updateTransaction(transactionId, updateData);

    // Revalidate paths that display transactions
    revalidatePath('/transactions');
    revalidatePath('/overview');
    revalidatePath('/accounts');

    return {
      success: true,
      transaction: {
        id: transaction.$id,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
      },
    };
  } catch (error) {
    console.error('Update transaction action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update transaction',
    };
  }
}

/**
 * Delete transaction action
 */
export async function deleteTransactionAction(transactionId: string): Promise<TransactionActionState> {
  try {
    // Require authentication
    await requireAuth();

    // Delete transaction
    const transactionService = new TransactionService();
    await transactionService.deleteTransaction(transactionId);

    // Revalidate paths that display transactions
    revalidatePath('/transactions');
    revalidatePath('/overview');
    revalidatePath('/accounts');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete transaction action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete transaction',
    };
  }
}

/**
 * Get transactions action - for use with React 19.2 'use' hook
 * Returns a promise that can be consumed by the 'use' hook
 */
export async function getTransactionsAction(filters?: Partial<TransactionFilter>) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Build filter
    const filter: TransactionFilter = {
      userId: user.sub,
      ...filters,
    };

    // Get transactions
    const transactionService = new TransactionService();
    const result = await transactionService.listTransactions(filter);

    return {
      transactions: result.transactions.map((transaction) => {
        // Parse data field
        let data: any = {};
        if (transaction.data) {
          try {
            data = typeof transaction.data === 'string' ? JSON.parse(transaction.data) : transaction.data;
          } catch {
            data = {};
          }
        }

        return {
          id: transaction.$id,
          amount: transaction.amount,
          type: transaction.type,
          date: transaction.date,
          status: transaction.status,
          category: data.category,
          description: data.description,
          currency: data.currency,
          accountId: data.account_id,
          merchant: data.merchant,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
        };
      }),
      total: result.total,
    };
  } catch (error) {
    console.error('Get transactions action error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch transactions');
  }
}

/**
 * Get transaction by ID action
 */
export async function getTransactionByIdAction(transactionId: string) {
  try {
    // Require authentication
    await requireAuth();

    // Get transaction
    const transactionService = new TransactionService();
    const transaction = await transactionService.getTransactionById(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Parse data field
    let data: any = {};
    if (transaction.data) {
      try {
        data = typeof transaction.data === 'string' ? JSON.parse(transaction.data) : transaction.data;
      } catch {
        data = {};
      }
    }

    return {
      id: transaction.$id,
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date,
      status: transaction.status,
      category: data.category,
      description: data.description,
      currency: data.currency,
      accountId: data.account_id,
      merchant: data.merchant,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
    };
  } catch (error) {
    console.error('Get transaction action error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch transaction');
  }
}

/**
 * Get transaction statistics action
 */
export async function getTransactionStatsAction(startDate?: string, endDate?: string) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Get stats
    const transactionService = new TransactionService();
    const stats = await transactionService.getTransactionStats(user.sub, startDate, endDate);

    return stats;
  } catch (error) {
    console.error('Get transaction stats action error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch transaction statistics');
  }
}
