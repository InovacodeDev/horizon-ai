# Balance Sync Function

Função Appwrite para atualizar automaticamente o saldo das contas quando transações são modificadas.

## 🎯 Funcionalidade

Esta função é **extremamente simples e direta**:

1. **CREATE**: Quando uma transação é criada → soma o `amount` ao `balance` da conta
2. **DELETE**: Quando uma transação é deletada → subtrai o `amount` do `balance` da conta
3. **UPDATE**: Quando uma transação é editada → calcula a diferença entre o `amount` antigo e novo, aplica ao `balance`

### Regras

- ✅ Processa apenas transações com status `pending` ou `failed`
- ✅ Marca transação como `completed` após processar (CREATE e UPDATE)
- ✅ O `amount` já vem sinalizado (positivo/negativo), basta somar
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

### 3. Configurar Triggers (Eventos de Database)

Adicione os seguintes eventos:

```
databases.*.tables.transactions.rows.*.create
databases.*.tables.transactions.rows.*.update
databases.*.tables.transactions.rows.*.delete
```

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

## 🔧 Estrutura do Código

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

### Transações de Cartão de Crédito

Transações com `credit_card_id` são ignoradas, pois são gerenciadas separadamente.

## 🛠️ Troubleshooting

### Saldo não atualiza

Verifique:

1. ✅ Função está ativa e deployada
2. ✅ Triggers configurados corretamente
3. ✅ Transação tem `account_id`
4. ✅ Transação não tem `credit_card_id`
5. ✅ Status da transação é `pending` ou `failed`
6. ✅ Logs da função no Appwrite Console

### Transação não marca como completed

Verifique:

1. ✅ Status inicial é `pending` ou `failed`
2. ✅ Não é transação de cartão de crédito
3. ✅ Evento é CREATE ou UPDATE (DELETE não marca)

## 📚 Referências

- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Database Events](https://appwrite.io/docs/advanced/platform/events)
- [TablesDB API Reference](https://appwrite.io/docs/references/cloud/server-nodejs/tablesdb)
