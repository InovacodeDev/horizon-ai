# Resumo da Migração para Hooks Realtime

## Hooks Ajustados

### ✅ useTotalBalance.ts

**Antes:** Fazia chamada direta à API `/api/accounts`  
**Depois:** Usa o hook `useAccounts` que já possui realtime integrado

- Calcula o saldo total a partir dos accounts com `useMemo`
- Beneficia-se automaticamente das atualizações realtime de accounts

### ✅ useCreditCardBills.ts

**Antes:** Fazia chamada à API deprecated `/api/credit-cards/bills`  
**Depois:** Busca diretamente do Appwrite usando `getAppwriteBrowserDatabases`

- Usa queries do Appwrite para filtrar por creditCardId, status, datas
- Mantém realtime com `useAppwriteRealtime`

### ✅ useTransactionsWithSharing.ts

**Antes:** Fazia chamada à API deprecated `/api/sharing/transactions`  
**Depois:** Busca diretamente do Appwrite usando `getAppwriteBrowserDatabases`

- Usa queries do Appwrite para filtrar transações
- Nota: Versão simplificada sem lógica completa de sharing (a ser implementada)

### ✅ useInvoicesWithSharing.ts

**Antes:** Fazia chamada à API deprecated `/api/sharing/invoices`  
**Depois:** Busca diretamente do Appwrite usando `getAppwriteBrowserDatabases`

- Usa queries do Appwrite para filtrar invoices
- Nota: Versão simplificada sem lógica completa de sharing (a ser implementada)

### ✅ useCreditCardsWithSharing.ts

**Antes:** Fazia chamada à API deprecated `/api/sharing/credit-cards`  
**Depois:** Busca diretamente do Appwrite usando `getAppwriteBrowserDatabases`

- Busca todos os cartões de crédito
- Nota: Versão simplificada sem lógica completa de sharing (a ser implementada)

## Hooks Já com Realtime

Os seguintes hooks já estavam usando realtime corretamente:

### ✅ useAccounts.ts

- Usa `useAppwriteRealtime` para subscrever a collection `accounts`
- Atualiza automaticamente quando há create/update/delete

### ✅ useAccountsWithSharing.ts

- Busca diretamente do Appwrite
- Implementa lógica completa de sharing (own + shared accounts)
- Usa `useAppwriteRealtime` para duas collections

### ✅ useCreditCards.ts

- Usa `useAppwriteRealtime` para subscrever a collection `credit_cards`
- Suporta operações otimistas com React 19.2

### ✅ useTransactions.ts

- Usa `useAppwriteRealtime` para subscrever a collection `transactions`
- Filtra eventos por user_id
- Atualiza cache automaticamente

### ✅ useInvitations.ts

- Usa realtime do Appwrite diretamente
- Subscreve a collection `sharing_invitations`
- Detecta mudanças de status (expired, accepted, etc.)

### ✅ useCreditCardTransactions.ts

- Usa `useAppwriteRealtime` para subscrever `credit_card_transactions`
- Filtra por credit_card_id

## Componentes com Chamadas de API Apropriadas

Os seguintes componentes fazem chamadas de API que **não devem** ser substituídas por hooks realtime, pois são operações pontuais:

### ✅ InvoiceDetailsModal

- Busca detalhes de uma invoice específica por ID
- Operação pontual quando o modal é aberto

### ✅ CreateInvitationModal

- Cria um novo convite (POST)
- Operação de escrita pontual

### ✅ PriceHistoryModal

- Busca histórico de preços de um produto específico
- Operação pontual quando o modal é aberto

### ✅ TerminateRelationshipModal

- Encerra um relacionamento de compartilhamento (POST)
- Operação de escrita pontual

### ✅ ShoppingListBuilder

- Otimiza lista de compras (POST)
- Operação de processamento pontual

### ✅ ImportTransactionsModal

- Upload e importação de transações
- Operação de processamento em lote

### ✅ DashboardLayout

- Logout (POST)
- Operação pontual de autenticação

## Rotas de API Deprecated

As seguintes rotas foram marcadas como deprecated e retornam HTTP 410:

- `/api/accounts` (GET)
- `/api/transactions` (GET)
- `/api/credit-cards` (GET)
- `/api/credit-cards/bills` (GET)
- `/api/credit-cards/transactions` (GET)
- `/api/sharing/accounts` (GET)
- `/api/sharing/transactions` (GET)
- `/api/sharing/credit-cards` (GET)
- `/api/sharing/invoices` (GET)
- `/api/invoices` (GET)
- `/api/products` (GET)

Todos os hooks foram ajustados para buscar dados diretamente do Appwrite.

## Benefícios da Migração

1. **Atualizações em Tempo Real**: Todos os dados são atualizados automaticamente quando há mudanças no banco
2. **Menos Chamadas de API**: Reduz a necessidade de polling ou refetch manual
3. **Melhor UX**: Interface sempre sincronizada com o estado do servidor
4. **Performance**: Cache inteligente com invalidação automática
5. **Consistência**: Todos os hooks seguem o mesmo padrão de realtime
6. **Menos Latência**: Dados vêm diretamente do Appwrite sem passar por API intermediária

## Padrão de Uso

Todos os hooks realtime seguem este padrão:

```typescript
useAppwriteRealtime({
  channels: [`databases.${databaseId}.collections.${collectionName}.documents`],
  enabled: enableRealtime && initialized,
  onCreate: (payload) => {
    // Adiciona novo item
  },
  onUpdate: (payload) => {
    // Atualiza item existente
  },
  onDelete: (payload) => {
    // Remove item
  },
});
```

## Próximos Passos

1. ✅ Migrar hooks para usar Appwrite diretamente
2. ✅ Remover dependências de rotas de API deprecated
3. ⚠️ Implementar lógica completa de sharing nos hooks simplificados:
   - `useTransactionsWithSharing`
   - `useInvoicesWithSharing`
   - `useCreditCardsWithSharing`
4. 🔄 Monitorar logs de realtime no console
5. 🔄 Verificar se todas as subscrições estão funcionando corretamente
6. 🔄 Ajustar filtros de eventos se necessário
7. 🔄 Considerar adicionar retry logic para reconexões

## Notas Importantes

- Os hooks "WithSharing" estão em versão simplificada e não incluem a lógica completa de compartilhamento
- Para implementar sharing completo, será necessário:
  1. Buscar dados próprios do usuário
  2. Buscar relacionamentos de sharing ativos
  3. Buscar dados dos usuários relacionados
  4. Mesclar e deduplicar resultados
  5. Adicionar metadados de ownership (isOwner, ownerName, etc.)
