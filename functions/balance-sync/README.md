# Balance Sync Function

Função Appwrite para atualizar automaticamente o saldo das contas quando transações são modificadas.

## 🎯 Funcionalidade

Esta função opera de duas maneiras:

### 1. Via Database Triggers (Tempo Real)

Responde imediatamente a mudanças nas transações:

1. **CREATE**: Quando uma transação é criada → soma o `amount` ao `balance` da conta
2. **DELETE**: Quando uma transação é deletada → subtrai o `amount` do `balance` da conta
3. **UPDATE**: Quando uma transação é editada → calcula a diferença entre o `amount` antigo e novo, aplica ao `balance`

### 2. Via Schedule (Processamento em Lote)

Executa **diariamente às 05:00 UTC** para processar:

- ✅ Transações criadas para o futuro que já chegaram na data programada
- ✅ Transações pendentes que não foram processadas
- ✅ Transações com falhas que precisam ser reprocessadas

### Regras

- ✅ Processa apenas transações com status `pending` ou `failed`
- ✅ Marca transação como `completed` após processar (CREATE e UPDATE)
- ✅ O `amount` já vem sinalizado (positivo/negativo), basta somar
- ✅ Processa apenas transações com data <= data atual
- ❌ Ignora transações de cartão de crédito (`credit_card_id` presente)
- ❌ Ignora transações sem `account_id`

## 📖 Como Funciona

### Evento CREATE

```
Transação criada: amount = 1000
Balance atual: 5000

Ação: balance = 5000 + 1000 = 6000
Status: pending → completed
```

### Evento DELETE

```
Transação deletada: amount = 500
Balance atual: 6000

Ação: balance = 6000 - 500 = 5500
```

### Evento UPDATE

```
Amount antigo: 1000
Amount novo: 1500
Balance atual: 6000

Diferença: 1500 - 1000 = 500
Ação: balance = 6000 + 500 = 6500
Status: pending → completed
```

## 🚀 Configuração no Appwrite Console

### 1. Criar a Função

1. Acesse o Appwrite Console
2. Vá em **Functions** > **Create Function**
3. Configure:
   - **Name**: Balance Sync
   - **Runtime**: Node.js 20.x (ou superior)
   - **Entrypoint**: `dist/index.js`
   - **Build Commands**: `npm install && npm run build`

### 2. Configurar Variáveis de Ambiente

```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_DATABASE_ID=seu-database-id
APPWRITE_API_KEY=sua-api-key
```

### 3. Configurar Triggers e Schedule

**Eventos de Database:**

```
databases.*.tables.transactions.rows.*.create
databases.*.tables.transactions.rows.*.update
databases.*.tables.transactions.rows.*.delete
```

**Schedule (Agendamento):**

Configure o cron schedule para executar diariamente às 05:00 UTC:

```
0 5 * * *
```

Este agendamento processa transações futuras que já chegaram na data programada e transações pendentes que não foram processadas em tempo real.

### 4. Deploy

1. Faça upload do código:

   ```bash
   cd functions/balance-sync
   npm install
   npm run build
   tar -czf balance-sync.tar.gz .
   ```

2. No Appwrite Console:
   - **Functions** > **Balance Sync** > **Deployments**
   - Faça upload do arquivo `balance-sync.tar.gz`
   - Aguarde o build completar

### 5. Testar

Crie, edite ou remova uma transação no banco de dados. A função será executada automaticamente e atualizará o saldo da conta.

## 📊 Logs

A função gera logs detalhados:

**Para execuções via trigger:**

```
[BalanceSync] Handling CREATE event for transaction abc123
[BalanceSync] Transaction ID: abc123
[BalanceSync] Account ID: acc456
[BalanceSync] Amount: 1000
[BalanceSync] Status: pending
[BalanceSync] Updating account acc456 balance by 1000
[BalanceSync] - Current balance: 5000
[BalanceSync] - Balance change: 1000
[BalanceSync] - New balance: 6000
[BalanceSync] Account acc456 balance updated successfully
[BalanceSync] Marking transaction abc123 as completed
[BalanceSync] Transaction abc123 marked as completed
[BalanceSync] CREATE event processed successfully
```

**Para execuções via schedule:**

```
[BalanceSync] Processing pending transactions from schedule
[BalanceSync] Current time: 2025-11-17T05:00:00.000Z
[BalanceSync] Found 15 pending transactions to process
[BalanceSync] Processing transaction abc123
[BalanceSync] Updating account acc456 balance by 1000
[BalanceSync] Transaction abc123 processed successfully
...
[BalanceSync] Processed 15 pending transactions
```

## 🔧 Estrutura do Código

**Via Database Triggers:**

```typescript
// CREATE: Soma amount ao balance
await updateAccountBalance(databases, accountId, amount);
await markTransactionCompleted(databases, transactionId);

// DELETE: Subtrai amount do balance
await updateAccountBalance(databases, accountId, -amount);

// UPDATE: Aplica diferença ao balance
const difference = newAmount - oldAmount;
await updateAccountBalance(databases, accountId, difference);
await markTransactionCompleted(databases, transactionId);
```

**Via Schedule (Processamento em Lote):**

```typescript
// Busca transações pendentes com data <= hoje
const queries = [
  Query.or([Query.equal('status', 'pending'), Query.equal('status', 'failed')]),
  Query.lessThanEqual('date', now.toISOString()),
  Query.limit(100),
];

// Processa cada transação
for (const transaction of transactions) {
  await updateAccountBalance(databases, transaction.account_id, transaction.amount);
  await markTransactionCompleted(databases, transaction.$id);
}
```

## ⚠️ Importante

### Amount Sinalizado

O `amount` da transação já deve vir com o sinal correto:

- **Receitas**: amount positivo (ex: 1000)
- **Despesas**: amount negativo (ex: -500)

A função simplesmente **soma** o amount ao balance, sem fazer conversões.

### Status da Transação

- Transações devem ser criadas/editadas com status `pending` ou `failed`
- A função processa e marca como `completed`
- Transações já `completed` são ignoradas

### Transações Futuras

- Transações com data no futuro **não são processadas imediatamente**
- São processadas pela execução agendada (schedule) quando a data chegar
- Exemplo: transação criada em 15/11 com data 20/11 será processada no dia 20/11 às 05:00 UTC

### Transações de Cartão de Crédito

Transações com `credit_card_id` são ignoradas, pois são gerenciadas separadamente.

## 🛠️ Troubleshooting

### Saldo não atualiza

Verifique:

1. ✅ Função está ativa e deployada
2. ✅ Triggers e schedule configurados corretamente
3. ✅ Transação tem `account_id`
4. ✅ Transação não tem `credit_card_id`
5. ✅ Status da transação é `pending` ou `failed`
6. ✅ Data da transação é <= data atual (ou aguarde execução do schedule)
7. ✅ Logs da função no Appwrite Console

### Transação não marca como completed

Verifique:

1. ✅ Status inicial é `pending` ou `failed`
2. ✅ Não é transação de cartão de crédito
3. ✅ Evento é CREATE ou UPDATE (DELETE não marca)

## 📚 Referências

- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Database Events](https://appwrite.io/docs/advanced/platform/events)
- [TablesDB API Reference](https://appwrite.io/docs/references/cloud/server-nodejs/tablesdb)
