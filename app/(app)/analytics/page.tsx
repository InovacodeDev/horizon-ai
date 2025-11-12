'use client';

import React, { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionsWithSharing } from '@/hooks/useTransactionsWithSharing';
import { useUser } from '@/lib/contexts/UserContext';
import { getCategoryById } from '@/lib/constants/categories';
import { 
  ArrowDownCircleIcon, 
  ArrowUpCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon 
} from '@/components/assets/Icons';

interface CategorySpending {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  isOwn?: boolean;
  isShared?: boolean;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  ownIncome?: number;
  ownExpenses?: number;
  sharedIncome?: number;
  sharedExpenses?: number;
}

const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthName = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
};

const getLastSixMonths = (): string[] => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(date));
  }
  return months;
};

export default function AnalyticsPage() {
  const { user } = useUser();
  const [showSharedData, setShowSharedData] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'own' | 'shared'>('all');

  // Fetch own transactions
  const { 
    transactions: ownTransactions, 
    loading: loadingOwnTransactions 
  } = useTransactions({ userId: user.$id ?? 'default-user' });

  // Fetch shared transactions
  const { 
    transactions: sharedTransactions, 
    loading: loadingSharedTransactions 
  } = useTransactionsWithSharing({ enableRealtime: true });

  const loading = showSharedData ? loadingSharedTransactions : loadingOwnTransactions;
  const transactions = showSharedData ? sharedTransactions : ownTransactions;

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const expenseTransactions = transactions.filter(tx => 
      tx.type === 'expense' && tx.amount < 0
    );

    const categoryMap = new Map<string, { amount: number; count: number; ownCount: number; sharedCount: number }>();

    expenseTransactions.forEach(tx => {
      const category = tx.category || 'Outros';
      const current = categoryMap.get(category) || { amount: 0, count: 0, ownCount: 0, sharedCount: 0 };
      
      const isOwn = showSharedData ? (tx as any).isOwn : true;
      
      categoryMap.set(category, {
        amount: current.amount + Math.abs(tx.amount),
        count: current.count + 1,
        ownCount: current.ownCount + (isOwn ? 1 : 0),
        sharedCount: current.sharedCount + (!isOwn ? 1 : 0),
      });
    });

    const totalExpenses = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);

    const breakdown: CategorySpending[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        isOwn: data.ownCount > 0,
        isShared: data.sharedCount > 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Apply filter
    if (filterType === 'own') {
      return breakdown.filter(cat => cat.isOwn);
    } else if (filterType === 'shared') {
      return breakdown.filter(cat => cat.isShared);
    }

    return breakdown;
  }, [transactions, showSharedData, filterType]);

  // Calculate monthly trends
  const monthlyTrends = useMemo(() => {
    const lastSixMonths = getLastSixMonths();
    const trendMap = new Map<string, MonthlyTrend>();

    lastSixMonths.forEach(month => {
      trendMap.set(month, {
        month: getMonthName(month),
        income: 0,
        expenses: 0,
        ownIncome: 0,
        ownExpenses: 0,
        sharedIncome: 0,
        sharedExpenses: 0,
      });
    });

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const monthKey = getMonthKey(txDate);
      const trend = trendMap.get(monthKey);

      if (trend) {
        const isOwn = showSharedData ? (tx as any).isOwn : true;
        
        if (tx.type === 'income' || tx.type === 'salary') {
          trend.income += Math.abs(tx.amount);
          if (isOwn) {
            trend.ownIncome! += Math.abs(tx.amount);
          } else {
            trend.sharedIncome! += Math.abs(tx.amount);
          }
        } else {
          trend.expenses += Math.abs(tx.amount);
          if (isOwn) {
            trend.ownExpenses! += Math.abs(tx.amount);
          } else {
            trend.sharedExpenses! += Math.abs(tx.amount);
          }
        }
      }
    });

    return Array.from(trendMap.values());
  }, [transactions, showSharedData]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const income = transactions
      .filter(tx => tx.type === 'income' || tx.type === 'salary')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const expenses = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const avgTransaction = transactions.length > 0 
      ? transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / transactions.length 
      : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      avgTransaction,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-normal text-on-surface mb-2">Análise Financeira</h1>
        <p className="text-base text-on-surface-variant">
          Visualize seus padrões de gastos e tendências financeiras
        </p>
      </header>

      {/* Toggle for shared data */}
      <div className="flex items-center gap-3 p-3 bg-surface-variant/30 rounded-lg">
        <span className="text-sm text-on-surface-variant">Visualização:</span>
        <div className="flex gap-2">
          <Button
            variant={!showSharedData ? "primary" : "ghost"}
            size="sm"
            onClick={() => setShowSharedData(false)}
            className="!h-8 !px-3 !text-sm"
          >
            Apenas Meus Dados
          </Button>
          <Button
            variant={showSharedData ? "primary" : "ghost"}
            size="sm"
            onClick={() => setShowSharedData(true)}
            className="!h-8 !px-3 !text-sm"
          >
            Dados Combinados
          </Button>
        </div>
        {showSharedData && (
          <span className="text-xs text-on-surface-variant ml-2">
            (Incluindo dados compartilhados)
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-secondary/20">
              <ArrowUpCircleIcon className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Receitas Totais</p>
              <p className="text-xl font-medium text-secondary">
                {summary.totalIncome.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-error/20">
              <ArrowDownCircleIcon className="w-6 h-6 text-error" />
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Despesas Totais</p>
              <p className="text-xl font-medium text-error">
                {summary.totalExpenses.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${summary.netBalance >= 0 ? 'bg-secondary/20' : 'bg-error/20'}`}>
              {summary.netBalance >= 0 ? (
                <TrendingUpIcon className="w-6 h-6 text-secondary" />
              ) : (
                <TrendingDownIcon className="w-6 h-6 text-error" />
              )}
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Saldo Líquido</p>
              <p className={`text-xl font-medium ${summary.netBalance >= 0 ? 'text-secondary' : 'text-error'}`}>
                {summary.netBalance.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <span className="text-xl font-bold text-primary">#</span>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Transações</p>
              <p className="text-xl font-medium text-on-surface">
                {summary.transactionCount}
              </p>
              <p className="text-xs text-on-surface-variant">
                Média: {summary.avgTransaction.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-on-surface">Gastos por Categoria</h2>
          
          {showSharedData && (
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="!h-8 !px-3 !text-sm"
              >
                Todos
              </Button>
              <Button
                variant={filterType === 'own' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('own')}
                className="!h-8 !px-3 !text-sm"
              >
                Meus
              </Button>
              <Button
                variant={filterType === 'shared' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('shared')}
                className="!h-8 !px-3 !text-sm"
              >
                Compartilhados
              </Button>
            </div>
          )}
        </div>

        {categoryBreakdown.length > 0 ? (
          <div className="space-y-4">
            {categoryBreakdown.map((cat) => {
              const categoryInfo = getCategoryById(cat.category);
              return (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-on-surface">{categoryInfo?.name || cat.category}</span>
                      {showSharedData && (
                        <div className="flex gap-1">
                          {cat.isOwn && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                              Seus
                            </span>
                          )}
                          {cat.isShared && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">
                              Compartilhados
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-on-surface">
                        {cat.amount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {cat.count} transação(ões)
                      </p>
                    </div>
                  </div>
                  <div className="relative h-2 bg-surface-variant rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant text-right">
                    {cat.percentage.toFixed(1)}% do total
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-on-surface-variant">Nenhuma despesa encontrada</p>
          </div>
        )}
      </Card>

      {/* Monthly Trends */}
      <Card className="p-6">
        <h2 className="text-xl font-medium text-on-surface mb-6">Tendências Mensais</h2>
        
        <div className="space-y-4">
          {monthlyTrends.map((trend) => (
            <div key={trend.month} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-on-surface">{trend.month}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-secondary">
                    +{trend.income.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                  <span className="text-error">
                    -{trend.expenses.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              </div>
              
              {showSharedData && (trend.ownIncome! > 0 || trend.sharedIncome! > 0) && (
                <div className="text-xs text-on-surface-variant flex justify-between pl-4">
                  <span>Seus: {trend.ownIncome!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {trend.ownExpenses!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  <span>Compartilhados: {trend.sharedIncome!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {trend.sharedExpenses!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              )}
              
              <div className="relative h-2 bg-surface-variant rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-secondary rounded-l-full"
                  style={{ 
                    width: `${trend.income > 0 ? 50 : 0}%`,
                  }}
                />
                <div
                  className="absolute top-0 right-0 h-full bg-error rounded-r-full"
                  style={{ 
                    width: `${trend.expenses > 0 ? 50 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
