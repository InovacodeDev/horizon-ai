/**
 * Exemplo de Formulário de Cadastro de Salário
 * 
 * Este componente demonstra como criar um formulário para registrar
 * transações de salário com desconto de imposto automático.
 */

'use client';

import { useState } from 'react';
import { createTransactionAction } from '@/actions/transaction.actions';

interface SalaryFormProps {
  accounts: Array<{ $id: string; name: string }>;
  onSuccess?: () => void;
}

export function SalaryForm({ accounts, onSuccess }: SalaryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createTransactionAction(null, formData);
      
      if (result.success) {
        // Limpar formulário
        e.currentTarget.reset();
        onSuccess?.();
      } else {
        setError(result.error || 'Erro ao criar salário');
      }
    } catch (err) {
      setError('Erro inesperado ao criar salário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">Cadastrar Salário</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tipo de Transação (hidden) */}
      <input type="hidden" name="type" value="salary" />
      
      {/* Categoria (hidden) */}
      <input type="hidden" name="category" value="Salário" />

      {/* Valor do Salário */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">
          Valor do Salário Bruto *
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          step="0.01"
          min="0"
          required
          placeholder="5000.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Valor bruto do salário antes dos descontos
        </p>
      </div>

      {/* Imposto sobre Salário */}
      <div>
        <label htmlFor="tax_amount" className="block text-sm font-medium mb-1">
          Imposto Retido na Fonte
        </label>
        <input
          type="number"
          id="tax_amount"
          name="tax_amount"
          step="0.01"
          min="0"
          placeholder="750.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Valor do imposto descontado automaticamente. Uma transação de despesa será criada.
        </p>
      </div>

      {/* Data */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1">
          Data de Recebimento *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Conta */}
      <div>
        <label htmlFor="account_id" className="block text-sm font-medium mb-1">
          Conta de Destino *
        </label>
        <select
          id="account_id"
          name="account_id"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione uma conta</option>
          {accounts.map((account) => (
            <option key={account.$id} value={account.$id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Descrição
        </label>
        <input
          type="text"
          id="description"
          name="description"
          placeholder="Salário Janeiro 2024"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Informações sobre Recorrência */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Recorrência Automática</h3>
        <p className="text-sm text-blue-700">
          Este salário será automaticamente configurado como recorrente mensal sem data de término.
          Você poderá gerenciar as próximas ocorrências na seção de transações recorrentes.
        </p>
      </div>

      {/* Exemplo de Cálculo */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h3 className="font-medium text-gray-900 mb-2">💡 Exemplo de Cálculo</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <div className="flex justify-between">
            <span>Salário Bruto:</span>
            <span className="font-medium text-green-600">+ R$ 5.000,00</span>
          </div>
          <div className="flex justify-between">
            <span>Imposto Retido:</span>
            <span className="font-medium text-red-600">- R$ 750,00</span>
          </div>
          <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold">
            <span>Saldo Líquido:</span>
            <span className="text-blue-600">R$ 4.250,00</span>
          </div>
        </div>
      </div>

      {/* Botão de Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Cadastrando...' : 'Cadastrar Salário'}
      </button>
    </form>
  );
}

/**
 * Exemplo de uso do componente:
 * 
 * import { SalaryForm } from '@/components/forms/SalaryForm';
 * 
 * export default function SalaryPage() {
 *   const accounts = await getAccountsAction();
 * 
 *   return (
 *     <div className="max-w-2xl mx-auto p-6">
 *       <SalaryForm 
 *         accounts={accounts} 
 *         onSuccess={() => {
 *           console.log('Salário cadastrado com sucesso!');
 *           // Redirecionar ou atualizar lista
 *         }}
 *       />
 *     </div>
 *   );
 * }
 */
