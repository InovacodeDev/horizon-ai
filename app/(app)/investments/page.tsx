'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PlusIcon,
  SearchIcon,
  DollarSignIcon,
  TargetIcon,
  LandmarkIcon,
  SwapIcon,
} from '@/components/assets/Icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import DateInput from '@/components/ui/DateInput';
import Modal from '@/components/ui/Modal';
import { useAccounts } from '@/hooks/useAccounts';
import type { Investment, InvestmentType } from '@/lib/types/investment.types';
import { getCurrentDateInUserTimezone } from '@/lib/utils/timezone';

// Mock data - substituir com chamadas reais à API
const mockInvestments: Investment[] = [
  {
    $id: '1',
    $createdAt: '2024-01-15T10:00:00Z',
    $updatedAt: '2024-01-15T10:00:00Z',
    user_id: 'default-user',
    account_id: 'acc1',
    name: 'Petrobras PN',
    type: 'stocks',
    ticker: 'PETR4',
    quantity: 100,
    purchase_price: 32.5,
    purchase_date: '2024-01-15T10:00:00Z',
    current_price: 38.75,
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const investmentTypes: { value: InvestmentType; label: string }[] = [
  { value: 'stocks', label: 'Ações' },
  { value: 'fiis', label: 'Fundos Imobiliários' },
  { value: 'fixed_income', label: 'Renda Fixa' },
  { value: 'crypto', label: 'Criptomoedas' },
  { value: 'funds', label: 'Fundos' },
  { value: 'etf', label: 'ETFs' },
  { value: 'pension', label: 'Previdência' },
  { value: 'other', label: 'Outros' },
];

interface NewInvestment {
  name: string;
  type: InvestmentType;
  ticker: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  current_price: number;
  account_id: string;
}

const InvestmentsPage: React.FC = () => {
  const [investments] = useState<Investment[]>(mockInvestments);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<InvestmentType | 'all'>('all');
  const [newInvestment, setNewInvestment] = useState<NewInvestment>({
    name: '',
    type: 'stocks',
    ticker: '',
    quantity: 0,
    purchase_price: 0,
    purchase_date: getCurrentDateInUserTimezone(),
    current_price: 0,
    account_id: '',
  });

  const { accounts } = useAccounts();

  const summary = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.quantity * inv.purchase_price, 0);
    const currentValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.current_price, 0);
    const totalGain = currentValue - totalInvested;
    const totalGainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      totalGain,
      totalGainPercentage,
    };
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchesSearch =
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.ticker && inv.ticker.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || inv.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [investments, searchTerm, filterType]);

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding investment:', newInvestment);
    setIsAddModalOpen(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getTypeLabel = (type: InvestmentType) => {
    return investmentTypes.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-on-surface'>Investimentos</h1>
          <p className='text-on-surface-variant mt-1'>Gerencie sua carteira de investimentos</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon className='w-5 h-5 mr-2' />
          Adicionar Investimento
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-on-surface-variant'>Total Investido</p>
              <p className='text-2xl font-bold text-on-surface'>{formatCurrency(summary.totalInvested)}</p>
            </div>
            <DollarSignIcon className='w-8 h-8 text-primary' />
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-on-surface-variant'>Valor Atual</p>
              <p className='text-2xl font-bold text-on-surface'>{formatCurrency(summary.currentValue)}</p>
            </div>
            <TargetIcon className='w-8 h-8 text-secondary' />
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-on-surface-variant'>Ganho/Perda</p>
              <p className={`text-2xl font-bold ${summary.totalGain >= 0 ? 'text-secondary' : 'text-error'}`}>
                {formatCurrency(summary.totalGain)}
              </p>
            </div>
            {summary.totalGain >= 0 ? (
              <TrendingUpIcon className='w-8 h-8 text-secondary' />
            ) : (
              <TrendingDownIcon className='w-8 h-8 text-error' />
            )}
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-on-surface-variant'>Rentabilidade</p>
              <p
                className={`text-2xl font-bold ${summary.totalGainPercentage >= 0 ? 'text-secondary' : 'text-error'}`}
              >
                {formatPercentage(summary.totalGainPercentage)}
              </p>
            </div>
            {summary.totalGainPercentage >= 0 ? (
              <TrendingUpIcon className='w-8 h-8 text-secondary' />
            ) : (
              <TrendingDownIcon className='w-8 h-8 text-error' />
            )}
          </div>
        </Card>
      </div>

      <div className='flex gap-4 mb-6'>
        <div className='flex-1'>
          <Input
            placeholder='Buscar investimentos...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<SearchIcon className='w-5 h-5 text-on-surface-variant' />}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as InvestmentType | 'all')}
          className='px-4 py-2 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none'
        >
          <option value='all'>Todos os tipos</option>
          {investmentTypes.map((type) => (
            <option
              key={type.value}
              value={type.value}
            >
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <div className='p-6'>
          <h2 className='text-xl font-semibold text-on-surface mb-4'>Meus Investimentos</h2>

          {filteredInvestments.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-on-surface-variant'>Nenhum investimento encontrado</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-outline'>
                    <th className='text-left py-3 px-2 text-on-surface-variant font-medium'>Ativo</th>
                    <th className='text-left py-3 px-2 text-on-surface-variant font-medium'>Tipo</th>
                    <th className='text-right py-3 px-2 text-on-surface-variant font-medium'>Quantidade</th>
                    <th className='text-right py-3 px-2 text-on-surface-variant font-medium'>Preço Médio</th>
                    <th className='text-right py-3 px-2 text-on-surface-variant font-medium'>Preço Atual</th>
                    <th className='text-right py-3 px-2 text-on-surface-variant font-medium'>Total Investido</th>
                    <th className='text-right py-3 px-2 text-on-surface-variant font-medium'>Valor Atual</th>
                    <th className='text-right py-3 px-2 text-on-surface-variant font-medium'>Ganho/Perda</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestments.map((investment) => {
                    const totalInvested = investment.quantity * investment.purchase_price;
                    const currentValue = investment.quantity * investment.current_price;
                    const gain = currentValue - totalInvested;
                    const gainPercentage = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

                    return (
                      <tr
                        key={investment.$id}
                        className='border-b border-outline/50 hover:bg-surface-variant/20'
                      >
                        <td className='py-4 px-2'>
                          <div>
                            <p className='font-medium text-on-surface'>{investment.name}</p>
                            {investment.ticker && <p className='text-sm text-on-surface-variant'>{investment.ticker}</p>}
                          </div>
                        </td>
                        <td className='py-4 px-2 text-on-surface'>{getTypeLabel(investment.type)}</td>
                        <td className='py-4 px-2 text-right text-on-surface'>
                          {investment.quantity.toLocaleString('pt-BR')}
                        </td>
                        <td className='py-4 px-2 text-right text-on-surface'>
                          {formatCurrency(investment.purchase_price)}
                        </td>
                        <td className='py-4 px-2 text-right text-on-surface'>
                          {formatCurrency(investment.current_price)}
                        </td>
                        <td className='py-4 px-2 text-right text-on-surface'>{formatCurrency(totalInvested)}</td>
                        <td className='py-4 px-2 text-right text-on-surface'>{formatCurrency(currentValue)}</td>
                        <td className='py-4 px-2 text-right'>
                          <div className={`${gain >= 0 ? 'text-secondary' : 'text-error'}`}>
                            <p className='font-medium'>{formatCurrency(gain)}</p>
                            <p className='text-sm'>{formatPercentage(gainPercentage)}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title='Adicionar Investimento'
      >
        <form onSubmit={handleAddInvestment}>
          <div className='p-6 space-y-4'>
            <Input
              label='Nome do Investimento'
              value={newInvestment.name}
              onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
              required
              placeholder='Ex: Petrobras PN, Tesouro IPCA+'
            />

            <div>
              <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                Tipo de Investimento *
              </label>
              <select
                value={newInvestment.type}
                onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value as InvestmentType })}
                required
                className='w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none'
              >
                {investmentTypes.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label='Ticker/Código'
              value={newInvestment.ticker}
              onChange={(e) => setNewInvestment({ ...newInvestment, ticker: e.target.value.toUpperCase() })}
              placeholder='Ex: PETR4, BTCUSD'
            />

            <div className='grid grid-cols-2 gap-4'>
              <Input
                label='Quantidade'
                type='number'
                step='0.01'
                value={newInvestment.quantity}
                onChange={(e) => setNewInvestment({ ...newInvestment, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
              <CurrencyInput
                label='Preço de Compra'
                value={newInvestment.purchase_price}
                onChange={(value) => setNewInvestment({ ...newInvestment, purchase_price: value })}
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <DateInput
                label='Data da Compra'
                value={newInvestment.purchase_date}
                onChange={(value) => setNewInvestment({ ...newInvestment, purchase_date: value })}
                required
              />
              <CurrencyInput
                label='Preço Atual'
                value={newInvestment.current_price}
                onChange={(value) => setNewInvestment({ ...newInvestment, current_price: value })}
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-on-surface-variant mb-1'>Conta *</label>
              <select
                value={newInvestment.account_id}
                onChange={(e) => setNewInvestment({ ...newInvestment, account_id: e.target.value })}
                required
                className='w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none'
              >
                <option value=''>Selecione uma conta</option>
                {accounts.map((account) => (
                  <option
                    key={account.$id}
                    value={account.$id}
                  >
                    {account.name} - {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='p-4 bg-surface-variant/20 flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type='submit'>Adicionar Investimento</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvestmentsPage;
