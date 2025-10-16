# Horizon AI MVP

O sistema operacional das finanças da família moderna brasileira.

## Tecnologias

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript 5.5+ (strict mode)
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Banco de Dados**: PostgreSQL (Supabase) + Drizzle ORM
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
- 🏗️ [Infrastructure Setup](./docs/infrastructure-setup.md) - Configuração Supabase, Vercel e CI/CD
- ✅ [Deployment Checklist](./docs/deployment-checklist.md) - Checklist para deploy em produção
- 📋 [Setup Guide](./SETUP.md) - Guia de configuração adicional

## Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Cria a build de produção
- `pnpm start` - Inicia o servidor de produção
- `pnpm lint` - Executa o linter
- `pnpm typecheck` - Verifica os tipos TypeScript
- `pnpm db:generate` - Gera migrações do Drizzle
- `pnpm db:push` - Aplica migrações no banco
- `pnpm db:studio` - Abre o Drizzle Studio

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
