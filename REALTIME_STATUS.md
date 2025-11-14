# Status do Realtime - Hooks e Componentes

## ✅ Hooks com Realtime Ativo

### Cartões de Crédito

#### useCreditCards.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve: `databases.${databaseId}.collections.credit_cards.documents`
- ✅ Eventos: onCreate, onUpdate, onDelete
- ✅ Busca diretamente do Appwrite (sem API intermediária)
- ✅ Filtra por accountId quando fornecido
- ✅ Cache com invalidação automática

#### useCreditCardsWithCache.ts

- ✅ Realtime configurado (subscription compartilhada globalmente)
- ✅ Subscreve: `databases.${databaseId}.collections.credit_cards.documents`
- ✅ Busca diretamente do Appwrite (sem API intermediária)
- ✅ Cache de 12h com TTL
- ✅ Batch loading (carrega todos os cartões de uma vez)
- ✅ Deduplicação de requests
- ✅ Usado em: overview, credit-card-bills, accounts, transactions

#### useCreditCardsWithSharing.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve duas collections:
  - `credit_cards.documents`
  - `sharing_relationships.documents`
- ✅ Busca diretamente do Appwrite
- ⚠️ Versão simplificada (sem lógica completa de sharing)

### Faturas de Cartão de Crédito

#### useCreditCardBills.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve: `databases.${databaseId}.collections.credit_card_bills.documents`
- ✅ Eventos: onCreate, onUpdate, onDelete
- ✅ Busca diretamente do Appwrite (sem API intermediária)
- ✅ Filtra por creditCardId, status, datas
- ✅ Usado em: credit-card-bills page (agora!)

#### useCreditCardTransactions.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve: `databases.${databaseId}.collections.credit_card_transactions.documents`
- ✅ Eventos: onCreate, onUpdate, onDelete
- ✅ Busca diretamente do Appwrite (sem API intermediária)
- ✅ Filtra por credit_card_id e purchase_date
- ✅ Cache com invalidação automática
- ✅ Default: últimos 6 meses de transações

### Contas

#### useAccounts.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve: `databases.${databaseId}.collections.accounts.documents`
- ✅ Eventos: onCreate, onUpdate, onDelete
- ✅ Busca diretamente do Appwrite
- ✅ Operações otimistas com React 19.2

#### useAccountsWithCache.ts

- ✅ Realtime configurado (fallback para polling se falhar)
- ✅ Subscreve: `databases.${databaseId}.collections.accounts.documents`
- ✅ Cache de 12h
- ✅ Busca via API (ainda usa /api/accounts)

#### useAccountsWithSharing.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve duas collections:
  - `accounts.documents`
  - `sharing_relationships.documents`
- ✅ Busca diretamente do Appwrite
- ✅ Implementa lógica completa de sharing

#### useTotalBalance.ts

- ✅ Usa `useAccounts` (herda realtime automaticamente)
- ✅ Calcula total com `useMemo`

### Transações

#### useTransactions.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve: `databases.${databaseId}.collections.transactions.documents`
- ✅ Eventos: onCreate, onUpdate, onDelete
- ✅ Filtra por user_id
- ✅ Busca diretamente do Appwrite
- ✅ Cache com invalidação automática

#### useTransactionsWithSharing.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve duas collections:
  - `transactions.documents`
  - `sharing_relationships.documents`
- ✅ Busca diretamente do Appwrite
- ⚠️ Versão simplificada (sem lógica completa de sharing)

### Convites e Relacionamentos

#### useInvitations.ts

- ✅ Realtime configurado (usa Appwrite client diretamente)
- ✅ Subscreve: `databases.${databaseId}.collections.sharing_invitations.documents`
- ✅ Detecta mudanças de status (expired, accepted, etc.)

### Notas Fiscais

#### useInvoicesWithSharing.ts

- ✅ Realtime configurado com `useAppwriteRealtime`
- ✅ Subscreve duas collections:
  - `invoices.documents`
  - `sharing_relationships.documents`
- ✅ Busca diretamente do Appwrite
- ⚠️ Versão simplificada (sem lógica completa de sharing)

## 📄 Páginas Usando Realtime

### ✅ app/(app)/credit-card-bills/page.tsx

- Usa `useCreditCardsWithCache` (realtime ativo) ✅
- Usa `useCreditCardTransactions` (realtime ativo) ✅ **ATUALIZADO - Busca direto do Appwrite**
- Usa `useCreditCardBills` (realtime ativo) ✅
- Ainda calcula bills manualmente (compatibilidade)
- TODO: Migrar para usar apenas dbBills

### ✅ app/(app)/overview/page.tsx

- Usa `useCreditCardsWithCache` (realtime ativo)

### ✅ app/(app)/accounts/page.tsx

- Usa `useCreditCardsWithCache` (realtime ativo)

### ✅ app/(app)/transactions/page.tsx

- Usa `useCreditCards` (realtime ativo)

## 🔄 Fluxo de Atualização Realtime

### Quando um cartão de crédito é criado/atualizado/deletado:

1. **Evento Appwrite** → Dispara para todos os subscribers
2. **useCreditCards** → Atualiza lista local + invalida cache
3. **useCreditCardsWithCache** → Refetch silencioso + atualiza cache global
4. **UI** → Atualiza automaticamente (sem refresh manual)

### Quando uma bill é criada/atualizada/deletada:

1. **Evento Appwrite** → Dispara para todos os subscribers
2. **useCreditCardBills** → Atualiza lista local
3. **UI** → Atualiza automaticamente (sem refresh manual)

### Quando uma transação de cartão é criada/atualizada/deletada:

1. **Evento Appwrite** → Dispara para todos os subscribers
2. **useCreditCardTransactions** → Atualiza lista local + invalida cache
3. **credit-card-bills page** → Recalcula bills automaticamente
4. **UI** → Atualiza automaticamente (sem refresh manual)

### Exemplo de fluxo completo na página de faturas:

1. Usuário cria uma transação de cartão
2. **useCreditCardTransactions** recebe evento onCreate via realtime
3. Adiciona transação à lista local
4. Bills são recalculadas automaticamente (useMemo)
5. UI mostra a nova transação e bill atualizada instantaneamente
6. Tudo sem refresh ou chamadas de API adicionais!

## 🎯 Benefícios Implementados

1. ✅ **Atualizações em Tempo Real**: Todas as mudanças aparecem instantaneamente
2. ✅ **Sem Polling**: Não há necessidade de refetch periódico
3. ✅ **Cache Inteligente**: Cache com invalidação automática via realtime
4. ✅ **Performance**: Menos chamadas de API, dados vêm direto do Appwrite
5. ✅ **UX Melhorada**: Interface sempre sincronizada
6. ✅ **Consistência**: Todos os hooks seguem o mesmo padrão

## 📊 Logs de Realtime

Para monitorar as atualizações realtime, procure no console:

```
📡 Realtime: credit card created {id}
📡 Realtime: credit card updated {id}
📡 Realtime: credit card deleted {id}
📡 Realtime: bill created {id}
📡 Realtime: bill updated {id}
📡 Realtime: bill deleted {id}
✅ Subscribed to credit cards realtime (shared)
🔌 Unsubscribed from credit cards realtime
```

## ⚠️ Próximos Passos

1. **Implementar lógica completa de sharing** nos hooks simplificados:
   - useTransactionsWithSharing
   - useInvoicesWithSharing
   - useCreditCardsWithSharing

2. **Migrar credit-card-bills page** para usar apenas dbBills do banco

3. **Remover cálculo manual de bills** quando a migração estiver completa

4. **Adicionar retry logic** para reconexões de realtime

5. **Monitorar performance** e ajustar cache TTL se necessário

## 🔍 Como Testar

1. Abra duas abas do navegador com a mesma conta
2. Crie/edite/delete um cartão de crédito em uma aba
3. Veja a atualização automática na outra aba (sem refresh)
4. Verifique os logs no console para confirmar eventos realtime
5. Teste com bills e transações também

## 📝 Notas Importantes

- Todos os hooks usam `getAppwriteBrowserDatabases()` para acesso direto
- Rotas de API deprecated retornam HTTP 410
- Cache é invalidado automaticamente via eventos realtime
- Subscription compartilhada em `useCreditCardsWithCache` para economia de recursos
- Bills do banco estão disponíveis mas página ainda usa cálculo manual (transição gradual)
