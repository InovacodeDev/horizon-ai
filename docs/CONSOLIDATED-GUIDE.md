# Horizon AI - Guia Consolidado

> **Documentação completa e consolidada do projeto Horizon AI**  
> Última atualização: Novembro 2025

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Início Rápido](#início-rápido)
- [Arquitetura](#arquitetura)
- [Desenvolvimento](#desenvolvimento)
- [Funcionalidades](#funcionalidades)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

### O que é o Horizon AI?

Plataforma completa de gestão financeira pessoal construída com tecnologias modernas:

- **Frontend**: Next.js 16 + React 19.2 + TypeScript
- **Backend**: Appwrite (BaaS) + Appwrite Functions (Serverless)
- **Estilo**: Tailwind CSS
- **Build**: Turbopack (fast HMR)

### Principais Recursos

- 🔐 Autenticação segura (JWT + httpOnly cookies)
- 💰 Gestão de contas bancárias
- 💳 Controle de cartões de crédito e faturas
- 📊 Transações e categorização
- 🔄 Transações recorrentes
- 📈 Projeções de fluxo de caixa
- 🧾 Gestão de notas fiscais (NFe)
- 👥 Compartilhamento de contas (joint accounts)
- 📱 Design responsivo
- ⚡ Atualizações em tempo real (Realtime)

---

## Início Rápido

### Pré-requisitos

- Node.js >= 22
- pnpm >= 9
- Conta Appwrite (cloud ou self-hosted)

### Setup em 5 Minutos

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Appwrite

# 3. Executar migrações
pnpm migrate:up

# 4. Iniciar servidor de desenvolvimento
pnpm dev
```

Acesse: http://localhost:1101

### Variáveis de Ambiente Essenciais

```env
# Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=seu-project-id
APPWRITE_API_KEY=sua-api-key
APPWRITE_DATABASE_ID=horizon_ai_db

# JWT
JWT_SECRET=seu-secret-gerado
JWT_EXPIRATION=7d

# App
NODE_ENV=development
API_URL=http://localhost:1101
```

**Gerar JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Arquitetura

### Arquitetura Serverless

O projeto segue uma **arquitetura serverless-first**:

```
┌─────────────────────────────────────────┐
│         Next.js (Presentation)          │
│  - UI Components                        │
│  - CRUD Operations                      │
│  - Realtime Subscriptions               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Appwrite Database               │
│  - Data Storage                         │
│  - Realtime Events                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Appwrite Functions (Logic)         │
│  - balance-sync (eventos + schedule)    │
│  - recurring-transactions (schedule)    │
│  - expire-invitations (schedule)        │
└─────────────────────────────────────────┘
```

### Princípios

1. **Next.js**: Apenas CRUD e UI
2. **Appwrite Functions**: Toda lógica de negócio e cálculos
3. **Realtime**: UI atualiza automaticamente

### Estrutura de Pastas

```
horizon-ai/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas públicas (login, register)
│   ├── (app)/             # Rotas protegidas (dashboard)
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes reutilizáveis
│   ├── layout/           # Layout components
│   └── modals/           # Modais
├── lib/                   # Lógica de negócio
│   ├── appwrite/         # Cliente Appwrite
│   ├── auth/             # Autenticação
│   ├── services/         # Serviços
│   └── database/         # Migrações
├── hooks/                 # Custom React hooks
├── actions/               # Server Actions
├── functions/             # Appwrite Functions
│   ├── balance-sync/
│   ├── recurring-transactions/
│   └── expire-invitations/
└── docs/                  # Documentação
```

---

## Desenvolvimento

### Comandos Principais

```bash
# Desenvolvimento
pnpm dev              # Inicia dev server (Turbopack)
pnpm build            # Build para produção
pnpm start            # Inicia servidor de produção
pnpm typecheck        # Verifica tipos TypeScript
pnpm lint             # Executa ESLint

# Database
pnpm migrate:up       # Executa migrações pendentes
pnpm migrate:down     # Reverte última migração
pnpm migrate:status   # Status das migrações

# Testes
pnpm test             # Executa todos os testes
pnpm test:auth        # Testa autenticação
pnpm test:accounts    # Testa contas
```

### Adicionando Nova Funcionalidade

#### 1. Criar Rota

```typescript
// app/(app)/reports/page.tsx
import { getCurrentUser } from '@/lib/auth/session';

export default async function ReportsPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1>Relatórios</h1>
      {/* Seu código */}
    </div>
  );
}
```

#### 2. Criar API Route

```typescript
// app/api/reports/route.ts
import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sua lógica
  return NextResponse.json({ data: [] });
}
```

#### 3. Criar Server Action

```typescript
// actions/report.actions.ts
'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function createReportAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Criar relatório

  revalidatePath('/reports');
  return { success: true };
}
```

#### 4. Usar no Componente

```typescript
'use client';

import { createReportAction } from '@/actions/report.actions';
import { useActionState } from 'react';

export function CreateReportForm() {
  const [state, formAction, isPending] = useActionState(
    createReportAction,
    null
  );

  return (
    <form action={formAction}>
      {state?.error && <p>{state.error}</p>}
      <input name="title" required />
      <button disabled={isPending}>
        {isPending ? 'Criando...' : 'Criar'}
      </button>
    </form>
  );
}
```

### React 19.2 Features

#### use Hook (Data Fetching)

```typescript
'use client';
import { use, Suspense } from 'react';

function DataList({ dataPromise }) {
  const data = use(dataPromise);
  return <ul>{data.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}

export default function Page() {
  const dataPromise = fetch('/api/data').then(r => r.json());

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DataList dataPromise={dataPromise} />
    </Suspense>
  );
}
```

#### useOptimistic (Instant Updates)

```typescript
'use client';
import { useOptimistic, useTransition } from 'react';

export function ItemList({ items }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, deleteOptimistic] = useOptimistic(
    items,
    (state, deletedId) => state.filter(item => item.id !== deletedId)
  );

  function handleDelete(id) {
    startTransition(async () => {
      deleteOptimistic(id);
      await deleteItemAction(id);
    });
  }

  return (
    <ul>
      {optimisticItems.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => handleDelete(item.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

#### useFormStatus (Form State)

```typescript
'use client';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Enviando...' : 'Enviar'}
    </button>
  );
}
```

---

## Funcionalidades

### Appwrite Functions

#### 1. Balance Sync

**Objetivo**: Sincronizar saldos das contas automaticamente

**Triggers**:

- Eventos: `transaction.*.create/update/delete`
- Schedule: Diário às 20:00

**Lógica**:

- Transações `in` aumentam saldo
- Transações `out` diminuem saldo
- Ignora transações futuras
- Ignora transações de cartão de crédito

**Localização**: `functions/balance-sync/`

#### 2. Recurring Transactions

**Objetivo**: Criar transações recorrentes automaticamente

**Triggers**:

- Schedule: 1º dia do mês às 00:00

**Lógica**:

- Busca transações com `is_recurring: true`
- Cria novas transações para o mês atual
- Previne duplicatas

**Localização**: `functions/recurring-transactions/`

#### 3. Expire Invitations

**Objetivo**: Expirar convites antigos

**Triggers**:

- Schedule: Diário às 00:00

**Lógica**:

- Busca convites pendentes
- Marca como expirados se `expires_at < now()`

**Localização**: `functions/expire-invitations/`

### Realtime Updates

O sistema usa Appwrite Realtime para atualizações automáticas:

```typescript
'use client';
import { client } from '@/lib/appwrite/client';
import { useEffect, useState } from 'react';

export function useAccounts(userId: string) {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = client.subscribe(`databases.${DB_ID}.collections.accounts.documents`, (response) => {
      if (response.events.includes('*.create')) {
        setAccounts((prev) => [response.payload, ...prev]);
      }
      // Handle update/delete
    });

    // Fetch initial data
    fetchAccounts().then(setAccounts);

    return () => unsubscribe();
  }, [userId]);

  return accounts;
}
```

### Autenticação

Sistema de autenticação com JWT e httpOnly cookies:

1. **Login**: Valida credenciais no Appwrite
2. **JWT**: Gerado e armazenado em cookie httpOnly
3. **Middleware**: Protege rotas automaticamente
4. **Session**: Mantida via cookies

**Rotas Protegidas**: Todas em `app/(app)/*`  
**Rotas Públicas**: `/`, `/login`, `/register`, `/pricing`

---

## Deploy

### Deploy na Vercel (Recomendado)

1. **Conectar repositório**:
   - Acesse [vercel.com](https://vercel.com)
   - Import Git Repository
   - Selecione o repositório

2. **Configurar variáveis de ambiente**:

   ```
   APPWRITE_ENDPOINT
   APPWRITE_PROJECT_ID
   APPWRITE_API_KEY
   APPWRITE_DATABASE_ID
   JWT_SECRET
   JWT_EXPIRATION
   NODE_ENV=production
   CORS_ORIGIN=https://seu-dominio.vercel.app
   ```

3. **Deploy**:
   - Clique em "Deploy"
   - Aguarde build completar

### Deploy das Functions

```bash
# Balance Sync
cd functions/balance-sync
./deploy.sh

# Recurring Transactions
cd functions/recurring-transactions
./deploy.sh

# Expire Invitations
cd functions/expire-invitations
./deploy.sh
```

**Configurar no Appwrite Console**:

1. Functions > Create Function
2. Upload código
3. Configurar triggers e variáveis de ambiente
4. Deploy

### Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas no banco de produção
- [ ] Appwrite Functions deployadas
- [ ] Triggers configurados
- [ ] CORS configurado
- [ ] JWT_SECRET único e seguro
- [ ] Testes executados
- [ ] Build local bem-sucedido

---

## Troubleshooting

### Problemas Comuns

#### Erro de Autenticação

**Problema**: Usuário não autenticado após login

**Solução**:

- Verificar se cookie está sendo setado
- Verificar configuração do middleware
- Usar `credentials: 'include'` em fetch

#### Saldo Incorreto

**Problema**: Saldo da conta não está correto

**Solução**:

```typescript
// Recalcular todos os saldos
await reprocessAllBalancesAction();
```

#### Function Não Executa

**Problema**: Appwrite Function não executa automaticamente

**Solução**:

- Verificar triggers configurados
- Verificar variáveis de ambiente
- Verificar permissões da API Key
- Checar logs no Console

#### Hydration Error

**Problema**: `Hydration failed`

**Solução**:

- Não usar `localStorage` ou `window` no render inicial
- Usar `useEffect` para código client-only
- Garantir que Server e Client renderizam o mesmo HTML

#### Imports Não Funcionam

**Problema**: `Cannot find module '@/...'`

**Solução**:
Verificar `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Logs e Monitoramento

**Appwrite Functions**:

- Console > Functions > [Nome] > Executions
- Verificar logs de erro
- Monitorar tempo de execução

**Next.js**:

- Logs no terminal durante desenvolvimento
- Vercel Logs em produção

---

## Recursos Adicionais

### Documentação Técnica

- **Arquitetura Serverless**: `docs/SERVERLESS_ARCHITECTURE.md`
- **Appwrite Functions**: `docs/APPWRITE_FUNCTIONS.md`
- **Guia de Desenvolvimento**: `docs/DEVELOPMENT-GUIDE.md`
- **Guia de Migração**: `docs/MIGRATION-GUIDE.md`

### Documentação de Features

- **Transações**: `docs/TRANSACTIONS-README.md`
- **Cartões de Crédito**: `docs/CREDIT_CARD_BILLING_LOGIC.md`
- **Fluxo de Caixa**: `docs/CASH_FLOW_PROJECTION.md`
- **Compartilhamento**: `docs/JOINT_ACCOUNTS_SHARING.md`
- **Notas Fiscais**: Specs em `.kiro/specs/nfe-webcrawler-ai-extraction/`

### Links Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Appwrite Docs](https://appwrite.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Suporte

Para dúvidas ou problemas:

1. Consulte esta documentação
2. Verifique os logs de execução
3. Revise a configuração
4. Abra uma issue no GitHub

---

**Versões**:

- Next.js: 16.0.1
- React: 19.2.0
- Node.js: 22.x
- TypeScript: 5.9.3

**Última atualização**: Novembro 2025
