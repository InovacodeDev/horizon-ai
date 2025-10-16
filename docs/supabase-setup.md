# Guia de Setup do Supabase

Este guia explica como configurar o Supabase para desenvolvimento local e produção.

## Pré-requisitos

### Instalar Supabase CLI

O Supabase CLI é necessário para gerenciar migrations e desenvolvimento local.

**macOS (Homebrew):**

```bash
brew install supabase/tap/supabase
```

**Linux/WSL:**

```bash
brew install supabase/tap/supabase
```

**Windows (Scoop):**

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**NPM (alternativa):**

```bash
npm install -g supabase
```

Verifique a instalação:

```bash
supabase --version
```

## Desenvolvimento Local

### 1. Iniciar Supabase Local

O Supabase local usa Docker para rodar PostgreSQL, Auth, Storage e outros serviços.

```bash
pnpm db:start
```

Isso irá:

- Baixar as imagens Docker necessárias (primeira vez)
- Iniciar todos os serviços do Supabase
- Aplicar as migrations em `supabase/migrations/`
- Exibir as URLs e credenciais de acesso

**URLs importantes:**

- API URL: `http://localhost:54321`
- Studio: `http://localhost:54323`
- Inbucket (emails): `http://localhost:54324`

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` com as credenciais locais:

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Outras variáveis...
JWT_ACCESS_SECRET=your-access-token-secret-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key
```

> **Nota:** As chaves acima são as chaves padrão do Supabase local. Nunca use essas chaves em produção!

### 3. Verificar Status

```bash
pnpm db:status
```

Isso mostra todos os serviços rodando e suas URLs.

### 4. Acessar o Supabase Studio

Abra `http://localhost:54323` no navegador para acessar o Supabase Studio local, onde você pode:

- Visualizar e editar dados das tabelas
- Executar queries SQL
- Gerenciar usuários
- Ver logs em tempo real

### 5. Parar o Supabase Local

```bash
pnpm db:stop
```

## Gerenciamento de Migrations

### Criar Nova Migration

```bash
pnpm db:migration:new add_user_preferences
```

Isso cria um novo arquivo em `supabase/migrations/` com timestamp.

### Listar Migrations

```bash
pnpm db:migration:list
```

Mostra todas as migrations e seu status (aplicada ou pendente).

### Resetar Banco Local

Para resetar o banco local e reaplicar todas as migrations:

```bash
pnpm db:reset
```

> **Atenção:** Isso apaga todos os dados locais!

### Gerar Diff de Schema

Se você fez mudanças no banco via Studio, pode gerar uma migration automaticamente:

```bash
pnpm db:diff -f add_new_column
```

Isso compara o schema atual com as migrations e cria uma nova migration com as diferenças.

## Produção (Supabase Cloud)

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Escolha um nome, senha do banco e região
5. Aguarde a criação do projeto (~2 minutos)

### 2. Obter Credenciais

No dashboard do projeto, vá em **Settings > API**:

- **Project URL**: `https://xxxxx.supabase.co`
- **anon/public key**: Chave pública para client-side
- **service_role key**: Chave privada para server-side (nunca exponha!)

### 3. Configurar Variáveis de Ambiente

**Vercel:**

1. Vá em Settings > Environment Variables
2. Adicione as variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 4. Linkar Projeto Local

Para conectar seu ambiente local ao projeto remoto:

```bash
supabase link --project-ref xxxxx
```

O `project-ref` está na URL do projeto: `https://app.supabase.com/project/xxxxx`

### 5. Aplicar Migrations

Para aplicar as migrations locais no banco remoto:

```bash
pnpm db:push
```

Isso irá:

1. Comparar migrations locais com o banco remoto
2. Mostrar quais migrations serão aplicadas
3. Pedir confirmação
4. Aplicar as migrations

### 6. Gerar Types do Schema Remoto

Após aplicar migrations, gere os tipos TypeScript:

```bash
pnpm db:types:remote
```

Isso atualiza `src/lib/db/types.ts` com o schema do banco remoto.

## Workflow Recomendado

### Desenvolvimento de Nova Feature

1. **Criar migration localmente:**

   ```bash
   pnpm db:migration:new add_feature_x
   ```

2. **Editar o arquivo SQL** em `supabase/migrations/`

3. **Aplicar localmente:**

   ```bash
   pnpm db:reset
   ```

4. **Gerar tipos:**

   ```bash
   pnpm db:types
   ```

5. **Desenvolver e testar** a feature

6. **Commit** da migration junto com o código

7. **Deploy:** As migrations são aplicadas automaticamente no CI/CD ou manualmente com `pnpm db:push`

### Sincronizar Schema Remoto

Se alguém aplicou migrations no remoto:

```bash
# Puxar migrations do remoto
pnpm db:pull

# Resetar local com as novas migrations
pnpm db:reset

# Gerar tipos atualizados
pnpm db:types
```

## Troubleshooting

### Porta já em uso

Se a porta 54321 já estiver em uso:

```bash
pnpm db:stop
# Aguarde alguns segundos
pnpm db:start
```

### Docker não está rodando

O Supabase CLI precisa do Docker. Certifique-se de que o Docker Desktop está rodando.

### Migrations fora de ordem

Se você tem conflitos de migrations:

```bash
# Listar migrations
pnpm db:migration:list

# Resetar e reaplicar
pnpm db:reset
```

### Erro ao aplicar migration remota

Se `db:push` falhar:

1. Verifique se está linkado ao projeto correto: `supabase projects list`
2. Verifique se tem permissões no projeto
3. Tente aplicar manualmente via SQL Editor no Supabase Studio

## Recursos Adicionais

- [Documentação Oficial do Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [Guia de Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase Studio](https://supabase.com/docs/guides/platform/studio)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
