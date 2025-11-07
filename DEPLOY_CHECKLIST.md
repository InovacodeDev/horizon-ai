# ✅ Checklist de Deploy na Vercel

## Correções de Tipagem Realizadas

### 1. ✅ Componente CashFlowProjection

**Arquivo:** `components/CashFlowProjection.tsx`

- **Problema:** Comparação de tipos incompatíveis (`'expense'` vs `'salary'`)
- **Solução:** Removida a verificação de `tx.type === 'salary'` nos filtros, mantendo apenas `'income'` e `'expense'`

### 2. ✅ Exportações do Toast

**Arquivo:** `components/ui/index.ts`

- **Problema:** Tentativa de exportar `default` e `ToastType` que não existiam
- **Solução:** Alterado para exportar `Toast` e `useToast` como named exports

### 3. ✅ API de Estatísticas de Invoices

**Arquivo:** `app/api/invoices/stats/route.ts`

- **Problema:** Tipos `unknown` em parâmetros de sort
- **Solução:** Adicionado type assertion `(a as number)` e `(b as number)`

### 4. ✅ Logger Service

**Arquivo:** `lib/services/nfe-crawler/logger.service.ts`

- **Problema:** Tipo implícito `any` no método `getStats()`
- **Solução:** Removido o tipo de retorno explícito, permitindo inferência automática

## Status do Build

```bash
✅ TypeScript Check: PASSOU
✅ Sem erros de compilação
✅ Todas as tipagens corrigidas
```

## Configurações da Vercel

### Arquivo `vercel.json`

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel da Vercel:

#### 🔴 OBRIGATÓRIAS

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `JWT_SECRET` (gerar com: `openssl rand -hex 32`)
- `JWT_REFRESH_SECRET` (gerar com: `openssl rand -hex 32`)

#### 🟡 RECOMENDADAS

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `NEXT_PUBLIC_API_URL`
- `API_URL`
- `CORS_ORIGIN`

#### 🟢 OPCIONAIS (para funcionalidades específicas)

- `GEMINI_API_KEY` (para integração com IA)
- `AI_PROVIDER` (padrão: gemini)
- `AI_MODEL` (padrão: gemini-2.5-flash)
- `CRON_SECRET` (para proteger endpoints de cron)

### Configurações de Segurança para Produção

```env
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=strict
```

## Próximos Passos

1. **Configurar Variáveis de Ambiente na Vercel**
   - Acesse: Settings → Environment Variables
   - Adicione todas as variáveis obrigatórias
   - Use valores diferentes para produção

2. **Verificar Configuração do Appwrite**
   - Certifique-se de que o projeto Appwrite está configurado
   - Verifique se as migrações foram executadas
   - Configure as permissões adequadas

3. **Deploy**
   - Faça commit das alterações
   - Push para o repositório
   - A Vercel fará o deploy automaticamente

4. **Pós-Deploy**
   - Teste as funcionalidades principais
   - Verifique os logs na Vercel
   - Configure domínio customizado (opcional)

## Comandos Úteis

```bash
# Verificar tipagem localmente
pnpm typecheck

# Build local (simula o build da Vercel)
pnpm build

# Validar variáveis de ambiente
pnpm validate:env production
```

## Notas Importantes

- ⚠️ O projeto usa Node.js 22.x (configurado em `package.json`)
- ⚠️ Certifique-se de que a Vercel está usando a versão correta do Node
- ⚠️ O build usa `pnpm` como gerenciador de pacotes
- ⚠️ Arquivos de teste e scripts são ignorados no deploy (`.vercelignore`)

## Troubleshooting

### Se o build falhar na Vercel:

1. **Verificar logs de build**
   - Acesse o painel da Vercel
   - Veja os logs detalhados do build

2. **Variáveis de ambiente faltando**
   - Verifique se todas as variáveis obrigatórias estão configuradas
   - Certifique-se de que não há espaços extras nos valores

3. **Problemas de tipagem**
   - Execute `pnpm typecheck` localmente
   - Corrija quaisquer erros antes de fazer push

4. **Problemas de memória**
   - A Vercel tem limites de memória no plano gratuito
   - Considere otimizar imports ou fazer upgrade do plano

## Suporte

- Documentação Next.js: https://nextjs.org/docs
- Documentação Vercel: https://vercel.com/docs
- Documentação Appwrite: https://appwrite.io/docs
