# Exemplos de Uso - Transação de Salário

## 📝 Exemplos Práticos

### Exemplo 1: Salário Simples (sem imposto)

```typescript
import { TransactionService } from '@/lib/services/transaction.service';

const transactionService = new TransactionService();

const salary = await transactionService.createManualTransaction({
  userId: 'user_123',
  amount: 3000.0,
  type: 'salary',
  date: '2024-01-05',
  category: 'Salário',
  description: 'Salário Janeiro 2024',
  currency: 'BRL',
  accountId: 'account_456',
  status: 'completed',
});

console.log('Salário criado:', salary.$id);
// Resultado: Uma transação de salário recorrente mensal
```

### Exemplo 2: Salário com Imposto

```typescript
const salaryWithTax = await transactionService.createManualTransaction({
  userId: 'user_123',
  amount: 5000.0,
  type: 'salary',
  date: '2024-01-05',
  category: 'Salário',
  description: 'Salário Janeiro 2024',
  currency: 'BRL',
  accountId: 'account_456',
  taxAmount: 750.0, // 15% de imposto
  status: 'completed',
});

console.log('Salário criado:', salaryWithTax.$id);
// Resultado: Duas transações criadas (salário + imposto)
```

### Exemplo 3: Usando Server Action

```typescript
'use server';

import { createTransactionAction } from '@/actions/transaction.actions';

export async function handleSalarySubmit(formData: FormData) {
  const result = await createTransactionAction(null, formData);

  if (result.success) {
    console.log('Salário cadastrado com sucesso!');
    return { success: true, transactionId: result.transaction.id };
  } else {
    console.error('Erro:', result.error);
    return { success: false, error: result.error };
  }
}
```

### Exemplo 4: Formulário React

```tsx
'use client';

import { useState } from 'react';
import { createTransactionAction } from '@/actions/transaction.actions';

export function QuickSalaryForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createTransactionAction(null, formData);

    if (result.success) {
      alert('Salário cadastrado!');
      e.currentTarget.reset();
    } else {
      alert(`Erro: ${result.error}`);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="type" value="salary" />
      <input type="hidden" name="category" value="Salário" />

      <input
        type="number"
        name="amount"
        placeholder="Valor do salário"
        required
      />

      <input
        type="number"
        name="tax_amount"
        placeholder="Imposto (opcional)"
      />

      <input
        type="date"
        name="date"
        required
      />

      <select name="account_id" required>
        <option value="">Selecione a conta</option>
        {/* Adicione suas contas aqui */}
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Salário'}
      </button>
    </form>
  );
}
```

### Exemplo 5: Atualizar Salário

```typescript
// Atualizar valor do salário e imposto
await transactionService.updateTransaction('salary_123', {
  amount: 5500.0, // Novo valor do salário
  taxAmount: 825.0, // Novo valor do imposto (15%)
  description: 'Salário Janeiro 2024 - Ajustado',
});

console.log('Salário atualizado!');
// A transação de imposto vinculada também é atualizada automaticamente
```

### Exemplo 6: Deletar Salário

```typescript
// Deletar salário (o imposto é deletado automaticamente)
await transactionService.deleteTransaction('salary_123');

console.log('Salário e imposto deletados!');
```

### Exemplo 7: Buscar Salários

```typescript
// Buscar todas as transações de salário
const { transactions } = await transactionService.listTransactions({
  userId: 'user_123',
  type: 'salary',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

console.log(`Encontrados ${transactions.length} salários`);

transactions.forEach((salary) => {
  console.log(`${salary.date}: R$ ${salary.amount}`);
});
```

### Exemplo 8: Calcular Total de Impostos

```typescript
// Buscar todas as transações de imposto sobre salário
const { transactions: taxTransactions } = await transactionService.listTransactions({
  userId: 'user_123',
  type: 'expense',
  category: 'Impostos',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

const totalTax = taxTransactions.reduce((sum, tx) => sum + tx.amount, 0);

console.log(`Total de impostos pagos em 2024: R$ ${totalTax.toFixed(2)}`);
```

### Exemplo 9: Verificar Transação Vinculada

```typescript
// Obter salário e sua transação de imposto vinculada
const salary = await transactionService.getTransactionById('salary_123');

if (salary) {
  const salaryData = JSON.parse(salary.data || '{}');
  const linkedTaxId = salaryData.linked_transaction_id;

  if (linkedTaxId) {
    const taxTransaction = await transactionService.getTransactionById(linkedTaxId);
    console.log('Imposto vinculado:', taxTransaction);
  }
}
```

### Exemplo 10: Criar Múltiplos Salários

```typescript
// Criar salários para vários meses
const months = [
  { date: '2024-01-05', description: 'Janeiro' },
  { date: '2024-02-05', description: 'Fevereiro' },
  { date: '2024-03-05', description: 'Março' },
];

for (const month of months) {
  await transactionService.createManualTransaction({
    userId: 'user_123',
    amount: 5000.0,
    type: 'salary',
    date: month.date,
    category: 'Salário',
    description: `Salário ${month.description} 2024`,
    currency: 'BRL',
    accountId: 'account_456',
    taxAmount: 750.0,
    status: 'completed',
  });

  console.log(`Salário de ${month.description} criado!`);
}
```

## 🎯 Casos de Uso Comuns

### Caso 1: Funcionário CLT

```typescript
// Salário mensal com descontos de IRRF
const cltSalary = {
  amount: 4500.0, // Salário bruto
  taxAmount: 450.0, // IRRF (10%)
  type: 'salary',
  category: 'Salário',
  description: 'Salário CLT',
};
```

### Caso 2: Freelancer com Retenção

```typescript
// Pagamento de projeto com retenção de imposto
const freelanceSalary = {
  amount: 8000.0, // Valor do projeto
  taxAmount: 1200.0, // Retenção na fonte (15%)
  type: 'salary',
  category: 'Freelance',
  description: 'Projeto XYZ',
};
```

### Caso 3: Servidor Público

```typescript
// Salário de servidor com múltiplos descontos
const publicServantSalary = {
  amount: 6000.0, // Salário bruto
  taxAmount: 900.0, // IRRF + contribuições
  type: 'salary',
  category: 'Salário Público',
  description: 'Salário Servidor',
};
```

## 💰 Cálculos de Imposto

### Tabela IRRF 2024 (Exemplo)

```typescript
function calculateIRRF(grossSalary: number): number {
  if (grossSalary <= 2112.0) return 0;
  if (grossSalary <= 2826.65) return grossSalary * 0.075 - 158.4;
  if (grossSalary <= 3751.05) return grossSalary * 0.15 - 370.4;
  if (grossSalary <= 4664.68) return grossSalary * 0.225 - 651.73;
  return grossSalary * 0.275 - 884.96;
}

// Exemplo de uso
const grossSalary = 5000.0;
const taxAmount = calculateIRRF(grossSalary);

await transactionService.createManualTransaction({
  userId: 'user_123',
  amount: grossSalary,
  type: 'salary',
  taxAmount: Math.max(0, taxAmount), // Garantir que não seja negativo
  // ... outros campos
});
```

## 🔍 Consultas Úteis

### Total de Salários no Ano

```typescript
async function getTotalSalariesYear(userId: string, year: number) {
  const { transactions } = await transactionService.listTransactions({
    userId,
    type: 'salary',
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  });

  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

const total = await getTotalSalariesYear('user_123', 2024);
console.log(`Total de salários em 2024: R$ ${total.toFixed(2)}`);
```

### Total de Impostos no Ano

```typescript
async function getTotalTaxesYear(userId: string, year: number) {
  const { transactions } = await transactionService.listTransactions({
    userId,
    type: 'expense',
    category: 'Impostos',
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  });

  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

const totalTax = await getTotalTaxesYear('user_123', 2024);
console.log(`Total de impostos em 2024: R$ ${totalTax.toFixed(2)}`);
```

### Salário Líquido Médio

```typescript
async function getAverageNetSalary(userId: string, year: number) {
  const totalGross = await getTotalSalariesYear(userId, year);
  const totalTax = await getTotalTaxesYear(userId, year);

  const { transactions } = await transactionService.listTransactions({
    userId,
    type: 'salary',
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  });

  const months = transactions.length;
  const averageNet = (totalGross - totalTax) / months;

  return {
    averageGross: totalGross / months,
    averageTax: totalTax / months,
    averageNet,
  };
}

const avg = await getAverageNetSalary('user_123', 2024);
console.log(`Salário líquido médio: R$ ${avg.averageNet.toFixed(2)}`);
```

## 🎨 Componente de Visualização

```tsx
'use client';

interface SalaryDisplayProps {
  grossAmount: number;
  taxAmount: number;
}

export function SalaryDisplay({ grossAmount, taxAmount }: SalaryDisplayProps) {
  const netAmount = grossAmount - taxAmount;
  const taxPercentage = (taxAmount / grossAmount) * 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Detalhes do Salário</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Salário Bruto:</span>
          <span className="font-semibold text-green-600">
            R$ {grossAmount.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">
            Imposto ({taxPercentage.toFixed(1)}%):
          </span>
          <span className="font-semibold text-red-600">
            - R$ {taxAmount.toFixed(2)}
          </span>
        </div>

        <div className="border-t pt-3 flex justify-between">
          <span className="font-bold">Salário Líquido:</span>
          <span className="font-bold text-blue-600 text-xl">
            R$ {netAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Barra de progresso visual */}
      <div className="mt-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${100 - taxPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {(100 - taxPercentage).toFixed(1)}% líquido
        </p>
      </div>
    </div>
  );
}
```

## 📊 Relatório de Salários

```tsx
'use client';

import { useState, useEffect } from 'react';

export function SalaryReport({ userId }: { userId: string }) {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSalaries() {
      const response = await fetch(`/api/transactions?type=salary&userId=${userId}`);
      const data = await response.json();
      setSalaries(data.transactions);
      setLoading(false);
    }

    loadSalaries();
  }, [userId]);

  if (loading) return <div>Carregando...</div>;

  const totalGross = salaries.reduce((sum, s) => sum + s.amount, 0);
  const totalTax = salaries.reduce((sum, s) => sum + (s.taxAmount || 0), 0);
  const totalNet = totalGross - totalTax;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Relatório de Salários</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Bruto</p>
          <p className="text-2xl font-bold text-green-600">
            R$ {totalGross.toFixed(2)}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Impostos</p>
          <p className="text-2xl font-bold text-red-600">
            R$ {totalTax.toFixed(2)}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Líquido</p>
          <p className="text-2xl font-bold text-blue-600">
            R$ {totalNet.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-right">Bruto</th>
              <th className="px-4 py-2 text-right">Imposto</th>
              <th className="px-4 py-2 text-right">Líquido</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((salary) => (
              <tr key={salary.id} className="border-t">
                <td className="px-4 py-2">
                  {new Date(salary.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right text-green-600">
                  R$ {salary.amount.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right text-red-600">
                  R$ {(salary.taxAmount || 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right font-semibold">
                  R$ {(salary.amount - (salary.taxAmount || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## 🚀 Próximos Passos

1. Execute a migração do banco de dados
2. Teste a criação de salários
3. Implemente o formulário na sua aplicação
4. Adicione validações personalizadas
5. Crie relatórios e dashboards

Para mais informações, consulte:

- [Documentação Completa](./SALARY_TRANSACTIONS.md)
- [Exemplo de Formulário](./SALARY_FORM_EXAMPLE.tsx)
- [Resumo da Feature](./SALARY_FEATURE_SUMMARY.md)
