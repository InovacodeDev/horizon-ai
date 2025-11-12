# Guia de Sincronização Automática de Saldo

## 🎯 Objetivo

Este guia explica como a sincronização automática de saldo funciona e como garantir que está funcionando corretamente.

## 🔄 Como Funciona

### Fluxo Completo

```
1. Usuário cria/edita/remove uma transação
   ↓
2. Next.js API salva no Appwrite Database
   ↓
3. Appwrite detecta mudança e dispara evento
   ↓
4. Balance Sync Function é executada automaticamente
   ↓
5. Função recalcula saldo da conta
   ↓
6. Saldo é atualizado no database
   ↓
7. Frontend recebe atualização via Realtime (opcional)
```

### Quando o Saldo é Atualizado

O saldo é recalculado automaticamente em 3 situações:

1. **Criar Transação**: Quando você cria uma nova transação via API
2. **Editar Transação**: Quando você atualiza uma transação existente
3. **Remover Transação**: Quando você deleta uma transação

## ✅ Verificando se Está Funcionando

### 1. Verificar Configuração da Função

No Appwrite Console:

1. Vá em **Functions** > **balance-sync**
2. Verifique se está **Enabled** (habilitada)
3. Verifique os **Events**:
   ```
   databases.*.collections.transactions.documents.*.create
   databases.*.collections.transactions.documents.*.update
   databases.*.collections.transactions.documents.*.delete
   ```

### 2. Testar Criação de Transação

```bash
# Criar uma transação via API
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "amount": 1000,
    "type": "income",
    "category": "salary",
    "date": "2024-01-15",
    "account_id": "SUA_CONTA_ID"
  }'
```

### 3. Verificar Logs da Função

No Appwrite Console:

1. Vá em **Functions** > **balance-sync** > **Executions**
2. Procure pela execução mais recente
3. Verifique os logs:

```
[BalanceSync] Processing database event
[BalanceSync] Transaction ID: abc123
[BalanceSync] Account ID: xyz789
[BalanceSync] Syncing account xyz789
[BalanceSync] - Total transactions: 5
[BalanceSync] - Final balance: 5000
[BalanceSync] Account xyz789 updated successfully
```

### 4. Verificar Saldo no Database

No Appwrite Console:

1. Vá em **Databases** > **horizon_ai_db** > **accounts**
2. Encontre sua conta
3. Verifique o campo `balance`
4. Verifique o campo `synced_transaction_ids` (deve conter IDs das transações)

## 🐛 Problemas Comuns

### ❌ Saldo não atualiza após criar transação

**Diagnóstico:**

1. Verifique se a transação foi criada com `account_id`:

   ```sql
   SELECT * FROM transactions WHERE $id = 'transaction-id'
   ```

2. Verifique se a função foi executada:
   - Appwrite Console > Functions > balance-sync > Executions
   - Deve haver uma execução recente

3. Verifique os logs da execução:
   - Se não houver logs, a função não foi acionada
   - Se houver erro, veja a mensagem de erro

**Soluções:**

- **Transação sem account_id**: Adicione o `account_id` ao criar a transação
- **Função não executou**: Verifique se os eventos estão configurados
- **Erro na função**: Veja a seção de erros abaixo

### ❌ Erro: "Transaction has no account_id"

**Causa:** A transação foi criada sem o campo `account_id`.

**Solução:**

```typescript
// ❌ Errado
await transactionService.createManualTransaction({
  userId,
  amount: 1000,
  type: 'income',
  // account_id está faltando!
});

// ✅ Correto
await transactionService.createManualTransaction({
  userId,
  amount: 1000,
  type: 'income',
  accountId: 'sua-conta-id', // ← Adicione isso
});
```

### ❌ Transação de cartão de crédito afeta o saldo

**Causa:** Transações de cartão de crédito devem ser ignoradas no saldo da conta.

**Verificação:**

```typescript
// Transação de cartão deve ter credit_card_id
const transaction = {
  amount: 200,
  type: 'expense',
  account_id: 'conta-id',
  credit_card_id: 'cartao-id', // ← Isso faz a função ignorar
};
```

**Logs esperados:**

```
[BalanceSync] Transaction is for credit card, skipping
```

### ❌ Transações futuras afetam o saldo

**Causa:** A função ignora transações futuras por design.

**Verificação:**

```typescript
// Transação futura (não deve afetar saldo hoje)
const transaction = {
  amount: 1000,
  type: 'income',
  date: '2025-12-31', // ← Data futura
  account_id: 'conta-id',
};
```

**Logs esperados:**

```
[BalanceSync] - Skipping future transaction: abc123 (2025-12-31T00:00:00.000Z)
```

**Quando será processada:**

- Automaticamente no dia 31/12/2025 às 20:00 (execução agendada)
- Ou quando você criar/editar qualquer transação da mesma conta

### ❌ Saldo está incorreto

**Diagnóstico:**

1. Liste todas as transações da conta:

   ```bash
   # No Appwrite Console
   Databases > horizon_ai_db > transactions
   Filtro: account_id = 'sua-conta-id'
   ```

2. Calcule manualmente:

   ```
   Saldo = Σ(transações 'in') - Σ(transações 'out')

   Ignorar:
   - Transações com credit_card_id
   - Transações com data futura
   ```

3. Compare com o saldo no database

**Solução: Forçar Recálculo**

Via Appwrite Console:

```json
// Functions > balance-sync > Execute
{
  "userId": "seu-user-id"
}
```

Via API:

```bash
curl -X POST https://nyc.cloud.appwrite.io/v1/functions/balance-sync/executions \
  -H "X-Appwrite-Project: seu-project-id" \
  -H "X-Appwrite-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{"userId": "seu-user-id"}'
```

## 🔍 Debug Avançado

### Habilitar Logs Detalhados

A função já tem logs detalhados habilitados. Para ver todos os logs:

1. Appwrite Console > Functions > balance-sync > Executions
2. Clique na execução
3. Veja a aba "Logs"

### Logs Importantes

```
# Início da sincronização
[BalanceSync] Syncing account xyz789

# Transações encontradas
[BalanceSync] - Total transactions: 15
[BalanceSync] - Current date: 2024-01-15T23:59:59.999Z

# Processamento de cada transação
[BalanceSync] - Adding 1000 from transaction abc123 (direction: in)
[BalanceSync] - Subtracting 500 from transaction def456 (direction: out)
[BalanceSync] - Skipping credit card transaction: ghi789
[BalanceSync] - Skipping future transaction: jkl012 (2025-12-31T00:00:00.000Z)

# Resultado final
[BalanceSync] - Final balance: 5000
[BalanceSync] - Processed 13 transactions
[BalanceSync] Account xyz789 updated successfully with balance: 5000
```

### Testar Manualmente

```typescript
// No seu código Next.js
import { TransactionService } from '@/lib/services/transaction.service';

// Criar transação
const service = new TransactionService();
const transaction = await service.createManualTransaction({
  userId: 'seu-user-id',
  amount: 1000,
  type: 'income',
  category: 'salary',
  date: '2024-01-15',
  currency: 'BRL',
  accountId: 'sua-conta-id', // ← Importante!
  status: 'completed',
});

console.log('Transação criada:', transaction.$id);

// Aguarde 2-3 segundos para a função executar
await new Promise((resolve) => setTimeout(resolve, 3000));

// Verifique o saldo
const { AccountService } = await import('@/lib/services/account.service');
const accountService = new AccountService();
const balance = await accountService.getAccountBalance('sua-conta-id');

console.log('Saldo atualizado:', balance);
```

## 📊 Monitoramento

### Métricas Importantes

1. **Taxa de Sucesso**: Deve ser próxima de 100%
2. **Tempo de Execução**: Deve ser < 5 segundos
3. **Frequência**: Deve executar sempre que uma transação é modificada

### Alertas Recomendados

Configure alertas para:

- Taxa de erro > 5%
- Tempo de execução > 10 segundos
- Função desabilitada
- Eventos não configurados

## 🚀 Próximos Passos

1. **Realtime Updates**: Configure Appwrite Realtime para atualizar o frontend automaticamente
2. **Webhooks**: Configure webhooks para notificar outros sistemas
3. **Logs Centralizados**: Envie logs para um sistema de monitoramento
4. **Testes Automatizados**: Crie testes E2E para validar a sincronização

## 📚 Referências

- [Appwrite Functions](https://appwrite.io/docs/functions)
- [Appwrite Database Events](https://appwrite.io/docs/events)
- [Appwrite Realtime](https://appwrite.io/docs/realtime)
- [README.md](./README.md) - Documentação principal
