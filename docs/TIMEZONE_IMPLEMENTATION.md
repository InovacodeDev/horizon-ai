# Implementação de Timezone

## Visão Geral

Este documento descreve como o sistema trata datas e timezones para garantir consistência ao salvar e exibir informações no banco de dados Appwrite.

## Problema

Quando um usuário em um timezone específico (ex: UTC-3) salva uma data no sistema, é importante que essa data seja armazenada corretamente em UTC no banco de dados, considerando o offset do timezone.

### Exemplo do Problema

- Usuário em São Paulo (UTC-3) seleciona: **01/11/2025**
- Sem tratamento correto: salva como **01/11/2025 00:00:00 UTC** ❌
- Com tratamento correto: salva como **01/11/2025 03:00:00 UTC** ✅

## Solução Implementada

### 1. Função Principal: `dateToUserTimezone()`

Esta função converte uma data local (YYYY-MM-DD) para UTC, considerando o timezone do usuário:

```typescript
import { dateToUserTimezone } from '@/lib/utils/timezone';

// Usuário em UTC-3
const utcDate = dateToUserTimezone('2025-11-01');
// Retorna: '2025-11-01T03:00:00.000Z'
```

### 2. Como Funciona

A conversão segue estes passos:

1. **Parse da data**: Extrai ano, mês e dia da string
2. **Cria Date local**: Cria um objeto Date tratando como meia-noite local
3. **Calcula offset**: Determina a diferença entre o timezone alvo e UTC
4. **Ajusta para UTC**: Subtrai o offset para obter o horário UTC correto

### 3. Exemplos por Timezone

```
Data local: 2025-11-01 00:00:00

America/Sao_Paulo (UTC-3):  -> 2025-11-01T03:00:00.000Z
America/New_York (UTC-5):   -> 2025-11-01T05:00:00.000Z
Europe/London (UTC+0):      -> 2025-11-01T00:00:00.000Z
Asia/Tokyo (UTC+9):         -> 2025-10-31T15:00:00.000Z
```

## Uso nos Serviços

### TransactionService

```typescript
import { dateToUserTimezone } from '@/lib/utils/timezone';

async createManualTransaction(data: CreateTransactionData): Promise<Transaction> {
  const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

  // Converter data do usuário para UTC
  const dateInUserTimezone = data.date.includes('T')
    ? data.date
    : dateToUserTimezone(data.date);

  const payload = {
    date: dateInUserTimezone,
    created_at: now,
    updated_at: now,
    // ...
  };
}
```

### AccountService

```typescript
import { dateToUserTimezone } from '@/lib/utils/timezone';

async createAccount(userId: string, data: CreateAccountData): Promise<Account> {
  const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

  const document = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, ID.unique(), {
    created_at: now,
    updated_at: now,
    // ...
  });
}
```

### BalanceSyncService

```typescript
import { dateToUserTimezone } from '@/lib/utils/timezone';

async syncAccountBalance(accountId: string): Promise<number> {
  const now = dateToUserTimezone(new Date().toISOString().split('T')[0]);

  await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId, {
    updated_at: now,
    // ...
  });
}
```

## Funções Utilitárias

### `getUserTimezone()`

Obtém o timezone do usuário (browser ou padrão):

```typescript
const tz = getUserTimezone();
// Retorna: 'America/Sao_Paulo'
```

### `getTimezoneOffset()`

Calcula o offset em minutos para um timezone:

```typescript
const offset = getTimezoneOffset('America/Sao_Paulo');
// Retorna: -180 (minutos) = -3 horas
```

### `isoToUserTimezone()`

Converte uma data UTC de volta para o formato local:

```typescript
const localDate = isoToUserTimezone('2025-11-01T03:00:00.000Z');
// Retorna: '2025-11-01'
```

### `getCurrentDateTimeInUTC()`

Obtém a data/hora atual em UTC ajustada para o timezone:

```typescript
const now = getCurrentDateTimeInUTC();
// Retorna: '2025-11-07T03:51:12.349Z'
```

## Teste de Timezone

Execute o script de teste para validar a implementação:

```bash
npx tsx scripts/test-timezone.ts
```

Saída esperada:

```
=== Teste de Timezone ===

1. Timezone do usuário: America/Sao_Paulo
2. Offset do timezone: -180 minutos (-3 horas)

3. Conversão de data local para UTC:
   Input (local): 2025-11-01 00:00:00
   Output (UTC): 2025-11-01T03:00:00.000Z

4. Conversão de UTC de volta para local:
   Input (UTC): 2025-11-01T03:00:00.000Z
   Output (local): 2025-11-01

6. Teste com diferentes timezones:
   America/Sao_Paulo (-3h): 2025-11-01 -> 2025-11-01T03:00:00.000Z
   America/New_York (-5h): 2025-11-01 -> 2025-11-01T05:00:00.000Z
   Europe/London (0h): 2025-11-01 -> 2025-11-01T00:00:00.000Z
   Asia/Tokyo (9h): 2025-11-01 -> 2025-10-31T15:00:00.000Z
```

## Checklist de Implementação

Ao adicionar novos campos de data em serviços:

- [ ] Usar `dateToUserTimezone()` para converter datas antes de salvar
- [ ] Aplicar em campos `created_at` e `updated_at`
- [ ] Aplicar em campos de data customizados (ex: `date`, `purchase_date`)
- [ ] Testar com diferentes timezones
- [ ] Verificar que a data é exibida corretamente no frontend

## Serviços Atualizados

Os seguintes serviços já foram atualizados com o tratamento correto de timezone:

✅ `TransactionService`
✅ `AccountService`
✅ `BalanceSyncService`

## Próximos Passos

Para garantir consistência total, os seguintes serviços ainda precisam ser atualizados:

- [ ] `CreditCardService`
- [ ] `CreditCardTransactionService`
- [ ] `InvoiceService`
- [ ] `UserService`
- [ ] `AnalyticsService`
- [ ] `ExportService`

## Referências

- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [ISO 8601 Date Format](https://www.iso.org/iso-8601-date-and-time-format.html)
