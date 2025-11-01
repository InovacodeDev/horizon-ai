/**
 * Custom React Hooks with React 19.2 Features
 *
 * All hooks are marked as 'use client' and leverage:
 * - useOptimistic for instant UI updates
 * - useTransition for non-blocking state updates
 * - useFormStatus for form submission states
 */

export { useAccounts } from './useAccounts';
export { useCreditCards } from './useCreditCards';
export { useCreditCardBills } from './useCreditCardBills';
export { useTransactions } from './useTransactions';
export { useFinancialInsights } from './useFinancialInsights';
export { useTotalBalance } from './useTotalBalance';
export { useFormSubmit, SubmitButton } from './useFormSubmit';

// Re-export types for convenience
export type {
  CreateAccountDto,
  UpdateAccountDto,
  CreateCreditCardDto,
  UpdateCreditCardDto,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '@/lib/types';
