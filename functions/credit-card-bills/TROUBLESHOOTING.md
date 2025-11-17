# Troubleshooting: Credit Card Bills Function

## Erro: "Timed out waiting for runtime. Error Code: 400"

### Possíveis Causas e Soluções

#### 1. ✅ Variáveis de Ambiente Faltando

**Problema:** A função não consegue inicializar porque falta configuração.

**Solução:** Verifique no Appwrite Console se estas variáveis estão configuradas:

- `APPWRITE_ENDPOINT` (ex: https://nyc.cloud.appwrite.io/v1)
- `APPWRITE_DATABASE_ID` (ex: horizon_ai_db ou seu database ID específico)

As variáveis `APPWRITE_FUNCTION_PROJECT_ID` e `APPWRITE_API_KEY` são injetadas automaticamente pelo Appwrite.

#### 2. ✅ Timeout Muito Baixo

**Problema:** A função precisa de mais tempo para processar.

**Solução:** No Appwrite Console:

- Vá em Functions → credit-card-bills → Settings
- Configure Timeout: **900 segundos** (15 minutos)

#### 3. ✅ Schedule Inválido

**Problema:** O formato do cron está incorreto.

**Solução:** Verifique se o schedule está configurado como:

```
*/5 * * * *
```

(Executa a cada 5 minutos)

#### 4. ✅ Problemas de Build

**Problema:** A função não foi compilada corretamente.

**Solução:**

```bash
cd functions/credit-card-bills
npm install
npm run build
```

Depois faça o deploy novamente.

#### 5. ✅ Logs para Diagnóstico

**Como ver os logs:**

1. Acesse Appwrite Console
2. Vá em Functions → credit-card-bills
3. Clique na aba "Executions"
4. Clique na execução mais recente
5. Veja os logs detalhados

**O que procurar nos logs:**

- Mensagem inicial: "Credit Card Bills function triggered (scheduled execution)"
- Database ID sendo usado
- Endpoint sendo usado
- Erros específicos de conexão ou permissão

#### 6. ✅ Teste Manual

Para testar a função manualmente sem esperar o schedule:

1. No Appwrite Console, vá em Functions → credit-card-bills
2. Clique em "Execute"
3. Deixe o body vazio (a função não precisa de payload no modo schedule)
4. Clique em "Execute"
5. Veja os logs da execução

#### 7. ✅ Verificar Permissões do Banco

**Problema:** A API key não tem permissão para acessar o banco.

**Solução:**

1. Vá em Settings → API Keys
2. Verifique se a key tem permissão para:
   - `databases.read`
   - `databases.write`

#### 8. ✅ Coluna sync_status Faltando

**Problema:** A migration não foi executada e a coluna `sync_status` não existe.

**Solução:**

```bash
npm run migrate:up
```

Ou execute a migration manualmente no Appwrite Console.

## Correções Implementadas

### ✅ Versão Atual (Corrigida)

A função agora tem:

- ✅ Validação de variáveis de ambiente no início
- ✅ Tratamento para quando não há transações
- ✅ Tratamento para quando não há bills para processar
- ✅ Logs detalhados em cada etapa
- ✅ Medição de tempo de execução
- ✅ Stack trace completo em caso de erro

### Melhorias de Logs

Agora os logs mostram:

```
Credit Card Bills function triggered (scheduled execution)
Database ID: horizon_ai_db
Endpoint: https://nyc.cloud.appwrite.io/v1
[CreditCardBills] Starting bills synchronization
[CreditCardBills] Found X pending transactions
[CreditCardBills] Processing Y credit cards
[CreditCardBills] Processing credit card Z with N pending transactions
...
Function completed successfully in Xms
```

## Próximos Passos

1. **Verifique as variáveis de ambiente** no Appwrite Console
2. **Faça um teste manual** para ver os logs detalhados
3. **Compartilhe os logs** se o erro persistir para diagnóstico mais específico
4. **Verifique se a migration foi executada** e a coluna sync_status existe

## Comandos Úteis

### Ver logs em tempo real (local)

```bash
cd functions/credit-card-bills
npm run dev
```

### Fazer deploy via CLI

```bash
appwrite functions update \
  --functionId credit-card-bills \
  --execute any \
  --schedule "*/5 * * * *" \
  --timeout 900
```

### Testar localmente

```bash
cd functions/credit-card-bills
npm run test
```
