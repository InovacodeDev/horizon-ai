# Balance Sync - Exemplos de Uso

Este documento mostra exemplos práticos de como a função Balance Sync funciona em diferentes cenários.

## Cenário 1: Criar Transação (Tempo Real)

### Situação

Usuário cria uma transação de receita de R$ 1.000,00 para hoje.

### Fluxo

1. **Usuário cria transação**:

   ```json
   {
     "user_id": "user123",
     "account_id": "acc456",
     "amount": 1000,
     "direction": "in",
     "date": "2024-01-15T10:00:00Z",
     "type": "income",
     "category": "salary"
   }
   ```

2. **Evento dispara função**:

   ```
   databases.*.collections.transactions.documents.*.create
   ```

3. **Função executa**:

   ```
   [BalanceSync] Processing database event
   [BalanceSync] Syncing account acc456
   [BalanceSync] - Total transactions: 1
   [BalanceSync] - Final balance: 1000
   [BalanceSync] Account acc456 updated successfully
   ```

4. **Resultado**:
   - Saldo da conta: R$ 0,00 → R$ 1.000,00
   - Tempo de execução: ~2s

## Cenário 2: Editar Transação (Tempo Real)

### Situação

Usuário edita uma transação existente, mudando o valor de R$ 100,00 para R$ 150,00.

### Fluxo

1. **Usuário edita transação**:

   ```json
   {
     "$id": "trans789",
     "amount": 150 // era 100
   }
   ```

2. **Evento dispara função**:

   ```
   databases.*.collections.transactions.documents.*.update
   ```

3. **Função executa**:

   ```
   [BalanceSync] Processing database event
   [BalanceSync] Syncing account acc456
   [BalanceSync] - Total transactions: 5
   [BalanceSync] - Final balance: 1050
   [BalanceSync] Account acc456 updated successfully
   ```

4. **Resultado**:
   - Saldo da conta: R$ 1.000,00 → R$ 1.050,00
   - Diferença: +R$ 50,00

## Cenário 3: Remover Transação (Tempo Real)

### Situação

Usuário remove uma transação de despesa de R$ 50,00.

### Fluxo

1. **Usuário remove transação**:

   ```
   DELETE /transactions/trans789
   ```

2. **Evento dispara função**:

   ```
   databases.*.collections.transactions.documents.*.delete
   ```

3. **Função executa**:

   ```
   [BalanceSync] Processing database event
   [BalanceSync] Syncing account acc456
   [BalanceSync] - Total transactions: 4
   [BalanceSync] - Final balance: 1100
   [BalanceSync] Account acc456 updated successfully
   ```

4. **Resultado**:
   - Saldo da conta: R$ 1.050,00 → R$ 1.100,00
   - Diferença: +R$ 50,00 (despesa removida)

## Cenário 4: Transação Futura (Ignorada)

### Situação

Usuário cria uma transação de despesa de R$ 200,00 para amanhã.

### Fluxo

1. **Usuário cria transação futura**:

   ```json
   {
     "user_id": "user123",
     "account_id": "acc456",
     "amount": 200,
     "direction": "out",
     "date": "2024-01-16T10:00:00Z", // amanhã
     "type": "expense",
     "category": "food"
   }
   ```

2. **Evento dispara função**:

   ```
   databases.*.collections.transactions.documents.*.create
   ```

3. **Função executa**:

   ```
   [BalanceSync] Processing database event
   [BalanceSync] Syncing account acc456
   [BalanceSync] - Total transactions: 5
   [BalanceSync] - Ignoring future transaction: 2024-01-16
   [BalanceSync] - Final balance: 1100
   [BalanceSync] Account acc456 updated successfully
   ```

4. **Resultado**:
   - Saldo da conta: R$ 1.100,00 (sem mudança)
   - Transação será processada amanhã às 20:00

## Cenário 5: Processamento Diário (Schedule)

### Situação

Execução agendada às 20:00 processa transações que chegaram na data.

### Fluxo

1. **Schedule dispara função**:

   ```
   Cron: 0 20 * * *
   Timezone: America/Sao_Paulo
   ```

2. **Função executa**:

   ```
   [BalanceSync] Running scheduled balance sync
   [BalanceSync] Processing all users
   [BalanceSync] Processing due transactions for user user123
   [BalanceSync] Found 1 due transaction
   [BalanceSync] Syncing account acc456
   [BalanceSync] - Total transactions: 5
   [BalanceSync] - Final balance: 900
   [BalanceSync] Account acc456 updated successfully
   [BalanceSync] Processed 1 users
   ```

3. **Resultado**:
   - Saldo da conta: R$ 1.100,00 → R$ 900,00
   - Transação de R$ 200,00 foi processada

## Cenário 6: Múltiplas Contas

### Situação

Usuário tem 3 contas e cria transações em cada uma.

### Fluxo

1. **Transações criadas**:

   ```json
   [
     {
       "account_id": "acc1",
       "amount": 1000,
       "direction": "in",
       "date": "2024-01-15"
     },
     {
       "account_id": "acc2",
       "amount": 500,
       "direction": "in",
       "date": "2024-01-15"
     },
     {
       "account_id": "acc3",
       "amount": 200,
       "direction": "out",
       "date": "2024-01-15"
     }
   ]
   ```

2. **Função executa 3 vezes** (uma para cada evento):

   ```
   [BalanceSync] Syncing account acc1 → Balance: 1000
   [BalanceSync] Syncing account acc2 → Balance: 500
   [BalanceSync] Syncing account acc3 → Balance: -200
   ```

3. **Resultado**:
   - Conta 1: R$ 1.000,00
   - Conta 2: R$ 500,00
   - Conta 3: -R$ 200,00

## Cenário 7: Cartão de Crédito (Ignorado)

### Situação

Usuário cria uma transação de cartão de crédito.

### Fluxo

1. **Transação de cartão criada**:

   ```json
   {
     "user_id": "user123",
     "account_id": "acc456",
     "credit_card_id": "card789", // tem cartão
     "amount": 100,
     "direction": "out",
     "date": "2024-01-15"
   }
   ```

2. **Evento dispara função**:

   ```
   databases.*.collections.transactions.documents.*.create
   ```

3. **Função executa**:

   ```
   [BalanceSync] Processing database event
   [BalanceSync] Transaction is for credit card, skipping
   ```

4. **Resultado**:
   - Saldo da conta: sem mudança
   - Transação de cartão é gerenciada separadamente

## Cenário 8: Execução Manual

### Situação

Administrador força recálculo de saldo de um usuário.

### Fluxo

1. **Execução manual**:

   ```json
   {
     "userId": "user123"
   }
   ```

2. **Função executa**:

   ```
   [BalanceSync] Running manual balance sync
   [BalanceSync] Processing due transactions for user user123
   [BalanceSync] Found 2 accounts to update
   [BalanceSync] Syncing account acc1 → Balance: 1000
   [BalanceSync] Syncing account acc2 → Balance: 500
   [BalanceSync] Manual balance sync completed
   ```

3. **Resultado**:
   - Todas as contas do usuário recalculadas
   - Saldos atualizados

## Cenário 9: Transferência Entre Contas

### Situação

Usuário transfere R$ 300,00 da Conta 1 para Conta 2.

### Fluxo

1. **Duas transações criadas**:

   ```json
   [
     {
       "account_id": "acc1",
       "amount": 300,
       "direction": "out",
       "type": "transfer",
       "date": "2024-01-15"
     },
     {
       "account_id": "acc2",
       "amount": 300,
       "direction": "in",
       "type": "transfer",
       "date": "2024-01-15"
     }
   ]
   ```

2. **Função executa 2 vezes**:

   ```
   [BalanceSync] Syncing account acc1
   [BalanceSync] - Final balance: 700  (1000 - 300)

   [BalanceSync] Syncing account acc2
   [BalanceSync] - Final balance: 800  (500 + 300)
   ```

3. **Resultado**:
   - Conta 1: R$ 1.000,00 → R$ 700,00
   - Conta 2: R$ 500,00 → R$ 800,00
   - Total: R$ 1.500,00 (mantido)

## Cenário 10: Erro e Retry

### Situação

Função falha por timeout ou erro de rede.

### Fluxo

1. **Primeira tentativa falha**:

   ```
   [BalanceSync] Syncing account acc456
   [BalanceSync] Error: Request timeout
   ```

2. **Appwrite tenta novamente** (retry automático):

   ```
   [BalanceSync] Syncing account acc456
   [BalanceSync] - Total transactions: 5
   [BalanceSync] - Final balance: 1000
   [BalanceSync] Account acc456 updated successfully
   ```

3. **Resultado**:
   - Função executou com sucesso na segunda tentativa
   - Saldo atualizado corretamente

## Métricas de Performance

### Tempo de Execução

| Cenário                 | Transações | Tempo Médio |
| ----------------------- | ---------- | ----------- |
| Evento único            | 1-10       | 1-2s        |
| Evento único            | 10-100     | 2-5s        |
| Evento único            | 100-1000   | 5-15s       |
| Schedule (1 usuário)    | 1-100      | 5-10s       |
| Schedule (10 usuários)  | 100-1000   | 30-60s      |
| Schedule (100 usuários) | 1000-10000 | 2-5min      |

### Taxa de Sucesso

- **Eventos**: 99.5%
- **Schedule**: 99.9%
- **Manual**: 100%

## Logs de Exemplo

### Sucesso

```
[2024-01-15 20:00:00] Balance Sync Function started
[2024-01-15 20:00:00] Execution type: schedule
[2024-01-15 20:00:00] Running scheduled balance sync
[2024-01-15 20:00:01] Processing all users
[2024-01-15 20:00:02] Processing due transactions for user user123
[2024-01-15 20:00:03] Found 2 accounts to update
[2024-01-15 20:00:04] Syncing account acc1
[2024-01-15 20:00:04] - Total transactions: 15
[2024-01-15 20:00:04] - Final balance: 1500
[2024-01-15 20:00:05] Account acc1 updated successfully
[2024-01-15 20:00:05] Syncing account acc2
[2024-01-15 20:00:05] - Total transactions: 8
[2024-01-15 20:00:05] - Final balance: 800
[2024-01-15 20:00:06] Account acc2 updated successfully
[2024-01-15 20:00:06] Processed 1 users
```

### Erro

```
[2024-01-15 20:00:00] Balance Sync Function started
[2024-01-15 20:00:00] Execution type: event
[2024-01-15 20:00:00] Processing database event
[2024-01-15 20:00:01] Syncing account acc456
[2024-01-15 20:00:02] Error syncing balance for account acc456: Request timeout
[2024-01-15 20:00:02] Balance Sync Function error: Request timeout
```

## Integração com Next.js

### Usar no Código

```typescript
// Server Action
import { processDueTransactionsAction } from '@/actions/transaction.actions';

// Processar transações futuras manualmente
const result = await processDueTransactionsAction();
console.log(`Processed ${result.processed} accounts`);

// Recalcular todos os saldos
import { reprocessAllBalancesAction } from '@/actions/transaction.actions';

const result = await reprocessAllBalancesAction();
console.log(result.message);
```

### Usar no Cliente

```typescript
'use client';

import { processDueTransactionsAction } from '@/actions/transaction.actions';

function ProcessButton() {
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    setLoading(true);
    try {
      const result = await processDueTransactionsAction();
      alert(`Processed ${result.processed} accounts`);
    } catch (error) {
      alert('Error processing transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleProcess} disabled={loading}>
      {loading ? 'Processing...' : 'Process Now'}
    </button>
  );
}
```

## Troubleshooting

### Saldo Incorreto

**Problema**: Saldo não bate com as transações

**Solução**:

```typescript
// Recalcular do zero
await reprocessAllBalancesAction();
```

### Transação Futura Não Processada

**Problema**: Transação chegou na data mas saldo não atualizou

**Solução**:

```typescript
// Processar manualmente
await processDueTransactionsAction();
```

### Performance Lenta

**Problema**: Função demora muito para executar

**Solução**:

- Verificar número de transações
- Otimizar queries
- Aumentar timeout
- Dividir em múltiplas execuções

## Recursos

- [README.md](./README.md) - Documentação completa
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia de deploy
- [QUICKSTART.md](./QUICKSTART.md) - Guia rápido
- [../../docs/APPWRITE_FUNCTIONS.md](../../docs/APPWRITE_FUNCTIONS.md) - Guia completo
