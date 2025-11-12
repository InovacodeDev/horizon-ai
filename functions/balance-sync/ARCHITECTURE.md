# Balance Sync - Arquitetura

Documentação técnica da arquitetura da função Balance Sync.

## 📐 Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         Horizon AI App                          │
│                      (Next.js 16 + React 19)                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP/HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Appwrite Cloud                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Database                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ Transactions│  │  Accounts   │  │ Credit Cards│      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                 │                                │
│                                 │ Events                         │
│                                 ▼                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Balance Sync Function                    │  │
│  │                                                           │  │
│  │  Triggers:                                                │  │
│  │  • transactions.*.create                                  │  │
│  │  • transactions.*.update                                  │  │
│  │  • transactions.*.delete                                  │  │
│  │  • Schedule: 0 20 * * * (20:00 daily)                    │  │
│  │                                                           │  │
│  │  Logic:                                                   │  │
│  │  1. Fetch all transactions for account                   │  │
│  │  2. Filter future transactions                            │  │
│  │  3. Filter credit card transactions                       │  │
│  │  4. Calculate balance (sum/subtract)                      │  │
│  │  5. Update account balance                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados

### 1. Evento de Criação de Transação

```
User Action
    │
    ▼
Next.js Server Action
    │
    ▼
Appwrite Database
    │
    ├─► Create Transaction Document
    │
    ├─► Trigger Event: transactions.*.create
    │
    ▼
Balance Sync Function
    │
    ├─► Fetch Transaction Data
    │
    ├─► Get Account ID
    │
    ├─► Fetch All Transactions for Account
    │
    ├─► Filter Transactions:
    │   ├─► Ignore if credit_card_id exists
    │   └─► Ignore if date > today
    │
    ├─► Calculate Balance:
    │   ├─► direction: 'in' → add amount
    │   └─► direction: 'out' → subtract amount
    │
    └─► Update Account Balance
```

### 2. Execução Agendada (Schedule)

```
Cron Trigger (20:00 daily)
    │
    ▼
Balance Sync Function
    │
    ├─► Fetch All Accounts
    │
    ├─► Group by User ID
    │
    ├─► For Each User:
    │   │
    │   ├─► Fetch All Transactions
    │   │
    │   ├─► Filter Due Transactions:
    │   │   └─► date <= today
    │   │
    │   ├─► Group by Account ID
    │   │
    │   └─► For Each Account:
    │       │
    │       ├─► Recalculate Balance
    │       │
    │       └─► Update Account
    │
    └─► Return Summary
```

## 🏗️ Estrutura do Código

```typescript
// main.ts

export default async ({ req, res, log, error }: any) => {
  // 1. Initialize Appwrite Client
  const { databases } = initializeClient();

  // 2. Determine Execution Type
  const executionType = req.headers['x-appwrite-trigger'];

  // 3. Route to Appropriate Handler
  if (executionType === 'schedule') {
    return handleSchedule(databases, res);
  } else if (executionType === 'event') {
    return handleEvent(databases, req.body, res);
  } else {
    return handleManual(databases, req.body, res);
  }
};

// Helper Functions

async function syncAccountBalance(databases: Databases, accountId: string): Promise<number> {
  // 1. Fetch account
  // 2. Fetch all transactions
  // 3. Filter transactions
  // 4. Calculate balance
  // 5. Update account
  // 6. Return new balance
}

async function processDueTransactions(databases: Databases, userId: string): Promise<number> {
  // 1. Fetch all user transactions
  // 2. Filter due transactions
  // 3. Group by account
  // 4. Sync each account
  // 5. Return count
}

async function processAllUsers(databases: Databases): Promise<void> {
  // 1. Fetch all accounts
  // 2. Group by user
  // 3. Process each user
}
```

## 🔐 Segurança

### Autenticação

```
API Key (Server-side)
    │
    ├─► Stored in Environment Variables
    │
    ├─► Scopes:
    │   ├─► databases.read
    │   └─► databases.write
    │
    └─► Never exposed to client
```

### Autorização

```
Function Execution
    │
    ├─► Triggered by:
    │   ├─► Database Events (automatic)
    │   ├─► Schedule (automatic)
    │   └─► API Key (manual)
    │
    └─► No user-level permissions needed
```

## 📊 Modelo de Dados

### Transaction

```typescript
interface Transaction {
  $id: string;
  user_id: string;
  account_id?: string;
  credit_card_id?: string;
  amount: number;
  direction: 'in' | 'out';
  date: string;
  type: 'income' | 'expense' | 'transfer' | 'salary';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  // ... outros campos
}
```

### Account

```typescript
interface Account {
  $id: string;
  user_id: string;
  name: string;
  balance: number;
  synced_transaction_ids?: string; // JSON array
  // ... outros campos
}
```

## ⚡ Performance

### Otimizações

1. **Paginação**:

   ```typescript
   const limit = 500;
   let offset = 0;

   while (true) {
     const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
       Query.limit(limit),
       Query.offset(offset),
     ]);

     if (result.documents.length === 0) break;

     // Process documents

     offset += limit;
   }
   ```

2. **Caching**:
   - Transactions são buscadas uma vez por execução
   - Resultados são processados em memória
   - Apenas uma atualização por conta

3. **Batch Processing**:
   - Schedule processa múltiplos usuários
   - Cada usuário é processado independentemente
   - Erros não afetam outros usuários

### Métricas

| Operação             | Complexidade | Tempo Médio  |
| -------------------- | ------------ | ------------ |
| Fetch Transactions   | O(n)         | 1-3s         |
| Calculate Balance    | O(n)         | < 1s         |
| Update Account       | O(1)         | < 1s         |
| **Total (Event)**    | **O(n)**     | **2-5s**     |
| **Total (Schedule)** | **O(n×m)**   | **30s-5min** |

_n = número de transações, m = número de usuários_

## 🔄 Estados e Transições

### Estado da Função

```
┌─────────┐
│ Stopped │
└────┬────┘
     │ Deploy
     ▼
┌─────────┐
│ Building│
└────┬────┘
     │ Build Success
     ▼
┌─────────┐     Trigger      ┌──────────┐
│  Ready  │ ───────────────► │ Executing│
└─────────┘                  └────┬─────┘
     ▲                            │
     │         Success/Error      │
     └────────────────────────────┘
```

### Estado da Transação

```
┌─────────┐
│ Created │
└────┬────┘
     │
     ▼
┌──────────────┐
│ Future?      │
├──────┬───────┤
│ Yes  │  No   │
└──┬───┴───┬───┘
   │       │
   │       ▼
   │  ┌─────────────┐
   │  │ Sync Balance│
   │  └─────────────┘
   │
   ▼
┌──────────────┐
│ Wait for Date│
└──────┬───────┘
       │ Schedule (20:00)
       ▼
┌─────────────┐
│ Sync Balance│
└─────────────┘
```

## 🧪 Testes

### Casos de Teste

1. **Criar Transação**:
   - Input: Nova transação
   - Expected: Saldo atualizado imediatamente

2. **Editar Transação**:
   - Input: Transação modificada
   - Expected: Saldo recalculado

3. **Remover Transação**:
   - Input: Transação removida
   - Expected: Saldo recalculado

4. **Transação Futura**:
   - Input: Transação com data futura
   - Expected: Saldo não muda até a data

5. **Transação de Cartão**:
   - Input: Transação com credit_card_id
   - Expected: Ignorada

6. **Schedule**:
   - Input: Cron trigger
   - Expected: Transações futuras processadas

### Testes de Performance

```typescript
// Teste de carga
const transactions = generateTransactions(1000);
const startTime = Date.now();

await syncAccountBalance(accountId);

const endTime = Date.now();
const duration = endTime - startTime;

assert(duration < 15000, 'Should complete in < 15s');
```

## 🔍 Monitoramento

### Logs

```typescript
// Estrutura de logs
log(`[BalanceSync] ${message}`);
error(`[BalanceSync] Error: ${errorMessage}`);

// Exemplos
log('[BalanceSync] Syncing account acc123');
log('[BalanceSync] - Total transactions: 50');
log('[BalanceSync] - Final balance: 1500');
log('[BalanceSync] Account acc123 updated successfully');
```

### Métricas

```typescript
// Métricas coletadas
{
  executionId: string;
  executionType: 'event' | 'schedule' | 'manual';
  duration: number;
  status: 'success' | 'error';
  accountsProcessed: number;
  transactionsProcessed: number;
  timestamp: string;
}
```

## 🚀 Escalabilidade

### Limites Atuais

- **Transações por conta**: 10.000
- **Contas por usuário**: 100
- **Usuários por execução**: 1.000
- **Timeout**: 900s (15 min)

### Estratégias de Escala

1. **Horizontal**:
   - Múltiplas funções processando diferentes usuários
   - Load balancing automático do Appwrite

2. **Vertical**:
   - Aumentar timeout
   - Otimizar queries
   - Usar índices adequados

3. **Caching**:
   - Cache de transações frequentes
   - Cache de saldos calculados

## 🔮 Evolução Futura

### Melhorias Planejadas

1. **Retry Logic**:

   ```typescript
   async function syncWithRetry(accountId: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await syncAccountBalance(accountId);
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await sleep(1000 * (i + 1));
       }
     }
   }
   ```

2. **Dead Letter Queue**:
   - Armazenar falhas para análise
   - Reprocessar automaticamente

3. **Métricas Avançadas**:
   - Exportar para ferramentas de monitoramento
   - Dashboards em tempo real

4. **Otimizações**:
   - Processamento em paralelo
   - Batch updates
   - Incremental sync

## 📚 Referências

- [Appwrite Functions Architecture](https://appwrite.io/docs/products/functions)
- [Node.js Runtime](https://appwrite.io/docs/products/functions/runtimes#node)
- [Database Events](https://appwrite.io/docs/advanced/platform/events)
- [Cron Expressions](https://crontab.guru/)

---

**Versão**: 1.0.0

**Última atualização**: Janeiro 2024
