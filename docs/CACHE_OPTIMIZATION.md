# Otimização de Cache e Realtime

## Problema Identificado

O sistema estava fazendo múltiplas chamadas à API desnecessárias:

```
GET /api/credit-cards 200 in 621ms
GET /api/credit-cards 200 in 223ms
GET /api/credit-cards/account/690d45e4001758186a99 200 in 671ms
GET /api/credit-cards/account/69023baa00229cbeaff1 200 in 477ms
GET /api/credit-cards/account/69023bb10022011132fa 200 in 672ms
... (múltiplas chamadas repetidas)
```

**Causas:**

1. Cada componente fazia sua própria chamada à API
2. Não havia deduplicação de requests
3. Cache não era compartilhado entre componentes
4. Múltiplas subscriptions do Appwrite Realtime

## Soluções Implementadas

### 1. Cache Global Compartilhado

**Antes:**

```typescript
// Cada instância do hook tinha seu próprio cache
const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
```

**Depois:**

```typescript
// Cache global compartilhado entre todas as instâncias
let globalCreditCards: CreditCard[] | null = null;
```

**Benefícios:**

- Reduz chamadas à API em ~90%
- Dados consistentes entre componentes
- Atualização instantânea em todos os componentes

### 2. Deduplicação de Requests

**Antes:**

```typescript
// Múltiplas chamadas simultâneas
fetchCreditCards(); // Componente A
fetchCreditCards(); // Componente B
fetchCreditCards(); // Componente C
```

**Depois:**

```typescript
// Uma única chamada compartilhada
let globalFetchPromise: Promise<CreditCard[]> | null = null;

if (globalFetchPromise) {
  return await globalFetchPromise; // Reutiliza a promise existente
}
```

**Benefícios:**

- Elimina requests duplicados
- Reduz carga no servidor
- Melhora performance

### 3. Batch Loading

**Antes:**

```typescript
// Uma chamada por conta
GET /api/credit-cards/account/690d45e4001758186a99
GET /api/credit-cards/account/69023baa00229cbeaff1
GET /api/credit-cards/account/69023bb10022011132fa
// ... 10+ chamadas
```

**Depois:**

```typescript
// Uma única chamada para todos os cartões
GET /api/credit-cards?account_ids=690d45e4001758186a99,69023baa00229cbeaff1,...
```

**Benefícios:**

- Reduz de N chamadas para 1 chamada
- Menor latência total
- Menos overhead de rede

### 4. Realtime Subscribe Compartilhado

**Antes:**

```typescript
// Cada componente criava sua própria subscription
useEffect(() => {
  const unsubscribe = client.subscribe(channels, callback);
  return unsubscribe;
}, []);
```

**Depois:**

```typescript
// Subscription global com contador de referências
let globalSubscription: (() => void) | null = null;
let subscriberCount = 0;

// Incrementa contador
subscriberCount++;

// Só cria subscription se não existir
if (!globalSubscription) {
  globalSubscription = client.subscribe(channels, callback);
}

// Só remove quando não há mais subscribers
return () => {
  subscriberCount--;
  if (subscriberCount === 0) {
    globalSubscription();
    globalSubscription = null;
  }
};
```

**Benefícios:**

- Uma única conexão WebSocket
- Reduz uso de recursos
- Atualizações mais eficientes

### 5. Cache com TTL Inteligente

**Configuração:**

```typescript
const cacheTime = 12 * 60 * 60 * 1000; // 12 horas
```

**Estratégia:**

- Cache de longa duração (12h) para dados que mudam pouco
- Invalidação automática via Realtime
- Invalidação manual quando necessário

## Hooks Otimizados

### `useCreditCardsWithCache`

**Recursos:**

- ✅ Cache global compartilhado
- ✅ Deduplicação de requests
- ✅ Batch loading
- ✅ Realtime subscribe compartilhado
- ✅ Atualizações otimistas
- ✅ TTL de 12h

**Uso:**

```typescript
const { creditCards, loading, invalidateCache } = useCreditCardsWithCache({
  accountId: 'optional-account-id', // Filtra por conta
  enableRealtime: true, // Ativa realtime
  cacheTime: 12 * 60 * 60 * 1000, // TTL customizado
});
```

### `useCreditCardTransactions`

**Recursos:**

- ✅ Cache por cartão
- ✅ Deduplicação de requests
- ✅ Realtime subscribe por cartão
- ✅ TTL de 12h

**Uso:**

```typescript
const { transactions, loading, invalidateCache } = useCreditCardTransactions({
  creditCardId: 'card-id',
  startDate: new Date('2024-01-01'),
  enableRealtime: true,
});
```

## Resultados Esperados

### Antes da Otimização

```
Total de requests: ~50-100 por carregamento
Tempo de carregamento: 3-5 segundos
Uso de memória: Alto (múltiplos caches)
Conexões WebSocket: 10-20
```

### Depois da Otimização

```
Total de requests: ~5-10 por carregamento (redução de 90%)
Tempo de carregamento: 0.5-1 segundo (melhoria de 80%)
Uso de memória: Baixo (cache compartilhado)
Conexões WebSocket: 1-2 (redução de 90%)
```

## Monitoramento

Para verificar a eficácia das otimizações, observe:

1. **Console do navegador:**
   - Mensagens de cache hit/miss
   - Logs de realtime subscription

2. **Network tab:**
   - Número de requests
   - Tempo de resposta
   - Tamanho dos payloads

3. **Performance:**
   - Tempo de carregamento inicial
   - Tempo de atualização após mudanças
   - Uso de memória

## Manutenção

### Invalidar Cache Manualmente

```typescript
// Invalidar todos os cartões
invalidateCache.creditCards('user');

// Invalidar transações
invalidateCache.creditCardTransactions();

// Invalidar tudo
invalidateCache.all('user');
```

### Ajustar TTL

```typescript
// Cache mais curto (1 hora)
const { creditCards } = useCreditCardsWithCache({
  cacheTime: 60 * 60 * 1000,
});

// Cache mais longo (24 horas)
const { creditCards } = useCreditCardsWithCache({
  cacheTime: 24 * 60 * 60 * 1000,
});
```

### Desabilitar Realtime

```typescript
const { creditCards } = useCreditCardsWithCache({
  enableRealtime: false, // Desabilita realtime
});
```

## Próximos Passos

1. **Implementar Service Worker** para cache offline
2. **Adicionar prefetching** para dados relacionados
3. **Implementar cache de imagens** para avatares e ícones
4. **Adicionar métricas** de performance
5. **Implementar retry logic** para requests falhados

## Referências

- [Appwrite Realtime](https://appwrite.io/docs/realtime)
- [React Query](https://tanstack.com/query/latest) - Inspiração para cache
- [SWR](https://swr.vercel.app/) - Inspiração para deduplicação
