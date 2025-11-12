# Guia de Deploy da Função Balance Sync

Este guia detalha o processo completo de deploy da função Balance Sync no Appwrite.

## Pré-requisitos

- Conta no Appwrite Cloud ou instância self-hosted
- Appwrite CLI instalado (opcional, mas recomendado)
- Node.js 20.x ou superior

## Método 1: Deploy via Appwrite Console (Recomendado)

### Passo 1: Preparar o Código

```bash
cd functions/balance-sync
npm install
npm run build
```

### Passo 2: Criar Arquivo de Deploy

```bash
# Criar arquivo tar.gz com o código
# IMPORTANTE: Os arquivos devem estar na raiz do tar.gz
tar -czf balance-sync.tar.gz src/ package.json tsconfig.json

# Verificar estrutura do arquivo (opcional)
tar -tzf balance-sync.tar.gz | head -10
# Deve mostrar:
# src/
# src/main.ts
# package.json
# tsconfig.json
```

### Passo 3: Criar a Função no Console

1. Acesse o [Appwrite Console](https://cloud.appwrite.io)
2. Selecione seu projeto
3. Vá em **Functions** no menu lateral
4. Clique em **Create Function**
5. Preencha:
   - **Function ID**: `balance-sync` (ou deixe gerar automaticamente)
   - **Name**: Balance Sync
   - **Runtime**: Node.js 20.x
   - **Entrypoint**: `src/main.ts`
   - **Build Commands**: `npm install && npm run build`
   - **Execute Access**: Server (API Key)

### Passo 4: Configurar Variáveis de Ambiente

Na aba **Settings** da função, adicione:

| Key                    | Value                          | Description                               |
| ---------------------- | ------------------------------ | ----------------------------------------- |
| `APPWRITE_ENDPOINT`    | `https://cloud.appwrite.io/v1` | Endpoint do Appwrite                      |
| `APPWRITE_DATABASE_ID` | Seu Database ID                | ID do banco de dados                      |
| `APPWRITE_API_KEY`     | Sua API Key                    | API Key com permissões de leitura/escrita |

**Importante**: A API Key deve ter as seguintes permissões:

- `databases.read`
- `databases.write`

### Passo 5: Configurar Triggers

#### Eventos de Database

Na aba **Settings** > **Events**, adicione:

```
databases.*.collections.transactions.documents.*.create
databases.*.collections.transactions.documents.*.update
databases.*.collections.transactions.documents.*.delete
```

Isso fará a função executar automaticamente quando transações forem criadas, editadas ou removidas.

#### Schedule (Execução Diária)

Na aba **Settings** > **Schedule**, configure:

- **Cron Expression**: `0 20 * * *`
- **Timezone**: `America/Sao_Paulo` (ou seu timezone)

Isso executará a função diariamente às 20:00 para processar transações futuras.

### Passo 6: Deploy

1. Na aba **Deployments**, clique em **Create Deployment**
2. Faça upload do arquivo `balance-sync.tar.gz`
3. Aguarde o build completar (pode levar alguns minutos)
4. Quando o status mudar para **Ready**, a função está pronta

### Passo 7: Testar

#### Teste Manual

1. Vá na aba **Execute**
2. Configure o payload:
   ```json
   {
     "userId": "seu-user-id-aqui"
   }
   ```
3. Clique em **Execute**
4. Verifique os logs e o resultado

#### Teste de Evento

1. Crie uma nova transação no banco de dados
2. Vá na aba **Executions** da função
3. Verifique se uma nova execução foi criada automaticamente
4. Verifique os logs para confirmar que o saldo foi atualizado

## Método 2: Deploy via Appwrite CLI

### Passo 1: Instalar Appwrite CLI

```bash
npm install -g appwrite-cli
```

### Passo 2: Login

```bash
appwrite login
```

### Passo 3: Inicializar Projeto

```bash
cd functions/balance-sync
appwrite init function
```

Siga as instruções:

- **Project ID**: Seu project ID
- **Function ID**: `balance-sync`
- **Function Name**: Balance Sync
- **Runtime**: Node.js 20.x
- **Entrypoint**: `src/main.ts`

### Passo 4: Configurar appwrite.json

Edite o arquivo `appwrite.json` gerado:

```json
{
  "projectId": "seu-project-id",
  "functions": [
    {
      "id": "balance-sync",
      "name": "Balance Sync",
      "runtime": "node-20.0",
      "entrypoint": "src/main.ts",
      "execute": ["role:all"],
      "events": [
        "databases.*.collections.transactions.documents.*.create",
        "databases.*.collections.transactions.documents.*.update",
        "databases.*.collections.transactions.documents.*.delete"
      ],
      "schedule": "0 20 * * *",
      "timeout": 900,
      "enabled": true,
      "logging": true,
      "path": ".",
      "vars": {
        "APPWRITE_ENDPOINT": "https://cloud.appwrite.io/v1",
        "APPWRITE_DATABASE_ID": "seu-database-id"
      }
    }
  ]
}
```

**Nota**: Não coloque a API Key no arquivo JSON. Configure-a manualmente no console por segurança.

### Passo 5: Deploy

```bash
appwrite deploy function
```

Selecione a função `balance-sync` quando solicitado.

### Passo 6: Configurar API Key

1. Acesse o Appwrite Console
2. Vá em **Functions** > **Balance Sync** > **Settings**
3. Adicione a variável `APPWRITE_API_KEY` manualmente

## Verificação Pós-Deploy

### 1. Verificar Status

No Appwrite Console:

- **Functions** > **Balance Sync** > **Deployments**
- Status deve estar **Ready**

### 2. Verificar Logs

- **Functions** > **Balance Sync** > **Executions**
- Clique em uma execução para ver logs detalhados

### 3. Verificar Triggers

- **Functions** > **Balance Sync** > **Settings**
- Confirme que eventos e schedule estão configurados

### 4. Teste Completo

1. **Teste Manual**:

   ```bash
   curl -X POST \
     https://cloud.appwrite.io/v1/functions/balance-sync/executions \
     -H "X-Appwrite-Project: seu-project-id" \
     -H "X-Appwrite-Key: sua-api-key" \
     -H "Content-Type: application/json" \
     -d '{"userId": "seu-user-id"}'
   ```

2. **Teste de Evento**:
   - Crie uma transação via API ou Console
   - Verifique se a função executou automaticamente

3. **Teste de Schedule**:
   - Aguarde a execução às 20:00
   - Ou force uma execução manual do schedule no Console

## Troubleshooting

### Build Falhou

**Erro 1**: `No package.json found in /usr/local/build`

**Causa**: Estrutura incorreta do arquivo tar.gz

**Solução**:

```bash
cd functions/balance-sync

# Remover arquivo antigo
rm -f balance-sync.tar.gz

# Criar novo arquivo com estrutura correta
tar -czf balance-sync.tar.gz src/ package.json tsconfig.json

# Verificar estrutura (os arquivos devem estar na raiz)
tar -tzf balance-sync.tar.gz | head -10
```

**Erro 2**: `npm install failed`

**Solução**:

1. Verifique se `package.json` está correto
2. Verifique se todas as dependências estão disponíveis
3. Tente fazer build local primeiro: `npm install && npm run build`

### Função Não Executa

**Erro**: Função não executa nos eventos

**Solução**:

1. Verifique se os eventos estão configurados corretamente
2. Verifique se a collection `transactions` existe
3. Verifique logs de erro no Console

### Erro de Permissão

**Erro**: `Insufficient permissions`

**Solução**:

1. Verifique se a API Key tem permissões corretas
2. Crie uma nova API Key com scopes: `databases.read`, `databases.write`
3. Atualize a variável de ambiente `APPWRITE_API_KEY`

### Timeout

**Erro**: `Function execution timeout`

**Solução**:

1. Aumente o timeout nas configurações da função (máximo 900s)
2. Otimize o código para processar menos dados por vez
3. Considere dividir em múltiplas execuções

## Monitoramento

### Métricas Importantes

1. **Taxa de Sucesso**: Deve estar próxima de 100%
2. **Tempo de Execução**: Deve ser < 30s para eventos, < 5min para schedule
3. **Erros**: Monitore erros recorrentes

### Alertas Recomendados

Configure alertas para:

- Taxa de erro > 5%
- Tempo de execução > 60s
- Falhas consecutivas > 3

## Atualizações

### Atualizar Código

1. Modifique o código em `src/main.ts`
2. Teste localmente
3. Crie novo deployment:
   ```bash
   cd functions/balance-sync
   npm run build
   tar -czf balance-sync.tar.gz src/ package.json tsconfig.json
   ```
4. Faça upload no Console ou use CLI: `appwrite deploy function`

### Rollback

Se algo der errado:

1. Vá em **Deployments**
2. Encontre o deployment anterior que funcionava
3. Clique em **Activate** para voltar para aquela versão

## Melhores Práticas

1. **Sempre teste localmente** antes de fazer deploy
2. **Use variáveis de ambiente** para configurações sensíveis
3. **Monitore logs** regularmente
4. **Configure alertas** para erros críticos
5. **Documente mudanças** em cada deployment
6. **Mantenha backups** dos deployments funcionais
7. **Teste em ambiente de staging** antes de produção

## Recursos Adicionais

- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite CLI Documentation](https://appwrite.io/docs/command-line)
- [Node.js Runtime Documentation](https://appwrite.io/docs/products/functions/runtimes)
- [Cron Expression Generator](https://crontab.guru/)
