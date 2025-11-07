'use client';

import React, { useState } from 'react';
import CurrencyInput from '@/components/ui/CurrencyInput';
import DateInput from '@/components/ui/DateInput';
import CategorySelect from '@/components/ui/CategorySelect';
import { getCurrentDateInUserTimezone } from '@/lib/utils/timezone';

export interface CreateTransactionInput {
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'salary';
  category: string;
  description?: string;
  date: string;
  accountId: string;
  taxAmount?: number;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  accounts: Array<{ $id: string; name: string }>;
}

export function AddTransactionModal({ isOpen, onClose, onSubmit, accounts }: AddTransactionModalProps) {
  const [formData, setFormData] = useState<CreateTransactionInput>({
    amount: 0,
    type: 'expense',
    category: '',
    description: '',
    date: getCurrentDateInUserTimezone(),
    accountId: '',
    taxAmount: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (formData.amount <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }
      if (!formData.category) {
        throw new Error('Selecione uma categoria');
      }
      if (!formData.accountId) {
        throw new Error('Selecione uma conta');
      }
      if (formData.type === 'salary' && formData.taxAmount !== undefined && formData.taxAmount < 0) {
        throw new Error('O valor do imposto não pode ser negativo');
      }

      await onSubmit(formData);
      
      // Reset form and close modal
      setFormData({
        amount: 0,
        type: 'expense',
        category: '',
        description: '',
        date: getCurrentDateInUserTimezone(),
        accountId: '',
        taxAmount: undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao criar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setFormData({ 
      ...formData, 
      type: type as any,
      // Limpar taxAmount se não for salário
      taxAmount: type === 'salary' ? formData.taxAmount : undefined,
    });
  };

  const calculateNetAmount = () => {
    if (formData.type === 'salary' && formData.taxAmount) {
      return formData.amount - formData.taxAmount;
    }
    return formData.amount;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Adicionar Transação</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Tipo de Transação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Transação *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="salary">Salário</option>
              <option value="transfer">Transferência</option>
            </select>
          </div>

          {/* Valor */}
          <div>
            <CurrencyInput
              label={formData.type === 'salary' ? 'Valor do Salário Bruto *' : 'Valor *'}
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
              placeholder="R$ 0,00"
              required
            />
            {formData.type === 'salary' && (
              <p className="text-xs text-gray-500 mt-1">
                Valor bruto do salário antes dos descontos
              </p>
            )}
          </div>

          {/* Imposto (apenas para salário) */}
          {formData.type === 'salary' && (
            <div>
              <CurrencyInput
                label="Imposto Retido na Fonte"
                value={formData.taxAmount || 0}
                onChange={(value) => setFormData({ ...formData, taxAmount: value })}
                placeholder="R$ 0,00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor do imposto descontado. Uma transação de despesa será criada automaticamente.
              </p>
            </div>
          )}

          {/* Cálculo do Líquido (apenas para salário com imposto) */}
          {formData.type === 'salary' && formData.taxAmount && formData.taxAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Salário Bruto:</span>
                  <span className="font-medium text-green-600">
                    + R$ {formData.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Imposto:</span>
                  <span className="font-medium text-red-600">
                    - R$ {formData.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-bold">
                  <span>Salário Líquido:</span>
                  <span className="text-blue-600">
                    R$ {calculateNetAmount().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Categoria */}
          <div>
            <CategorySelect
              label="Categoria *"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              type={
                formData.type === 'salary'
                  ? 'income'
                  : formData.type === 'transfer'
                    ? 'all'
                    : (formData.type as 'income' | 'expense')
              }
              required
            />
          </div>

          {/* Data */}
          <div>
            <DateInput
              label="Data *"
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              required
            />
          </div>

          {/* Conta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conta *
            </label>
            <select
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma conta</option>
              {accounts.map((account) => (
                <option key={account.$id} value={account.$id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes da transação (opcional)"
              rows={3}
            />
          </div>

          {/* Info sobre recorrência (apenas para salário) */}
          {formData.type === 'salary' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Recorrência Automática</p>
                  <p className="mt-1">
                    Este salário será configurado como recorrente mensal sem data de término.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Salvando...' : 'Criar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
