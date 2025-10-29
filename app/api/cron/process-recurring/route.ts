import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { TransactionService } from '@/lib/services/transaction.service';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

/**
 * GET /api/cron/process-recurring
 * Process recurring subscriptions and create new transactions
 *
 * This endpoint should be called daily by a cron job
 * For security, you should add authentication or use Vercel Cron Jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication for cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const databases = getAppwriteDatabases();
    const transactionService = new TransactionService();

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get all recurring transactions
    const recurringTransactions = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
      Query.equal('is_recurring', true),
      Query.limit(1000),
    ]);

    const processedTransactions = [];
    const errors = [];

    for (const transaction of recurringTransactions.documents) {
      try {
        // Parse recurring pattern
        let recurringPattern;
        try {
          const data = transaction.data ? JSON.parse(transaction.data) : {};
          recurringPattern = data.recurring_pattern;
        } catch {
          continue;
        }

        if (!recurringPattern || recurringPattern.frequency !== 'monthly') {
          continue;
        }

        // Get the day of the month from the original transaction
        const originalDate = new Date(transaction.date);
        const recurringDay = originalDate.getDate();

        // Check if today is the recurring day
        if (currentDay !== recurringDay) {
          continue;
        }

        // Check if we already created a transaction for this month
        const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

        const existingTransactions = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
          Query.equal('user_id', transaction.user_id),
          Query.equal('credit_card_id', transaction.credit_card_id || ''),
          Query.equal('category', transaction.category || ''),
          Query.equal('merchant', transaction.merchant || ''),
          Query.equal('amount', transaction.amount),
          Query.greaterThanEqual('date', startOfMonth),
          Query.lessThanEqual('date', endOfMonth),
          Query.limit(1),
        ]);

        // Skip if transaction already exists for this month
        if (existingTransactions.documents.length > 0) {
          continue;
        }

        // Create new transaction for this month
        const newTransactionDate = new Date(currentYear, currentMonth, recurringDay);

        const newTransaction = await transactionService.createManualTransaction({
          userId: transaction.user_id,
          amount: transaction.amount,
          accountId: transaction.account_id,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          date: newTransactionDate.toISOString(),
          currency: transaction.currency || 'BRL',
          creditCardId: transaction.credit_card_id,
          merchant: transaction.merchant,
          status: 'completed',
          isRecurring: true,
          recurringPattern: recurringPattern,
        });

        processedTransactions.push({
          original_id: transaction.$id,
          new_id: newTransaction.$id,
          amount: transaction.amount,
          date: newTransactionDate.toISOString(),
        });
      } catch (error: any) {
        console.error(`Error processing recurring transaction ${transaction.$id}:`, error);
        errors.push({
          transaction_id: transaction.$id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed_count: processedTransactions.length,
        error_count: errors.length,
        processed_transactions: processedTransactions,
        errors: errors,
        date: today.toISOString(),
        current_day: currentDay,
      },
    });
  } catch (error: any) {
    console.error('GET /api/cron/process-recurring error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process recurring transactions',
      },
      { status: 500 },
    );
  }
}
