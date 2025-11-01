# 📝 Uso do Modal de Adicionar Transação

## Visão Geral

O `AddTransactionModal` é um componente React que fornece uma interface completa para criar transações, incluindo o novo tipo "Salário" com desconto automático de imposto.

## Características

- ✅ Suporte a todos os tipos de transação (Despesa, Receita, Salário, Transferência)
- ✅ Campo de imposto para transações de salário
- ✅ Cálculo automático do salário líquido
- ✅ Validações de formulário
- ✅ Feedback visual de recorrência para salários
- ✅ Seleção de categoria e conta
- ✅ Interface responsiva

## Importação

```typescript
import { AddTransactionModal } from '@/components/modals';
// ou
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
```

## Props

```typescript
interface AddTransactionModalProps {
  isOpen: boolean; // Controla visibilidade do modal
  onClose: () => void; // Callback ao fechar
  onSubmit: (data: CreateTransactionInput) => Promise<void>; // Callback ao submeter
  accounts: Array<{ $id: string; name: string }>; // Lista de contas disponíveis
}

interface CreateTransactionInput {
  amount: number; // Valor da transação
  type: 'income' | 'expense' | 'transfer' | 'salary'; // Tipo
  category: string; // Categoria
  description?: string; // Descrição opcional
  date: string; // Data (YYYY-MM-DD)
  accountId: string; // ID da conta
  taxAmount?: number; // Imposto (apenas para salary)
}
```

## Exemplo Básico

```typescript
'use client';

import { useState } from 'react';
import { AddTransactionModal, CreateTransactionInput } from '@/components/modals';
import { createTransactionAction } from '@/actions/transaction.actions';

export function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accounts, setAccounts] = useState([
    { $id: 'account1', name: 'Conta Corrente' },
    { $id: 'account2', name: 'Poupança' },
  ]);

  const handleSubmit = async (data: CreateTransactionInput) => {
    // Criar FormData para o server action
    const formData = new FormData();
    formData.append('amount', data.amount.toString());
    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('date', data.date);
    formData.append('account_id', data.accountId);

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.type === 'salary' && data.taxAmount) {
      formData.append('tax_amount', data.taxAmount.toString());
    }

    const result = await createTransactionAction(null, formData);

    if (!result.success) {
      throw new Error(result.error || 'Falha ao criar transação');
    }

    // Atualizar lista de transações ou revalidar
    console.log('Transação criada:', result.transaction);
  };

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Adicionar Transação
      </button>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        accounts={accounts}
      />
    </div>
  );
}
```

## Exemplo com Server Component

```typescript
// app/(app)/transactions/page.tsx
import { TransactionsClient } from './TransactionsClient';
import { getAccountsAction } from '@/actions/account.actions';

export default async function TransactionsPage() {
  // Buscar contas no servidor
  const accounts = await getAccountsAction();

  return <TransactionsClient accounts={accounts} />;
}
```

```typescript
// app/(app)/transactions/TransactionsClient.tsx
'use client';

import { useState } from 'react';
import { AddTransactionModal, CreateTransactionInput } from '@/components/modals';
import { createTransactionAction } from '@/actions/transaction.actions';
import { useRouter } from 'next/navigation';

interface TransactionsClientProps {
  accounts: Array<{ $id: string; name: string }>;
}

export function TransactionsClient({ accounts }: TransactionsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: CreateTransactionInput) => {
    const formData = new FormData();
    formData.append('amount', data.amount.toString());
    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('date', data.date);
    formData.append('account_id', data.accountId);

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.type === 'salary' && data.taxAmount) {
      formData.append('tax_amount', data.taxAmount.toString());
    }

    const result = await createTransactionAction(null, formData);

    if (!result.success) {
      throw new Error(result.error || 'Falha ao criar transação');
    }

    // Revalidar a página
    router.refresh();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transações</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Nova Transação
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        accounts={accounts}
      />

      {/* Lista de transações */}
    </div>
  );
}
```

## Exemplo com Toast de Sucesso

```typescript
'use client';

import { useState } from 'react';
import { AddTransactionModal, CreateTransactionInput } from '@/components/modals';
import { createTransactionAction } from '@/actions/transaction.actions';
import { useRouter } from 'next/navigation';

export function TransactionsWithToast() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const handleSubmit = async (data: CreateTransactionInput) => {
    try {
      const formData = new FormData();
      formData.append('amount', data.amount.toString());
      formData.append('type', data.type);
      formData.append('category', data.category);
      formData.append('date', data.date);
      formData.append('account_id', data.accountId);

      if (data.description) {
        formData.append('description', data.description);
      }

      if (data.type === 'salary' && data.taxAmount) {
        formData.append('tax_amount', data.taxAmount.toString());
      }

      const result = await createTransactionAction(null, formData);

      if (!result.success) {
        throw new Error(result.error || 'Falha ao criar transação');
      }

      // Mostrar toast de sucesso
      setToast({
        message: data.type === 'salary'
          ? 'Salário cadastrado com sucesso! Imposto criado automaticamente.'
          : 'Transação criada com sucesso!',
        type: 'success',
      });

      // Revalidar
      router.refresh();

      // Limpar toast após 3 segundos
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast({
        message: error.message,
        type: 'error',
      });

      setTimeout(() => setToast(null), 5000);
      throw error;
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg ${
          toast.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {toast.message}
        </div>
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Adicionar Transação
      </button>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        accounts={[
          { $id: 'account1', name: 'Conta Corrente' },
          { $id: 'account2', name: 'Poupança' },
        ]}
      />
    </div>
  );
}
```

## Validações

O modal inclui as seguintes validações:

1. **Valor**: Deve ser maior que zero
2. **Categoria**: Obrigatória
3. **Conta**: Obrigatória
4. **Imposto** (para salário): Não pode ser negativo
5. **Data**: Obrigatória

## Comportamento por Tipo

### Despesa / Receita

- Campos padrão: valor, categoria, data, conta, descrição

### Salário

- Campos adicionais: imposto retido
- Mostra cálculo do salário líquido
- Exibe aviso sobre recorrência automática
- Cria automaticamente transação de imposto

### Transferência

- Campos padrão (pode ser expandido para incluir conta de destino)

## Customização

### Alterar Categorias Padrão

O componente usa `CategorySelect` que pode ser customizado:

```typescript
// components/ui/CategorySelect.tsx
const categories = {
  income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Outros'],
  salary: ['Salário CLT', 'Salário PJ', 'Freelance Recorrente'],
  transfer: ['Transferência'],
};
```

### Alterar Estilos

O modal usa classes Tailwind CSS que podem ser customizadas:

```typescript
// Exemplo: Alterar cor do botão principal
<button
  type="submit"
  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
>
  Criar Transação
</button>
```

## Acessibilidade

- ✅ Navegação por teclado
- ✅ Labels associados aos inputs
- ✅ Mensagens de erro claras
- ✅ Foco automático no primeiro campo
- ✅ Escape para fechar

## Testes

```typescript
// __tests__/AddTransactionModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddTransactionModal } from '@/components/modals';

describe('AddTransactionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockAccounts = [
    { $id: 'account1', name: 'Conta Corrente' },
  ];

  it('should render when open', () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Adicionar Transação')).toBeInTheDocument();
  });

  it('should show tax field for salary type', () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        accounts={mockAccounts}
      />
    );

    const typeSelect = screen.getByLabelText('Tipo de Transação *');
    fireEvent.change(typeSelect, { target: { value: 'salary' } });

    expect(screen.getByText('Imposto Retido na Fonte')).toBeInTheDocument();
  });

  it('should calculate net salary', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        accounts={mockAccounts}
      />
    );

    // Selecionar tipo salário
    const typeSelect = screen.getByLabelText('Tipo de Transação *');
    fireEvent.change(typeSelect, { target: { value: 'salary' } });

    // Preencher valores
    // ... (implementar testes completos)
  });
});
```

## Recursos Relacionados

- [Documentação de Salário](./SALARY_TRANSACTIONS.md)
- [Exemplos de Uso](./SALARY_USAGE_EXAMPLES.md)
- [FAQ](./SALARY_FAQ.md)

## Suporte

Para dúvidas ou problemas:

1. Consulte o [FAQ](./SALARY_FAQ.md)
2. Revise os exemplos acima
3. Verifique a documentação do componente
