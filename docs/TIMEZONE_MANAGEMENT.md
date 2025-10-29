# Gerenciamento de Timezone

## Visão Geral

Todas as datas no sistema são armazenadas em **UTC** no banco de dados, mas são exibidas e manipuladas no **timezone do usuário**. Isso garante consistência independente de onde o usuário está localizado.

## Princípios

### 1. Armazenamento

- ✅ Todas as datas são armazenadas em **UTC** no banco de dados
- ✅ Formato ISO 8601: `2025-10-29T03:00:00.000Z`
- ✅ Sempre com timezone explícito (Z = UTC)

### 2. Exibição

- ✅ Datas são exibidas no **timezone do usuário**
- ✅ Detectado automaticamente do navegador
- ✅ Fallback para `America/Sao_Paulo` (UTC-3)

### 3. Entrada

- ✅ Usuário insere datas no formato local (YYYY-MM-DD)
- ✅ Sistema converte para UTC antes de salvar
- ✅ Mantém o "dia" correto no timezone do usuário

## Funções Utilitárias

### `getUserTimezone()`

Obtém o timezone do usuário do navegador.

```typescript
const timezone = getUserTimezone();
// Returns: "America/Sao_Paulo" ou timezone do navegador
```

### `dateToUserTimezone(dateString, timezone?)`

Converte uma data (YYYY-MM-DD) para ISO string em UTC, representando o início do dia no timezone do usuário.

```typescript
// Usuário em São Paulo (UTC-3)
dateToUserTimezone('2025-10-29');
// Returns: '2025-10-29T03:00:00.000Z'
// Que é 2025-10-29 00:00:00 em São Paulo
```

**Por que isso é importante?**

Sem conversão:

```typescript
// ❌ Errado
new Date('2025-10-29').toISOString();
// Returns: '2025-10-29T00:00:00.000Z'
// Que é 2025-10-28 21:00:00 em São Paulo (dia anterior!)
```

Com conversão:

```typescript
// ✅ Correto
dateToUserTimezone('2025-10-29');
// Returns: '2025-10-29T03:00:00.000Z'
// Que é 2025-10-29 00:00:00 em São Paulo (dia correto!)
```

### `isoToUserTimezone(isoString, timezone?)`

Converte uma ISO string para data (YYYY-MM-DD) no timezone do usuário.

```typescript
// Usuário em São Paulo (UTC-3)
isoToUserTimezone('2025-10-29T03:00:00.000Z');
// Returns: '2025-10-29'
```

### `getCurrentDateInUserTimezone(timezone?)`

Obtém a data atual no timezone do usuário.

```typescript
const today = getCurrentDateInUserTimezone();
// Returns: '2025-10-29' (data de hoje em São Paulo)
```

### `formatDateInUserTimezone(isoString, timezone?, options?)`

Formata uma data para exibição no timezone do usuário.

```typescript
formatDateInUserTimezone('2025-10-29T03:00:00.000Z');
// Returns: '29/10/2025'

formatDateInUserTimezone('2025-10-29T03:00:00.000Z', undefined, {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});
// Returns: '29 de outubro de 2025'
```

### `addDaysInUserTimezone(dateString, days, timezone?)`

Adiciona dias a uma data no timezone do usuário.

```typescript
addDaysInUserTimezone('2025-10-29', 7);
// Returns: '2025-11-05'

addDaysInUserTimezone('2025-10-29', -1);
// Returns: '2025-10-28'
```

### `getStartOfMonthInUserTimezone(year, month, timezone?)`

Obtém o início do mês no timezone do usuário.

```typescript
getStartOfMonthInUserTimezone(2025, 11);
// Returns: '2025-11-01T03:00:00.000Z' (início de novembro em São Paulo)
```

### `getEndOfMonthInUserTimezone(year, month, timezone?)`

Obtém o fim do mês no timezone do usuário.

```typescript
getEndOfMonthInUserTimezone(2025, 11);
// Returns: '2025-11-30T23:59:59.999Z' (fim de novembro em São Paulo)
```

### `isSameDayInUserTimezone(date1, date2, timezone?)`

Verifica se duas datas são o mesmo dia no timezone do usuário.

```typescript
isSameDayInUserTimezone('2025-10-29T03:00:00.000Z', '2025-10-29T23:59:59.999Z');
// Returns: true (ambas são 29/10/2025 em São Paulo)
```

## Uso no Código

### Transaction Service

```typescript
import { dateToUserTimezone } from '@/lib/utils/timezone';

// Ao criar transação
const dateInUserTimezone = data.date.includes('T') ? data.date : dateToUserTimezone(data.date);

const payload = {
  date: dateInUserTimezone, // Salva em UTC
  // ...
};
```

### API Routes

```typescript
import { dateToUserTimezone } from '@/lib/utils/timezone';

// Ao receber data do frontend
const body = await request.json();
const date = dateToUserTimezone(body.date);

// Salvar no banco
await transactionService.createTransaction({
  date, // Já em UTC
  // ...
});
```

### Frontend Components

```typescript
import { getCurrentDateInUserTimezone, isoToUserTimezone } from '@/lib/utils/timezone';

// Ao exibir data
const displayDate = isoToUserTimezone(transaction.date);

// Ao inicializar input de data
const [date, setDate] = useState(getCurrentDateInUserTimezone());
```

## Exemplos Práticos

### Exemplo 1: Criar Transação

**Frontend:**

```typescript
// Usuário seleciona: 29/10/2025
const formData = {
  date: '2025-10-29', // YYYY-MM-DD
  amount: 100.0,
  // ...
};

// Enviar para API
await fetch('/api/transactions', {
  method: 'POST',
  body: JSON.stringify(formData),
});
```

**Backend (Transaction Service):**

```typescript
// Recebe: '2025-10-29'
const dateInUserTimezone = dateToUserTimezone('2025-10-29');
// Converte: '2025-10-29T03:00:00.000Z' (UTC)

// Salva no banco
await databases.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, id, {
  date: dateInUserTimezone, // '2025-10-29T03:00:00.000Z'
  // ...
});
```

**Banco de Dados:**

```json
{
  "date": "2025-10-29T03:00:00.000Z"
}
```

**Frontend (Exibição):**

```typescript
// Lê do banco: '2025-10-29T03:00:00.000Z'
const displayDate = isoToUserTimezone(transaction.date);
// Exibe: '2025-10-29'
```

### Exemplo 2: Filtrar por Mês

**Frontend:**

```typescript
// Usuário quer ver transações de novembro/2025
const startDate = getStartOfMonthInUserTimezone(2025, 11);
// Returns: '2025-11-01T03:00:00.000Z'

const endDate = getEndOfMonthInUserTimezone(2025, 11);
// Returns: '2025-11-30T23:59:59.999Z'

// Buscar transações
const transactions = await fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}`);
```

**Backend:**

```typescript
// Query no banco
const transactions = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
  Query.greaterThanEqual('date', startDate),
  Query.lessThanEqual('date', endDate),
]);
```

### Exemplo 3: Parcelas Mensais

**Criar parcelas:**

```typescript
const purchaseDate = '2025-10-29';
const installments = 12;

for (let i = 0; i < installments; i++) {
  // Adicionar meses à data
  const installmentDate = new Date(purchaseDate);
  installmentDate.setMonth(installmentDate.getMonth() + i);

  // Converter para timezone do usuário
  const dateString = installmentDate.toISOString().split('T')[0];
  const dateInUserTimezone = dateToUserTimezone(dateString);

  await createTransaction({
    date: dateInUserTimezone,
    installment: i + 1,
    installments: 12,
    // ...
  });
}
```

## Problemas Comuns e Soluções

### Problema 1: Data Aparece com Dia Anterior

**Sintoma:**

```typescript
// Usuário seleciona: 29/10/2025
// Sistema exibe: 28/10/2025
```

**Causa:**

```typescript
// ❌ Errado - não converte timezone
new Date('2025-10-29').toISOString();
// Returns: '2025-10-29T00:00:00.000Z'
// Em São Paulo (UTC-3): 28/10/2025 21:00:00
```

**Solução:**

```typescript
// ✅ Correto - converte timezone
dateToUserTimezone('2025-10-29');
// Returns: '2025-10-29T03:00:00.000Z'
// Em São Paulo (UTC-3): 29/10/2025 00:00:00
```

### Problema 2: Comparação de Datas Falha

**Sintoma:**

```typescript
// Duas datas do mesmo dia não são iguais
date1 === date2; // false
```

**Causa:**

```typescript
// Comparando ISO strings com horários diferentes
'2025-10-29T03:00:00.000Z' === '2025-10-29T15:00:00.000Z'; // false
```

**Solução:**

```typescript
// Usar função de comparação
isSameDayInUserTimezone(date1, date2); // true
```

### Problema 3: Filtro de Mês Não Funciona

**Sintoma:**

```typescript
// Transações de novembro não aparecem
```

**Causa:**

```typescript
// ❌ Errado - não considera timezone
const startDate = '2025-11-01T00:00:00.000Z';
// Em São Paulo: 31/10/2025 21:00:00 (ainda outubro!)
```

**Solução:**

```typescript
// ✅ Correto - usa função de timezone
const startDate = getStartOfMonthInUserTimezone(2025, 11);
// Returns: '2025-11-01T03:00:00.000Z'
// Em São Paulo: 01/11/2025 00:00:00 (novembro correto!)
```

## Testes

### Teste 1: Conversão de Data

```typescript
describe('dateToUserTimezone', () => {
  it('should convert date to user timezone', () => {
    const result = dateToUserTimezone('2025-10-29');
    expect(result).toBe('2025-10-29T03:00:00.000Z');
  });
});
```

### Teste 2: Exibição de Data

```typescript
describe('isoToUserTimezone', () => {
  it('should display date in user timezone', () => {
    const result = isoToUserTimezone('2025-10-29T03:00:00.000Z');
    expect(result).toBe('2025-10-29');
  });
});
```

### Teste 3: Mesmo Dia

```typescript
describe('isSameDayInUserTimezone', () => {
  it('should return true for same day', () => {
    const result = isSameDayInUserTimezone('2025-10-29T03:00:00.000Z', '2025-10-29T23:59:59.999Z');
    expect(result).toBe(true);
  });
});
```

## Checklist de Implementação

Ao trabalhar com datas:

- [ ] Usar `dateToUserTimezone()` ao salvar datas no banco
- [ ] Usar `isoToUserTimezone()` ao exibir datas para o usuário
- [ ] Usar `getCurrentDateInUserTimezone()` para data atual
- [ ] Usar `getStartOfMonthInUserTimezone()` e `getEndOfMonthInUserTimezone()` para filtros de mês
- [ ] Usar `isSameDayInUserTimezone()` para comparar datas
- [ ] Nunca usar `new Date(dateString).toISOString()` diretamente
- [ ] Sempre verificar se a data já está em formato ISO antes de converter

## Referências

- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) - Formato de data padrão
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - API de formatação de datas
- [IANA Time Zone Database](https://www.iana.org/time-zones) - Lista de timezones
