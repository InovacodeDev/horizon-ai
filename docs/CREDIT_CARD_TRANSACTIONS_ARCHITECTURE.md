# Arquitetura: Separação de Transações

## Visão Geral

O sistema agora tem **duas tabelas separadas** para transações:

1. **`transactions`** - Transações de conta (afetam saldo)
2. **`credit_card_transactions`** - Transações de cartão de crédito (não afetam saldo)

## Tabelas

### 1. `transactions` (Transações de Conta)

**Propósito:** Registrar movimentações que afetam o saldo da conta

**Exemplos:**

- Salário recebido
- Pagamento de conta de luz
- Transferência entre contas
- **Pagamento de fatura de cartão de crédito**

**Campos Principais:**

- `user_id`
- `account_id`
- `amount`
- `type` (income/expense/transfer)
- `date`
- `category`
- `status`

**NÃO tem mais:**

- ❌ `credit_card_id`
- ❌ `installment`
- ❌ `installments`
- ❌ `is_recurring`

### 2. `credit_card_transactions` (Transações de Cartão)

**Propósito:** Registrar compras no cartão de crédito

**Exemplos:**

- Compra no supermercado
- Assinatura Netflix
- Compra parcelada de notebook
- Gasolina no posto

**Campos Principais:**

- `user_id`
- `credit_card_id`
- `amount`
- `date` (data de vencimento da fatura)
- `purchase_date` (data da compra)
- `category`
- `installment`
- `installments`
- `is_recurring`
- `status`

## Fluxo de Dados

### Compra no Cartão de Crédito

```typescript
// 1. Criar transação de cartão
await creditCardTransactionService.createTransaction({
  userId: 'user_123',
  creditCardId: 'card_123',
  amount: 100.0,
  purchaseDate: '2025-10-29',
  date: '2025-11-15', // Vencimento da fatura
  category: 'Alimentação',
  description: 'Supermercado',
});

// Resultado:
// ✅ Salvo em credit_card_transactions
// ✅ Limite do cartão reduzido
// ❌ Saldo da conta NÃO afetado
```

### Pagamento da Fatura

```typescript
// 2. Criar transação de pagamento (conta)
await transactionService.createTransaction({
  userId: 'user_123',
  accountId: 'account_123',
  amount: 1500.0,
  type: 'expense',
  date: '2025-11-15',
  category: 'Pagamento de Fatura',
  description: 'Pagamento Fatura Nubank - Nov/2025',
});

// Resultado:
// ✅ Salvo em transactions
// ✅ Saldo da conta reduzido
// ✅ Fatura marcada como paga
```

## Interfaces

### Tela de Transações (`/transactions`)

**Mostra:** Apenas `transactions`

- Salário
- Contas pagas
- Transferências
- Pagamentos de fatura

**Não mostra:** Compras no cartão de crédito

### Tela de Faturas do Cartão (`/credit-card-bills`)

**Mostra:** Apenas `credit_card_transactions`

- Compras no cartão
- Parcelas
- Assinaturas recorrentes

**Não mostra:** Transações de conta

### Dashboard (`/dashboard`)

**Mostra:** Ambas, mas separadas

- Card: Transações Recentes (transactions)
- Card: Compras no Cartão Recentes (credit_card_transactions)
- Card: Total de Cartões no Mês (credit_card_transactions)
- Insights de consumo de cartão

## Cálculos

### Saldo da Conta

```typescript
// Apenas transactions (SEM credit_card_id)
balance = initial_balance + sum(income) - sum(expense);
```

### Limite Usado do Cartão

```typescript
// Apenas credit_card_transactions não pagas
// (com data >= última fatura paga)
usedLimit = sum(credit_card_transactions.amount);
```

### Total de Cartões no Mês

```typescript
// Todas as credit_card_transactions do mês atual
totalMonth = sum(credit_card_transactions.amount WHERE date >= startOfMonth)
```

## Serviços

### TransactionService

**Arquivo:** `lib/services/transaction.service.ts`

**Responsável por:**

- Transações de conta
- Sincronização de saldo
- Relatórios de conta

**Métodos:**

- `createManualTransaction()`
- `updateTransaction()`
- `deleteTransaction()`
- `listTransactions()`

### CreditCardTransactionService

**Arquivo:** `lib/services/credit-card-transaction.service.ts`

**Responsável por:**

- Transações de cartão
- Sincronização de limite usado
- Relatórios de cartão

**Métodos:**

- `createTransaction()`
- `updateTransaction()`
- `deleteTransaction()`
- `listTransactions()`
- `getCurrentMonthTotal()`

## APIs

### Transações de Conta

- `POST /api/transactions` - Criar transação de conta
- `GET /api/transactions` - Listar transações de conta
- `PATCH /api/transactions/:id` - Atualizar transação de conta
- `DELETE /api/transactions/:id` - Excluir transação de conta

### Transações de Cartão

- `POST /api/credit-cards/transactions` - Criar transação de cartão
- `GET /api/credit-cards/transactions` - Listar transações de cartão
- `PATCH /api/credit-cards/transactions/:id` - Atualizar transação de cartão
- `DELETE /api/credit-cards/transactions/:id` - Excluir transação de cartão

### Pagamento de Fatura

- `POST /api/credit-cards/bills/pay` - Pagar fatura (cria transaction)

## Migração de Dados

### Passo 1: Criar Nova Tabela

```bash
npm run migrate:up
```

### Passo 2: Migrar Dados Existentes

```typescript
// Buscar todas as transactions com credit_card_id
const oldTransactions = await listTransactions({
  creditCardId: { $exists: true },
});

// Criar em credit_card_transactions
for (const old of oldTransactions) {
  await creditCardTransactionService.createTransaction({
    userId: old.user_id,
    creditCardId: old.credit_card_id,
    amount: old.amount,
    date: old.date,
    purchaseDate: old.credit_card_transaction_created_at || old.date,
    category: old.category,
    description: old.description,
    merchant: old.merchant,
    installment: old.installment,
    installments: old.installments,
    isRecurring: old.is_recurring,
    status: old.status,
  });
}

// Excluir da tabela transactions
for (const old of oldTransactions) {
  await transactionService.deleteTransaction(old.$id);
}
```

### Passo 3: Remover Colunas Antigas

Criar migração para remover:

- `credit_card_id` de transactions
- `installment` de transactions
- `installments` de transactions
- `credit_card_transaction_created_at` de transactions

## Vantagens

### 1. Separação Clara

- ✅ Transações de conta separadas de cartão
- ✅ Saldo calculado corretamente
- ✅ Limite de cartão calculado corretamente

### 2. Performance

- ✅ Queries mais rápidas (menos dados)
- ✅ Índices otimizados para cada tipo
- ✅ Menos joins necessários

### 3. Manutenibilidade

- ✅ Código mais limpo
- ✅ Lógica mais clara
- ✅ Fácil adicionar features específicas

### 4. Escalabilidade

- ✅ Tabelas podem crescer independentemente
- ✅ Fácil adicionar sharding se necessário
- ✅ Backup/restore mais granular

## Checklist de Implementação

- [x] Criar tabela `credit_card_transactions`
- [x] Criar serviço `CreditCardTransactionService`
- [x] Atualizar schema TypeScript
- [x] Criar APIs para transações de cartão
- [x] Atualizar tela de faturas para usar nova tabela
- [x] Atualizar modais de criação e edição de transações
- [x] Criar hook `useCreditCardTransactions`
- [x] Criar card de compras recentes no overview
- [x] Criar card de total de cartões no mês no overview
- [ ] Migrar dados existentes (executar script de migração)
- [ ] Remover colunas antigas de transactions (após migração)
- [x] Atualizar documentação

## Próximos Passos

### 1. Migração de Dados

Execute a migração para mover transações existentes:

```bash
npm run migrate:up
```

Isso irá:

1. Buscar todas as transações com `credit_card_id`
2. Criar registros correspondentes em `credit_card_transactions`
3. Excluir as transações antigas da tabela `transactions`

### 2. Limpeza de Schema

Após confirmar que a migração foi bem-sucedida, remova as colunas antigas:

- `credit_card_id` de `transactions`
- `installment` de `transactions`
- `installments` de `transactions`
- `credit_card_transaction_created_at` de `transactions`
- `is_recurring` de `transactions`

### 3. Verificação

Após a migração, verifique:

- ✅ Saldo das contas está correto (apenas transações de conta)
- ✅ Limite usado dos cartões está correto (apenas transações de cartão)
- ✅ Faturas mostram todas as compras
- ✅ Overview mostra transações separadas
- ✅ Parcelamentos funcionam corretamente
- ✅ Assinaturas recorrentes funcionam
