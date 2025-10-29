'use client';

import React, { useState } from 'react';
import CurrencyInput from '@/components/ui/CurrencyInput';
import type { CreditCard } from '@/lib/types';

export interface UpdateCreditCardInput {
  name?: string;
  last_digits?: string;
  credit_limit?: number;
  used_limit?: number;
  closing_day?: number;
  due_day?: number;
}

interface EditCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateCreditCardInput) => Promise<void>;
  creditCard: CreditCard;
}

export function EditCreditCardModal({ isOpen, onClose, onSubmit, creditCard }: EditCreditCardModalProps) {
  const [formData, setFormData] = useState({
    name: creditCard.name || '',
    last_digits: creditCard.last_digits || '',
    credit_limit: creditCard.credit_limit || 0,
    used_limit: creditCard.used_limit || 0,
    closing_day: creditCard.closing_day || 1,
    due_day: creditCard.due_day || 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar cartão de crédito');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Editar Cartão de Crédito</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cartão *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Cartão Platinum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bandeira
            </label>
            <input
              type="text"
              value={creditCard.brand || 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">A bandeira não pode ser alterada</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Últimos 4 Dígitos *
            </label>
            <input
              type="text"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              value={formData.last_digits}
              onChange={(e) => setFormData({ ...formData, last_digits: e.target.value.replace(/\D/g, '') })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1234"
            />
          </div>

          <CurrencyInput
            label="Limite de Crédito"
            value={formData.credit_limit}
            onChange={(value) => setFormData({ ...formData, credit_limit: value })}
            required
            placeholder="R$ 0,00"
          />

          <CurrencyInput
            label="Limite Utilizado"
            value={formData.used_limit}
            onChange={(value) => setFormData({ ...formData, used_limit: value })}
            placeholder="R$ 0,00"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dia de Fechamento *
              </label>
              <input
                type="number"
                required
                min="1"
                max="31"
                value={formData.closing_day}
                onChange={(e) => setFormData({ ...formData, closing_day: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dia de Vencimento *
              </label>
              <input
                type="number"
                required
                min="1"
                max="31"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
