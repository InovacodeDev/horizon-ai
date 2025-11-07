# Sincronização Automática de Saldo

## Visão Geral

O sistema agora possui um serviço de sincronização automática de saldo que atualiza o saldo de todas as contas a cada 5 minutos. Isso garante que os saldos estejam sempre atualizados, mesmo que haja alguma inconsistência temporária.

## Como Funciona

### 1. Serviço de Sincronização Automática

O serviço `AutoBalanceSyncService` (`lib/services/auto-balance-sync.service.ts`) é responsável por:

- Executar a sincronização de saldo a cada 5 minutos
- Buscar todas as contas do sistema
- Sincronizar o saldo de cada conta usando o `BalanceSyncService`
- Registrar logs de sucesso e erro

### 2. Inicialização Automática

O serviço é inicializado automaticamente quando o servidor Next.js inicia:

1. `app/layout.tsx` importa `@/lib/server-init`
2. `lib/server-init.ts` chama `initializeServices()`
3. `lib/services/init-services.ts` inicia o `AutoBalanceSyncService`

### 3. Controle do Serviço

Você pode controlar o serviço programaticamente:

```typescript
import { getAutoBalanceSyncService } from '@/lib/services/auto-balance-sync.service';

const service = getAutoBalanceSyncService();

// Verificar se está rodando
const isRunning = service.isActive();

// Forçar sincronização imediata
await service.syncNow();

// Parar o serviço
service.stop();

// Reiniciar o serviço
service.start();
```

## Tratamento de Timezone

### Problema Resolvido

Anteriormente, as datas eram salvas diretamente no banco sem considerar o timezone do usuário. Isso causava problemas onde:

- Usuário em UTC-3 salvava 01/11/2025 00:00:00
- Era salvo como 01/11/2025 00:00:00 UTC (incorreto)
- Deveria ser salvo como 01/11/2025 03:00:00 UTC (correto)

### Solução Implementada

Todas as datas agora são convertidas para UTC considerando o timezone do usuário:

```typescript
import { dateToUserTimezone } from '@/lib/utils/timezone';

// Converter data local para UTC
const utcDate = dateToUserTimezone('2025-11-01'); // Retorna '2025-11-01T03:00:00.000Z' para UTC-3
```

### Funções de Timezone

O arquivo `lib/utils/timezone.ts` fornece várias funções úteis:

- `getUserTimezone()`: Obtém o timezone do usuário
- `getTimezoneOffset()`: Calcula o offset em minutos
- `dateToUserTimezone()`: Converte data local para UTC
- `isoToUserTimezone()`: Converte UTC para data local
- `getCurrentDateTimeInUTC()`: Obtém data/hora atual em UTC ajustada

### Locais Atualizados

Os seguintes serviços foram atualizados para usar o tratamento correto de timezone:

1. **TransactionService** (`lib/services/transaction.service.ts`)
   - `createManualTransaction()`
   - `createIntegrationTransaction()`
   - `updateTransaction()`

2. **AccountService** (`lib/services/account.service.ts`)
   - `createAccount()`
   - `updateAccount()`
   - `transferBalance()`

3. **BalanceSyncService** (`lib/services/balance-sync.service.ts`)
   - `syncAccountBalance()`

## Logs e Monitoramento

O serviço registra logs detalhados no console:

```
[AutoBalanceSync] Iniciando sincronização automática a cada 5 minutos
[AutoBalanceSync] Iniciando sincronização de todas as contas...
[AutoBalanceSync] Encontradas 10 contas para sincronizar
[BalanceSync] Syncing account abc123 (Conta Corrente, type: checking)
[BalanceSync] Found 25 transactions for account abc123
[BalanceSync] Final calculated balance for account abc123: 1500.50
[AutoBalanceSync] Sincronização concluída em 1234ms - Sucesso: 10, Erros: 0
```

## Configuração

### Alterar Intervalo de Sincronização

Para alterar o intervalo de 5 minutos, edite `lib/services/auto-balance-sync.service.ts`:

```typescript
private syncIntervalMs: number = 5 * 60 * 1000; // 5 minutos
```

### Desabilitar Sincronização Automática

Para desabilitar temporariamente, comente a linha em `lib/services/init-services.ts`:

```typescript
// startAutoBalanceSync(); // Desabilitado
```

## Testes

Para testar a sincronização manualmente:

```typescript
import { getAutoBalanceSyncService } from '@/lib/services/auto-balance-sync.service';

// Forçar sincronização imediata
const service = getAutoBalanceSyncService();
await service.syncNow();
```

## Considerações de Performance

- O serviço sincroniza todas as contas em paralelo
- Cada conta é sincronizada individualmente para evitar falhas em cascata
- Erros em contas individuais não afetam a sincronização das outras
- O tempo de execução depende do número de contas e transações

## Troubleshooting

### Serviço não está iniciando

Verifique os logs do servidor para erros de inicialização:

```bash
npm run dev
# Procure por: [Services] Inicializando serviços em background...
```

### Saldos não estão atualizando

1. Verifique se o serviço está rodando:

   ```typescript
   const service = getAutoBalanceSyncService();
   console.log(service.isActive()); // Deve retornar true
   ```

2. Force uma sincronização manual:

   ```typescript
   await service.syncNow();
   ```

3. Verifique os logs para erros específicos

### Problemas de Timezone

Se as datas ainda estão incorretas:

1. Verifique o timezone do usuário:

   ```typescript
   import { getUserTimezone } from '@/lib/utils/timezone';

   console.log(getUserTimezone()); // Ex: 'America/Sao_Paulo'
   ```

2. Teste a conversão manualmente:

   ```typescript
   import { dateToUserTimezone } from '@/lib/utils/timezone';

   console.log(dateToUserTimezone('2025-11-01'));
   ```

3. Verifique se todos os serviços estão usando `dateToUserTimezone()`
