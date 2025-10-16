# Production Deployment Guide

Guia passo a passo para fazer deploy do Horizon AI MVP em produção usando Vercel.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- [ ] Conta na [Vercel](https://vercel.com)
- [ ] Conta no [Supabase](https://supabase.com)
- [ ] Conta no [Upstash](https://upstash.com)
- [ ] Repositório GitHub com o código
- [ ] Domínio customizado (opcional, mas recomendado)

## 🚀 Passo 1: Configurar Supabase

### 1.1 Criar Projeto de Produção

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Configure:
   - **Name**: horizon-ai-production
   - **Database Password**: Gere uma senha forte
   - **Region**: São Paulo (South America - sa-east-1) para melhor latência no Brasil
   - **Pricing Plan**: Selecione o plano adequado

### 1.2 Aplicar Migrations

```bash
# Link com o projeto de produção
supabase link --project-ref <your-production-project-id>

# Aplicar todas as migrations
supabase db push

# Verificar se as migrations foram aplicadas
supabase migration list
```

### 1.3 Coletar Credenciais

Vá em **Settings > API** e copie:

- Project URL
- anon/public key
- service_role key (mantenha seguro!)
- Project ID

## 🚀 Passo 2: Configurar Upstash Redis

### 2.1 Criar Database Redis

1. Acesse [Upstash Console](https://console.upstash.com)
2. Clique em "Create Database"
3. Configure:
   - **Name**: horizon-ai-production
   - **Type**: Regional
   - **Region**: São Paulo (para melhor latência)
   - **TLS**: Enabled

### 2.2 Coletar Credenciais

Na página do database, copie:

- REST URL
- REST Token

## 🚀 Passo 3: Gerar Secrets

### 3.1 JWT Secrets

```bash
# Access Token Secret
openssl rand -base64 32

# Refresh Token Secret
openssl rand -base64 32
```

### 3.2 Encryption Key

```bash
# Gera uma chave de exatamente 32 caracteres
openssl rand -base64 32 | cut -c1-32
```

### 3.3 Cron Secret

```bash
# Gera um token para autenticar cron jobs
openssl rand -hex 32
```

**IMPORTANTE:** Salve todos esses secrets em um local seguro (ex: 1Password, LastPass).

## 🚀 Passo 4: Deploy na Vercel

### 4.1 Importar Projeto

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em "Add New..." > "Project"
3. Selecione seu repositório GitHub
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

### 4.2 Configurar Environment Variables

Na seção "Environment Variables", adicione:

#### Supabase

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (marque como Sensitive)
SUPABASE_PROJECT_ID=your-project-id
```

#### Authentication

```
JWT_ACCESS_SECRET=<generated-secret> (marque como Sensitive)
JWT_REFRESH_SECRET=<generated-secret> (marque como Sensitive)
```

#### Encryption

```
ENCRYPTION_KEY=<generated-key> (marque como Sensitive)
```

#### Redis

```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token> (marque como Sensitive)
```

#### Cron

```
CRON_SECRET=<generated-secret> (marque como Sensitive)
```

#### Application

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4.3 Deploy

1. Clique em "Deploy"
2. Aguarde o build completar (2-5 minutos)
3. Verifique se não há erros no build log

## 🚀 Passo 5: Configurar Domínio (Opcional)

### 5.1 Adicionar Domínio Customizado

1. No projeto Vercel, vá em "Settings" > "Domains"
2. Clique em "Add"
3. Digite seu domínio (ex: `app.horizonai.com.br`)
4. Siga as instruções para configurar DNS

### 5.2 Configurar DNS

Adicione os seguintes registros no seu provedor de DNS:

**Para domínio raiz (example.com):**

```
Type: A
Name: @
Value: 76.76.21.21
```

**Para subdomínio (app.example.com):**

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### 5.3 Aguardar Propagação

- DNS pode levar até 48 horas para propagar
- SSL é configurado automaticamente pela Vercel
- Verifique em https://dnschecker.org

### 5.4 Atualizar Environment Variable

Atualize `NEXT_PUBLIC_APP_URL` na Vercel:

```
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

Faça redeploy para aplicar a mudança.

## 🚀 Passo 6: Configurar Cron Jobs

### 6.1 Verificar vercel.json

Certifique-se de que `vercel.json` contém:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 6.2 Testar Cron Job

```bash
# Teste o endpoint de cron
curl -X POST https://your-domain.com/api/cron/sync \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Esperado: Status 200

## 🚀 Passo 7: Verificação Pós-Deploy

### 7.1 Health Check

```bash
curl https://your-domain.com/api/health
```

Esperado:

```json
{
  "timestamp": "2024-10-16T10:00:00.000Z",
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### 7.2 Smoke Tests

Execute os testes do [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md#smoke-tests)

### 7.3 Verificar Logs

1. Vá em Vercel Dashboard > seu projeto > "Logs"
2. Verifique se não há erros críticos
3. Monitore por alguns minutos

### 7.4 Testar Funcionalidades

- [ ] Página inicial carrega
- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Não há erros no console do navegador

## 🚀 Passo 8: Configurar Monitoramento

### 8.1 Vercel Analytics

1. No projeto Vercel, vá em "Analytics"
2. Habilite "Web Analytics"
3. Habilite "Speed Insights"

### 8.2 Uptime Monitoring (Opcional)

Configure um serviço como:

- [UptimeRobot](https://uptimerobot.com) (gratuito)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

Monitore:

- `https://your-domain.com` (página inicial)
- `https://your-domain.com/api/health` (health check)

### 8.3 Error Tracking (Opcional)

Configure [Sentry](https://sentry.io):

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## 🚀 Passo 9: Configurar CI/CD

### 9.1 GitHub Actions

O projeto já tem `.github/workflows/validate.yml` configurado.

Verifique se:

- [ ] Workflow está habilitado
- [ ] Secrets do GitHub estão configurados (se necessário)
- [ ] PRs disparam o workflow

### 9.2 Vercel Integration

Vercel automaticamente:

- Faz deploy da branch `main` para produção
- Cria preview deployments para PRs
- Executa checks antes do deploy

## 🚀 Passo 10: Documentação e Comunicação

### 10.1 Atualizar Documentação

- [ ] Atualizar README.md com URL de produção
- [ ] Documentar processo de deploy
- [ ] Criar runbook para troubleshooting

### 10.2 Comunicar à Equipe

- [ ] Notificar equipe sobre deploy
- [ ] Compartilhar credenciais (de forma segura)
- [ ] Agendar sessão de treinamento (se necessário)

## 🔄 Rollback

Se algo der errado:

### Rollback Rápido (Vercel)

1. Vá em Vercel Dashboard > Deployments
2. Encontre o último deployment estável
3. Clique em "..." > "Promote to Production"

### Rollback de Database

```bash
# Se necessário, restaure backup do Supabase
# Vá em Supabase Dashboard > Database > Backups
```

## 📊 Métricas de Sucesso

Após o deploy, monitore:

- **Uptime**: > 99.9%
- **Response Time**: < 200ms (API), < 3s (Dashboard)
- **Error Rate**: < 0.1%
- **Core Web Vitals**:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

## 🆘 Troubleshooting

### Build Falha

```bash
# Verifique logs de build na Vercel
# Teste build localmente
pnpm build

# Verifique se todas as dependências estão instaladas
pnpm install
```

### Erro 500 em Produção

1. Verifique logs na Vercel
2. Verifique environment variables
3. Verifique conexão com Supabase
4. Verifique conexão com Redis

### Database Connection Error

1. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correto
2. Verifique se IP da Vercel está permitido no Supabase
3. Teste conexão manualmente

### Cron Job Não Executa

1. Verifique se `vercel.json` está correto
2. Verifique se `CRON_SECRET` está configurado
3. Teste endpoint manualmente
4. Verifique logs do cron na Vercel

## 📚 Recursos Adicionais

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Upstash Documentation](https://docs.upstash.com)

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Aplicação está acessível via HTTPS
- [ ] Todas as funcionalidades críticas funcionam
- [ ] Smoke tests passaram
- [ ] Monitoramento está ativo
- [ ] Logs não mostram erros críticos
- [ ] Performance está dentro dos targets
- [ ] Equipe foi notificada
- [ ] Documentação está atualizada
- [ ] Rollback plan está pronto

## 🎉 Parabéns!

Seu Horizon AI MVP está em produção! 🚀

Próximos passos:

1. Monitore métricas nas primeiras 24-48 horas
2. Colete feedback dos primeiros usuários
3. Itere baseado em dados reais
4. Planeje próximas features

---

**Última atualização:** 16 de Outubro de 2024
