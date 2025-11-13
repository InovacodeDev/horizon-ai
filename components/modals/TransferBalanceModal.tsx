'use client';

import React, { useState } from 'react';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { transferBalanceAction } from '@/actions/account.actions';
import type { Account } from '@/lib/types';

interface TransferBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSuccess?: () => void;
}

export function TransferBalanceModal({ isOpen, onClose, accounts, onSuccess }: TransferBalanceModalProps) {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('from_account_id', fromAccountId);
      formData.append('to_account_id', toAccountId);
      formData.append('amount', amount.toString());
      formData.append('description', description);

      const result = await transferBalanceAction(null, formData);

      if (result.success) {
        // Reset form
        setFromAccountId('');
        setToAccountId('');
        setAmount(0);
        setDescription('');
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || 'Falha ao transferir saldo');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao transferir saldo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fromAccount = accounts.find((acc) => acc.$id === fromAccountId);
  const availableBalance = fromAccount?.balance || 0;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in'>
      <div className='bg-surface-new-primary w-full max-w-md rounded-lg shadow-soft-xl transform transition-smooth-200 animate-slide-up'>
        <div className='flex justify-between items-center p-6 border-b border-border-primary'>
          <h2 className='text-lg font-semibold text-text-primary'>Transferir Saldo</h2>
          <button
            onClick={onClose}
            className='p-2 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus'
            type='button'
            aria-label='Fechar modal'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='p-6 space-y-5'
        >
          {error && (
            <div className='bg-red-bg border border-red-border text-red-text px-4 py-3.5 rounded-lg flex items-start gap-3'>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm leading-relaxed">{error}</p>
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-text-primary mb-2'>Conta de Origem *</label>
            <select
              required
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className='w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10'
            >
              <option value=''>Selecione uma conta</option>
              {accounts.map((account) => (
                <option
                  key={account.$id}
                  value={account.$id}
                >
                  {account.name} - {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </option>
              ))}
            </select>
            {fromAccountId && (
              <p className='text-xs text-text-tertiary mt-1.5'>
                Saldo disponível: {availableBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-text-primary mb-2'>Conta de Destino *</label>
            <select
              required
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className='w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10'
            >
              <option value=''>Selecione uma conta</option>
              {accounts
                .filter((account) => account.$id !== fromAccountId)
                .map((account) => (
                  <option
                    key={account.$id}
                    value={account.$id}
                  >
                    {account.name} - {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <CurrencyInput
              label='Valor da Transferência *'
              value={amount}
              onChange={(value) => setAmount(value)}
              placeholder='R$ 0,00'
              required
            />
            {amount > availableBalance && fromAccountId && (
              <p className='text-xs text-red-text mt-1.5'>Saldo insuficiente na conta de origem</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-text-primary mb-2'>Descrição (opcional)</label>
            <input
              type='text'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary placeholder:text-text-tertiary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10'
              placeholder='Ex: Transferência para poupança'
            />
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t border-border-primary'>
            <button
              type='button'
              onClick={onClose}
              className='h-10 px-4 rounded-md text-sm font-medium bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed'
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='h-10 px-4 rounded-md text-sm font-medium bg-blue-primary text-white hover:bg-blue-hover shadow-soft-xs hover:shadow-soft-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed'
              disabled={loading || !fromAccountId || !toAccountId || amount <= 0 || amount > availableBalance}
            >
              {loading ? 'Transferindo...' : 'Transferir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
