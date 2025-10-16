# Horizon AI MVP

O sistema operacional das finanças da família moderna brasileira.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Começando](#começando)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Arquitetura](#arquitetura)
- [Documentação Adicional](#documentação-adicional)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## Sobre o Projeto

Horizon AI é uma plataforma de gestão financeira pessoal que visa se tornar o "sistema operacional" das finanças da família moderna brasileira. O MVP foca em resolver o problema central de fragmentação financeira através da consolidação automatizada de contas via Open Finance, proporcionando uma visão unificada e inteligente da vida financeira do usuário.

### Principais Funcionalidades

- ✅ **Autenticação Segura**: Sistema JWT customizado com refresh tokens
- 🏦 **Integração Open Finance**: Conexão segura com bancos brasileiros
- 📊 **Dashboard Consolidado**: Visão unificada de todas as contas
- 🔄 **Sincronização Automática**: Atualização periódica de dados financeiros
- 🏷️ **Categorização Inteligente**: Classificação automática de transações
- 🔒 **Segurança LGPD**: Criptografia e proteção de dados sensíveis

## Tecnologias

### Core Stack

- **Framework**: Next.js 15 (App Router) com React Server Components
- **Linguagem**: TypeScript 5.5+ (strict mode)
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Banco de Dados**: PostgreSQL (Supabase)
- **Cache**: Redis (Upstash)
- **Autenticação**: JWT (implementação customizada)
- **State Management**: TanStack Query v5 + Zustand
- **Validação**: Zod

### Bibliotecas Principais

- `@supabase/supabase-js` - Cliente Supabase
- `@tanstack/react-query` - Data fetching e cache
- `bcryptjs` - Hashing de senhas
- `jsonwebtoken` - Geração e validação de tokens
- `framer-motion` - Animações
- `react-hook-form` - Gerenciamento de formulários
- `@upstash/ratelimit` - Rate limiting

## Começando

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Conta Supabase (para banco de dados PostgreSQL)
- Conta Upstash (para Redis cache)
- Git

### Setup Rápido

```bash
# 1. Clone o repositório
git clone <repository-url>
cd horizon-ai-mvp

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
./scripts/setup-env.sh

# 4. Edite o arquivo .env com suas credenciais
# Adicione: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.

# 5. Aplique as migrations no banco de dados
pnpm db:push

# 6. Inicie o servidor de desenvolvimento
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Setup Detalhado

#### 1. Configuração do Supabase

```bash
# Instale o Supabase CLI (se ainda não tiver)
npm install -g supabase

# Faça login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref <your-project-id>

# Aplique as migrations
pnpm db:push
```

#### 2. Configuração do Upstash Redis

1. Acesse [Upstash Console](https://console.upstash.com/)
2. Crie um novo banco Redis
3. Copie `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
4. Adicione ao arquivo `.env`

#### 3. Configuração do Open Finance (Opcional para desenvolvimento)

Para integração completa com Open Finance, você precisará:

1. Credenciais de uma instituição participante do Open Finance Brasil
2. Configurar `OPEN_FINANCE_CLIENT_ID`, `OPEN_FINANCE_CLIENT_SECRET` e `OPEN_FINANCE_API_URL`

## Estrutura do Projeto

```
horizon-ai-mvp/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── .husky/                 # Git hooks
├── .kiro/
│   └── specs/             # Especificações e documentação de features
├── docs/                   # Documentação adicional
├── scripts/               # Scripts utilitários
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (app)/        # Rotas autenticadas
│   │   │   └── dashboard/
│   │   ├── (auth)/       # Rotas de autenticação
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (onboarding)/ # Fluxo de onboarding
│   │   │   ├── welcome/
│   │   │   ├── select-bank/
│   │   │   └── security-interstitial/
│   │   ├── api/          # API Routes
│   │   │   ├── cron/     # Cron jobs
│   │   │   └── v1/       # API v1
│   │   │       ├── auth/ # Autenticação
│   │   │       ├── banks/
│   │   │       ├── dashboard/
│   │   │       └── of/   # Open Finance
│   │   ├── of/
│   │   │   └── callback/ # OAuth callback
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/    # Componentes do dashboard
│   │   ├── states/       # Estados de UI (loading, error)
│   │   ├── ui/          # Componentes Shadcn/UI
│   │   └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── animations/   # Configurações de animação
│   │   ├── audit/       # Logging de auditoria
│   │   ├── auth/        # Utilitários de autenticação
│   │   │   ├── cookies.ts
│   │   │   ├── get-user.ts
│   │   │   ├── password.ts
│   │   │   └── tokens.ts
│   │   ├── cache/       # Redis cache
│   │   ├── categorization/ # Categorização de transações
│   │   ├── db/          # Configuração do banco
│   │   │   ├── index.ts
│   │   │   ├── supabase.ts
│   │   │   └── types.ts
│   │   ├── jobs/        # Background jobs
│   │   ├── of/          # Open Finance
│   │   │   ├── encryption.ts
│   │   │   ├── sync.ts
│   │   │   └── tokens.ts
│   │   ├── react-query/ # TanStack Query config
│   │   ├── utils/       # Utilitários gerais
│   │   ├── logger.ts
│   │   └── utils.ts
│   └── middleware.ts     # Next.js middleware (auth)
├── supabase/
│   └── migrations/       # Database migrations
├── .env.example          # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

### Convenções de Código

- **Componentes**: PascalCase (ex: `DashboardLayout.tsx`)
- **Utilitários**: camelCase (ex: `getUserId.ts`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `JWT_ACCESS_SECRET`)
- **Tipos**: PascalCase com sufixo Type (ex: `UserType`)
- **Interfaces**: PascalCase (ex: `User`)

## Variáveis de Ambiente

### Obrigatórias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id

# Authentication (gerados automaticamente pelo setup-env.sh)
JWT_ACCESS_SECRET=your-access-token-secret-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# Encryption (gerado automaticamente pelo setup-env.sh)
ENCRYPTION_KEY=your-32-character-encryption-key

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# Cron Jobs (gerado automaticamente pelo setup-env.sh)
CRON_SECRET=your-cron-secret-token-here

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Opcionais (para produção)

```bash
# Open Finance
OPEN_FINANCE_CLIENT_ID=your-client-id
OPEN_FINANCE_CLIENT_SECRET=your-client-secret
OPEN_FINANCE_API_URL=https://api.openfinance.example.com
```

### Como Obter as Credenciais

**Supabase:**

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em Settings > API
4. Copie URL, anon key e service role key

**Upstash Redis:**

1. Acesse [console.upstash.com](https://console.upstash.com)
2. Crie um novo banco Redis
3. Copie REST URL e REST Token

## Scripts Disponíveis

### Desenvolvimento

```bash
pnpm dev          # Inicia o servidor de desenvolvimento (porta 3000)
pnpm build        # Cria a build de produção
pnpm start        # Inicia o servidor de produção
pnpm lint         # Executa o linter (ESLint)
pnpm typecheck    # Verifica os tipos TypeScript
```

### Banco de Dados (Supabase CLI)

```bash
pnpm db:start              # Inicia o Supabase local
pnpm db:stop               # Para o Supabase local
pnpm db:status             # Verifica o status do Supabase local
pnpm db:reset              # Reseta o banco de dados local
pnpm db:migration:new      # Cria uma nova migration
pnpm db:migration:list     # Lista todas as migrations
pnpm db:push               # Aplica migrations no banco remoto
pnpm db:pull               # Puxa o schema do banco remoto
pnpm db:diff               # Mostra diferenças entre local e remoto
pnpm db:types:remote       # Gera tipos TypeScript do schema remoto
```

## Arquitetura

### Fluxo de Autenticação

1. Usuário faz login com email/senha
2. Sistema valida credenciais e gera Access Token (15 min) + Refresh Token (7 dias)
3. Tokens são enviados como cookies httpOnly, secure, sameSite
4. Middleware valida Access Token em cada requisição
5. Quando Access Token expira, Refresh Token é usado automaticamente
6. Se Refresh Token expirar, usuário é redirecionado para login

### Fluxo de Conexão Open Finance

1. Usuário seleciona banco na tela de onboarding
2. Sistema inicia fluxo OAuth com a instituição
3. Usuário é redirecionado para autenticação no banco
4. Após consentimento, sistema recebe código de autorização
5. Código é trocado por access token (criptografado antes de armazenar)
6. Sincronização inicial busca contas e transações dos últimos 90 dias
7. Dados são armazenados no banco com categorização automática

### Sincronização de Dados

- **Inicial**: Ao conectar conta (últimos 90 dias)
- **Periódica**: A cada 6 horas via cron job
- **On-demand**: Ao abrir app (se > 1 hora desde última sync)
- **Manual**: Botão "Sync Now" no dashboard

### Segurança

- Senhas: bcrypt com salt round 12
- Tokens Open Finance: AES-256 encryption
- Comunicação: HTTPS/TLS obrigatório
- Cookies: httpOnly, secure, sameSite: 'strict'
- Autorização: Filtro obrigatório por userId em todas as queries
- Rate Limiting: 5 tentativas de login por minuto por IP
- Auditoria: Logs de eventos de segurança

## Documentação Adicional

- 📖 [Quick Start Guide](./docs/quick-start.md) - Setup detalhado passo a passo
- 🗄️ [Supabase Setup Guide](./docs/supabase-setup.md) - Guia completo do Supabase CLI e migrations
- 💡 [Supabase Examples](./docs/supabase-examples.md) - Exemplos práticos de uso do Supabase
- 🔄 [Supabase Migration Guide](./docs/supabase-migration.md) - Migração do Drizzle para Supabase
- 🏗️ [Infrastructure Setup](./docs/infrastructure-setup.md) - Configuração Supabase, Vercel e CI/CD
- ✅ [Deployment Checklist](./docs/deployment-checklist.md) - Checklist para deploy em produção
- 📋 [Setup Guide](./SETUP.md) - Guia de configuração adicional
- 🔧 [API Documentation](./docs/API.md) - Documentação completa da API

## Contribuindo

### Workflow de Desenvolvimento

1. Crie uma branch a partir de `main`:

   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. Faça suas alterações seguindo as convenções do projeto

3. Commit suas mudanças:

   ```bash
   git commit -m "feat: descrição da feature"
   ```

4. Push para o repositório:

   ```bash
   git push origin feature/nome-da-feature
   ```

5. Abra um Pull Request

### Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Alterações na documentação
- `style:` Formatação, ponto e vírgula, etc
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Tarefas de manutenção

### Qualidade de Código

O projeto usa:

- **ESLint** para linting
- **Prettier** para formatação
- **TypeScript** em strict mode
- **Husky** para git hooks
- **lint-staged** para validação pré-commit

Antes de commitar, o código passa automaticamente por:

1. Formatação com Prettier
2. Linting com ESLint
3. Type checking com TypeScript

### Code Review

Pull Requests devem:

- Ter descrição clara do que foi implementado
- Incluir testes quando aplicável
- Passar em todos os checks do CI/CD
- Ser revisados por pelo menos um membro da equipe

## Licença

Privado - Todos os direitos reservados
