/**
 * Credit Card Types
 * Sistema de gerenciamento de faturas e parcelamentos
 */

export interface CreditCardBill {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  credit_card_id: string;
  user_id: string;
  due_date: string;
  closing_date: string;
  total_amount: number;
  paid_amount: number;
  status: 'open' | 'closed' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface InstallmentPlan {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  transaction_id: string;
  credit_card_id: string;
  user_id: string;
  total_amount: number;
  installments: number;
  current_installment: number;
  installment_amount: number;
  first_installment_amount: number;
  start_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreditCardTransaction {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  credit_card_id: string;
  amount: number;
  date: string; // Bill due date
  purchase_date: string; // Original purchase date
  category?: string;
  description?: string;
  merchant?: string;
  installment?: number; // Current installment (1, 2, 3...)
  installments?: number; // Total installments (12 for 12x)
  is_recurring?: boolean; // Is this a recurring subscription?
  status: 'pending' | 'completed' | 'cancelled';
  sync_status: 'pending' | 'synced'; // Bill synchronization status
  created_at: string;
  updated_at: string;
}

export interface CreateInstallmentDto {
  transaction_id: string;
  credit_card_id: string;
  total_amount: number;
  installments: number;
  description: string;
  purchase_date: string;
}

export interface CreditCardSettings {
  closing_day: number;
  due_day: number;
  limit: number;
}

export const calculateInstallmentAmounts = (totalAmount: number, installments: number) => {
  const baseAmount = Math.floor((totalAmount * 100) / installments) / 100;
  const remainder = Math.round((totalAmount - baseAmount * installments) * 100) / 100;

  return {
    firstInstallmentAmount: baseAmount + remainder,
    regularInstallmentAmount: baseAmount,
  };
};

export const getNextClosingDate = (closingDay: number, referenceDate: Date = new Date()): Date => {
  const nextClosing = new Date(referenceDate);
  nextClosing.setDate(closingDay);

  if (referenceDate.getDate() > closingDay) {
    nextClosing.setMonth(nextClosing.getMonth() + 1);
  }

  return nextClosing;
};

export const getNextDueDate = (dueDay: number, closingDate: Date): Date => {
  const dueDate = new Date(closingDate);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(dueDay);
  return dueDate;
};

export const shouldGoToNextBill = (purchaseDate: Date, closingDate: Date): boolean => {
  return purchaseDate > closingDate;
};
