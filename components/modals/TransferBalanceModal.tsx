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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-semibold text-gray-900'>Transferir Saldo</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
            type='button'
          >
            <svg
              className='w-6 h-6'
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
          className='space-y-4'
        >
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
              {error}
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Conta de Origem *</label>
            <select
              required
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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
              <p className='text-xs text-gray-500 mt-1'>
                Saldo disponível: {availableBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Conta de Destino *</label>
            <select
              required
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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
              <p className='text-xs text-red-600 mt-1'>Saldo insuficiente na conta de origem</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Descrição (opcional)</label>
            <input
              type='text'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Ex: Transferência para poupança'
            />
          </div>

          <div className='flex justify-end space-x-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
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
