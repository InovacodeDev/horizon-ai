# Implementação do Sistema de Sincronização Automática de Balance

## ✅ Implementação Concluída

### Arquivos Criados

#### Migrations (TablesDB)

1. **`lib/database/migrations/20251027_000010_add_account_id_to_transactions.ts`**
   - Adiciona coluna `account_id` na tabela `transactions`
   - Cria índice `idx_account_id` para otimizar queries

2. **`lib/database/migrations/20251027_000011_add_synced_transaction_ids_to_accounts.ts`**
   - Adiciona coluna `synced_transaction_ids` na tabela `accounts`
   - Armazena JSON array com IDs das transações sincronizadas

3. **`lib/database/migrations/20251027_000012_migrate_account_id_and_sync_balances.ts`**
   - Migra dados de `data.account_id` para coluna `account_id`
   - Recalcula balance de todas as contas
   - Popula `synced_transaction_ids` em todas as contas

#### Serviços

4. **`lib/services/balance-sync.service.ts`**
   - `syncAccountBalance()`: Recalcula balance baseado em transações
   - `syncAfterCreate()`: Sincroniza após criar transação
   - `syncAfterUpdate()`: Sincroniza após editar transação
   - `syncAfterDelete()`: Sincroniza após remover transação
   - `recalculateAllBalances()`: Recalcula todas as contas de um usuário

#### Documentação

5. **`docs/BALANCE_SYNC_SYSTEM.md`**
   - Documentação completa do sistema
   - Fluxos de sincronização
   - Exemplos de uso
   - Troubleshooting

### Arquivos Modificados

#### Schema

1. **`lib/appwrite/schema.ts`**
   - Adicionado `account_id` em `Transaction` interface
   - Adicionado `synced_transaction_ids` em `Account` interface
   - Atualizado `transactionsSchema` com nova coluna e índice
   - Atualizado `accountsSchema` com nova coluna

#### Migrations Core

2. **`lib/database/migrations/migration.interface.ts`**
   - Migrado de `Databases` para `TablesDB`
   - Todas as migrations agora usam TablesDB API

3. **`lib/database/migrations/index.ts`**
   - Registradas 3 novas migrations

#### Serviços

4. **`lib/services/transaction.service.ts`**
   - `createManualTransaction()`: Adiciona `account_id` como coluna + sincroniza balance
   - `createIntegrationTransaction()`: Adiciona `account_id` como coluna + sincroniza balance
   - `updateTransaction()`: Sincroniza balance após edição (ambas contas se mudou)
   - `deleteTransaction()`: Sincroniza balance após remoção
   - `formatTransaction()`: Inclui `account_id` no retorno

5. **`lib/services/account.service.ts`**
   - **REMOVIDO**: `updateAccountBalance()` (balance não é mais atualizado manualmente)
   - **REMOVIDO**: `calculateAccountBalance()` (substituído por BalanceSyncService)
   - `getAccountsByUserId()`: Não recalcula balance (já está sincronizado)
   - `syncAccountBalance()`: Novo método para forçar sincronização manual
   - `deserializeAccount()`: Inclui `synced_transaction_ids`

### Arquivos Removidos

- **`scripts/migrate-balance-sync.ts`**: Substituído pelas migrations do TablesDB

## 🚀 Como Usar

### 1. Executar Migrations

```bash
# Executar todas as migrations pendentes
pnpm migrate:up

# Verificar status das migrations
pnpm tsx lib/database/migrations/cli.ts status
```

### 2. Testar o Sistema

#### Criar Conta com Saldo Inicial

```typescript
const accountService = new AccountService();

const account = await accountService.createAccount('user123', {
  name: 'Conta Corrente',
  account_type: 'checking',
  initial_balance: 1000.0, // Cria transação automática
  is_manual: true,
});

console.log(`Balance: R$ ${account.balance}`); // R$ 1000.00
```

#### Criar Transação (Balance atualiza automaticamente)

```typescript
const transactionService = new TransactionService();

await transactionService.createManualTransaction({
  userId: 'user123',
  amount: 500.0,
  type: 'income',
  category: 'salary',
  date: new Date().toISOString(),
  currency: 'BRL',
  accountId: account.$id, // ← Balance será R$ 1500.00
  status: 'completed',
});
```

#### Editar Transação (Balance recalcula)

```typescript
await transactionService.updateTransaction('transaction_id', {
  amount: 300.0, // Mudou de 500 para 300
  // Balance será R$ 1300.00
});
```

#### Deletar Transação (Balance ajusta)

```typescript
await transactionService.deleteTransaction('transaction_id');
// Balance volta para R$ 1000.00
```

### 3. Verificar Sincronização

```typescript
// Buscar conta
const account = await accountService.getAccountById('account_id', 'user123');

// Ver transações sincronizadas
const syncedIds = JSON.parse(account.synced_transaction_ids || '[]');
console.log(`Transações sincronizadas: ${syncedIds.length}`);
console.log(`Balance atual: R$ ${account.balance}`);

// Forçar recálculo (se necessário)
const newBalance = await accountService.syncAccountBalance('account_id');
console.log(`Balance recalculado: R$ ${newBalance}`);
```

## 📋 Checklist de Validação

### Antes de Executar Migrations

- [ ] Backup do banco de dados
- [ ] Verificar que todas as migrations anteriores foram aplicadas
- [ ] Confirmar que o ambiente está usando TablesDB

### Após Executar Migrations

- [ ] Verificar que as colunas foram criadas no Appwrite Console
- [ ] Verificar que os índices foram criados
- [ ] Verificar que os dados foram migrados corretamente
- [ ] Testar criação de transação
- [ ] Testar edição de transação
- [ ] Testar remoção de transação
- [ ] Verificar que o balance está correto em todas as contas

### Testes de Integração

- [ ] Criar conta com saldo inicial → Balance correto
- [ ] Adicionar transação de income → Balance aumenta
- [ ] Adicionar transação de expense → Balance diminui
- [ ] Editar valor da transação → Balance recalcula
- [ ] Mover transação entre contas → Ambos balances atualizam
- [ ] Deletar transação → Balance volta ao anterior
- [ ] Transação de cartão de crédito → Balance não muda

## 🔍 Troubleshooting

### Balance está incorreto após migration?

```bash
# Executar recálculo manual
pnpm tsx -e "
import { BalanceSyncService } from './lib/services/balance-sync.service';
const service = new BalanceSyncService();
await service.recalculateAllBalances('USER_ID');
"
```

### Migration falhou?

```bash
# Reverter última migration
pnpm tsx lib/database/migrations/cli.ts down

# Verificar logs
pnpm tsx lib/database/migrations/cli.ts status
```

### Verificar integridade dos dados

```typescript
// Script de verificação
const accountService = new AccountService();
const transactionService = new TransactionService();

const accounts = await accountService.getAccountsByUserId('user123');

for (const account of accounts) {
  // Buscar transações
  const transactions = await transactionService.listTransactions({
    userId: 'user123',
  });

  // Filtrar por conta
  const accountTransactions = transactions.transactions.filter((t) => t.account_id === account.$id);

  // Calcular balance esperado
  let expectedBalance = 0;
  for (const t of accountTransactions) {
    if (t.type === 'income') expectedBalance += t.amount;
    if (t.type === 'expense') expectedBalance -= t.amount;
  }

  console.log(`Conta: ${account.name}`);
  console.log(`Balance atual: R$ ${account.balance}`);
  console.log(`Balance esperado: R$ ${expectedBalance}`);
  console.log(`Diferença: R$ ${account.balance - expectedBalance}`);
  console.log('---');
}
```

## 🎯 Benefícios Implementados

### ✅ Consistência de Dados

- Balance sempre reflete a soma das transações
- Impossível ter dessincronia entre balance e transações

### ✅ Auditoria Completa

- `synced_transaction_ids` permite rastrear todas as transações contabilizadas
- Fácil identificar e corrigir problemas

### ✅ Performance Otimizada

- Índice em `account_id` acelera queries
- Sincronização apenas quando necessário
- Sem recálculos desnecessários

### ✅ Código Limpo

- Lógica centralizada no `BalanceSyncService`
- Serviços não precisam se preocupar com balance
- Fácil manutenção e extensão

### ✅ Segurança

- Balance não pode ser editado manualmente
- Apenas transações podem alterar o balance
- Validação automática de integridade

## 📚 Referências

- [Documentação Completa](./BALANCE_SYNC_SYSTEM.md)
- [Appwrite TablesDB](https://appwrite.io/docs/products/databases/tables)
- [Migration System](../lib/database/migrations/README.md)

## 🚧 Próximos Passos (Opcional)

1. **Testes Automatizados**
   - Criar testes unitários para `BalanceSyncService`
   - Criar testes de integração para fluxos completos

2. **Monitoramento**
   - Adicionar logs de sincronização
   - Criar dashboard de integridade de balances

3. **Otimizações**
   - Cache de balances para leitura rápida
   - Sincronização em batch para múltiplas transações

4. **Histórico**
   - Implementar snapshots diários de balance
   - Permitir visualizar evolução do balance ao longo do tempo

5. **Validação Periódica**
   - Criar job que valida integridade dos balances
   - Notificar se houver inconsistências
