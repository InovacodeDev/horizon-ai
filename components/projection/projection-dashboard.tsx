'use client';

import { BurnRateChart } from '@/components/projection/burn-rate-chart';
import { ForecastList } from '@/components/projection/forecast-list';
import { Card } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { useProjection } from '@/hooks/use-projection';
import { cn } from '@/lib/utils';
import { addMonths, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export function FinancialProjectionDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { data, chartData, isLoading } = useProjection(selectedMonth);

  const handlePrevMonth = () => setSelectedMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isSafe = data.safeToSpend >= 0;

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Financial Horizon
        </h1>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <span className="min-w-[140px] text-center font-medium capitalize text-slate-900 dark:text-slate-100">
            {monthLabel}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Hero: Safe-to-Spend Indicator */}
      <Card className={cn(
        "p-6 border-l-4 shadow-sm transition-all",
        isSafe 
          ? "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10" 
          : "border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10"
      )}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Safe to Spend
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={cn(
                "text-4xl font-bold tracking-tight",
                isSafe ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {formatCurrency(data.safeToSpend)}
              </span>
              <span className="text-sm font-medium text-slate-500">
                remaining
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
              {isSafe ? (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  You are within your budget.
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  You are over budget by {formatCurrency(Math.abs(data.safeToSpend))}.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="text-slate-500">Total Income</div>
            <div className="text-right font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(data.totalIncome)}
            </div>
            
            <div className="text-slate-500">Committed</div>
            <div className="text-right font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(data.committedExpenses)}
            </div>

            <div className="text-slate-500">Variable</div>
            <div className="text-right font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(data.variableExpenses)}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Burn Rate Chart */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Burn Rate Projection
              </h3>
              <p className="text-sm text-slate-500">
                Realized vs. Committed expenses for the next 3 months
              </p>
            </div>
            <BurnRateChart data={chartData} />
          </Card>
        </div>

        {/* Forecast List */}
        <div className="lg:col-span-1">
          <Card className="p-6 h-full overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              <ForecastList items={data.items} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
