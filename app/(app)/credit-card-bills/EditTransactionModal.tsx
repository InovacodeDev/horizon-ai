'use client';

import React, { useState } from 'react';
import { Trash2Icon } from '@/components/assets/Icons';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import CategorySelect from '@/components/ui/CategorySelect';

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
    <Modal isOpen={true} onClose={onClose} title="Editar Transação de Cartão" maxWidth="xl">
      {showDeleteConfirm ? (
        <div className='p-6'>
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
                      className='mt-0.5 w-5 h-5 text-error bg-surface border-outline rounded focus:ring-2 focus:ring-error'
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
            </div>
          </div>
          
          <div className='p-4 bg-surface-variant/20 flex justify-end gap-3 border-t border-outline sticky bottom-0'>
            <Button variant="outlined" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={loading}
              className="bg-error text-on-error hover:bg-error/90"
            >
              {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <div className="p-6 overflow-y-auto flex-1">
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

            {/* Two Column Grid */}
            <div className='grid grid-cols-2 gap-4'>
              <CurrencyInput
                label="Valor"
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                required
              />

              <div>
                <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                  Data
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

            {/* Option to apply to future installments */}
            {hasRemainingInstallments && (
              <div className='mt-4 p-3 bg-secondary/10 border border-secondary/20 rounded-lg'>
                <label className='flex items-start gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={applyToFutureInstallments}
                    onChange={(e) => setApplyToFutureInstallments(e.target.checked)}
                    className='mt-0.5 w-5 h-5 text-secondary bg-surface border-outline rounded focus:ring-2 focus:ring-secondary'
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

          <div className='p-4 bg-surface-variant/20 flex justify-between gap-3 border-t border-outline sticky bottom-0'>
            <Button
              type='button'
              onClick={() => setShowDeleteConfirm(true)}
              className='bg-error/10 text-error hover:bg-error/20'
            >
              <Trash2Icon className='w-4 h-4 mr-2' />
              Excluir
            </Button>
            <div className='flex gap-3'>
              <Button type="button" variant="outlined" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditTransactionModal;
