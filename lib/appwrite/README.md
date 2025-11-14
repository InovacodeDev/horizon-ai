# Lib / Appwrite

Cliente e configurações do Appwrite (Backend as a Service).

## Arquivos

- **client.ts** - Cliente Appwrite para uso no servidor (Node SDK)
- **client-browser.ts** - Cliente Appwrite para uso no browser (Web SDK)
- **database.ts** - Helpers e utilitários para operações de database
- **adapter.ts** - Adapter pattern para abstrair operações de DB
- **schema.ts** - Schema das collections do Appwrite
- **validation.ts** - Validações de dados antes de salvar no DB

## Uso

### Servidor (Server Components, API Routes, Server Actions)

```typescript
import { getAppwriteDatabases } from '@/lib/appwrite/client';

const databases = getAppwriteDatabases();
const result = await databases.listDocuments('db', 'collection');
```

### Browser (Client Components)

```typescript
import { databases } from '@/lib/appwrite/client-browser';

const result = await databases.listDocuments('db', 'collection');
```

## Schema

O arquivo `schema.ts` define a estrutura de todas as collections:

- Accounts
- Transactions
- CreditCards
- CreditCardBills
- Invoices
- Users
- Invitations
- E outras...

## Convenções

- Use o cliente de servidor sempre que possível (mais seguro)
- Use o cliente de browser apenas para operações que precisam ser feitas no cliente
- Sempre valide dados antes de salvar
- Use o adapter para operações complexas
