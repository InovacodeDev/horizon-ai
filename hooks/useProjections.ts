import { getNextMonthProjections } from '@/actions/projection.actions';
import { useCallback, useEffect, useState } from 'react';

interface ProjectedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  isRecurring: boolean;
}

export function useProjections() {
  const [projectedTransactions, setProjectedTransactions] = useState<ProjectedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getNextMonthProjections();

      if (result.success) {
        setProjectedTransactions(result.projectedTransactions);
      } else {
        setError(result.error || 'Failed to load projections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  return {
    projectedTransactions,
    loading,
    error,
    refetch: fetchProjections,
  };
}
