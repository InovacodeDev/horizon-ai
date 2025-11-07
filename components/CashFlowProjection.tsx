'use client';

import React, { useMemo } from 'react';
import Card from '@/components/ui/Card';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, CalendarIcon } from '@/components/assets/Icons';

interface ProjectedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  isRecurring: boolean;
}

interface CashFlowProjectionProps {
  currentBalance: number;
  projectedTransactions: ProjectedTransaction[];
}

const CashFlowProjection: React.FC<CashFlowProjectionProps> = ({
  currentBalance,
  projectedTransactions,
}) => {
  const nextMonth = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, []);

  const projections = useMemo(() => {
    const income = projectedTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expenses = projectedTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const projectedBalance = currentBalance + income - expenses;
    
    return { income, expenses, projectedBalance };
  }, [projectedTransactions, currentBalance]);

  const groupedByType = useMemo(() => {
    const income = projectedTransactions.filter(tx => tx.type === 'income');
    const expenses = projectedTransactions.filter(tx => tx.type === 'expense');
    return { income, expenses };
  }, [projectedTransactions]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-medium text-on-surface">
            Projeção para {nextMonth}
          </h3>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-secondary/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircleIcon className="w-5 h-5 text-secondary" />
            <p className="text-sm text-on-surface-variant">Entradas Previstas</p>
          </div>
          <p className="text-2xl font-bold text-secondary">
            {projections.income.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {groupedByType.income.length} transação(ões)
          </p>
        </div>

        <div className="p-4 bg-error/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircleIcon className="w-5 h-5 text-error" />
            <p className="text-sm text-on-surface-variant">Saídas Previstas</p>
          </div>
          <p className="text-2xl font-bold text-error">
            {projections.expenses.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {groupedByType.expenses.length} transação(ões)
          </p>
        </div>

        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-on-surface-variant mb-2">Saldo Projetado</p>
          <p className={`text-2xl font-bold ${
            projections.projectedBalance >= 0 ? 'text-secondary' : 'text-error'
          }`}>
            {projections.projectedBalance.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Saldo atual: {currentBalance.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
        </div>
      </div>

      {/* Detailed List */}
      <div className="space-y-4">
        {/* Income Section */}
        {groupedByType.income.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-secondary mb-2 flex items-center gap-2">
              <ArrowUpCircleIcon className="w-4 h-4" />
              Entradas Previstas
            </h4>
            <div className="space-y-2">
              {groupedByType.income.map((tx, index) => (
                <div
                  key={`income-${index}`}
                  className="flex items-center justify-between p-3 bg-surface-variant/30 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-on-surface">{tx.description}</p>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>
                        {new Date(tx.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      {tx.isRecurring && (
                        <>
                          <span>•</span>
                          <span className="text-primary">Recorrente</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-base font-medium text-secondary">
                    +{tx.amount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses Section */}
        {groupedByType.expenses.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-error mb-2 flex items-center gap-2">
              <ArrowDownCircleIcon className="w-4 h-4" />
              Saídas Previstas
            </h4>
            <div className="space-y-2">
              {groupedByType.expenses.map((tx, index) => (
                <div
                  key={`expense-${index}`}
                  className="flex items-center justify-between p-3 bg-surface-variant/30 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-on-surface">{tx.description}</p>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>
                        {new Date(tx.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      {tx.isRecurring && (
                        <>
                          <span>•</span>
                          <span className="text-primary">Recorrente</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-base font-medium text-error">
                    -{tx.amount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {projectedTransactions.length === 0 && (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 mx-auto text-outline mb-3" />
            <p className="text-on-surface-variant">
              Nenhuma transação prevista para o próximo mês
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              Adicione transações recorrentes para ver projeções automáticas
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CashFlowProjection;
