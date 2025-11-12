# Balance Sync - Guia Rápido

Guia rápido para fazer deploy da função Balance Sync em 5 minutos.

## ⚡ Deploy Rápido

### 1. Preparar o Código (1 min)

```bash
cd functions/balance-sync
./deploy.sh
```

Isso irá:

- ✅ Instalar dependências
- ✅ Compilar TypeScript
- ✅ Criar arquivo `balance-sync.tar.gz`

### 2. Criar Função no Appwrite (2 min)

1. Acesse [Appwrite Console](https://cloud.appwrite.io)
2. Vá em **Functions** > **Create Function**
3. Configure:
   - **Name**: `Balance Sync`
   - **Runtime**: `Node.js 20.x`
   - **Entrypoint**: `src/main.ts`
   - **Build Commands**: `npm install && npm run build`

### 3. Configurar Variáveis (1 min)

Na aba **Settings** > **Environment Variables**, adicione:

```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_DATABASE_ID=seu-database-id
APPWRITE_API_KEY=sua-api-key
```

**Como obter a API Key**:

1. Vá em **Settings** > **API Keys**
2. Clique em **Create API Key**
3. Nome: `Balance Sync Function`
4. Scopes: Marque `databases.read` e `databases.write`
5. Copie a chave gerada

### 4. Configurar Triggers (1 min)

#### Eventos (Sincronização em Tempo Real)

Na aba **Settings** > **Events**, adicione:

```
databases.*.collections.transactions.documents.*.create
databases.*.collections.transactions.documents.*.update
databases.*.collections.transactions.documents.*.delete
```

#### Schedule (Execução Diária)

Na aba **Settings** > **Schedule**:

- **Cron**: `0 20 * * *`
- **Timezone**: `America/Sao_Paulo`

### 5. Deploy (30 seg)

1. Vá na aba **Deployments**
2. Clique em **Create Deployment**
3. Faça upload do arquivo `balance-sync.tar.gz`
4. Aguarde o build completar

## ✅ Verificar

### Teste Manual

1. Vá na aba **Execute**
2. Payload:
   ```json
   {
     "userId": "seu-user-id"
   }
   ```
3. Clique em **Execute**
4. Verifique o resultado

### Teste Automático

1. Crie uma transação no banco de dados
2. Vá na aba **Executions**
3. Verifique se uma nova execução apareceu
4. Clique para ver os logs

## 🎯 Pronto!

A função está configurada e funcionando. Ela irá:

- ✅ Atualizar saldos automaticamente quando transações forem criadas/editadas/removidas
- ✅ Processar transações futuras diariamente às 20:00
- ✅ Ignorar transações futuras até chegarem na data
- ✅ Ignorar transações de cartão de crédito

## 📖 Próximos Passos

- [README.md](./README.md) - Documentação completa
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia detalhado de deploy
- [../docs/APPWRITE_FUNCTIONS.md](../../docs/APPWRITE_FUNCTIONS.md) - Guia completo de funções

## 🆘 Problemas?

### Build Falhou

```bash
cd functions/balance-sync
npm install
npm run build
```

Se funcionar localmente, o problema pode ser no Appwrite. Verifique os logs de build.

### Função Não Executa

1. Verifique se os triggers estão configurados
2. Verifique se as variáveis de ambiente estão corretas
3. Verifique se a API Key tem as permissões corretas

### Saldo Incorreto

Execute manualmente a função com o userId para recalcular:

```json
{
  "userId": "seu-user-id"
}
```

## 💡 Dicas

- **Logs**: Sempre verifique os logs em **Executions** para debug
- **Teste**: Teste sempre após fazer deploy
- **Monitore**: Configure alertas para erros
- **Backup**: Mantenha backups dos deployments funcionais
