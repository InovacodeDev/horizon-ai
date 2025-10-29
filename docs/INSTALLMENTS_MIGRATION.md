# Migração de Parcelas - Transações

## Resumo

Esta migração adiciona suporte completo para controle de parcelas de cartão de crédito na tabela `transactions`.

## Novas Colunas

### 1. `installment` (integer, opcional)

- Número da parcela atual (1, 2, 3, etc.)
- Exemplo: Para a 3ª parcela de uma compra de 12x, o valor será `3`

### 2. `installments` (integer, opcional)

- Número total de parcelas
- Exemplo: Para uma compra de 12x, o valor será `12`

### 3. `credit_card_transaction_created_at` (datetime, opcional)

- Data original da compra no cartão de crédito
- Esta é a data em que a compra foi realizada

## Comportamento

### Para Transações Parceladas:

- `date`: Data de vencimento da fatura (quando a parcela deve ser paga)
- `credit_card_transaction_created_at`: Data da compra original
- `installment`: Número da parcela atual (ex: 3)
- `installments`: Total de parcelas (ex: 12)

### Exemplo Prático:

```typescript
// Compra de R$ 1.200,00 em 12x no dia 15/10/2025
// Fechamento do cartão: dia 10
// Vencimento: dia 20

// Parcela 1/12
{
  amount: 100.00,
  date: "2025-11-20", // Vencimento da primeira fatura
  credit_card_transaction_created_at: "2025-10-15", // Data da compra
  installment: 1,
  installments: 12,
  description: "Notebook (1/12)"
}

// Parcela 2/12
{
  amount: 100.00,
  date: "2025-12-20", // Vencimento da segunda fatura
  credit_card_transaction_created_at: "2025-10-15", // Mesma data da compra
  installment: 2,
  installments: 12,
  description: "Notebook (2/12)"
}
```

## Migração

### Arquivo de Migração

`lib/database/migrations/20251029_000017_add_installment_columns_to_transactions.ts`

### Como Executar

```bash
# Executar a migração
npm run migrate:up

# Reverter a migração (se necessário)
npm run migrate:down
```

## Atualizações no Código

### 1. Schema TypeScript (`lib/appwrite/schema.ts`)

- Interface `Transaction` atualizada com os novos campos
- Schema `transactionsSchema` atualizado com as novas colunas
- Novo índice `idx_installments` para queries otimizadas

### 2. Transaction Service (`lib/services/transaction.service.ts`)

- `CreateTransactionData` interface atualizada
- `UpdateTransactionData` interface atualizada
- Método `formatTransaction` atualizado para incluir os novos campos
- Suporte completo para criar e atualizar transações com parcelas

### 3. API de Parcelas (`app/api/credit-cards/installments/route.ts`)

- Endpoint atualizado para usar os novos campos
- Cada parcela criada agora inclui:
  - `installment`: número da parcela
  - `installments`: total de parcelas
  - `creditCardTransactionCreatedAt`: data da compra original

## Queries Úteis

### Buscar todas as parcelas de uma compra

```typescript
// Buscar pela data de compra original
const transactions = await transactionService.listTransactions({
  userId: 'user_id',
  creditCardId: 'card_id',
  // Filtrar por credit_card_transaction_created_at
});
```

### Buscar parcelas pendentes

```typescript
const transactions = await transactionService.listTransactions({
  userId: 'user_id',
  creditCardId: 'card_id',
  status: 'pending',
  // Ordenar por installment
});
```

### Agrupar por compra original

```typescript
// Agrupar transações pela data de compra original
const groupedByPurchase = transactions.reduce((acc, t) => {
  const key = t.credit_card_transaction_created_at || 'no-date';
  if (!acc[key]) acc[key] = [];
  acc[key].push(t);
  return acc;
}, {});
```

## Compatibilidade

- ✅ Transações antigas sem parcelas continuam funcionando normalmente
- ✅ Campos são opcionais, não quebram código existente
- ✅ Transações não parceladas podem deixar os campos vazios
- ✅ Índices otimizados para queries de parcelas

## Notas Importantes

1. **Data da Transação vs Data da Compra**:
   - `date`: Sempre representa o vencimento da fatura
   - `credit_card_transaction_created_at`: Data real da compra

2. **Parcelas Únicas**:
   - Para compras à vista, deixe `installment` e `installments` vazios
   - Ou defina `installment: 1` e `installments: 1`

3. **Sincronização de Saldo**:
   - O saldo da conta é sincronizado pela data de vencimento (`date`)
   - Não pela data da compra original
