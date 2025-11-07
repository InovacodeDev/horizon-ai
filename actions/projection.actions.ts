'use server';

/**
 * Projection Server Actions
 * Handles cash flow projections for the next month
 */
import { requireAuth } from '@/lib/auth/session';
import { TransactionService } from '@/lib/services/transaction.service';

interface ProjectedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  isRecurring: boolean;
}

/**
 * Get projected transactions for the next month
 * Based on recurring transactions and scheduled payments
 */
export async function getNextMonthProjections(): Promise<{
  projectedTransactions: ProjectedTransaction[];
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    const transactionService = new TransactionService();

    // Get date range for next month
    const now = new Date();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    // Get recurring transactions from current and previous months
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const { transactions: recurringTransactions } = await transactionService.listTransactions({
      userId: user.sub,
      startDate: currentMonthStart.toISOString().split('T')[0],
      limit: 1000,
    });

    // Filter only recurring transactions
    const recurring = recurringTransactions.filter((tx) => tx.is_recurring);

    // Project recurring transactions to next month
    const projectedTransactions: ProjectedTransaction[] = [];

    for (const tx of recurring) {
      // Parse transaction data
      let txData: any = {};
      if (tx.data) {
        try {
          txData = typeof tx.data === 'string' ? JSON.parse(tx.data) : tx.data;
        } catch {
          txData = {};
        }
      }

      const recurringPattern = txData.recurring_pattern;

      if (!recurringPattern) continue;

      // Calculate next occurrence based on frequency
      const originalDate = new Date(tx.date);
      let projectedDate = new Date(originalDate);

      switch (recurringPattern.frequency) {
        case 'monthly':
          // Project to same day next month
          projectedDate = new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), originalDate.getDate());
          break;

        case 'weekly':
          // Project weekly occurrences in next month
          const dayOfWeek = originalDate.getDay();
          let currentDate = new Date(nextMonthStart);

          while (currentDate <= nextMonthEnd) {
            if (currentDate.getDay() === dayOfWeek && currentDate >= nextMonthStart) {
              projectedTransactions.push({
                description: tx.description || txData.description || 'Transação Recorrente',
                amount: tx.amount,
                type: tx.type as 'income' | 'expense',
                date: currentDate.toISOString(),
                category: tx.category || txData.category || 'Outros',
                isRecurring: true,
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
          continue;

        case 'yearly':
          // Only project if anniversary falls in next month
          if (
            originalDate.getMonth() === nextMonthStart.getMonth() &&
            originalDate.getDate() <= nextMonthEnd.getDate()
          ) {
            projectedDate = new Date(nextMonthStart.getFullYear(), originalDate.getMonth(), originalDate.getDate());
          } else {
            continue;
          }
          break;

        case 'daily':
          // Project daily occurrences (limit to avoid too many)
          const daysInNextMonth = nextMonthEnd.getDate();
          for (let day = 1; day <= daysInNextMonth; day++) {
            projectedTransactions.push({
              description: tx.description || txData.description || 'Transação Recorrente',
              amount: tx.amount,
              type: tx.type as 'income' | 'expense',
              date: new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), day).toISOString(),
              category: tx.category || txData.category || 'Outros',
              isRecurring: true,
            });
          }
          continue;
      }

      // Check if end date has passed
      if (recurringPattern.endDate) {
        const endDate = new Date(recurringPattern.endDate);
        if (projectedDate > endDate) {
          continue;
        }
      }

      // Add projected transaction (for monthly and yearly)
      if (recurringPattern.frequency === 'monthly' || recurringPattern.frequency === 'yearly') {
        projectedTransactions.push({
          description: tx.description || txData.description || 'Transação Recorrente',
          amount: tx.amount,
          type: tx.type as 'income' | 'expense',
          date: projectedDate.toISOString(),
          category: tx.category || txData.category || 'Outros',
          isRecurring: true,
        });
      }
    }

    // Get scheduled transactions (status: pending) for next month
    const { transactions: scheduledTransactions } = await transactionService.listTransactions({
      userId: user.sub,
      status: 'pending',
      startDate: nextMonthStart.toISOString().split('T')[0],
      endDate: nextMonthEnd.toISOString().split('T')[0],
      limit: 1000,
    });

    // Add scheduled transactions to projections
    for (const tx of scheduledTransactions) {
      let txData: any = {};
      if (tx.data) {
        try {
          txData = typeof tx.data === 'string' ? JSON.parse(tx.data) : tx.data;
        } catch {
          txData = {};
        }
      }

      projectedTransactions.push({
        description: tx.description || txData.description || 'Transação Agendada',
        amount: tx.amount,
        type: tx.type as 'income' | 'expense',
        date: tx.date,
        category: tx.category || txData.category || 'Outros',
        isRecurring: false,
      });
    }

    // Sort by date
    projectedTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      projectedTransactions,
      success: true,
    };
  } catch (error) {
    console.error('Get projections error:', error);
    return {
      projectedTransactions: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projections',
    };
  }
}

/**
 * Get projection summary for quick display
 */
export async function getProjectionSummary(): Promise<{
  totalIncome: number;
  totalExpenses: number;
  netProjection: number;
  transactionCount: number;
  success: boolean;
  error?: string;
}> {
  try {
    const { projectedTransactions, success, error } = await getNextMonthProjections();

    if (!success) {
      throw new Error(error || 'Failed to get projections');
    }

    const totalIncome = projectedTransactions
      .filter((tx) => tx.type === 'income' || tx.type === 'salary')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = projectedTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netProjection: totalIncome - totalExpenses,
      transactionCount: projectedTransactions.length,
      success: true,
    };
  } catch (error) {
    console.error('Get projection summary error:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netProjection: 0,
      transactionCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projection summary',
    };
  }
}
