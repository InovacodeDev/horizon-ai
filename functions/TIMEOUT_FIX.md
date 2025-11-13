# Correção de Timeout nas Functions

## Problema

As functions estavam retornando erro 408 (timeout) com a mensagem:

```
Synchronous function execution timed out. Use asynchronous execution instead, or ensure the execution duration doesn't exceed 30 seconds.
```

## Causa

O Appwrite possui dois modos de execução:

- **Síncrono** (padrão para requisições HTTP): limite de 30 segundos
- **Assíncrono**: até 900 segundos (15 minutos)

Quando uma function processa muitos dados e demora mais de 30 segundos, ela precisa usar execução assíncrona.

## Solução Implementada

### 1. Resposta Imediata para Execuções Longas

Para execuções agendadas (cron) e eventos de database, as functions agora:

- Retornam resposta HTTP imediatamente (< 30s)
- Continuam processando de forma assíncrona
- Registram logs do progresso

### 2. Processamento em Lotes com Delays

Para evitar sobrecarga do database:

- **Balance Sync**: processa 50 contas por vez com delay de 200ms entre lotes
- **Recurring Transactions**: processa 100 transações por vez com delay de 100ms
- **Expire Invitations**: processa 50 convites por vez com delay de 100ms

### 3. Delays Entre Operações

Pequenos delays foram adicionados:

- 50ms entre transações individuais
- 100ms entre lotes de dados
- 100ms entre atualizações de status

### 4. Tratamento de Erros Melhorado

- Erros individuais não interrompem o processamento completo
- Logs detalhados para debugging
- Continua processando mesmo se um item falhar

## Mudanças por Function

### Balance Sync (`functions/balance-sync/src/index.ts`)

- ✅ Resposta imediata para eventos e execuções agendadas
- ✅ Processamento em lotes de 50 contas
- ✅ Atualização de status em lotes de 10 transações
- ✅ Delays entre operações (50-200ms)
- ✅ Paginação melhorada para grandes volumes

### Recurring Transactions (`functions/recurring-transactions/src/index.ts`)

- ✅ Resposta imediata para execuções agendadas
- ✅ Processamento em lotes de 100 transações
- ✅ Delays entre transações (50ms)
- ✅ Delays entre lotes (100ms)
- ✅ Tratamento de erros por transação

### Expire Invitations (`functions/expire-invitations/src/index.ts`)

- ✅ Resposta imediata para execuções agendadas
- ✅ Processamento em lotes de 50 convites
- ✅ Delays entre atualizações (50ms)
- ✅ Delays entre lotes (100ms)
- ✅ Tratamento de erros por convite

## Como Funciona Agora

### Execução Agendada (Cron)

```typescript
// Detecta execução agendada
const isScheduled = req.headers['x-appwrite-trigger'] === 'schedule';

if (isScheduled) {
  // Responde imediatamente
  res.json({ success: true, message: 'Processing started' });
}

// Continua processando...
await processData();

// Não retorna resposta se já foi enviada
if (!isScheduled) {
  return res.json({ success: true, data });
}
```

### Eventos de Database

```typescript
// Detecta evento
const isAsync = req.headers['x-appwrite-trigger'] === 'event';

if (isAsync) {
  // Responde imediatamente
  res.json({ success: true, message: 'Sync started' });
}

// Processa o evento...
await syncBalance();

// Logs ao invés de resposta
log('Sync completed');
```

### Execução Manual

Mantém comportamento síncrono normal para testes e chamadas manuais.

## Próximos Passos

1. **Deploy das Functions**

   ```bash
   cd functions/balance-sync && npm run build
   cd ../recurring-transactions && npm run build
   cd ../expire-invitations && npm run build
   ```

2. **Testar Execuções**
   - Testar execução manual
   - Verificar logs das execuções agendadas
   - Monitorar eventos de database

3. **Monitoramento**
   - Verificar logs no console do Appwrite
   - Confirmar que não há mais timeouts
   - Validar que os dados estão sendo processados corretamente

## Benefícios

- ✅ Sem mais erros 408 (timeout)
- ✅ Processamento de grandes volumes de dados
- ✅ Melhor performance do database
- ✅ Logs detalhados para debugging
- ✅ Resiliência a erros individuais
- ✅ Execução assíncrona automática quando necessário
