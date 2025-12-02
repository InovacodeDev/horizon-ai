'use client';

import { ProjectionItem } from '@/hooks/use-projection';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, DollarSign } from 'lucide-react';

interface ForecastListProps {
  items: ProjectionItem[];
  onConfirmItem?: (id: string) => void;
}

export function ForecastList({ items, onConfirmItem }: ForecastListProps) {
  // Sort items: Projected first (by date), then Paid (by date desc)
  const sortedItems = [...items].sort((a, b) => {
    if (a.status === b.status) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return a.status === 'PROJECTED' ? -1 : 1;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Upcoming Bills & Expenses
      </h3>
      <div className="space-y-2">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No expenses found for this month.
          </div>
        ) : (
          sortedItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-all",
                item.status === 'PAID' 
                  ? "bg-slate-50 border-slate-100 opacity-70 dark:bg-slate-900/50 dark:border-slate-800" 
                  : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm dark:bg-slate-950 dark:border-slate-800"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    item.status === 'PAID'
                      ? "bg-slate-200 text-slate-500 dark:bg-slate-800"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  )}
                >
                  {item.status === 'PAID' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className={cn(
                    "font-medium",
                    item.status === 'PAID' ? "text-slate-500 line-through" : "text-slate-900 dark:text-slate-100"
                  )}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{formatDate(item.date)}</span>
                    <span>•</span>
                    <span className="capitalize">{item.category}</span>
                    {item.isRecurring && (
                      <>
                        <span>•</span>
                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800">Recurring</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  item.status === 'PAID' ? "text-slate-500" : "text-slate-900 dark:text-slate-100"
                )}>
                  {formatCurrency(item.amount)}
                </p>
                {item.status === 'PROJECTED' && onConfirmItem && (
                  <button 
                    onClick={() => onConfirmItem(item.id)}
                    className="text-xs text-blue-600 hover:underline mt-1 font-medium"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
