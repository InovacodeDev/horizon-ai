'use client';

import React, { useState } from 'react';
import { XIcon } from '@/components/assets/Icons';

interface CreateTransactionModalProps {
  creditCard: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({ creditCard, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: 0,
    category: '',
    description: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const totalAmount = formData.amount;
      const installments = parseInt(formData.installments);

      if (totalAmount <= 0) {
        setError('O valor deve ser maior que zero');
        setLoading(false);
        return;
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

      onSuccess();
      onClose();
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-surface-container rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-on-surface'>Nova Transação</h2>
            <button
              onClick={onClose}
              className='p-2 hover:bg-surface-variant rounded-lg transition-colors'
            >
              <XIcon className='w-5 h-5 text-on-surface-variant' />
            </button>
          </div>

          <div className='mb-4 p-3 bg-primary/10 rounded-lg'>
            <p className='text-sm text-on-surface'>
              <span className='font-medium'>Cartão:</span> {creditCard.name}
            </p>
            <p className='text-xs text-on-surface-variant mt-1'>
              Final {creditCard.last_digits}
            </p>
          </div>

          {error && (
            <div className='mb-4 p-3 bg-error/10 border border-error/20 rounded-lg'>
              <p className='text-sm text-error'>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-on-surface mb-2'>
                  Valor Total *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    R$
                  </span>
                  <input
                    type='text'
                    value={formData.amount === 0 ? '0,00' : formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    onChange={(e) => {
                      const input = e.target.value;
                      const numericOnly = input.replace(/\D/g, '');
                      if (numericOnly === '') {
                        setFormData({ ...formData, amount: 0 });
                        return;
                      }
                      const cents = parseInt(numericOnly, 10);
                      const valueInReais = cents / 100;
                      setFormData({ ...formData, amount: valueInReais });
                    }}
                    required
                    placeholder='0,00'
                    className='w-full pl-12 pr-4 py-2 bg-surface border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface'
                  />
                </div>
              </div>

              <div>
                <label className='flex items-center gap-2 mb-4 cursor-pointer'>
                  <input
                    type='checkbox'
                    name='isRecurring'
                    checked={formData.isRecurring}
                    onChange={handleChange}
                    className='w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary'
                  />
                  <span className='text-sm font-medium text-on-surface'>
                    Assinatura Recorrente
                  </span>
                </label>
              </div>

              {formData.isRecurring ? (
                <div>
                  <label className='block text-sm font-medium text-on-surface mb-2'>
                    Dia da Cobrança *
                  </label>
                  <select
                    name='recurringDay'
                    value={formData.recurringDay}
                    onChange={handleChange}
                    required
                    className='w-full px-4 py-2 bg-surface border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface'
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
                <div>
                  <label className='block text-sm font-medium text-on-surface mb-2'>
                    Parcelamento *
                  </label>
                  <select
                    name='installments'
                    value={formData.installments}
                    onChange={handleChange}
                    required
                    className='w-full px-4 py-2 bg-surface border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface'
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

              <div>
                <label className='block text-sm font-medium text-on-surface mb-2'>
                  Categoria *
                </label>
                <select
                  name='category'
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-2 bg-surface border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface'
                >
                  <option value=''>Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                    >
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-on-surface mb-2'>
                  Estabelecimento
                </label>
                <input
                  type='text'
                  name='merchant'
                  value={formData.merchant}
                  onChange={handleChange}
                  placeholder='Nome do estabelecimento'
                  className='w-full px-4 py-2 bg-surface border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-on-surface mb-2'>
                  Descrição
                </label>
                <textarea
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder='Descrição da transação'
                  className='w-full px-4 py-2 bg-surface border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface resize-none'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-on-surface mb-2'>
                  Data *
                </label>
                <input
                  type='date'
                  name='date'
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-2 bg-surface border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-on-surface'
                />
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 px-4 py-2 bg-surface-variant text-on-surface rounded-lg hover:bg-surface-variant/80 transition-colors'
              >
                Cancelar
              </button>
              <button
                type='submit'
                disabled={loading}
                className='flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Criando...' : 'Criar Transação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTransactionModal;
