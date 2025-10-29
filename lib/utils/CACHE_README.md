# Sistema de Cache

Sistema centralizado de cache para otimizar performance e reduzir chamadas à API.

## Características

- **TTL padrão**: 12 horas
- **Invalidação automática**: Cache é limpo quando dados são criados, atualizados ou removidos
- **Gerenciamento centralizado**: Um único ponto de controle para todo o cache da aplicação

## Uso nos Hooks

Todos os hooks principais já implementam cache automaticamente:

### useTransactions

```typescript
const { transactions, loading, refetch } = useTransactions({ userId });
// Dados são cacheados automaticamente
// Cache é invalidado ao criar/atualizar/deletar transações
```

### useAccounts

```typescript
const { accounts, loading, fetchAccounts } = useAccounts();
// Dados são cacheados automaticamente
// Cache é invalidado ao criar/atualizar/deletar contas
```

### useCreditCards

```typescript
const { creditCards, loading, fetchCreditCards } = useCreditCards();
// Dados são cacheados automaticamente
// Cache é invalidado ao criar/atualizar/deletar cartões
```

### useCreditCardTransactions

```typescript
const { transactions, loading, refetch } = useCreditCardTransactions(options);
// Dados são cacheados automaticamente
// Cache é invalidado ao criar/atualizar/deletar transações de cartão
```

## Invalidação Manual

Se precisar invalidar o cache manualmente:

```typescript
import { invalidateCache } from '@/lib/utils/cache';

// Invalidar transações de um usuário
invalidateCache.transactions(userId);

// Invalidar contas
invalidateCache.accounts(userId);

// Invalidar cartões de crédito
invalidateCache.creditCards(userId);

// Invalidar transações de cartão
invalidateCache.creditCardTransactions();

// Invalidar tudo de um usuário
invalidateCache.all(userId);
```

## Forçar Atualização

Para forçar uma busca ignorando o cache:

```typescript
// useTransactions
fetchTransactions(filters, true); // skipCache = true

// useAccounts
fetchAccounts(true); // skipCache = true

// useCreditCards
fetchCreditCards(true); // skipCache = true
```

## Como Funciona

1. **Primeira chamada**: Busca dados da API e armazena no cache
2. **Chamadas subsequentes**: Retorna dados do cache se ainda válidos (< 12h)
3. **Mutações**: Ao criar/atualizar/deletar, o cache é automaticamente invalidado
4. **Próxima leitura**: Após invalidação, busca dados atualizados da API

## Benefícios

- ✅ Reduz chamadas desnecessárias à API
- ✅ Melhora performance e tempo de resposta
- ✅ Reduz uso de banda
- ✅ Dados sempre atualizados após mutações
- ✅ Gerenciamento centralizado e consistente
