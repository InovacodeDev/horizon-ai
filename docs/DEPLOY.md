# 🚀 Deploy e Validação

Este projeto possui validações automáticas para garantir que apenas código funcional seja deployado.

## ✅ Sistema Implementado

O projeto agora conta com:

- **Pre-Push Hook**: Valida TypeScript e Build antes de cada push
- **GitHub Actions CI/CD**: Pipeline completo de validação e deploy
- **Vercel Integration**: Deploy automático apenas na branch `main`

## 📋 Opções de Validação

### 1. Pre-Push Hook (Recomendado)

Valida o código **antes** de fazer push para o repositório.

**Instalação:**

```bash
pnpm install
pnpm prepare
```

**O que valida:**

- ✅ TypeScript type checking
- ✅ ESLint
- ✅ Build completo

**Uso:**
O hook executa automaticamente em cada `git push`. Para executar manualmente:

```bash
pnpm pre-push
```

**Bypass (emergências apenas):**

```bash
git push --no-verify
```

### 2. GitHub Actions CI/CD

Valida o código **após** o push, antes do deploy.

**Configuração:**

1. Configure os secrets no GitHub (veja `.github/workflows/README.md`)
2. O workflow executa automaticamente em pushes e PRs

**Fluxo:**

```
Push → GitHub Actions → Validação → Deploy (se main)
```

## 🎯 Estratégias Recomendadas

### Opção A: Pre-Push + Vercel Auto-Deploy (Atual)

- ✅ Validação local antes do push
- ✅ Deploy automático na Vercel
- ✅ Rápido e simples
- ⚠️ Pode fazer push com `--no-verify`

### Opção B: GitHub Actions + Deploy Manual

- ✅ Validação obrigatória no CI
- ✅ Controle total do deploy
- ✅ Impossível bypass
- ⚠️ Mais lento (CI + deploy)

### Opção C: Ambos (Máxima Segurança)

- ✅ Validação local (rápida)
- ✅ Validação no CI (obrigatória)
- ✅ Deploy controlado
- ⚠️ Redundante, mas mais seguro

## 🔧 Configuração Atual

**Pre-Push Hook:** ✅ Configurado
**GitHub Actions:** ✅ Configurado
**Vercel Auto-Deploy:** ✅ Ativo (apenas branch `main`)

## 📝 Comandos Úteis

```bash
# Validar localmente antes de commitar
pnpm typecheck
pnpm lint
pnpm build

# Validação completa (igual ao pre-push)
pnpm pre-push

# Limpar build cache
pnpm clean

# Build de produção com validações
pnpm build:production
```

## 🚨 Troubleshooting

### Pre-push hook não executa

```bash
chmod +x .husky/pre-push
chmod +x scripts/pre-push-check.sh
```

### Build falha localmente mas passa na Vercel

- Verifique variáveis de ambiente
- Limpe o cache: `pnpm clean`
- Reinstale dependências: `rm -rf node_modules && pnpm install`

### GitHub Actions falha

- Verifique os secrets configurados
- Veja os logs no GitHub Actions tab
- Certifique-se que todas as env vars estão configuradas

## 🎨 Desabilitar Deploy Automático na Vercel

Se preferir usar apenas GitHub Actions para deploy:

1. Acesse Vercel Dashboard
2. Projeto → Settings → Git
3. Desabilite "Automatic Deployments from Git"
4. Configure os secrets da Vercel no GitHub
5. O workflow fará o deploy via GitHub Actions

## 📚 Mais Informações

- [GitHub Actions Workflow](.github/workflows/README.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Husky Documentation](https://typicode.github.io/husky/)
