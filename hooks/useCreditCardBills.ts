import { CreditCardBill } from '@/lib/types/credit-card.types';
import { useCallback, useEffect, useState } from 'react';

interface UseCreditCardBillsOptions {
  creditCardId?: string;
  status?: 'open' | 'closed' | 'paid' | 'overdue';
  startDate?: string;
  endDate?: string;
}

/**
 * Hook para buscar faturas de cartão de crédito
 */
export function useCreditCardBills(options: UseCreditCardBillsOptions = {}) {
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error('Error fetching credit card bills:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [options.creditCardId, options.status, options.startDate, options.endDate]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return {
    bills,
    loading,
    error,
    refetch: fetchBills,
  };
}
