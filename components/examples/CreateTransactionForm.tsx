'use client';

/**
 * Create Transaction Form using React 19.2 features
 * Combines useActionState, useFormStatus, and useOptimistic
 */

import { createTransactionAction, type TransactionActionState } from '@/actions/transaction.actions';
import { useActionState, useOptimistic, useState } from 'react';
import { useFormStatus } from 'react-dom';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'salary';
  category: string;
  description?: string;
  date: string;
  taxAmount?: number;
  isPending?: boolean;
}

interface CreateTransactionFormProps {
  onTransactionCreated?: (transaction: Transaction) => void;
}

/**
 * Submit button with loading state from useFormStatus
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Creating...
        </span>
      ) : (
        'Create Transaction'
      )}
    </button>
  );
}

/**
 * Recent transactions list with optimistic updates
 */
function RecentTransactionsList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No recent transactions</p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.slice(0, 5).map((transaction) => (
        <div
          key={transaction.id}
          className={`p-3 border rounded-md flex justify-between items-center ${
            transaction.isPending ? 'opacity-50 bg-gray-50' : 'bg-white'
          }`}
        >
          <div>
            <p className="font-medium text-sm">
              {transaction.category}
              {transaction.isPending && (
                <span className="ml-2 text-xs text-gray-500">(Saving...)</span>
              )}
            </p>
            {transaction.description && (
              <p className="text-xs text-gray-600">{transaction.description}</p>
            )}
            <p className="text-xs text-gray-400">
              {new Date(transaction.date).toLocaleDateString()}
            </p>
          </div>
          <p
            className={`font-bold ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Main form component with all React 19.2 features
 */
export function CreateTransactionForm({ onTransactionCreated }: CreateTransactionFormProps) {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // useOptimistic for instant UI feedback
  const [optimisticTransactions, addOptimisticTransaction] = useOptimistic(
    recentTransactions,
    (state, newTransaction: Transaction) => {
      return [{ ...newTransaction, isPending: true }, ...state];
    },
  );

  // useActionState for form state management
  const [state, formAction, isPending] = useActionState<TransactionActionState, FormData>(
    async (prevState, formData) => {
      // Create optimistic transaction
      const amount = parseFloat(formData.get('amount') as string);
      const type = formData.get('type') as 'income' | 'expense' | 'transfer' | 'salary';
      const category = formData.get('category') as string;
      const description = formData.get('description') as string;
      const date = formData.get('date') as string;
      const taxAmount = formData.get('tax_amount') ? parseFloat(formData.get('tax_amount') as string) : undefined;

      const optimisticTransaction: Transaction = {
        id: `temp-${Date.now()}`,
        amount,
        type,
        category,
        description,
        date,
        taxAmount,
        isPending: true,
      };

      // Add optimistically
      addOptimisticTransaction(optimisticTransaction);

      // Call the actual server action
      const result = await createTransactionAction(prevState, formData);

      if (result.success && result.transaction) {
        // Update with real transaction
        setRecentTransactions((prev) => [
          {
            id: result.transaction.id,
            amount: result.transaction.amount,
            type: result.transaction.type,
            category: result.transaction.category,
            description: result.transaction.description,
            date: result.transaction.date,
          },
          ...prev,
        ]);

        // Callback
        if (onTransactionCreated) {
          onTransactionCreated(result.transaction);
        }
      }

      return result;
    },
    { success: false },
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create Transaction</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form action={formAction} className="space-y-4">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                name="type"
                required
                onChange={(e) => {
                  const taxField = document.getElementById('tax_amount_field');
                  if (taxField) {
                    taxField.style.display = e.target.value === 'salary' ? 'block' : 'none';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
                <option value="salary">Salary</option>
              </select>
            </div>

            {/* Tax Amount (only for salary) */}
            <div id="tax_amount_field" style={{ display: 'none' }}>
              <label htmlFor="tax_amount" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Amount (Withheld)
              </label>
              <input
                type="number"
                id="tax_amount"
                name="tax_amount"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tax withheld at source. An expense transaction will be created automatically.
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                id="category"
                name="category"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Groceries, Salary"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional details..."
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error message */}
            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            {/* Success message */}
            {state?.success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">Transaction created successfully!</p>
              </div>
            )}

            {/* Submit button */}
            <SubmitButton />
          </form>
        </div>

        {/* Recent transactions with optimistic updates */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <RecentTransactionsList transactions={optimisticTransactions} />

          {isPending && (
            <p className="text-sm text-gray-500 text-center mt-4">Processing...</p>
          )}
        </div>
      </div>

      {/* Feature explanation */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">React 19.2 Features Used:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>useActionState:</strong> Manages form state and server action execution</li>
          <li>• <strong>useFormStatus:</strong> Provides loading state in the submit button</li>
          <li>• <strong>useOptimistic:</strong> Shows instant feedback before server confirmation</li>
          <li>• <strong>Server Actions:</strong> Direct form submission to server without API routes</li>
        </ul>
      </div>
    </div>
  );
}
