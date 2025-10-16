# Changelog - Migração para Supabase

## [2024-10-16] - Migração do Drizzle ORM para Supabase

### Adicionado

#### Scripts NPM

- `db:start` - Inicia ambiente local do Supabase
- `db:stop` - Para ambiente local do Supabase
- `db:status` - Verifica status dos serviços locais
- `db:reset` - Reseta banco de dados local
- `db:migration:new` - Cria nova migration
- `db:migration:list` - Lista todas as migrations
- `db:push` - Aplica migrations no banco remoto
- `db:pull` - Puxa schema do banco remoto
- `db:diff` - Mostra diferenças entre local e remoto
- `db:types` - Gera tipos TypeScript do schema local
- `db:types:remote` - Gera tipos TypeScript do schema remoto

#### Arquivos

- `supabase/config.toml` - Configuração do Supabase local
- `supabase/migrations/20241016000000_initial_schema.sql` - Migration inicial com schema completo
- `src/lib/db/supabase.ts` - Configuração dos clients Supabase
- `src/lib/db/types.ts` - Tipos TypeScript do banco de dados
- `docs/supabase-setup.md` - Guia completo de setup do Supabase
- `docs/supabase-migration.md` - Guia de migração do Drizzle
- `docs/CHANGELOG-supabase.md` - Este arquivo

#### Dependências

- `@supabase/supabase-js@^2.75.0` - Cliente oficial do Supabase

### Removido

#### Dependências

- `drizzle-orm` - ORM layer
- `drizzle-kit` - Ferramenta de migrations
- `postgres` - Cliente PostgreSQL

#### Scripts NPM

- `db:generate` - Geração de migrations do Drizzle
- `db:push` (antigo) - Push do schema Drizzle
- `db:studio` - Drizzle Studio

#### Arquivos

- `drizzle.config.ts` - Configuração do Drizzle
- `src/lib/db/schema.ts` - Schema do Drizzle

### Modificado

#### Arquivos

- `src/lib/db/index.ts` - Agora exporta clients Supabase
- `package.json` - Scripts e dependências atualizados
- `.env.example` - Variáveis de ambiente do Supabase
- `.gitignore` - Entradas do Supabase
- `README.md` - Documentação atualizada
- `.kiro/specs/horizon-ai-mvp/tasks.md` - Tasks atualizadas

#### Variáveis de Ambiente

**Antes:**

```env
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
```

**Depois:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Schema do Banco de Dados

### Tabelas

- `users` - Contas de usuários
- `refresh_tokens` - Tokens JWT de refresh
- `connections` - Conexões Open Finance
- `accounts` - Contas financeiras
- `transactions` - Transações financeiras

### Enums

- `user_role` - FREE, PREMIUM
- `account_type` - CHECKING, SAVINGS, CREDIT_CARD, INVESTMENT
- `transaction_type` - DEBIT, CREDIT
- `connection_status` - ACTIVE, EXPIRED, ERROR, DISCONNECTED

### Índices de Performance

- `idx_transactions_user_date` - transactions(user_id, transaction_date DESC)
- `idx_accounts_user` - accounts(user_id)
- `idx_connections_user_status` - connections(user_id, status)
- `idx_refresh_tokens_user` - refresh_tokens(user_id)

### Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas RLS garantem que usuários só acessem seus próprios dados
- Service role key para operações administrativas server-side

## Benefícios da Migração

1. **Segurança Nativa**: Row Level Security no nível do banco
2. **Menos Abstrações**: Acesso direto ao PostgreSQL via Supabase
3. **Melhor Integração**: Acesso a features do Supabase (Auth, Storage, Realtime)
4. **Desenvolvimento Local**: Ambiente completo com Docker
5. **Type Safety**: Geração automática de tipos TypeScript
6. **Migrations Gerenciadas**: Histórico e rollback via Supabase CLI

## Próximos Passos

1. ✅ Remover dependências do Drizzle
2. ✅ Instalar Supabase client
3. ✅ Criar migration SQL inicial
4. ✅ Configurar clients Supabase
5. ✅ Criar tipos TypeScript
6. ✅ Adicionar scripts NPM
7. ✅ Atualizar documentação
8. ⏳ Aplicar migration no Supabase (produção)
9. ⏳ Atualizar código existente para usar Supabase client
10. ⏳ Testar todas as operações de banco

## Comandos Úteis

### Desenvolvimento Local

```bash
# Iniciar Supabase local
pnpm db:start

# Ver status
pnpm db:status

# Acessar Studio
open http://localhost:54323

# Parar Supabase
pnpm db:stop
```

### Migrations

```bash
# Criar nova migration
pnpm db:migration:new add_feature

# Aplicar no remoto
pnpm db:push

# Gerar tipos
pnpm db:types:remote
```

### Troubleshooting

```bash
# Resetar banco local
pnpm db:reset

# Ver diferenças
pnpm db:diff

# Listar migrations
pnpm db:migration:list
```

## Referências

- [Documentação Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [Guia de Migrations](https://supabase.com/docs/guides/cli/local-development)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
