# Transações de Salário

## Visão Geral

O tipo de transação "Salário" foi criado para facilitar o registro de receitas salariais com desconto automático de impostos na fonte.

## Características

### 1. Tipo de Transação

- **Tipo**: `salary`
- **Categoria padrão**: Pode ser definida pelo usuário (ex: "Salário", "Remuneração")
- **Recorrência**: Automaticamente configurada como mensal sem data de término

### 2. Recorrência Automática

Quando uma transação do tipo `salary` é criada:

- `isRecurring` é automaticamente definido como `true`
- `recurringPattern` é configurado como:
  ```typescript
  {
    frequency: 'monthly',
    interval: 1,
    // Sem endDate - salário é indefinido
  }
  ```

### 3. Imposto sobre Salário

O campo `taxAmount` permite registrar o valor do imposto retido na fonte:

- Quando informado, uma transação de despesa é criada automaticamente
- A transação de imposto é vinculada à transação de salário
- Ambas as transações são recorrentes mensais

#### Exemplo de Criação

```typescript
const salaryData: CreateTransactionData = {
  userId: 'user123',
  amount: 5000.0, // Salário bruto
  type: 'salary',
  date: '2024-01-05',
  category: 'Salário',
  description: 'Salário Janeiro 2024',
  currency: 'BRL',
  accountId: 'account123',
  taxAmount: 750.0, // Imposto retido na fonte (15%)
  status: 'completed',
};
```

#### Resultado

Duas transações são criadas:

1. **Transação de Salário** (Income)
   - Tipo: `salary`
   - Valor: R$ 5.000,00
   - Recorrente: Mensal
   - Vinculada à transação de imposto

2. **Transação de Imposto** (Expense)
   - Tipo: `expense`
   - Categoria: `Impostos`
   - Valor: R$ 750,00
   - Descrição: "Imposto sobre salário - Salário Janeiro 2024"
   - Recorrente: Mensal
   - Vinculada à transação de salário

### 4. Saldo Líquido

O saldo da conta reflete automaticamente:

- **Entrada**: Valor do salário bruto (+R$ 5.000,00)
- **Saída**: Valor do imposto (-R$ 750,00)
- **Saldo líquido**: +R$ 4.250,00

## Operações

### Criar Salário

```typescript
const transactionService = new TransactionService();
const salary = await transactionService.createManualTransaction({
  userId: user.sub,
  amount: 5000.0,
  type: 'salary',
  date: '2024-01-05',
  category: 'Salário',
  description: 'Salário Janeiro 2024',
  currency: 'BRL',
  accountId: 'account123',
  taxAmount: 750.0,
  status: 'completed',
});
```

### Atualizar Salário

Ao atualizar um salário, o imposto vinculado também é atualizado:

```typescript
await transactionService.updateTransaction(salaryId, {
  amount: 5500.0, // Novo valor do salário
  taxAmount: 825.0, // Novo valor do imposto (15%)
});
```

### Deletar Salário

Ao deletar um salário, o imposto vinculado também é deletado automaticamente:

```typescript
await transactionService.deleteTransaction(salaryId);
// A transação de imposto vinculada é deletada automaticamente
```

## Formulário de Cadastro

### Campos Necessários

1. **Valor do Salário** (obrigatório)
   - Valor bruto do salário
2. **Data** (obrigatório)
   - Data de recebimento do salário
3. **Conta** (obrigatório)
   - Conta bancária onde o salário será depositado
4. **Descrição** (opcional)
   - Descrição do salário (ex: "Salário Janeiro 2024")
5. **Imposto sobre Salário** (opcional)
   - Valor do imposto retido na fonte
   - Se informado, cria automaticamente uma transação de despesa

### Exemplo de FormData

```typescript
const formData = new FormData();
formData.append('amount', '5000.00');
formData.append('type', 'salary');
formData.append('category', 'Salário');
formData.append('description', 'Salário Janeiro 2024');
formData.append('date', '2024-01-05');
formData.append('account_id', 'account123');
formData.append('tax_amount', '750.00');

const result = await createTransactionAction(null, formData);
```

## Estrutura de Dados

### Campo `data` (JSON)

A transação de salário armazena no campo `data`:

```json
{
  "linked_transaction_id": "tax_transaction_id",
  "recurring_pattern": {
    "frequency": "monthly",
    "interval": 1
  }
}
```

### Campo `data` da Transação de Imposto (JSON)

```json
{
  "linked_transaction_id": "salary_transaction_id"
}
```

## Validações

1. **Tipo de Transação**: Deve ser `salary`
2. **Valor do Salário**: Deve ser um número positivo
3. **Valor do Imposto**: Se informado, deve ser um número positivo
4. **Data**: Deve ser uma data válida
5. **Conta**: Deve ser um ID de conta válido

## Considerações

1. **Recorrência**: O salário é automaticamente marcado como recorrente mensal sem data de término
2. **Vinculação**: As transações de salário e imposto são vinculadas através do campo `linked_transaction_id`
3. **Sincronização de Saldo**: Ambas as transações afetam o saldo da conta automaticamente
4. **Exclusão em Cascata**: Ao deletar o salário, o imposto vinculado também é deletado
5. **Atualização em Cascata**: Ao atualizar o valor do imposto, a transação de imposto vinculada é atualizada

## Migração do Banco de Dados

Para usar o novo tipo de transação, é necessário atualizar o schema do Appwrite:

1. Acesse o Appwrite Console
2. Navegue até a collection `transactions`
3. Edite o atributo `type`
4. Adicione o valor `salary` aos elementos do enum

Ou use o Appwrite CLI:

```bash
appwrite databases updateAttribute \
  --databaseId=horizon_ai_db \
  --collectionId=transactions \
  --key=type \
  --elements=income,expense,transfer,salary
```
