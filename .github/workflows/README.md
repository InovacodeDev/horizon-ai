# CI/CD Configuration

## GitHub Actions Workflow

O workflow de CI/CD valida o código antes do deploy automático na Vercel.

### Secrets Necessários

Configure os seguintes secrets no GitHub (Settings → Secrets and variables → Actions):

#### Variáveis de Ambiente do Appwrite

- `NEXT_PUBLIC_APPWRITE_ENDPOINT` - URL do endpoint Appwrite
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID` - ID do projeto Appwrite
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID` - ID do database Appwrite
- `APPWRITE_API_KEY` - API key do Appwrite (server-side)

#### Credenciais da Vercel (opcional, para deploy via GitHub Actions)

- `VERCEL_TOKEN` - Token de autenticação da Vercel
- `VERCEL_ORG_ID` - ID da organização Vercel
- `VERCEL_PROJECT_ID` - ID do projeto Vercel

### Como Funciona

1. **Validação** - Executa em todos os pushes e PRs:
   - Type checking (TypeScript)
   - Linting (ESLint)
   - Build do projeto

2. **Deploy** - Executa apenas em pushes para `main`:
   - Após validação bem-sucedida
   - Deploy automático para Vercel (se configurado)

### Desabilitar Deploy Automático na Vercel

Se preferir usar apenas o GitHub Actions para deploy:

1. Acesse o projeto na Vercel
2. Settings → Git
3. Desabilite "Automatic Deployments"
4. Configure os secrets do Vercel no GitHub

## Pre-Push Hook

O hook de pre-push valida o código localmente antes de permitir o push.

### Instalação

```bash
pnpm install
pnpm prepare
chmod +x .husky/pre-push
chmod +x scripts/pre-push-check.sh
```

### Uso Manual

```bash
pnpm pre-push
```

### Bypass (use com cuidado)

```bash
git push --no-verify
```
