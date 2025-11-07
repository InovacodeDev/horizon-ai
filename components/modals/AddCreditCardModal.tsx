'use client';

import React, { useState } from 'react';
import CurrencyInput from '@/components/ui/CurrencyInput';

export interface CreateCreditCardInput {
  account_id: string;
  name: string;
  last_digits: string;
  credit_limit: number;
  used_limit?: number;
  closing_day: number;
  due_day: number;
  brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
  network?: string;
  color?: string;
}

interface AddCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCreditCardInput) => Promise<void>;
  accountId: string;
}

export function AddCreditCardModal({ isOpen, onClose, onSubmit, accountId }: AddCreditCardModalProps) {
  const [formData, setFormData] = useState<Omit<CreateCreditCardInput, 'account_id'>>({
    name: '',
    last_digits: '',
    credit_limit: 0,
    used_limit: undefined,
    closing_day: 1,
    due_day: 10,
    brand: 'visa',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit({ ...formData, account_id: accountId });
      // Reset form and close modal
      setFormData({
        name: '',
        last_digits: '',
        credit_limit: 0,
        used_limit: undefined,
        closing_day: 1,
        due_day: 10,
        brand: 'visa',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create credit card');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-new-primary w-full max-w-md rounded-lg shadow-soft-xl max-h-[90vh] overflow-y-auto transform transition-smooth-200 animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-border-primary sticky top-0 bg-surface-new-primary z-10">
          <h2 className="text-lg font-semibold text-text-primary">Adicionar Cartão de Crédito</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus"
            type="button"
            aria-label="Fechar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-bg border border-red-border text-red-text px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Nome do Cartão *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary placeholder:text-text-tertiary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
              placeholder="Ex: Cartão Platinum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Bandeira *
            </label>
            <select
              required
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value as any })}
              className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
            >
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="elo">Elo</option>
              <option value="amex">American Express</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Últimos 4 Dígitos *
            </label>
            <input
              type="text"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              value={formData.last_digits}
              onChange={(e) => setFormData({ ...formData, last_digits: e.target.value.replace(/\D/g, '') })}
              className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary placeholder:text-text-tertiary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
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
            value={formData.used_limit || 0}
            onChange={(value) => setFormData({ ...formData, used_limit: value })}
            placeholder="R$ 0,00"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Dia de Fechamento *
              </label>
              <input
                type="number"
                required
                min="1"
                max="31"
                value={formData.closing_day}
                onChange={(e) => setFormData({ ...formData, closing_day: parseInt(e.target.value) || 1 })}
                className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Dia de Vencimento *
              </label>
              <input
                type="number"
                required
                min="1"
                max="31"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) || 10 })}
                className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-md text-sm font-medium bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 px-4 rounded-md text-sm font-medium bg-blue-primary text-white hover:bg-blue-hover shadow-soft-xs hover:shadow-soft-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Cartão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
