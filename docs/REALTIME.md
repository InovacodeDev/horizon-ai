# Realtime com Appwrite

Este documento descreve a implementação de realtime usando o Appwrite SDK no projeto Horizon AI.

## Visão Geral

O realtime foi implementado nas seguintes tabelas:

- `transactions` - Transações bancárias
- `accounts` - Contas bancárias
- `credit_cards` - Cartões de crédito
- `credit_card_transactions` - Transações de cartão de crédito

## Arquitetura

### Client-Side SDK

Foi adicionado o SDK `appwrite` (v21.3.0) para uso no client-side, separado do `node-appwrite` usado no server-side.

**Arquivo:** `lib/appwrite/client-browser.ts`

Este arquivo inicializa o cliente Appwrite para o navegador usando as variáveis de ambiente públicas:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`

### Hook Genérico de Realtime

**Arquivo:** `hooks/useAppwriteRealtime.ts`

Um hook React genérico que permite subscrever a eventos realtime do Appwrite:

```typescript
useAppwriteRealtime({
  channels: [`databases.${databaseId}.collections.${collectionId}.documents`],
  onCreate: (payload) => console.log('Created:', payload),
  onUpdate: (payload) => console.log('Updated:', payload),
  onDelete: (payload) => console.log('Deleted:', payload),
});
```

## Implementação por Hook

### 1. Accounts (`hooks/useAccountsWithCache.ts`)

Subscreve ao canal:

```
databases.{databaseId}.collections.accounts.documents
```

Quando um evento é recebido, o hook refaz o fetch silencioso dos dados.

### 2. Credit Cards (`hooks/useCreditCardsWithCache.ts`)

Subscreve ao canal:

```
databases.{databaseId}.collections.credit_cards.documents
```

### 3. Transactions (`hooks/useTransactions.ts`)

Subscreve ao canal:

```
databases.{databaseId}.collections.transactions.documents
```

### 4. Credit Card Transactions (`hooks/useCreditCardTransactions.ts`)

Subscreve ao canal:

```
databases.{databaseId}.collections.credit_card_transactions.documents
```

## Fallback para Polling

Todos os hooks implementam um fallback automático para polling (a cada 30 segundos) caso:

- A variável `NEXT_PUBLIC_APPWRITE_DATABASE_ID` não esteja configurada
- Ocorra um erro ao configurar o realtime
- O realtime esteja desabilitado via opção `enableRealtime: false`

## Configuração

### Variáveis de Ambiente

Adicione ao seu `.env.local`:

```bash
# Client-side (públicas)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Permissões no Appwrite

Certifique-se de que as coleções têm as permissões corretas configuradas no Appwrite Console:

1. Acesse o Appwrite Console
2. Navegue até Database > Collections
3. Para cada coleção (`accounts`, `credit_cards`, `transactions`, `credit_card_transactions`):
   - Vá em Settings > Permissions
   - Adicione permissões de leitura para os usuários autenticados

## Uso

Os hooks já estão configurados para usar realtime por padrão. Exemplo:

```typescript
// Accounts com realtime habilitado (padrão)
const { accounts } = useAccountsWithCache();

// Accounts sem realtime
const { accounts } = useAccountsWithCache({ enableRealtime: false });

// Credit Cards com realtime
const { creditCards } = useCreditCardsWithCache({
  accountId: 'account-id',
  enableRealtime: true
});
```

## Logs

O realtime emite logs no console para facilitar o debug:

- ✅ `Subscribed to {collection} realtime updates` - Subscrição bem-sucedida
- 📡 `Realtime event received for {collection}` - Evento recebido
- 🔌 `Unsubscribed from {collection} realtime` - Desinscrição ao desmontar componente
- ❌ `Error setting up realtime for {collection}` - Erro na configuração

## Performance

- As subscrições são automaticamente limpas quando o componente é desmontado
- O cache é atualizado automaticamente quando eventos realtime são recebidos
- Apenas um fetch silencioso é feito por evento, evitando múltiplas requisições

## Troubleshooting

### Realtime não está funcionando

1. Verifique se as variáveis de ambiente públicas estão configuradas
2. Verifique o console do navegador para logs de erro
3. Confirme que as permissões estão corretas no Appwrite Console
4. Verifique se o projeto Appwrite tem realtime habilitado

### Múltiplas subscrições

Se você notar múltiplas subscrições, verifique se:

- O componente não está sendo remontado desnecessariamente
- As dependências do `useEffect` estão corretas
- Não há múltiplas instâncias do mesmo hook no mesmo componente

## Próximos Passos

- [ ] Adicionar filtros específicos por usuário nos canais
- [ ] Implementar reconexão automática em caso de perda de conexão
- [ ] Adicionar métricas de performance do realtime
- [ ] Implementar batching de eventos para reduzir fetches
