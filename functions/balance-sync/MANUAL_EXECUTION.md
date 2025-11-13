# Execução Manual da Função Balance Sync

Este documento descreve como executar manualmente a função Balance Sync para diferentes cenários.

## 📋 Pré-requisitos

- Função Balance Sync deployada no Appwrite
- ID da função (encontrado no Appwrite Console)
- API Key com permissões de execução
- User ID do usuário que deseja processar

## 🎯 Cenários de Uso

### 1. Processamento Normal (Transações Vencidas)

Processa apenas transações que chegaram na data de hoje ou passado.

**Quando usar:**

- Execução diária automática (já configurada via schedule)
- Forçar processamento de transações vencidas manualmente

**Payload:**

```json
{
  "userId": "68fbd3a700145f22609d"
}
```

### 2. Reprocessamento Completo (Todas as Transações)

Recalcula o saldo de TODAS as contas do usuário do zero, baseado em todas as transações.

**Quando usar:**

- Corrigir inconsistências de saldo
- Após migrações de dados
- Após correções manuais no banco de dados
- Manutenção preventiva

**Payload:**

```json
{
  "userId": "68fbd3a700145f22609d",
  "reprocessAll": true
}
```

## 🚀 Métodos de Execução

### Via Appwrite Console (Recomendado)

1. Acesse o Appwrite Console
2. Navegue até **Functions** > **balance-sync**
3. Clique em **Execute**
4. Cole o payload desejado (veja exemplos abaixo)
5. Clique em **Execute**
6. Aguarde a execução completar
7. Verifique os logs para confirmar sucesso

**Exemplo de Payload no Console:**

Para processamento normal:

```json
{
  "userId": "68fbd3a700145f22609d"
}
```

Para reprocessamento completo:

```json
{
  "userId": "68fbd3a700145f22609d",
  "reprocessAll": true
}
```

**Dica**: Você pode encontrar o `userId` no Appwrite Console em **Auth** > **Users** > selecione o usuário > copie o ID

### Via API REST

```bash
curl -X POST \
  https://cloud.appwrite.io/v1/functions/[FUNCTION_ID]/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: [PROJECT_ID]" \
  -H "X-Appwrite-Key: [API_KEY]" \
  -d '{
    "userId": "68fbd3a700145f22609d",
    "reprocessAll": true
  }'
```

### Via SDK Node.js

```typescript
import { Client, Functions } from 'node-appwrite';

const client = new Client().setEndpoint('https://cloud.appwrite.io/v1').setProject('[PROJECT_ID]').setKey('[API_KEY]');

const functions = new Functions(client);

// Processamento normal
const execution1 = await functions.createExecution('[FUNCTION_ID]', JSON.stringify({ userId: '68fbd3a700145f22609d' }));

// Reprocessamento completo
const execution2 = await functions.createExecution(
  '[FUNCTION_ID]',
  JSON.stringify({
    userId: '68fbd3a700145f22609d',
    reprocessAll: true,
  }),
);

console.log('Execution ID:', execution2.$id);
console.log('Status:', execution2.status);
```

### Via SDK Web (Client-Side)

```typescript
import { Client, Functions } from 'appwrite';

const client = new Client().setEndpoint('https://cloud.appwrite.io/v1').setProject('[PROJECT_ID]');

const functions = new Functions(client);

// Reprocessamento completo
const execution = await functions.createExecution(
  '[FUNCTION_ID]',
  JSON.stringify({
    userId: '68fbd3a700145f22609d',
    reprocessAll: true,
  }),
);

console.log('Execution started:', execution.$id);
```

## 📊 Resposta da Função

### Sucesso

```json
{
  "success": true,
  "message": "All transactions reprocessed successfully",
  "accountsProcessed": 3,
  "reprocessAll": true
}
```

### Erro

```json
{
  "success": false,
  "error": "userId is required for manual execution"
}
```

## 🔍 Verificando Logs

1. Acesse o Appwrite Console
2. Navegue até **Functions** > **balance-sync** > **Executions**
3. Clique na execução desejada
4. Visualize os logs detalhados

**Logs esperados para reprocessamento:**

```
[BalanceSync] Running manual balance sync
[BalanceSync] reprocessAll: true
[BalanceSync] Reprocessing ALL transactions for all user accounts
[BalanceSync] Found 3 accounts to reprocess
[BalanceSync] Reprocessing account: 68fbd3a700145f22609d
[BalanceSync] Syncing account 68fbd3a700145f22609d
[BalanceSync] - Total transactions: 45
[BalanceSync] - Final balance: 15000.50
[BalanceSync] Account 68fbd3a700145f22609d updated successfully
[BalanceSync] Reprocessing completed. Total accounts processed: 3
```

## ⚠️ Considerações Importantes

### Performance

- **Processamento Normal**: Rápido, processa apenas transações vencidas
- **Reprocessamento Completo**: Mais lento, processa todas as transações de todas as contas

### Frequência

- **Processamento Normal**: Pode ser executado quantas vezes necessário
- **Reprocessamento Completo**: Use apenas quando necessário (manutenção, correções)

### Impacto

- A função adiciona pequenos delays entre processamentos para evitar sobrecarga
- Transações de cartão de crédito são sempre ignoradas
- Transações futuras são sempre ignoradas no cálculo do saldo

## 🛠️ Troubleshooting

### Erro: "userId is required"

**Causa**: Payload não contém o campo `userId`

**Solução**: Adicione o campo `userId` no payload:

```json
{
  "userId": "seu-user-id"
}
```

### Saldo ainda incorreto após reprocessamento

**Possíveis causas:**

1. Transações com datas futuras (serão processadas quando chegarem na data)
2. Transações de cartão de crédito (gerenciadas separadamente)
3. Transações criadas após o reprocessamento

**Solução**: Execute o reprocessamento novamente ou verifique as transações manualmente

### Timeout na execução

**Causa**: Muitas transações para processar

**Solução**: A função já está otimizada com delays. Se persistir, considere:

1. Aumentar o timeout da função no Appwrite Console
2. Processar contas individualmente usando a action `reprocessAccountBalanceAction`

## 📚 Referências

- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Functions Executions](https://appwrite.io/docs/products/functions/executions)
- [Balance Sync README](./README.md)
- [Balance Sync Architecture](./ARCHITECTURE.md)
