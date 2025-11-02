'use client';

/**
 * Transaction List using React 19.2 'use' hook
 * Demonstrates how to consume promises directly in components
 */

import { getTransactionsAction } from '@/actions/transaction.actions';
import { Suspense, use } from 'react';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'salary';
  category: string;
  description?: string;
  date: string;
  merchant?: string;
}

interface TransactionListProps {
  transactionsPromise: Promise<{
    transactions: Transaction[];
    total: number;
  }>;
}

/**
 * Transaction list component that uses the 'use' hook
 * The 'use' hook allows consuming promises directly in render
 */
function TransactionList({ transactionsPromise }: TransactionListProps) {
  // Use the 'use' hook to unwrap the promise
  const { transactions, total } = use(transactionsPromise);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found. Start by adding your first transaction!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">Total: {total} transactions</p>

      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    transaction.type === 'income'
                      ? 'bg-green-100 text-green-800'
                      : transaction.type === 'expense'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {transaction.type}
                </span>
                <span className="text-sm text-gray-600">{transaction.category}</span>
              </div>

              {transaction.description && (
                <p className="text-sm text-gray-700 mb-1">{transaction.description}</p>
              )}

              {transaction.merchant && (
                <p className="text-xs text-gray-500">Merchant: {transaction.merchant}</p>
              )}

              <p className="text-xs text-gray-400 mt-1">
                {new Date(transaction.date).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`text-xl font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for transactions
 */
function TransactionListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 border rounded-lg bg-gray-50 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Main component that wraps TransactionList with Suspense
 * This demonstrates the React 19.2 pattern for async data fetching
 */
export function TransactionListWithUse() {
  // Create the promise - this will be passed to the child component
  // The 'use' hook will handle the async resolution
  const transactionsPromise = getTransactionsAction({
    limit: 50,
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Transactions (using 'use' hook)</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>React 19.2 Feature:</strong> This component uses the new 'use' hook to consume
          promises directly in render. The Suspense boundary handles the loading state automatically.
        </p>
      </div>

      {/* Suspense boundary for loading state */}
      <Suspense fallback={<TransactionListSkeleton />}>
        <TransactionList transactionsPromise={transactionsPromise} />
      </Suspense>
    </div>
  );
}

/**
 * Alternative: Component that creates the promise internally
 * This shows another pattern for using the 'use' hook
 */
export function TransactionListWithUseInternal() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>

      <Suspense fallback={<TransactionListSkeleton />}>
        <TransactionListInner />
      </Suspense>
    </div>
  );
}

function TransactionListInner() {
  // Create and consume the promise in the same component
  const { transactions } = use(
    getTransactionsAction({
      limit: 10,
    }),
  );

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="p-3 border rounded-lg">
          <div className="flex justify-between">
            <span className="font-medium">{transaction.category}</span>
            <span className="font-bold">${transaction.amount.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
