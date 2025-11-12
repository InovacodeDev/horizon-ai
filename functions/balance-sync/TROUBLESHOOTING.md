# Balance Sync - Troubleshooting

Soluções para problemas comuns ao fazer deploy da função.

## ❌ Erro: "No package.json found in /usr/local/build"

### Descrição

```
ERR_PNPM_NO_PKG_MANIFEST  No package.json found in /usr/local/build
Build archive was not created.
```

### Causa

O arquivo `balance-sync.tar.gz` foi criado com estrutura incorreta. O Appwrite espera que os arquivos estejam na **raiz** do arquivo tar.gz, não dentro de uma pasta.

### Estrutura Incorreta ❌

```
balance-sync.tar.gz
└── balance-sync/          ← Pasta extra (ERRADO)
    ├── src/
    ├── package.json
    └── tsconfig.json
```

### Estrutura Correta ✅

```
balance-sync.tar.gz
├── src/                   ← Arquivos na raiz (CORRETO)
│   └── main.ts
├── package.json
└── tsconfig.json
```

### Solução

#### Opção 1: Usar o Script de Deploy (Recomendado)

```bash
cd functions/balance-sync

# Remover arquivo antigo
rm -f balance-sync.tar.gz

# Executar script de deploy
./deploy.sh
```

O script já cria o arquivo com a estrutura correta.

#### Opção 2: Criar Manualmente

```bash
cd functions/balance-sync

# Remover arquivo antigo
rm -f balance-sync.tar.gz

# Criar arquivo com estrutura correta
tar -czf balance-sync.tar.gz src/ package.json tsconfig.json

# Verificar estrutura
tar -tzf balance-sync.tar.gz | head -10
```

**Saída esperada**:

```
src/
src/main.ts
package.json
tsconfig.json
```

**NÃO deve mostrar**:

```
balance-sync/src/          ← Pasta extra (ERRADO)
balance-sync/package.json
```

#### Opção 3: Criar do Diretório Pai

Se você estiver no diretório pai (`functions/`):

```bash
cd functions

# ERRADO - Cria pasta extra
tar -czf balance-sync.tar.gz balance-sync/

# CORRETO - Entra na pasta primeiro
cd balance-sync
tar -czf balance-sync.tar.gz src/ package.json tsconfig.json
```

### Verificação

Antes de fazer upload, verifique a estrutura:

```bash
# Listar conteúdo do arquivo
tar -tzf balance-sync.tar.gz

# Deve mostrar:
# src/
# src/main.ts
# package.json
# tsconfig.json
```

Se mostrar `balance-sync/src/` ou qualquer pasta pai, está incorreto.

### Upload no Appwrite

1. Vá em **Functions** > **Balance Sync** > **Deployments**
2. Clique em **Create Deployment**
3. Faça upload do arquivo `balance-sync.tar.gz` corrigido
4. Aguarde o build completar

## ❌ Erro: "npm install failed"

### Descrição

```
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /usr/local/build/package.json
```

### Causa

Mesmo problema acima - `package.json` não está na raiz do tar.gz.

### Solução

Siga as instruções da seção anterior.

## ❌ Erro: "Module not found"

### Descrição

```
Error: Cannot find module 'node-appwrite'
```

### Causa

Dependências não foram instaladas corretamente.

### Solução

1. Verifique se `package.json` está correto:

```json
{
  "dependencies": {
    "node-appwrite": "^20.3.0"
  }
}
```

2. Teste localmente:

```bash
cd functions/balance-sync
rm -rf node_modules package-lock.json
npm install
npm run build
```

3. Se funcionar localmente, recrie o tar.gz:

```bash
rm -f balance-sync.tar.gz
tar -czf balance-sync.tar.gz src/ package.json tsconfig.json
```

## ❌ Erro: "Build timeout"

### Descrição

```
Build exceeded maximum time limit
```

### Causa

Build está demorando muito (> 15 minutos).

### Solução

1. Simplifique o `package.json` - remova dependências desnecessárias
2. Use versões específicas das dependências (não `^` ou `~`)
3. Tente novamente - pode ser problema temporário do Appwrite

## ❌ Erro: "Invalid entrypoint"

### Descrição

```
Entrypoint 'src/main.ts' not found
```

### Causa

Arquivo de entrypoint não existe ou está no caminho errado.

### Solução

1. Verifique se `src/main.ts` existe:

```bash
ls -la src/main.ts
```

2. Verifique a estrutura do tar.gz:

```bash
tar -tzf balance-sync.tar.gz | grep main.ts
# Deve mostrar: src/main.ts
```

3. Verifique a configuração no Appwrite Console:
   - **Entrypoint**: `src/main.ts` (não `./src/main.ts` ou `/src/main.ts`)

## ❌ Erro: "TypeScript compilation failed"

### Descrição

```
error TS2307: Cannot find module 'node-appwrite'
```

### Causa

TypeScript não encontra as definições de tipos.

### Solução

1. Verifique `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

2. Teste localmente:

```bash
npm install
npm run build
```

3. Se funcionar, o problema pode ser no Appwrite. Tente:
   - Remover `dist/` do tar.gz (deixe o Appwrite compilar)
   - Usar `"skipLibCheck": true` no tsconfig.json

## ✅ Checklist de Verificação

Antes de fazer upload, verifique:

- [ ] Arquivo `balance-sync.tar.gz` existe
- [ ] Estrutura do tar.gz está correta (arquivos na raiz)
- [ ] `package.json` está na raiz do tar.gz
- [ ] `src/main.ts` existe no tar.gz
- [ ] Build local funciona: `npm install && npm run build`
- [ ] Tamanho do arquivo < 100MB

## 🔍 Debug Avançado

### Extrair e Inspecionar o Tar.gz

```bash
# Criar pasta temporária
mkdir -p /tmp/test-deploy
cd /tmp/test-deploy

# Extrair arquivo
tar -xzf ~/path/to/balance-sync.tar.gz

# Verificar estrutura
ls -la
# Deve mostrar:
# src/
# package.json
# tsconfig.json

# Testar build
npm install
npm run build
```

### Comparar com Arquivo Funcional

Se você tem um deployment que funcionou:

```bash
# Baixar deployment funcional do Appwrite Console
# Comparar estruturas
tar -tzf balance-sync-working.tar.gz > working.txt
tar -tzf balance-sync-new.tar.gz > new.txt
diff working.txt new.txt
```

## 📞 Ainda com Problemas?

Se nenhuma solução funcionou:

1. **Verifique os logs completos** no Appwrite Console
2. **Teste localmente** primeiro: `npm install && npm run build`
3. **Compare com exemplo funcional** da documentação
4. **Abra uma issue** no GitHub com:
   - Logs completos do erro
   - Conteúdo do `package.json`
   - Saída de `tar -tzf balance-sync.tar.gz`
   - Versão do Node.js local

## 📚 Recursos

- [Appwrite Functions Troubleshooting](https://appwrite.io/docs/products/functions/troubleshooting)
- [Node.js Runtime](https://appwrite.io/docs/products/functions/runtimes#node)
- [Deployment Guide](./DEPLOYMENT.md)
- [FAQ](./FAQ.md)

---

**Última atualização**: Janeiro 2024
