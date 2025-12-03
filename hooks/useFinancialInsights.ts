'use client';

import type { FinancialInsight, Transaction } from '@/lib/types';
import { useMemo } from 'react';

interface CategorySpending {
  category: string;
  currentMonth: number;
  previousMonths: number;
  transactionCount: number;
}

/**
 * Analyzes transactions and generates AI-powered financial insights
 * Uses React 19.2 useMemo for efficient computation
 */
export function useFinancialInsights(transactions: Transaction[]): FinancialInsight[] {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const insights: FinancialInsight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Separate transactions by time period (excluding transfers)
    const currentMonthTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear && tx.type === 'expense';
    });

    const previousMonthsTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const isOlderThanCurrentMonth =
        txDate.getFullYear() < currentYear ||
        (txDate.getFullYear() === currentYear && txDate.getMonth() < currentMonth);
      return isOlderThanCurrentMonth && tx.type === 'expense';
    });

    // Need at least some historical data for comparison
    if (currentMonthTransactions.length === 0 || previousMonthsTransactions.length === 0) {
      return insights;
    }

    // Calculate spending by category
    const categorySpending: Record<string, CategorySpending> = {};

    // Current month spending
    currentMonthTransactions.forEach((tx) => {
      const category = tx.category || 'Sem Categoria';
      if (!categorySpending[category]) {
        categorySpending[category] = {
          category,
          currentMonth: 0,
          previousMonths: 0,
          transactionCount: 0,
        };
      }
      categorySpending[category].currentMonth += Math.abs(tx.amount);
      categorySpending[category].transactionCount += 1;
    });

    // Calculate number of previous months for averaging
    const oldestTransaction = previousMonthsTransactions.reduce((oldest, tx) => {
      const txDate = new Date(tx.date);
      const oldestDate = new Date(oldest.date);
      return txDate < oldestDate ? tx : oldest;
    }, previousMonthsTransactions[0]);

    const oldestDate = new Date(oldestTransaction.date);
    const monthsDiff = (currentYear - oldestDate.getFullYear()) * 12 + (currentMonth - oldestDate.getMonth());
    const previousMonthsCount = Math.max(1, monthsDiff);

    // Previous months spending
    previousMonthsTransactions.forEach((tx) => {
      const category = tx.category || 'Sem Categoria';
      if (!categorySpending[category]) {
        categorySpending[category] = {
          category,
          currentMonth: 0,
          previousMonths: 0,
          transactionCount: 0,
        };
      }
      categorySpending[category].previousMonths += Math.abs(tx.amount);
    });

    // Calculate averages and find unusual spending patterns
    const unusualSpending: Array<{
      category: string;
      currentMonth: number;
      avgPrevious: number;
      percentageIncrease: number;
      transactionCount: number;
    }> = [];

    Object.values(categorySpending).forEach((cat) => {
      const avgPrevious = cat.previousMonths / previousMonthsCount;

      // Only consider if there's meaningful spending (> R$ 100)
      if (cat.currentMonth > 100 && avgPrevious > 0) {
        const percentageIncrease = ((cat.currentMonth - avgPrevious) / avgPrevious) * 100;

        // Flag if spending is up by more than 30%
        if (percentageIncrease > 30) {
          unusualSpending.push({
            category: cat.category,
            currentMonth: cat.currentMonth,
            avgPrevious,
            percentageIncrease,
            transactionCount: cat.transactionCount,
          });
        }
      }
    });

    // Sort by percentage increase (highest first)
    unusualSpending.sort((a, b) => b.percentageIncrease - a.percentageIncrease);

    // Generate insights for top unusual spending categories (max 2)
    unusualSpending.slice(0, 2).forEach((spending) => {
      const categoryName = formatCategoryName(spending.category);
      const percentRounded = Math.round(spending.percentageIncrease);

      insights.push({
        $id: `unusual-${spending.category}`,
        type: 'UNUSUAL_SPENDING',
        title: `Gastos acima do normal em "${categoryName}"`,
        description: `Seus gastos nesta categoria aumentaram ${percentRounded}% este mês em comparação com a sua média. Você gastou ${formatCurrency(spending.currentMonth)} vs. média de ${formatCurrency(spending.avgPrevious)}. Ficar de olho nisso pode ajudar você a manter o orçamento.`,
        actionText: 'Ver Transações',
      });
    });

    // Generate cash flow forecast if we have enough data
    if (transactions.length > 10) {
      const currentMonthIncome = transactions
        .filter((tx) => {
          const txDate = new Date(tx.date);
          return (
            txDate.getMonth() === currentMonth &&
            txDate.getFullYear() === currentYear &&
            (tx.type === 'income' || tx.type === 'salary')
          );
        })
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const currentMonthExpenses = currentMonthTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const avgPreviousExpenses =
        previousMonthsTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / previousMonthsCount;

      // Estimate remaining expenses for the month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const currentDay = now.getDate();
      const daysRemaining = daysInMonth - currentDay;
      const dailyAvgExpense = currentMonthExpenses / currentDay;
      const estimatedRemainingExpenses = dailyAvgExpense * daysRemaining;
      const estimatedTotalExpenses = currentMonthExpenses + estimatedRemainingExpenses;

      // Estimate income for the month (assume similar to average or already received)
      const avgPreviousIncome =
        transactions
          .filter((tx) => tx.type === 'income' || tx.type === 'salary')
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / previousMonthsCount;

      const estimatedTotalIncome = Math.max(currentMonthIncome, avgPreviousIncome);
      const estimatedSurplus = estimatedTotalIncome - estimatedTotalExpenses;

      if (estimatedSurplus > 100) {
        insights.push({
          $id: 'cashflow-positive',
          type: 'CASH_FLOW_FORECAST',
          title: 'Previsão de Fluxo de Caixa Positivo',
          description: `Com base em seus padrões de renda e gastos, você está no caminho para ter um excedente de ~${formatCurrency(estimatedSurplus)} este mês. Uma ótima oportunidade para economizar ou investir!`,
          actionText: 'Ver Transações',
        });
      } else if (estimatedSurplus < -100) {
        insights.push({
          $id: 'cashflow-negative',
          type: 'CASH_FLOW_FORECAST',
          title: 'Atenção ao Fluxo de Caixa',
          description: `Suas despesas projetadas podem exceder sua renda em ~${formatCurrency(Math.abs(estimatedSurplus))} este mês. Considere rever seus gastos para manter o controle.`,
          actionText: 'Ver Transações',
        });
      }
    }

    return insights;
  }, [transactions]);
}

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  food: 'Alimentação',
  dining: 'Restaurantes',
  transport: 'Transporte',
  transportation: 'Transporte',
  utilities: 'Contas',
  housing: 'Moradia',
  entertainment: 'Lazer',
  health: 'Saúde',
  shopping: 'Compras',
  groceries: 'Mercado',
  education: 'Educação',
  travel: 'Viagem',
  salary: 'Salário',
  income: 'Renda',
  personal: 'Pessoal',
  investments: 'Investimentos',
  general: 'Geral',
  subscriptions: 'Assinaturas',
  clothing: 'Roupas',
  gifts: 'Presentes',
  services: 'Serviços',
  credit_card_bill: 'Fatura do Cartão',
  uncategorized: 'Sem Categoria',
};

function formatCategoryName(category: string): string {
  const normalizedKey = category.toLowerCase();
  if (CATEGORY_TRANSLATIONS[normalizedKey]) {
    return CATEGORY_TRANSLATIONS[normalizedKey];
  }

  // Convert "food" -> "Food", "dining" -> "Dining", etc.
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
