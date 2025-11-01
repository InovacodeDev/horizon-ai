# Resumo: Feature de Transação de Salário

## 📋 Visão Geral

Foi implementado um novo tipo de transação chamado **"Salário"** que automaticamente:

- É configurado como recorrente mensal sem data de término
- Cria uma transação de imposto vinculada quando um valor de imposto é informado
- Mantém as duas transações sincronizadas (salário e imposto)

## 🎯 Características Principais

### 1. Novo Tipo de Transação

- **Tipo**: `salary`
- **Recorrência**: Automática mensal sem fim
- **Imposto**: Campo opcional que cria transação de despesa automaticamente

### 2. Transação de Imposto Automática

Quando um salário é criado com `taxAmount`:

- Uma transação de despesa é criada automaticamente
- Categoria: "Impostos"
- Descrição: "Imposto sobre salário - [descrição do salário]"
- Também é recorrente mensal
- Vinculada à transação de salário

### 3. Sincronização Automática

- **Criação**: Salário + Imposto criados juntos
- **Atualização**: Atualizar imposto do salário atualiza a transação de imposto
- **Exclusão**: Deletar salário deleta o imposto automaticamente

## 📁 Arquivos Modificados

### Schema e Tipos

- ✅ `lib/appwrite/schema.ts` - Adicionado tipo 'salary' ao enum
- ✅ `lib/types/index.ts` - Atualizado TransactionType
- ✅ `lib/services/transaction.service.ts` - Lógica de criação/atualização/exclusão

### Actions

- ✅ `actions/transaction.actions.ts` - Suporte ao campo tax_amount

### Componentes

- ✅ `components/examples/CreateTransactionForm.tsx` - Adicionado campo de imposto

### Documentação

- ✅ `docs/SALARY_TRANSACTIONS.md` - Documentação completa
- ✅ `docs/SALARY_FORM_EXAMPLE.tsx` - Exemplo de formulário
- ✅ `docs/SALARY_FEATURE_SUMMARY.md` - Este arquivo

### Scripts

- ✅ `scripts/migrate-add-salary-type.ts` - Script de migração

## 🚀 Como Usar

### 1. Migração do Banco de Dados

Execute o script de migração para verificar o status:

```bash
npx tsx scripts/migrate-add-salary-type.ts
```

Ou atualize manualmente no Appwrite Console:

1. Acesse a collection `transactions`
2. Edite o atributo `type`
3. Adicione `salary` aos elementos do enum

### 2. Criar um Salário

```typescript
import { createTransactionAction } from '@/actions/transaction.actions';

const formData = new FormData();
formData.append('amount', '5000.00'); // Salário bruto
formData.append('type', 'salary');
formData.append('category', 'Salário');
formData.append('description', 'Salário Janeiro 2024');
formData.append('date', '2024-01-05');
formData.append('account_id', 'account123');
formData.append('tax_amount', '750.00'); // Imposto (opcional)

const result = await createTransactionAction(null, formData);
```

### 3. Usar o Componente de Exemplo

```tsx
import { SalaryForm } from '@/docs/SALARY_FORM_EXAMPLE';

export default function SalaryPage() {
  const accounts = await getAccountsAction();

  return (
    <SalaryForm
      accounts={accounts}
      onSuccess={() => {
        console.log('Salário cadastrado!');
      }}
    />
  );
}
```

## 💡 Exemplo Prático

### Entrada

```typescript
{
  amount: 5000.00,
  type: 'salary',
  taxAmount: 750.00,
  date: '2024-01-05',
  accountId: 'account123'
}
```

### Resultado

Duas transações criadas:

**1. Salário (Income)**

```json
{
  "id": "salary_123",
  "amount": 5000.0,
  "type": "salary",
  "category": "Salário",
  "is_recurring": true,
  "recurring_pattern": {
    "frequency": "monthly",
    "interval": 1
  },
  "data": {
    "linked_transaction_id": "tax_456"
  }
}
```

**2. Imposto (Expense)**

```json
{
  "id": "tax_456",
  "amount": 750.0,
  "type": "expense",
  "category": "Impostos",
  "description": "Imposto sobre salário - Salário Janeiro 2024",
  "is_recurring": true,
  "data": {
    "linked_transaction_id": "salary_123"
  }
}
```

### Impacto no Saldo

- Entrada: +R$ 5.000,00 (salário)
- Saída: -R$ 750,00 (imposto)
- **Saldo líquido: +R$ 4.250,00**

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    Criar Salário                            │
│  amount: 5000, taxAmount: 750                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         TransactionService.createManualTransaction          │
│  - Define type = 'salary'                                   │
│  - Define isRecurring = true                                │
│  - Define recurringPattern = monthly                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Cria Transação de Salário                      │
│  ID: salary_123                                             │
│  Amount: 5000                                               │
│  Type: salary                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Se taxAmount > 0, cria Transação de Imposto         │
│  ID: tax_456                                                │
│  Amount: 750                                                │
│  Type: expense                                              │
│  Category: Impostos                                         │
│  linked_transaction_id: salary_123                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Atualiza Salário com Link para Imposto              │
│  data.linked_transaction_id = tax_456                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Sincroniza Saldo da Conta                      │
│  Balance += 5000 (salário)                                  │
│  Balance -= 750 (imposto)                                   │
│  Net: +4250                                                 │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Checklist de Implementação

- [x] Atualizar schema do Appwrite (tipo 'salary')
- [x] Atualizar tipos TypeScript
- [x] Implementar lógica de criação com imposto
- [x] Implementar lógica de atualização
- [x] Implementar lógica de exclusão em cascata
- [x] Atualizar actions
- [x] Atualizar componente de exemplo
- [x] Criar documentação
- [x] Criar script de migração

## 🧪 Testes Sugeridos

1. **Criar salário sem imposto**
   - Verificar que é criado como recorrente mensal
   - Verificar que não cria transação de imposto

2. **Criar salário com imposto**
   - Verificar que cria duas transações
   - Verificar que estão vinculadas
   - Verificar saldo da conta

3. **Atualizar valor do imposto**
   - Verificar que atualiza a transação de imposto
   - Verificar sincronização de saldo

4. **Deletar salário**
   - Verificar que deleta o imposto também
   - Verificar sincronização de saldo

5. **Criar salário com imposto zero**
   - Verificar que não cria transação de imposto

## 📚 Referências

- [Documentação Completa](./SALARY_TRANSACTIONS.md)
- [Exemplo de Formulário](./SALARY_FORM_EXAMPLE.tsx)
- [Script de Migração](../scripts/migrate-add-salary-type.ts)

## 🎉 Conclusão

A feature de transação de salário está completa e pronta para uso. Ela simplifica o registro de salários com descontos de impostos, mantendo tudo sincronizado automaticamente.
