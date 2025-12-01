'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import CategorySelect from '@/components/ui/CategorySelect';
import { getCurrentDateInUserTimezone } from '@/lib/utils/timezone';

interface CreateTransactionModalProps {
  creditCard: any;
  onClose: () => void;
  onSuccess: (options?: { silent?: boolean }) => void;
}

const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({ creditCard, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: 0,
    category: '',
    description: '',
    merchant: '',
    date: getCurrentDateInUserTimezone(),
    installments: '1',
    isRecurring: false,
    recurringDay: '1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse card settings to get closing day
  const getCardSettings = () => {
    try {
      const data = creditCard.data ? JSON.parse(creditCard.data) : {};
      return {
        closingDay: creditCard.closing_day || data.closing_day || 10,
        dueDay: creditCard.due_day || data.due_day || 15,
      };
    } catch {
      return {
        closingDay: creditCard.closing_day || 10,
        dueDay: creditCard.due_day || 15,
      };
    }
  };

  const cardSettings = getCardSettings();

  // Calculate which bill the first installment will fall into
  const getFirstInstallmentBillInfo = () => {
    // Parse date in YYYY-MM-DD format to avoid timezone issues
    const [purchaseYear, purchaseMonth, purchaseDay] = formData.date.split('-').map(Number);

    let billMonth = purchaseMonth - 1; // Convert to 0-indexed
    let billYear = purchaseYear;

    // If purchase is on or after closing day, first installment goes to next month's bill
    if (purchaseDay >= cardSettings.closingDay) {
      billMonth += 1;
      if (billMonth > 11) {
        billMonth = 0;
        billYear += 1;
      }
    }

    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return {
      month: months[billMonth],
      year: billYear,
      isNextMonth: purchaseDay >= cardSettings.closingDay,
    };
  };

  const firstBillInfo = getFirstInstallmentBillInfo();
  const installmentCount = parseInt(formData.installments) || 1;
  const totalAmount = formData.amount;
  const installmentAmount = installmentCount > 1 ? totalAmount / installmentCount : totalAmount;

  const categories = [
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Compras',
    'Serviços',
    'Viagem',
    'Outros',
  ];

  const submitTransaction = async () => {
    const totalAmount = formData.amount;
    const installments = parseInt(formData.installments);

    if (totalAmount <= 0) {
      throw new Error('O valor deve ser maior que zero');
    }

    if (formData.isRecurring) {
      // Recurring subscription
      const response = await fetch('/api/credit-cards/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credit_card_id: creditCard.$id,
          amount: totalAmount,
          category: formData.category,
          account_id: creditCard.account_id,
          description: formData.description,
          merchant: formData.merchant,
          recurring_day: parseInt(formData.recurringDay),
          start_date: formData.date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar assinatura recorrente');
      }
    } else if (installments === 1) {
      // Single transaction - use credit card transactions API
      // Calculate bill date based on purchase date and closing day
      // Parse date in YYYY-MM-DD format to avoid timezone issues
      const [purchaseYear, purchaseMonth, purchaseDay] = formData.date.split('-').map(Number);
      let billMonth = purchaseMonth - 1; // Convert to 0-indexed
      let billYear = purchaseYear;
      
      // If purchase is on or after closing day, it goes to next month's bill
      if (purchaseDay >= cardSettings.closingDay) {
        billMonth += 1;
        if (billMonth > 11) {
          billMonth = 0;
          billYear += 1;
        }
      }
      
      const billDate = new Date(billYear, billMonth, cardSettings.dueDay);
      
      const response = await fetch('/api/credit-cards/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credit_card_id: creditCard.$id,
          amount: totalAmount,
          category: formData.category,
          description: formData.description,
          merchant: formData.merchant,
          date: billDate.toISOString().split('T')[0],
          purchase_date: formData.date,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar transação');
      }
    } else {
      // Create installment plan
      const response = await fetch('/api/credit-cards/installments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credit_card_id: creditCard.$id,
          total_amount: totalAmount,
          installments: installments,
          category: formData.category,
          account_id: creditCard.account_id,
          description: formData.description,
          merchant: formData.merchant,
          purchase_date: formData.date,
          closing_day: cardSettings.closingDay,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar parcelamento');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitTransaction();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndCreateNew = async () => {
    setLoading(true);
    setError(null);

    try {
      await submitTransaction();
      onSuccess({ silent: true });
      
      // Reset form
      setFormData({
        amount: 0,
        category: '',
        description: '',
        merchant: '',
        date: getCurrentDateInUserTimezone(),
        installments: '1',
        isRecurring: false,
        recurringDay: '1',
      });
      
      // Focus amount field
      setTimeout(() => {
        const amountInput = document.getElementById('amount');
        if (amountInput) {
          amountInput.focus();
        }
      }, 100);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao criar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nova Transação de Cartão" maxWidth="xl">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
        <div className="p-6 overflow-y-auto flex-1">
          <div className='mb-4 p-3 bg-primary/10 rounded-lg'>
            <p className='text-sm text-on-surface'>
              <span className='font-medium'>Cartão:</span> {creditCard.name}
            </p>
            <p className='text-xs text-on-surface-variant mt-1'>
              Final {creditCard.last_digits}
            </p>
          </div>

          {error && (
            <div className='mb-4 bg-red-bg border border-red-border text-red-text px-4 py-3.5 rounded-lg flex items-start gap-3'>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className='text-sm leading-relaxed'>{error}</p>
            </div>
          )}

          {/* Two Column Grid */}
          <div className='grid grid-cols-2 gap-4'>
            <CurrencyInput
              label="Valor Total"
              id="amount"
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
              required
            />

            <div>
              <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                Data da Compra
              </label>
              <input
                type='date'
                name='date'
                value={formData.date}
                onChange={handleChange}
                required
                className='w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none'
              />
            </div>
          </div>

          {/* Recurring Checkbox - Full Width */}
          <div className='mt-4'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                name='isRecurring'
                checked={formData.isRecurring}
                onChange={handleChange}
                className='w-5 h-5 rounded border-outline text-primary focus:ring-2 focus:ring-primary'
              />
              <span className='text-sm font-medium text-on-surface'>
                Assinatura Recorrente
              </span>
            </label>
            <p className='text-xs text-on-surface-variant mt-1 ml-7'>
              Marque se esta é uma assinatura que se repete mensalmente
            </p>
          </div>

          {/* Conditional Fields */}
          <div className='grid grid-cols-2 gap-4 mt-4'>

            {formData.isRecurring ? (
              <div className='col-span-2'>
                <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                  Dia da Cobrança *
                </label>
                <select
                  name='recurringDay'
                  value={formData.recurringDay}
                  onChange={handleChange}
                  required
                  className='w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none'
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Dia {day} de cada mês
                    </option>
                  ))}
                </select>
                <p className='text-xs text-on-surface-variant mt-2'>
                  A transação será criada automaticamente todo dia {formData.recurringDay} do mês
                </p>
              </div>
            ) : (
              <div className='col-span-2'>
                <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                  Parcelamento *
                </label>
                <select
                  name='installments'
                  value={formData.installments}
                  onChange={handleChange}
                  required
                  className='w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none'
                >
                  <option value='1'>À vista</option>
                  {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
                    <option
                      key={num}
                      value={num}
                    >
                      {num}x de {totalAmount > 0 ? (totalAmount / num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                    </option>
                  ))}
                </select>
                {installmentCount > 1 && (
                  <p className='text-xs text-on-surface-variant mt-2'>
                    {firstBillInfo.isNextMonth ? (
                      <>
                        Compra após o fechamento (dia {cardSettings.closingDay}). 
                        Primeira parcela na fatura de <span className='font-medium'>{firstBillInfo.month}/{firstBillInfo.year}</span>
                      </>
                    ) : (
                      <>
                        Compra antes do fechamento (dia {cardSettings.closingDay}). 
                        Primeira parcela na fatura de <span className='font-medium'>{firstBillInfo.month}/{firstBillInfo.year}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            <CategorySelect
              label="Categoria"
              id="category"
              value={formData.category}
              onChange={(categoryId) => setFormData({ ...formData, category: categoryId })}
              type='expense'
              required
            />

            <Input
              label="Estabelecimento"
              id="merchant"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              placeholder='Nome do estabelecimento'
            />
          </div>

          {/* Description - Full Width */}
          <div className='mt-4'>
            <label className='block text-sm font-medium text-on-surface-variant mb-1'>
              Descrição
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder='Descrição da transação (opcional)'
              className='w-full p-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none'
            />
          </div>
        </div>

        <div className="p-4 bg-surface-variant/20 flex justify-end gap-3 border-t border-outline sticky bottom-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveAndCreateNew} disabled={loading}>
            Salvar e Criar Nova
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Transação'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTransactionModal;
