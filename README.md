<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Horizon AI - Financial Management Platform

Plataforma completa de gestão financeira pessoal construída com Next.js 16, React 19.2 e Appwrite.

## 🚀 Tech Stack

- **Next.js 16** + **React 19.2** + **TypeScript 5.9**
- **Appwrite** (BaaS + Serverless Functions)
- **Tailwind CSS** + **Turbopack**

## ✨ Features

- 🔐 Autenticação segura (JWT + httpOnly cookies)
- 💰 Gestão de contas bancárias e saldos
- 💳 Controle de cartões de crédito e faturas
- 📊 Transações e categorização
- 🔄 Transações recorrentes automáticas
- 📈 Projeções de fluxo de caixa
- 🧾 Gestão de notas fiscais (NFe)
- 👥 Compartilhamento de contas (joint accounts)
- ⚡ Atualizações em tempo real (Realtime)
- 📱 Design responsivo

## 🛠️ Setup Rápido

### Pré-requisitos

- Node.js >= 22
- pnpm >= 9
- Conta Appwrite

### Instalação

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Appwrite

# 3. Executar migrações
pnpm migrate:up

# 4. Iniciar servidor
pnpm dev
```

Acesse: http://localhost:1101

### Variáveis de Ambiente Essenciais

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=seu-project-id
APPWRITE_API_KEY=sua-api-key
APPWRITE_DATABASE_ID=horizon_ai_db
JWT_SECRET=seu-secret-gerado
JWT_EXPIRATION=7d
```

**Gerar JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📦 Comandos Principais

```bash
# Desenvolvimento
pnpm dev              # Inicia dev server (Turbopack)
pnpm build            # Build para produção
pnpm typecheck        # Verifica tipos TypeScript
pnpm lint             # Executa ESLint

# Database
pnpm migrate:up       # Executa migrações pendentes
pnpm migrate:down     # Reverte última migração
pnpm migrate:status   # Status das migrações

# Testes
pnpm test             # Executa todos os testes
```

## 🏗️ Arquitetura

### Serverless-First

```
Next.js (UI + CRUD)
       ↓
Appwrite Database
       ↓
Appwrite Functions (Business Logic)
       ↓
Realtime Updates → UI Auto-Update
```

**Princípios**:

- Next.js: Apenas CRUD e UI
- Appwrite Functions: Toda lógica de negócio
- Realtime: Atualizações automáticas

### Estrutura de Pastas

```
horizon-ai/
├── app/                # Next.js App Router
│   ├── (auth)/        # Rotas públicas
│   ├── (app)/         # Rotas protegidas
│   └── api/           # API Routes
├── components/        # Componentes React
├── lib/               # Lógica de negócio
│   ├── services/     # Serviços
│   ├── auth/         # Autenticação
│   └── database/     # Migrações
├── hooks/             # Custom hooks
├── actions/           # Server Actions
└── functions/         # Appwrite Functions
```

## 🤖 Appwrite Functions

### 1. Balance Sync

- **Triggers**: Eventos de transação + Schedule diário (20:00)
- **Função**: Sincroniza saldos automaticamente

### 2. Recurring Transactions

- **Trigger**: Schedule mensal (1º dia às 00:00)
- **Função**: Cria transações recorrentes

### 3. Expire Invitations

- **Trigger**: Schedule diário (00:00)
- **Função**: Expira convites antigos

**Deploy**: `cd functions/[nome] && ./deploy.sh`

## 📚 Documentação

### Guias Principais

- **[Guia Consolidado](docs/CONSOLIDATED-GUIDE.md)** - Documentação completa
- **[Arquitetura Serverless](docs/SERVERLESS_ARCHITECTURE.md)** - Detalhes da arquitetura
- **[Guia de Desenvolvimento](docs/DEVELOPMENT-GUIDE.md)** - Como adicionar features
- **[Appwrite Functions](docs/APPWRITE_FUNCTIONS.md)** - Guia completo de functions

### Features Específicas

- Transações: `docs/TRANSACTIONS-README.md`
- Cartões de Crédito: `docs/CREDIT_CARD_BILLING_LOGIC.md`
- Fluxo de Caixa: `docs/CASH_FLOW_PROJECTION.md`
- Compartilhamento: `docs/JOINT_ACCOUNTS_SHARING.md`

## 🚀 Deploy

### Vercel (Recomendado)

1. Conectar repositório no [vercel.com](https://vercel.com)
2. Configurar variáveis de ambiente
3. Deploy

### Variáveis de Ambiente (Produção)

```env
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
APPWRITE_DATABASE_ID
JWT_SECRET
JWT_EXPIRATION
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.com
```

### Checklist

- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas
- [ ] Appwrite Functions deployadas
- [ ] Triggers configurados
- [ ] Testes executados

## 🔧 React 19.2 Features

```typescript
// Server Actions
'use server';
export async function createAction(formData: FormData) {}

// use Hook
const data = use(dataPromise);

// useOptimistic
const [optimistic, update] = useOptimistic(data, updater);

// useFormStatus
const { pending } = useFormStatus();

// useActionState
const [state, action, isPending] = useActionState(myAction, null);
```

## 📞 Suporte

- Documentação: `docs/CONSOLIDATED-GUIDE.md`
- Issues: GitHub
- Logs: Appwrite Console > Functions > Executions

---

**Versões**: Next.js 16 • React 19.2 • Node.js 22 • TypeScript 5.9
