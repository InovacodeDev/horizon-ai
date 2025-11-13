'use client';

import React from 'react';
import { ParsedTransaction } from '@/lib/types';

interface ImportPreviewProps {
  transactions: ParsedTransaction[];
  duplicates: Set<string>;
  selectedTransactions: Set<string>;
  summary: {
    total: number;
    income: number;
    expense: number;
    duplicateCount: number;
    totalAmount: number;
  } | null;
  onToggleTransaction: (id: string) => void;
  onToggleAll: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  error?: string | null;
}

export default function ImportPreview({
  transactions,
  duplicates,
  selectedTransactions,
  summary,
  onToggleTransaction,
  onToggleAll,
  onConfirm,
  onCancel,
  error,
}: ImportPreviewProps) {
  const allSelected = transactions.length > 0 && transactions.every((t) => selectedTransactions.has(t.id));
  const someSelected = transactions.some((t) => selectedTransactions.has(t.id)) && !allSelected;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getTypeLabel = (type: 'income' | 'expense') => {
    return type === 'income' ? 'Receita' : 'Despesa';
  };

  const getTypeColor = (type: 'income' | 'expense') => {
    return type === 'income' ? 'text-green-text' : 'text-red-text';
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Sem categoria';

    const categoryMap: Record<string, string> = {
      income: 'Receita',
      salary: 'Salário',
      transfer: 'Transferência',
      utilities: 'Contas e Serviços',
      shopping: 'Compras',
      transportation: 'Transporte',
      food: 'Alimentação',
      health: 'Saúde',
      entertainment: 'Entretenimento',
      education: 'Educação',
      other: 'Outros',
    };

    return categoryMap[category] || category;
  };

  return (
    <div className="space-y-5">
      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bg-secondary rounded-lg p-4">
            <p className="text-xs text-text-tertiary mb-1">Total de Transações</p>
            <p className="text-2xl font-semibold text-text-primary">{summary.total}</p>
          </div>
          <div className="bg-green-bg rounded-lg p-4">
            <p className="text-xs text-text-tertiary mb-1">Receitas</p>
            <p className="text-2xl font-semibold text-green-text">{summary.income}</p>
          </div>
          <div className="bg-red-bg rounded-lg p-4">
            <p className="text-xs text-text-tertiary mb-1">Despesas</p>
            <p className="text-2xl font-semibold text-red-text">{summary.expense}</p>
          </div>
          <div className="bg-yellow-bg rounded-lg p-4">
            <p className="text-xs text-text-tertiary mb-1">Duplicadas</p>
            <p className="text-2xl font-semibold text-yellow-text">{summary.duplicateCount}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-bg border border-red-border text-red-text px-4 py-3 rounded-md" role="alert">
          {error}
        </div>
      )}

      {/* Transactions Table */}
      <div className="border border-border-primary rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-bg-secondary px-4 py-3 border-b border-border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-border-primary text-blue-primary focus:ring-2 focus:ring-border-focus focus:ring-offset-0 cursor-pointer"
                aria-label={allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
              />
              <span className="text-sm font-medium text-text-primary">
                {selectedTransactions.size} de {transactions.length} selecionadas
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleAll}
              className="text-sm text-blue-primary hover:text-blue-hover font-medium focus:outline-none focus:underline"
            >
              {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-bg-secondary sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-12">
                    <span className="sr-only">Selecionar</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-new-primary divide-y divide-border-primary">
                {transactions.map((transaction) => {
                  const isSelected = selectedTransactions.has(transaction.id);
                  const isDuplicate = duplicates.has(transaction.id);

                  return (
                    <tr
                      key={transaction.id}
                      className={`
                        hover:bg-bg-secondary transition-colors-smooth cursor-pointer
                        ${isDuplicate ? 'bg-yellow-bg/30' : ''}
                      `}
                      onClick={() => onToggleTransaction(transaction.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onToggleTransaction(transaction.id);
                        }
                      }}
                      aria-label={`${isSelected ? 'Desmarcar' : 'Selecionar'} transação ${transaction.description}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleTransaction(transaction.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-border-primary text-blue-primary focus:ring-2 focus:ring-border-focus focus:ring-offset-0 cursor-pointer"
                          aria-label={`Selecionar transação ${transaction.description}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{transaction.description}</span>
                          {isDuplicate && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-bg text-yellow-text border border-yellow-border whitespace-nowrap"
                              title="Possível duplicata"
                            >
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Duplicata
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {getCategoryLabel(transaction.category)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={getTypeColor(transaction.type)}>{getTypeLabel(transaction.type)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        <span className={getTypeColor(transaction.type)}>{formatCurrency(transaction.amount)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicates.size > 0 && (
        <div className="bg-yellow-bg border border-yellow-border rounded-md p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-text flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-yellow-text mb-1">Possíveis Duplicatas Detectadas</p>
              <p className="text-text-secondary">
                {duplicates.size} transação(ões) podem já existir no sistema. Revise as transações marcadas antes de
                importar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 rounded-md text-sm font-medium bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-10 px-4 rounded-md text-sm font-medium bg-blue-primary text-white hover:bg-blue-hover shadow-soft-xs hover:shadow-soft-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={selectedTransactions.size === 0}
        >
          Importar {selectedTransactions.size > 0 ? `(${selectedTransactions.size})` : ''}
        </button>
      </div>
    </div>
  );
}
