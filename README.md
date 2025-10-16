# Horizon AI MVP

O sistema operacional das finanças da família moderna brasileira.

## Tecnologias

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript 5.5+ (strict mode)
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Banco de Dados**: PostgreSQL (Supabase) com Supabase Client
- **Cache**: Redis (Upstash)
- **Autenticação**: JWT (custom implementation)
- **State Management**: TanStack Query + Zustand
- **Validação**: Zod

## Começando

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Conta Supabase (para banco de dados PostgreSQL)
- Git

### Setup Rápido

```bash
# 1. Clone e instale dependências
pnpm install

# 2. Configure ambiente (gera secrets automaticamente)
./scripts/setup-env.sh

# 3. Adicione suas credenciais Supabase ao .env
# DATABASE_URL e DIRECT_DATABASE_URL

# 4. Sincronize schema do banco
pnpm db:push

# 5. Inicie o servidor
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Documentação Completa

- 📖 [Quick Start Guide](./docs/quick-start.md) - Setup detalhado passo a passo
- 🗄️ [Supabase Setup Guide](./docs/supabase-setup.md) - Guia completo do Supabase CLI e migrations
- 💡 [Supabase Examples](./docs/supabase-examples.md) - Exemplos práticos de uso do Supabase
- 🔄 [Supabase Migration Guide](./docs/supabase-migration.md) - Migração do Drizzle para Supabase
- 🏗️ [Infrastructure Setup](./docs/infrastructure-setup.md) - Configuração Supabase, Vercel e CI/CD
- ✅ [Deployment Checklist](./docs/deployment-checklist.md) - Checklist para deploy em produção
- 📋 [Setup Guide](./SETUP.md) - Guia de configuração adicional

## Scripts Disponíveis

### Desenvolvimento

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Cria a build de produção
- `pnpm start` - Inicia o servidor de produção
- `pnpm lint` - Executa o linter
- `pnpm typecheck` - Verifica os tipos TypeScript

### Banco de Dados (Supabase CLI)

- `pnpm db:start` - Inicia o Supabase local
- `pnpm db:stop` - Para o Supabase local
- `pnpm db:status` - Verifica o status do Supabase local
- `pnpm db:reset` - Reseta o banco de dados local
- `pnpm db:migration:new <name>` - Cria uma nova migration
- `pnpm db:migration:list` - Lista todas as migrations
- `pnpm db:push` - Aplica migrations no banco remoto
- `pnpm db:pull` - Puxa o schema do banco remoto
- `pnpm db:diff` - Mostra diferenças entre local e remoto
- `pnpm db:types` - Gera tipos TypeScript do schema local
- `pnpm db:types:remote` - Gera tipos TypeScript do schema remoto

## Estrutura do Projeto

```
src/
├── app/              # App Router (páginas e layouts)
├── components/       # Componentes React
│   └── ui/          # Componentes Shadcn/UI
├── lib/             # Utilitários e configurações
│   ├── db/          # Schema e configuração do banco
│   ├── auth/        # Utilitários de autenticação
│   └── utils.ts     # Funções utilitárias
└── hooks/           # Custom React hooks
```

## Qualidade de Código

O projeto usa:

- **ESLint** para linting
- **Prettier** para formatação
- **TypeScript** em strict mode
- **Husky** para git hooks
- **lint-staged** para validação pré-commit

## Licença

Privado - Todos os direitos reservados
