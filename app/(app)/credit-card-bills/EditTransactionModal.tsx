'use client';

import React, { useState } from 'react';
import { XIcon, Trash2Icon } from '@/components/assets/Icons';

interface EditTransactionModalProps {
  transaction: any;
  creditCard: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  creditCard,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    amount: transaction.amount || 0,
    category: transaction.category || '',
    description: transaction.description || '',
    merchant: transaction.merchant || '',
    date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [applyToFutureInstallments, setApplyToFutureInstallments] = useState(false);
  
  // Check if this is an installment transaction
  const isInstallment = transaction.installments && transaction.installments > 1;
  const hasRemainingInstallments = isInstallment && transaction.installment < transaction.installments;
  const remainingInstallments = hasRemainingInstallments 
    ? transaction.installments - transaction.installment 
    : 0;

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

      if (totalAmount <= 0) {
        setError('O valor deve ser maior que zero');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/credit-cards/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: totalAmount,
          category: formData.category,
          description: formData.description,
          merchant: formData.merchant,
          date: formData.date,
          applyToFutureInstallments: isInstallment && applyToFutureInstallments,
          creditCardId: transaction.credit_card_id,
          purchaseDate: transaction.credit_card_transaction_created_at,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar transação');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/credit-cards/transactions/${transaction.id}`, window.location.origin);
      if (isInstallment && applyToFutureInstallments) {
        url.searchParams.set('applyToFutureInstallments', 'true');
        url.searchParams.set('creditCardId', transaction.credit_card_id);
        url.searchParams.set('purchaseDate', transaction.credit_card_transaction_created_at);
      }
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir transação');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir transação');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Format currency display
  const formatCurrencyDisplay = (value: number): string => {
    if (value === 0) return '0,00';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-surface-container rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-on-surface'>Editar Transação</h2>
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
            {transaction.is_recurring && (
              <p className='text-xs text-tertiary mt-1 font-medium'>
                ⚠️ Esta é uma assinatura recorrente
              </p>
            )}
            {transaction.installments && transaction.installments > 1 && (
              <p className='text-xs text-secondary mt-1 font-medium'>
                ⚠️ Parcela {transaction.installment} de {transaction.installments}
              </p>
            )}
          </div>

          {error && (
            <div className='mb-4 p-3 bg-error/10 border border-error/20 rounded-lg'>
              <p className='text-sm text-error'>{error}</p>
            </div>
          )}

          {showDeleteConfirm ? (
            <div className='space-y-4'>
              <div className='p-4 bg-error/10 border border-error/20 rounded-lg'>
                <p className='text-sm text-on-surface font-medium mb-3'>
                  Tem certeza que deseja excluir esta transação?
                </p>
                <p className='text-xs text-on-surface-variant mb-4'>
                  Esta ação não pode ser desfeita.
                </p>
                
                {/* Option to delete future installments */}
                {hasRemainingInstallments && (
                  <div className='mb-4 p-3 bg-surface rounded-lg'>
                    <label className='flex items-start gap-3 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={applyToFutureInstallments}
                        onChange={(e) => setApplyToFutureInstallments(e.target.checked)}
                        className='mt-0.5 w-4 h-4 text-error bg-surface border-outline rounded focus:ring-2 focus:ring-error'
                      />
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-on-surface'>
                          Excluir também as próximas parcelas
                        </p>
                        <p className='text-xs text-on-surface-variant mt-1'>
                          Serão excluídas {remainingInstallments} parcela(s) restante(s)
                        </p>
                      </div>
                    </label>
                  </div>
                )}
                
                <div className='flex gap-3'>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className='flex-1 px-4 py-2 bg-surface-variant text-on-surface rounded-lg hover:bg-surface-variant/80 transition-colors'
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className='flex-1 px-4 py-2 bg-error text-on-error rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-on-surface mb-2'>
                    Valor *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                      R$
                    </span>
                    <input
                      type='text'
                      value={formatCurrencyDisplay(formData.amount)}
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
                      <option key={cat} value={cat}>
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

                {/* Option to apply to future installments */}
                {hasRemainingInstallments && (
                  <div className='p-3 bg-secondary/10 border border-secondary/20 rounded-lg'>
                    <label className='flex items-start gap-3 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={applyToFutureInstallments}
                        onChange={(e) => setApplyToFutureInstallments(e.target.checked)}
                        className='mt-0.5 w-4 h-4 text-secondary bg-surface border-outline rounded focus:ring-2 focus:ring-secondary'
                      />
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-on-surface'>
                          Aplicar para as próximas parcelas
                        </p>
                        <p className='text-xs text-on-surface-variant mt-1'>
                          Esta alteração será aplicada para as {remainingInstallments} parcela(s) restante(s) desta compra
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className='flex gap-3 mt-6'>
                <button
                  type='button'
                  onClick={() => setShowDeleteConfirm(true)}
                  className='px-4 py-2 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors flex items-center gap-2'
                >
                  <Trash2Icon className='w-4 h-4' />
                  Excluir
                </button>
                <div className='flex-1 flex gap-3'>
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
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;
