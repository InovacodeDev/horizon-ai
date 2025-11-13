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

      const params = new URLSearchParams();
      if (options.creditCardId) params.append('creditCardId', options.creditCardId);
      if (options.status) params.append('status', options.status);
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const response = await fetch(`/api/credit-cards/bills?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch credit card bills');
      }

      const data = await response.json();
      setBills(data.bills || []);
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
