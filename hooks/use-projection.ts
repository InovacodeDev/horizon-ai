import { addMonths, format } from 'date-fns';
import { useEffect, useState } from 'react';

export interface ProjectionItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PROJECTED';
  isRecurring: boolean;
  category: string;
}

export interface ProjectionData {
  month: string; // e.g. "2025-12"
  monthLabel: string; // e.g. "Dec"
  totalIncome: number;
  realizedExpenses: number;
  committedExpenses: number;
  variableExpenses: number;
  safeToSpend: number;
  items: ProjectionItem[];
}

interface UseProjectionResult {
  data: ProjectionData | null; // Selected month data
  chartData: ProjectionData[]; // Current + next 2 months
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProjection(selectedMonth: Date = new Date()): UseProjectionResult {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [chartData, setChartData] = useState<ProjectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjection = async (date: Date): Promise<ProjectionData> => {
    const monthStr = format(date, 'yyyy-MM');
    const response = await fetch(`/api/financials/projection?month=${monthStr}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch projection for ${monthStr}`);
    }

    const result = await response.json();

    // Process transactions to items
    const items: ProjectionItem[] = result.transactions.map((tx: any) => {
      const isVirtual = tx.isVirtual === true;
      const isCompleted = tx.status === 'completed';

      // Determine status
      let status: 'PAID' | 'PROJECTED' = 'PROJECTED';
      if (isCompleted) status = 'PAID';

      // Determine title
      let title = tx.description || tx.merchant || 'Untitled Transaction';
      if (isVirtual) {
        title = tx.description.replace('(Virtual) ', '');
      }

      return {
        id: tx.id || tx.$id,
        title,
        amount: Math.abs(tx.amount),
        date: tx.date,
        status,
        isRecurring: tx.is_recurring || tx.isVirtual || !!tx.recurring_rule_id,
        category: tx.category,
      };
    });

    // Calculate realized expenses from items
    const realizedExpenses = items
      .filter((item) => item.status === 'PAID' && item.category !== 'Income' && item.category !== 'Salary') // Rough check, ideally check transaction type
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      month: monthStr,
      monthLabel: format(date, 'MMM'),
      totalIncome: result.totalIncome,
      realizedExpenses, // This is an approximation based on the items list. The API returns aggregated metrics too.
      // The API's 'committedExpenses' includes both realized recurring and virtuals.
      // The API's 'variableExpenses' includes realized non-recurring.
      // So 'realizedExpenses' should ideally be sum of all realized expenses (committed or variable).
      // Let's rely on the API metrics where possible, but the API didn't explicitly return 'realizedExpenses'.
      // It returned 'committedExpenses' and 'variableExpenses'.
      // Wait, 'committedExpenses' in API = Fixed Costs + Installments.
      // 'variableExpenses' in API = One-off spending.
      // Both can be realized or projected.
      // For the dashboard, "Realized" usually means past/paid.
      // I will calculate realizedExpenses from the transaction list where status is PAID.
      committedExpenses: result.committedExpenses,
      variableExpenses: result.variableExpenses,
      safeToSpend: result.safeToSpend,
      items,
    };
  };

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch selected month
      const mainData = await fetchProjection(selectedMonth);
      setData(mainData);

      // Fetch next 2 months for chart
      // We want [Selected, Selected+1, Selected+2]
      const m1 = addMonths(selectedMonth, 1);
      const m2 = addMonths(selectedMonth, 2);

      const [d1, d2] = await Promise.all([fetchProjection(m1), fetchProjection(m2)]);

      setChartData([mainData, d1, d2]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load projection data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [selectedMonth]); // Re-fetch when selectedMonth changes

  return { data, chartData, isLoading, error, refresh: fetchAll };
}
