# Supabase - Referência Rápida

## 🚀 Comandos Essenciais

### Desenvolvimento Local

```bash
pnpm db:start          # Iniciar Supabase local
pnpm db:stop           # Parar Supabase local
pnpm db:status         # Ver status dos serviços
pnpm db:reset          # Resetar banco local
```

### Migrations

```bash
pnpm db:migration:new add_feature    # Criar nova migration
pnpm db:migration:list                # Listar migrations
pnpm db:push                          # Aplicar no remoto
pnpm db:pull                          # Puxar do remoto
pnpm db:diff                          # Ver diferenças
```

### Types

```bash
pnpm db:types          # Gerar tipos do local
pnpm db:types:remote   # Gerar tipos do remoto
```

## 🔗 URLs Locais

- **API**: http://localhost:54321
- **Studio**: http://localhost:54323
- **Emails**: http://localhost:54324

## 📝 Variáveis de Ambiente

### Local (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Produção

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## 💻 Código Básico

### Importar

```typescript
import { supabase, supabaseAdmin } from "@/lib/db";
```

### Select

```typescript
const { data, error } = await supabase
  .from("users")
  .select("*")
  .eq("id", userId)
  .single();
```

### Insert

```typescript
const { data, error } = await supabaseAdmin
  .from("users")
  .insert({ id: createId(), email: "user@example.com" })
  .select()
  .single();
```

### Update

```typescript
const { error } = await supabase
  .from("users")
  .update({ first_name: "João" })
  .eq("id", userId);
```

### Delete

```typescript
const { error } = await supabase.from("users").delete().eq("id", userId);
```

## 🔐 Segurança

- Use `supabaseAdmin` para operações server-side
- Use `supabase` para operações client-side
- Sempre filtre por `user_id` em queries
- RLS está habilitado em todas as tabelas

## 📚 Documentação Completa

- [Supabase Setup Guide](./docs/supabase-setup.md)
- [Supabase Examples](./docs/supabase-examples.md)
- [Migration Guide](./docs/supabase-migration.md)
- [Changelog](./docs/CHANGELOG-supabase.md)

## 🆘 Troubleshooting

### Porta em uso

```bash
pnpm db:stop
# Aguarde alguns segundos
pnpm db:start
```

### Docker não está rodando

Certifique-se de que o Docker Desktop está ativo.

### Erro ao aplicar migration

```bash
# Verificar link
supabase projects list

# Religar se necessário
supabase link --project-ref xxxxx
```

### Resetar tudo

```bash
pnpm db:stop
pnpm db:start
pnpm db:reset
```
