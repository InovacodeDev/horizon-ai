# Sistema de Sincronização Automática de Balance

## Visão Geral

O sistema de sincronização automática de balance garante que o saldo (`balance`) das contas seja sempre calculado corretamente baseado nas transações, sem necessidade de atualização manual no código.

## Arquitetura

### Estrutura de Dados

#### Tabela `accounts`

- `balance` (float): Saldo atual da conta (calculado automaticamente)
- `synced_transaction_ids` (string): JSON array com IDs das transações já sincronizadas
- Outros campos: `user_id`, `name`, `account_type`, `is_manual`, `data`, etc.

#### Tabela `transactions`

- `account_id` (string): Referência direta à conta (coluna dedicada)
- `amount` (float): Valor da transação
- `type` (enum): 'income', 'expense', 'transfer'
- `data` (string): JSON com outros campos (category, description, etc.)
- Outros campos: `user_id`, `date`, `status`, etc.

### Fluxo de Sincronização

```
┌─────────────────────────────────────────────────────────────┐
│                    Transaction Event                         │
│              (Create / Update / Delete)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              TransactionService                              │
│  • createManualTransaction()                                 │
│  • createIntegrationTransaction()                            │
│  • updateTransaction()                                       │
│  • deleteTransaction()                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BalanceSyncService                              │
│  • syncAfterCreate()                                         │
│  • syncAfterUpdate()                                         │
│  • syncAfterDelete()                                         │
│  • syncAccountBalance() ← Core Logic                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cálculo do Balance                              │
│                                                              │
│  1. Buscar todas as transações da conta                     │
│  2. Filtrar transações de cartão de crédito                 │
│  3. Calcular: balance = Σ(income) - Σ(expense)              │
│  4. Atualizar account.balance                                │
│  5. Atualizar account.synced_transaction_ids                 │
└─────────────────────────────────────────────────────────────┘
```

## Migrations

### 1. `20251027_000010_add_account_id_to_transactions`

Adiciona a coluna `account_id` na tabela `transactions` para vincular transações diretamente às contas.

### 2. `20251027_000011_add_synced_transaction_ids_to_accounts`

Adiciona a coluna `synced_transaction_ids` na tabela `accounts` para rastrear transações sincronizadas.

### 3. `20251027_000012_migrate_account_id_and_sync_balances`

Migra dados existentes:

- Move `data.account_id` para a coluna `account_id` em transactions
- Recalcula o balance de todas as contas
- Popula `synced_transaction_ids` em todas as contas

## Como Executar as Migrations

```bash
# Executar todas as migrations pendentes
pnpm migrate:up

# Ou executar manualmente
pnpm tsx lib/database/migrations/cli.ts up
```

## Uso no Código

### Criar Transação (Balance é sincronizado automaticamente)

```typescript
const transactionService = new TransactionService();

await transactionService.createManualTransaction({
  userId: 'user123',
  amount: 100.0,
  type: 'income',
  category: 'salary',
  description: 'Salário mensal',
  date: new Date().toISOString(),
  currency: 'BRL',
  accountId: 'account456', // ← Balance será atualizado automaticamente
  status: 'completed',
});
```

### Editar Transação (Balance é recalculado)

```typescript
await transactionService.updateTransaction('transaction789', {
  amount: 150.0, // Mudou o valor
  // Balance será recalculado automaticamente
});
```

### Deletar Transação (Balance é ajustado)

```typescript
await transactionService.deleteTransaction('transaction789');
// Balance será recalculado automaticamente
```

### Sincronizar Balance Manualmente (se necessário)

```typescript
const accountService = new AccountService();

// Forçar recálculo do balance
const newBalance = await accountService.syncAccountBalance('account456');
console.log(`Novo balance: R$ ${newBalance}`);
```

## Regras de Negócio

### 1. Transações de Cartão de Crédito

Transações com `credit_card_id` no campo `data` **NÃO** afetam o balance da conta.

```typescript
// Esta transação NÃO afeta o balance da conta
await transactionService.createManualTransaction({
  userId: 'user123',
  amount: 50.0,
  type: 'expense',
  category: 'food',
  accountId: 'account456',
  creditCardId: 'card789', // ← Não afeta balance
  status: 'completed',
});
```

### 2. Mudança de Conta

Quando uma transação muda de conta, ambas as contas são sincronizadas:

```typescript
// Transação estava na conta A, agora vai para conta B
await transactionService.updateTransaction('transaction789', {
  accountId: 'accountB', // Mudou de accountA para accountB
});
// Balance de accountA e accountB são recalculados
```

### 3. Saldo Inicial

O saldo inicial é definido ao criar a conta e uma transação de "balance" é criada automaticamente:

```typescript
const accountService = new AccountService();

await accountService.createAccount('user123', {
  name: 'Conta Corrente',
  account_type: 'checking',
  initial_balance: 1000.0, // ← Cria transação automática
  is_manual: true,
});
```

## Vantagens do Sistema

### ✅ Consistência

- Balance sempre reflete a soma das transações
- Não há risco de dessincronia entre balance e transações

### ✅ Auditoria

- `synced_transaction_ids` permite rastrear quais transações foram contabilizadas
- Fácil identificar problemas de sincronização

### ✅ Performance

- Cálculo otimizado usando índices no banco
- Sincronização apenas quando necessário

### ✅ Manutenibilidade

- Lógica centralizada no `BalanceSyncService`
- Fácil adicionar novos tipos de transações

### ✅ Segurança

- Balance não pode ser editado manualmente via API
- Apenas transações podem alterar o balance

## Troubleshooting

### Balance está incorreto?

```typescript
// 1. Verificar transações da conta
const transactions = await transactionService.listTransactions({
  userId: 'user123',
  // Filtrar por account_id não está disponível diretamente,
  // mas você pode buscar todas e filtrar
});

// 2. Forçar recálculo
const accountService = new AccountService();
const newBalance = await accountService.syncAccountBalance('account456');

// 3. Verificar synced_transaction_ids
const account = await accountService.getAccountById('account456', 'user123');
const syncedIds = JSON.parse(account.synced_transaction_ids || '[]');
console.log(`Transações sincronizadas: ${syncedIds.length}`);
```

### Recalcular todas as contas de um usuário

```typescript
const balanceSyncService = new BalanceSyncService();
await balanceSyncService.recalculateAllBalances('user123');
```

## Testes

### Testar Criação de Transação

1. Criar uma conta com saldo inicial
2. Verificar que o balance está correto
3. Criar uma transação de income
4. Verificar que o balance aumentou
5. Criar uma transação de expense
6. Verificar que o balance diminuiu

### Testar Edição de Transação

1. Criar uma transação
2. Editar o valor
3. Verificar que o balance foi recalculado

### Testar Remoção de Transação

1. Criar uma transação
2. Remover a transação
3. Verificar que o balance voltou ao valor anterior

### Testar Mudança de Conta

1. Criar duas contas
2. Criar uma transação na conta A
3. Mover a transação para a conta B
4. Verificar que ambos os balances foram atualizados

## Próximos Passos

- [ ] Adicionar testes automatizados para BalanceSyncService
- [ ] Implementar webhook para notificar mudanças de balance
- [ ] Adicionar cache para otimizar consultas frequentes
- [ ] Implementar histórico de balance (snapshots diários)
- [ ] Adicionar validação de integridade periódica
