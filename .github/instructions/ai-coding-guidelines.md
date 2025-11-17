---
title: AI Coding Guidelines - Horizon AI
version: 1.0.0
---

# AI Coding Guidelines for Horizon AI

Este documento contém diretrizes essenciais para desenvolvimento de código no projeto Horizon AI. SIGA ESTAS REGRAS RIGOROSAMENTE.

## 🚨 REGRAS CRÍTICAS - NUNCA VIOLAR

### 1. NUNCA Editar Arquivos de Ambiente

- **PROIBIDO**: Editar `.env`, `.env.local`, `.env.production`, ou qualquer arquivo de configuração de ambiente
- **RAZÃO**: Contém credenciais sensíveis e configurações específicas do ambiente
- **SE NECESSÁRIO**: Instrua o usuário a editar manualmente

### 2. SEMPRE Usar Operações em Lote (Bulk Operations)

- **OBRIGATÓRIO**: Use `updateRows()`, `createRows()`, `deleteRows()` para múltiplos registros
- **PROIBIDO**: Loops com `updateRow()`, `createRow()`, `deleteRow()` individuais
- **CHUNK SIZE**: Processe em chunks de 50 itens por vez
- **DELAY**: Adicione 100ms entre chunks para evitar rate limits

## 📊 Appwrite - Operações em Lote

### ✅ CORRETO - Operações em Lote

```typescript
// Atualizar múltiplos registros
const CHUNK_SIZE = 50;
for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
  const chunk = ids.slice(i, i + CHUNK_SIZE);

  await databases.updateRows({
    databaseId: DATABASE_ID,
    tableId: 'table_name',
    queries: [Query.equal('$id', chunk)],
    data: {
      field: 'value',
      updated_at: new Date().toISOString(),
    },
  });

  // Delay entre chunks
  if (i + CHUNK_SIZE < ids.length) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
```

### ❌ INCORRETO - Operações Individuais

```typescript
// NUNCA FAÇA ISSO!
for (const id of ids) {
  await databases.updateRow({
    databaseId: DATABASE_ID,
    tableId: 'table_name',
    rowId: id,
    data: { field: 'value' },
  });
}
```

## 💰 Precisão Financeira

### SEMPRE Arredondar para 2 Casas Decimais

```typescript
/**
 * Arredonda valores monetários para exatamente 2 casas decimais
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

// Uso obrigatório em TODAS operações com amounts
const amount = roundToTwoDecimals(transaction.amount);
```

### Locais Onde Aplicar

- Criação de transações
- Atualização de transações
- Cálculo de faturas de cartão de crédito
- Cálculo de saldos
- Qualquer operação com valores monetários

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `transactions`

- `user_id` (string, required)
- `account_id` (string, optional)
- `amount` (number, 2 decimais)
- `type` ('income' | 'expense' | 'transfer' | 'salary')
- `date` (ISO string)
- `status` ('pending' | 'completed' | 'failed' | 'cancelled')
- `direction` ('in' | 'out')
- `category` (string)
- `description` (string)
- `merchant` (string)

#### `credit_card_transactions`

- `user_id` (string, required)
- `credit_card_id` (string, required)
- `amount` (number, 2 decimais - **valor da parcela individual**)
- `date` (ISO string - data de vencimento da parcela)
- `purchase_date` (ISO string - data da compra original)
- `installment` (number - parcela atual: 1, 2, 3...)
- `installments` (number - total de parcelas: 1, 12, etc)
- `status` ('pending' | 'completed' | 'cancelled')
- `sync_status` ('pending' | 'synced')

#### `credit_cards`

- `account_id` (string, required)
- `name` (string)
- `closing_day` (number - dia de fechamento)
- `due_day` (number - dia de vencimento)
- `credit_limit` (number)
- `used_limit` (number)

## 🔄 Padrões de Código React

### Hooks Customizados

```typescript
'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useCallback, useEffect, useState } from 'react';

export function useCustomHook(options: Options) {
  const { user } = useUser();
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user.$id) return;

    setLoading(true);
    setError(null);

    try {
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

      const result = await databases.listRows({
        databaseId,
        tableId: 'table_name',
        queries: [Query.equal('user_id', user.$id), Query.limit(1000)],
      });

      setData(result.rows as unknown as Data[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.$id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

### React 19 - Optimistic Updates

```typescript
import { useOptimistic, useTransition } from 'react';

const [isPending, startTransition] = useTransition();
const [optimisticData, addOptimisticUpdate] = useOptimistic(data, (state, update: Update) => {
  switch (update.type) {
    case 'add':
      return update.item ? [update.item, ...state] : state;
    case 'update':
      return state.map((item) => (item.$id === update.item.$id ? update.item : item));
    case 'delete':
      return state.filter((item) => item.$id !== update.id);
    default:
      return state;
  }
});
```

## 📝 Appwrite Functions (Node.js 20)

### Estrutura Padrão

```typescript
import { Client, Query, TablesDB } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';

function initializeClient(): { client: Client; databases: TablesDB } {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const databases = new TablesDB(client);
  return { client, databases };
}

export default async ({ req, res, log, error }: any) => {
  const startTime = Date.now();
  log('Function triggered');

  try {
    const { databases } = initializeClient();

    // Sua lógica aqui
    // SEMPRE use operações em lote!

    const duration = Date.now() - startTime;
    log(`Function completed in ${duration}ms`);

    return res.json({
      success: true,
      duration,
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    error(`Error after ${duration}ms: ${err.message}`);

    return res.json(
      {
        success: false,
        error: err.message,
        duration,
      },
      500,
    );
  }
};
```

## 📅 Tratamento de Datas

### SEMPRE Usar ISO 8601

```typescript
// ✅ CORRETO
const date = new Date().toISOString(); // "2025-11-17T12:00:00.000Z"

// ✅ Comparação de datas
Query.greaterThanEqual('date', startDate.toISOString())
Query.lessThanEqual('date', endDate.toISOString())

// ❌ INCORRETO
const date = new Date().toString(); // Formato local inconsistente
```

### Timezone do Usuário

```typescript
function getCurrentDateInUserTimezone(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

## 🔍 Queries Appwrite

### Padrões Comuns

```typescript
// Filtros básicos
Query.equal('field', 'value');
Query.notEqual('field', 'value');
Query.lessThan('field', value);
Query.greaterThan('field', value);
Query.lessThanEqual('field', value);
Query.greaterThanEqual('field', value);

// Arrays (bulk operations)
Query.equal('$id', [id1, id2, id3]); // Buscar múltiplos IDs

// Paginação
Query.limit(50);
Query.offset(0);

// Ordenação
Query.orderDesc('date');
Query.orderAsc('created_at');
```

### Paginação com Infinite Scroll

```typescript
const [hasMore, setHasMore] = useState(true);
const [currentOffset, setCurrentOffset] = useState(0);
const LIMIT_PER_PAGE = 50;

const fetchData = async (append = false) => {
  const offset = append ? currentOffset : 0;

  const result = await databases.listRows({
    databaseId,
    tableId: 'table_name',
    queries: [
      Query.equal('user_id', userId),
      Query.limit(LIMIT_PER_PAGE),
      Query.offset(offset),
      Query.orderDesc('date'),
    ],
  });

  if (append) {
    setData((prev) => [...prev, ...result.rows]);
    setCurrentOffset((prev) => prev + result.rows.length);
  } else {
    setData(result.rows);
    setCurrentOffset(result.rows.length);
  }

  setHasMore(offset + result.rows.length < result.total);
};

const loadMore = () => fetchData(true);
```

## 🛠️ Scripts de Manutenção

### Template Padrão

```typescript
#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import { Client, Query } from 'node-appwrite';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';

async function mainFunction() {
  console.log('🔄 Starting script...\n');

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const { TablesDB } = await import('node-appwrite');
  const databases = new TablesDB(client);

  try {
    // 1. Buscar dados
    let allData = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const result = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: 'table_name',
        queries: [Query.limit(limit), Query.offset(offset)],
      });

      allData.push(...result.rows);
      console.log(`   Fetched ${result.rows.length} items (total: ${allData.length})`);

      if (result.rows.length === 0 || result.rows.length < limit) {
        break;
      }

      offset += limit;
    }

    console.log(`\n✅ Found ${allData.length} total items\n`);

    // 2. Processar em lote
    const CHUNK_SIZE = 50;
    let processed = 0;

    for (let i = 0; i < allData.length; i += CHUNK_SIZE) {
      const chunk = allData.slice(i, i + CHUNK_SIZE);
      const chunkIds = chunk.map((item) => item.$id);

      await databases.updateRows({
        databaseId: DATABASE_ID,
        tableId: 'table_name',
        queries: [Query.equal('$id', chunkIds)],
        data: {
          field: 'value',
          updated_at: new Date().toISOString(),
        },
      });

      processed += chunk.length;
      console.log(`   Processed ${processed}/${allData.length} items`);

      if (i + CHUNK_SIZE < allData.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Successfully processed ${processed} items\n`);
  } catch (error: any) {
    console.error('❌ Error:', error);
    throw error;
  }
}

mainFunction()
  .then(() => {
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
```

## 🎨 Padrões de UI (Next.js + Tailwind)

### Componentes de Formulário

```typescript
'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function FormComponent() {
  const [formData, setFormData] = useState({
    field1: '',
    field2: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Processar dados
      await submitData(formData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="field1"
        value={formData.field1}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          field1: e.target.value
        }))}
        required
      />

      <Button type="submit">
        Submit
      </Button>
    </form>
  );
}
```

## 🔐 Segurança

### Validação de Propriedade

```typescript
// Verificar se recurso pertence ao usuário
const resource = await databases.getRow({
  databaseId,
  tableId: 'table_name',
  rowId: resourceId,
});

if (resource.user_id !== user.$id) {
  throw new Error('Unauthorized');
}

// Verificar compartilhamento
const sharingResult = await databases.listRows({
  databaseId,
  tableId: 'sharing_relationships',
  queries: [
    Query.equal('member_user_id', user.$id),
    Query.equal('responsible_user_id', resource.user_id),
    Query.equal('status', 'active'),
  ],
});

const hasAccess = resource.user_id === user.$id || sharingResult.rows.length > 0;
```

## 📦 Estrutura de Projeto

```
horizon-ai/
├── app/                      # Next.js App Router
│   ├── (app)/               # Rotas autenticadas
│   ├── (auth)/              # Rotas de autenticação
│   └── api/                 # API Routes (deprecated)
├── components/              # Componentes React
│   ├── ui/                  # Componentes base
│   ├── layout/              # Layout components
│   └── [feature]/           # Componentes por feature
├── functions/               # Appwrite Functions
│   └── [function-name]/
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── hooks/                   # React Hooks customizados
├── lib/
│   ├── appwrite/           # Cliente Appwrite
│   ├── services/           # Serviços de negócio
│   ├── types/              # TypeScript types
│   └── utils/              # Utilitários
├── scripts/                # Scripts de manutenção
└── .github/
    └── instructions/       # Instruções de código
```

## ✅ Checklist de Code Review

### Antes de Commit

- [ ] Operações em lote implementadas corretamente
- [ ] Valores monetários com `roundToTwoDecimals()`
- [ ] Datas em formato ISO 8601
- [ ] Validação de propriedade de recursos
- [ ] Tratamento de erros adequado
- [ ] TypeScript sem erros
- [ ] Nenhum arquivo `.env` foi modificado
- [ ] Logs informativos em functions
- [ ] Paginação implementada quando necessário
- [ ] Delays entre chunks de bulk operations

### Performance

- [ ] Queries otimizadas com índices apropriados
- [ ] Limite de resultados definido
- [ ] Uso de cache quando aplicável
- [ ] Operações assíncronas em paralelo quando possível
- [ ] Bulk operations para múltiplos registros

## 🚀 Deployment

### Appwrite Functions

```bash
# Build
cd functions/[function-name]
npm run build

# Deploy via Appwrite Console ou CLI
appwrite deploy function --functionId [id]
```

### Next.js (Vercel)

```bash
# Build local
pnpm build

# Deploy automático via Git push
git push origin main
```

## 📚 Referências

- [Appwrite TablesDB API](https://appwrite.io/docs/products/databases)
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**IMPORTANTE**: Estas diretrizes são obrigatórias. Código que não segue estes padrões será rejeitado no code review.
