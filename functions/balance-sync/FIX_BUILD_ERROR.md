# 🔧 Corrigir Erro de Build

## ❌ Erro que você está vendo:

```
ERR_PNPM_NO_PKG_MANIFEST  No package.json found in /usr/local/build
Build archive was not created.
```

## ✅ Solução Rápida (2 minutos)

### Passo 1: Abrir Terminal

```bash
cd functions/balance-sync
```

### Passo 2: Remover Arquivo Antigo

```bash
rm -f balance-sync.tar.gz
```

### Passo 3: Criar Arquivo Correto

```bash
tar -czf balance-sync.tar.gz src/ package.json tsconfig.json
```

### Passo 4: Verificar Estrutura

```bash
tar -tzf balance-sync.tar.gz | head -5
```

**Deve mostrar** (✅ CORRETO):

```
src/
src/main.ts
package.json
tsconfig.json
```

**NÃO deve mostrar** (❌ ERRADO):

```
balance-sync/src/
balance-sync/package.json
```

### Passo 5: Fazer Upload no Appwrite

1. Vá em **Functions** > **Balance Sync** > **Deployments**
2. Clique em **Create Deployment**
3. Faça upload do arquivo `balance-sync.tar.gz`
4. Aguarde o build completar

## 🎯 Por que isso aconteceu?

O Appwrite espera que os arquivos estejam **na raiz** do arquivo tar.gz, não dentro de uma pasta.

### Estrutura Incorreta ❌

```
balance-sync.tar.gz
└── balance-sync/          ← Pasta extra (PROBLEMA)
    ├── src/
    ├── package.json
    └── tsconfig.json
```

### Estrutura Correta ✅

```
balance-sync.tar.gz
├── src/                   ← Arquivos na raiz (CORRETO)
├── package.json
└── tsconfig.json
```

## 🚀 Alternativa: Usar o Script

Se preferir, use o script de deploy que já faz tudo certo:

```bash
cd functions/balance-sync
./deploy.sh
```

O script:

- ✅ Instala dependências
- ✅ Compila TypeScript
- ✅ Cria o tar.gz com estrutura correta
- ✅ Verifica o tamanho do arquivo

## 📋 Checklist Final

Antes de fazer upload, confirme:

- [ ] Executei `rm -f balance-sync.tar.gz`
- [ ] Executei `tar -czf balance-sync.tar.gz src/ package.json tsconfig.json`
- [ ] Verifiquei a estrutura com `tar -tzf balance-sync.tar.gz`
- [ ] Os arquivos estão na raiz (sem pasta `balance-sync/`)
- [ ] Arquivo `balance-sync.tar.gz` existe

## ❓ Ainda com Problemas?

Veja o guia completo: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Tempo estimado**: 2 minutos

**Dificuldade**: Fácil ⭐
