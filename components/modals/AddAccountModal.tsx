'use client';

import React, { useState } from 'react';
import CurrencyInput from '@/components/ui/CurrencyInput';
import Button from '@/components/ui/Button';

export interface CreateAccountInput {
  name: string;
  account_type: 'checking' | 'savings' | 'investment' | 'vale' | 'other';
  initial_balance?: number;
  is_manual?: boolean;
  bank_id?: string;
  last_digits?: string;
  status?: 'Connected' | 'Sync Error' | 'Disconnected' | 'Manual';
}

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountInput) => Promise<void>;
}

export function AddAccountModal({ isOpen, onClose, onSubmit }: AddAccountModalProps) {
  const [formData, setFormData] = useState<CreateAccountInput>({
    name: '',
    account_type: 'checking',
    initial_balance: undefined,
    is_manual: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      // Reset form and close modal
      setFormData({
        name: '',
        account_type: 'checking',
        initial_balance: undefined,
        is_manual: true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-new-primary w-full max-w-md rounded-lg shadow-soft-xl transform transition-smooth-200 animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary">Adicionar Conta</h2>
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
            <div className="bg-red-bg border border-red-border text-red-text px-4 py-3.5 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm leading-relaxed">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Nome da Conta *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary placeholder:text-text-tertiary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
              placeholder="Ex: Conta Corrente Banco X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tipo de Conta *
            </label>
            <select
              required
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
              className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
            >
              <option value="checking">Conta Corrente</option>
              <option value="savings">Poupança</option>
              <option value="investment">Investimento</option>
              <option value="vale">Vale (Alimentação/Flexível)</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <CurrencyInput
              label="Saldo Inicial"
              value={formData.initial_balance || 0}
              onChange={(value) => setFormData({ ...formData, initial_balance: value })}
              placeholder="R$ 0,00"
            />
            <p className="text-xs text-text-tertiary mt-1.5">
              Se houver saldo inicial, uma transação de entrada será criada automaticamente
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
