'use client';

import React, { useState, useMemo } from 'react';
import { XIcon } from '@/components/assets/Icons';
import Button from '@/components/ui/Button';
import { useAccounts } from '@/hooks/useAccounts';

interface PayBillModalProps {
  bill: {
    month: string;
    year: number;
    totalAmount: number;
    closingDate: Date;
    dueDate: Date;
  };
  creditCard: {
    $id: string;
    name: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const PayBillModal: React.FC<PayBillModalProps> = ({ bill, creditCard, onClose, onSuccess }) => {
  const { accounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(() => {
    return accounts.find(acc => acc.$id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  const hasEnoughBalance = useMemo(() => {
    if (!selectedAccount) return false;
    return (selectedAccount.balance || 0) >= bill.totalAmount;
  }, [selectedAccount, bill.totalAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccountId) {
      setError('Selecione uma conta para pagamento');
      return;
    }

    if (!hasEnoughBalance) {
      setError('Saldo insuficiente na conta selecionada');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/credit-cards/bills/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credit_card_id: creditCard.$id,
          account_id: selectedAccountId,
          amount: bill.totalAmount,
          bill_month: bill.month,
          bill_year: bill.year,
          payment_date: paymentDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao pagar fatura');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao pagar fatura');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatMonthYear = (month: string, year: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-on-surface">Pagar Fatura</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-variant rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5 text-on-surface" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-on-surface-variant mb-1">Fatura de {creditCard.name}</p>
            <p className="text-xl font-bold text-on-surface mb-2">
              {formatMonthYear(bill.month, bill.year)}
            </p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(bill.totalAmount)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Conta para Pagamento *
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-surface-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.$id} value={account.$id}>
                    {account.name} - {formatCurrency(account.balance || 0)}
                  </option>
                ))}
              </select>
              {selectedAccount && !hasEnoughBalance && (
                <p className="text-xs text-error mt-1">
                  Saldo insuficiente. Faltam {formatCurrency(bill.totalAmount - (selectedAccount.balance || 0))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Data do Pagamento *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-3 bg-surface-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="bg-surface-variant/30 p-4 rounded-lg">
              <p className="text-xs text-on-surface-variant mb-2">
                ⚠️ Importante:
              </p>
              <ul className="text-xs text-on-surface-variant space-y-1">
                <li>• O valor será debitado da conta selecionada</li>
                <li>• Esta ação não pode ser desfeita</li>
                <li>• O saldo da conta será atualizado imediatamente</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outlined"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="filled"
                className="flex-1"
                disabled={isSubmitting || !hasEnoughBalance}
              >
                {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayBillModal;
