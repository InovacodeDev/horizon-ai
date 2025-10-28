'use client';

import React, { useState, useMemo } from 'react';
import { CreditCardIcon, CalendarIcon, DollarSignIcon, HelpCircleIcon } from '@/components/assets/Icons';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { useCreditCardsWithCache } from '@/hooks/useCreditCardsWithCache';

const CreditCardBillsPage: React.FC = () => {
  const { creditCards, loading, fetchCreditCards } = useCreditCardsWithCache();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Auto-select first card when loaded
  React.useEffect(() => {
    if (creditCards.length > 0 && !selectedCardId) {
      setSelectedCardId(creditCards[0].$id);
    }
  }, [creditCards, selectedCardId]);

  const selectedCard = useMemo(() => {
    return creditCards.find((card) => card.$id === selectedCardId);
  }, [creditCards, selectedCardId]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Parse card settings
  const getCardSettings = (card: any) => {
    try {
      const data = card.data ? JSON.parse(card.data) : {};
      return {
        closingDay: data.closing_day || 10,
        dueDay: data.due_day || 15,
        limit: data.limit || 0,
      };
    } catch {
      return {
        closingDay: 10,
        dueDay: 15,
        limit: 0,
      };
    }
  };

  if (loading) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='mb-6'>
          <Skeleton className='h-9 w-80 mb-2' />
          <Skeleton className='h-5 w-64' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <Skeleton className='h-24' />
          <Skeleton className='h-24' />
          <Skeleton className='h-24' />
        </div>
        <Skeleton className='h-96' />
      </div>
    );
  }

  if (creditCards.length === 0) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-on-surface'>Faturas do Cartão de Crédito</h1>
          <p className='text-on-surface-variant mt-1'>Gerencie suas faturas e parcelamentos</p>
        </div>

        <Card>
          <div className='p-12 text-center'>
            <CreditCardIcon className='w-16 h-16 text-on-surface-variant/30 mx-auto mb-4' />
            <p className='text-on-surface-variant text-lg mb-2'>Nenhum cartão de crédito cadastrado</p>
            <p className='text-on-surface-variant/70 text-sm'>
              Cadastre um cartão de crédito na página de Contas para começar a gerenciar suas faturas.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const settings = selectedCard ? getCardSettings(selectedCard) : null;

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-on-surface'>Faturas do Cartão de Crédito</h1>
        <p className='text-on-surface-variant mt-1'>Gerencie suas faturas e parcelamentos</p>
      </div>

      {/* Tabs for Credit Cards */}
      <div className='mb-6 border-b border-outline'>
        <div className='flex gap-2 overflow-x-auto'>
          {creditCards.map((card) => (
            <button
              key={card.$id}
              onClick={() => setSelectedCardId(card.$id)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                selectedCardId === card.$id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
              }`}
            >
              <div className='flex items-center gap-2'>
                <CreditCardIcon className='w-4 h-4' />
                {card.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedCard && settings && (
        <>
          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <Card className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-on-surface-variant'>Fatura Atual</p>
                  <p className='text-2xl font-bold text-on-surface'>R$ 0,00</p>
                  <p className='text-xs text-on-surface-variant mt-1'>Nenhuma transação</p>
                </div>
                <CreditCardIcon className='w-8 h-8 text-primary' />
              </div>
            </Card>

            <Card className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-on-surface-variant'>Próximo Vencimento</p>
                  <p className='text-2xl font-bold text-on-surface'>Dia {settings.dueDay}</p>
                  <p className='text-xs text-on-surface-variant mt-1'>Fechamento: Dia {settings.closingDay}</p>
                </div>
                <CalendarIcon className='w-8 h-8 text-secondary' />
              </div>
            </Card>

            <Card className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-on-surface-variant'>Limite Disponível</p>
                  <p className='text-2xl font-bold text-on-surface'>{formatCurrency(settings.limit)}</p>
                  <p className='text-xs text-on-surface-variant mt-1'>Limite total: {formatCurrency(settings.limit)}</p>
                </div>
                <DollarSignIcon className='w-8 h-8 text-tertiary' />
              </div>
            </Card>
          </div>

          {/* Bills List */}
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold text-on-surface'>Faturas de {selectedCard.name}</h2>
                <div className='flex items-center gap-2 text-sm text-on-surface-variant'>
                  <HelpCircleIcon className='w-4 h-4' />
                  <span>Sistema em desenvolvimento</span>
                </div>
              </div>

              <div className='text-center py-12'>
                <CreditCardIcon className='w-16 h-16 text-on-surface-variant/30 mx-auto mb-4' />
                <p className='text-on-surface-variant text-lg mb-2'>Nenhuma fatura encontrada</p>
                <p className='text-on-surface-variant/70 text-sm mb-4'>
                  As faturas serão geradas automaticamente quando você adicionar transações no cartão.
                </p>
                <div className='max-w-md mx-auto text-left bg-surface-variant/20 rounded-lg p-4 mt-6'>
                  <p className='text-sm font-medium text-on-surface mb-2'>Configurações do Cartão:</p>
                  <ul className='text-sm text-on-surface-variant space-y-1'>
                    <li>• Dia de fechamento: {settings.closingDay}</li>
                    <li>• Dia de vencimento: {settings.dueDay}</li>
                    <li>• Limite: {formatCurrency(settings.limit)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default CreditCardBillsPage;
