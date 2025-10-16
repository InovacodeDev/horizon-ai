# Production Deployment Checklist

Checklist completo para preparar e fazer deploy do Horizon AI MVP em produção.

## 📋 Índice

- [Pré-Deploy](#pré-deploy)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Segurança](#segurança)
- [Performance](#performance)
- [Monitoramento](#monitoramento)
- [Deploy](#deploy)
- [Pós-Deploy](#pós-deploy)
- [Smoke Tests](#smoke-tests)

## Pré-Deploy

### Código

- [ ] Todos os testes passam
- [ ] Build de produção funciona sem erros (`pnpm build`)
- [ ] Linter passa sem erros (`pnpm lint`)
- [ ] Type check passa sem erros (`pnpm typecheck`)
- [ ] Não há console.logs desnecessários em código de produção
- [ ] Código está na branch `main` e atualizado
- [ ] Todas as features estão completas e testadas
- [ ] Documentação está atualizada

### Dependências

- [ ] Todas as dependências estão atualizadas
- [ ] Não há vulnerabilidades críticas (`pnpm audit`)
- [ ] package.json tem versões fixas (não usar `^` ou `~` em produção)
- [ ] Dependências de desenvolvimento não estão em `dependencies`

## Configuração de Ambiente

### Variáveis de Ambiente Obrigatórias

#### Supabase

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Chave de service role (NUNCA expor ao cliente)
- [ ] `SUPABASE_PROJECT_ID` - ID do projeto Supabase

#### Authentication

- [ ] `JWT_ACCESS_SECRET` - Secret forte para access tokens (min 32 caracteres)
- [ ] `JWT_REFRESH_SECRET` - Secret forte para refresh tokens (min 32 caracteres)
- [ ] Secrets são diferentes entre ambientes (dev/staging/prod)
- [ ] Secrets são gerados com alta entropia (use `openssl rand -base64 32`)

#### Encryption

- [ ] `ENCRYPTION_KEY` - Chave de 32 caracteres para criptografia AES-256
- [ ] Chave é única para produção
- [ ] Chave está armazenada de forma segura

#### Redis Cache

- [ ] `UPSTASH_REDIS_REST_URL` - URL do Redis Upstash
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Token do Redis Upstash
- [ ] Instância Redis está em região próxima ao servidor

#### Cron Jobs

- [ ] `CRON_SECRET` - Token secreto para autenticar cron jobs
- [ ] Secret é forte e único

#### Application

- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` - URL completa da aplicação (https://your-domain.com)

#### Open Finance (Opcional para MVP)

- [ ] `OPEN_FINANCE_CLIENT_ID` - Client ID da instituição Open Finance
- [ ] `OPEN_FINANCE_CLIENT_SECRET` - Client Secret
- [ ] `OPEN_FINANCE_API_URL` - URL da API Open Finance

### Verificação de Variáveis

```bash
# Execute este script para verificar se todas as variáveis estão configuradas
node -e "
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_PROJECT_ID',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CRON_SECRET',
  'NEXT_PUBLIC_APP_URL'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}
"
```

## Banco de Dados

### Supabase Setup

- [ ] Projeto Supabase criado para produção
- [ ] Plano adequado selecionado (considerar volume de dados)
- [ ] Região selecionada (preferencialmente próxima aos usuários)
- [ ] Backup automático configurado
- [ ] Point-in-time recovery habilitado

### Migrations

- [ ] Todas as migrations foram aplicadas (`pnpm db:push`)
- [ ] Schema está sincronizado com o código
- [ ] Indexes estão criados:
  - [ ] `idx_transactions_user_date` em `transactions(user_id, transaction_date DESC)`
  - [ ] `idx_accounts_user` em `accounts(user_id)`
  - [ ] `idx_connections_user_status` em `connections(user_id, status)`
- [ ] Row Level Security (RLS) está configurado (se aplicável)

### Performance

- [ ] Connection pooling configurado
- [ ] Query performance testada com volume realista
- [ ] Slow query log habilitado
- [ ] Database monitoring configurado

## Segurança

### SSL/TLS

- [ ] Certificado SSL configurado (Vercel faz automaticamente)
- [ ] HTTPS forçado (redirect HTTP → HTTPS)
- [ ] HSTS header configurado
- [ ] Certificado válido e não expirado

### Headers de Segurança

Verificar em `next.config.ts`:

- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Content-Security-Policy` configurado
- [ ] `Permissions-Policy` configurado

### CORS

- [ ] CORS configurado para origens específicas
- [ ] Não usar `*` em produção
- [ ] Verificar em `src/lib/utils/cors.ts`

### Secrets

- [ ] Nenhum secret commitado no código
- [ ] `.env` está no `.gitignore`
- [ ] Secrets rotacionados regularmente
- [ ] Acesso a secrets limitado (princípio do menor privilégio)

### Rate Limiting

- [ ] Rate limiting configurado em endpoints sensíveis
- [ ] Limites apropriados para produção
- [ ] Upstash Rate Limit configurado

### Auditoria

- [ ] Audit logs habilitados
- [ ] Eventos importantes sendo registrados:
  - [ ] Login/Logout
  - [ ] Registro de usuário
  - [ ] Conexão de conta
  - [ ] Tentativas de acesso não autorizado

## Performance

### Caching

- [ ] Redis cache configurado e funcionando
- [ ] TTLs apropriados configurados
- [ ] Cache invalidation implementado
- [ ] Cache warming strategy (se necessário)

### CDN

- [ ] Assets estáticos servidos via CDN (Vercel Edge Network)
- [ ] Imagens otimizadas (Next.js Image)
- [ ] Fonts otimizadas

### Build

- [ ] Build de produção otimizado
- [ ] Code splitting configurado
- [ ] Tree shaking funcionando
- [ ] Bundle size analisado (`pnpm build` mostra tamanhos)

### Database

- [ ] Queries otimizadas
- [ ] Indexes criados
- [ ] N+1 queries eliminados
- [ ] Connection pooling configurado

## Monitoramento

### Logging

- [ ] Structured logging implementado
- [ ] Log levels apropriados (error, warn, info)
- [ ] Logs não contêm informações sensíveis
- [ ] Vercel Logs ou serviço de logging configurado

### Error Tracking

- [ ] Sentry ou similar configurado (opcional)
- [ ] Source maps enviados para error tracking
- [ ] Alertas configurados para erros críticos

### Performance Monitoring

- [ ] Vercel Analytics habilitado
- [ ] Core Web Vitals monitorados
- [ ] API response times monitorados
- [ ] Database query performance monitorado

### Uptime Monitoring

- [ ] Health check endpoint criado (`/api/health`)
- [ ] Uptime monitoring configurado (UptimeRobot, Pingdom, etc)
- [ ] Alertas configurados para downtime

### Alertas

- [ ] Alertas configurados para:
  - [ ] Downtime
  - [ ] Erros críticos
  - [ ] Performance degradation
  - [ ] Database issues
  - [ ] Rate limit exceeded

## Deploy

### Vercel Setup

- [ ] Projeto criado na Vercel
- [ ] Repositório GitHub conectado
- [ ] Branch de produção configurada (`main`)
- [ ] Auto-deploy habilitado
- [ ] Preview deployments configurados para PRs

### Domínio

- [ ] Domínio customizado configurado
- [ ] DNS configurado corretamente
- [ ] SSL/TLS funcionando
- [ ] Redirect www → non-www (ou vice-versa)

### Build Settings

- [ ] Build command: `pnpm build`
- [ ] Output directory: `.next`
- [ ] Install command: `pnpm install`
- [ ] Node version: 20.x

### Environment Variables

- [ ] Todas as variáveis configuradas na Vercel
- [ ] Variáveis sensíveis marcadas como "Sensitive"
- [ ] Variáveis corretas para ambiente de produção

### Cron Jobs

- [ ] Vercel Cron configurado em `vercel.json`:

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

- [ ] Endpoint de cron protegido com `CRON_SECRET`
- [ ] Cron job testado

## Pós-Deploy

### Verificação Inicial

- [ ] Site está acessível via HTTPS
- [ ] Página inicial carrega corretamente
- [ ] Assets estáticos carregam (CSS, JS, imagens)
- [ ] Não há erros no console do navegador
- [ ] Não há erros nos logs do servidor

### Funcionalidades Críticas

- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Dashboard carrega
- [ ] Conexão com banco funciona (se Open Finance configurado)
- [ ] Sincronização funciona

### Performance

- [ ] Lighthouse score > 90 (Performance)
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1

### SEO

- [ ] Meta tags configuradas
- [ ] robots.txt configurado
- [ ] sitemap.xml gerado (se aplicável)

## Smoke Tests

Execute estes testes manualmente após o deploy:

### 1. Teste de Registro

```bash
curl -X POST https://your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "firstName": "Test"
  }'
```

Esperado: Status 201, usuário criado

### 2. Teste de Login

```bash
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

Esperado: Status 200, cookies setados

### 3. Teste de Dashboard

```bash
curl https://your-domain.com/api/v1/dashboard \
  -b cookies.txt
```

Esperado: Status 200, dados do dashboard

### 4. Teste de Banks

```bash
curl https://your-domain.com/api/v1/banks
```

Esperado: Status 200, lista de bancos

### 5. Teste de Health Check

```bash
curl https://your-domain.com/api/health
```

Esperado: Status 200, sistema saudável

## Rollback Plan

Em caso de problemas críticos:

### Vercel

1. Acesse Vercel Dashboard
2. Vá em Deployments
3. Encontre o último deployment estável
4. Clique em "..." → "Promote to Production"

### Database

1. Se necessário, restaure backup do Supabase
2. Reverta migrations problemáticas

### Comunicação

- [ ] Template de comunicação preparado para usuários
- [ ] Canais de comunicação definidos (email, status page)
- [ ] Equipe de suporte preparada

## Checklist Final

Antes de marcar como completo:

- [ ] Todos os itens acima foram verificados
- [ ] Smoke tests passaram
- [ ] Equipe foi notificada do deploy
- [ ] Documentação de deploy atualizada
- [ ] Monitoramento está ativo
- [ ] Rollback plan está pronto
- [ ] Primeira sincronização de dados funcionou
- [ ] Nenhum erro crítico nos logs

## Recursos Adicionais

- [Vercel Production Checklist](https://vercel.com/docs/concepts/deployments/production-checklist)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

## Suporte

Em caso de problemas:

1. Verifique logs na Vercel
2. Verifique logs no Supabase
3. Verifique error tracking (Sentry)
4. Consulte documentação
5. Entre em contato com a equipe

---

**Data do último deploy:** ****\*\*****\_****\*\*****

**Responsável:** ****\*\*****\_****\*\*****

**Versão:** ****\*\*****\_****\*\*****
