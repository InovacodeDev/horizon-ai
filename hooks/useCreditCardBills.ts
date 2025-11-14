'use client';

import { CreditCardBill } from '@/lib/types/credit-card.types';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseCreditCardBillsOptions {
  creditCardId?: string;
  status?: 'open' | 'closed' | 'paid' | 'overdue';
  startDate?: string;
  endDate?: string;
  enableRealtime?: boolean;
}

/**
 * Hook para buscar faturas de cartão de crédito com Realtime
 */
export function useCreditCardBills(options: UseCreditCardBillsOptions = {}) {
  const { enableRealtime = true } = options;
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch directly from Appwrite using the browser client
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

      if (!databaseId) {
        throw new Error('Database ID not configured');
      }

      // Build queries
      const queries = [];
      if (options.creditCardId) queries.push(Query.equal('credit_card_id', options.creditCardId));
      if (options.status) queries.push(Query.equal('status', options.status));
      if (options.startDate) queries.push(Query.greaterThanEqual('due_date', options.startDate));
      if (options.endDate) queries.push(Query.lessThanEqual('due_date', options.endDate));

      // Default ordering by due date descending
      queries.push(Query.orderDesc('due_date'));

      const result = await databases.listDocuments(databaseId, 'credit_card_bills', queries);

      const billsData = result.documents as unknown as CreditCardBill[];
      setBills(billsData);
      setInitialized(true);
    } catch (err) {
      console.error('Error fetching credit card bills:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBills([]);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [options.creditCardId, options.status, options.startDate, options.endDate]);

  useEffect(() => {
    if (!initialized) {
      fetchBills();
    }
  }, [initialized, fetchBills]);

  // Setup realtime subscription for credit card bills
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.credit_card_bills.documents`],
    enabled: enableRealtime && initialized,
    onCreate: (payload: CreditCardBill) => {
      console.log('📡 Realtime: bill created', payload.$id);
      // Filtrar se necessário baseado nas options
      if (options.creditCardId && payload.credit_card_id !== options.creditCardId) return;
      if (options.status && payload.status !== options.status) return;

      setBills((prev) => {
        if (prev.some((b) => b.$id === payload.$id)) return prev;
        return [payload, ...prev];
      });
    },
    onUpdate: (payload: CreditCardBill) => {
      console.log('📡 Realtime: bill updated', payload.$id);
      setBills((prev) => prev.map((b) => (b.$id === payload.$id ? payload : b)));
    },
    onDelete: (payload: CreditCardBill) => {
      console.log('📡 Realtime: bill deleted', payload.$id);
      setBills((prev) => prev.filter((b) => b.$id !== payload.$id));
    },
  });

  return {
    bills,
    loading,
    error,
    refetch: fetchBills,
  };
}
