# Appwrite Functions - Guia Completo

Este documento explica como as funções Appwrite são usadas no projeto Horizon AI para automatizar tarefas e manter a integridade dos dados.

## Visão Geral

As funções Appwrite são executadas no servidor e podem ser acionadas por:

- **Eventos de Database**: Quando dados são criados, atualizados ou removidos
- **Schedule (Cron)**: Execução periódica em horários específicos
- **HTTP Requests**: Chamadas diretas via API
- **Manual**: Execução manual no Console

## Funções Implementadas

### 1. Balance Sync

**Localização**: `functions/balance-sync/`

**Objetivo**: Manter o saldo das contas sempre atualizado baseado nas transações.

**Como Funciona**:

1. **Sincronização em Tempo Real** (via eventos):
   - Quando uma transação é criada → atualiza saldo da conta
   - Quando uma transação é editada → recalcula saldo da conta
   - Quando uma transação é removida → recalcula saldo da conta

2. **Processamento Diário** (via schedule):
   - Executa às 20:00 todos os dias
   - Processa transações que eram futuras mas chegaram na data de hoje
   - Atualiza saldos das contas afetadas

**Regras de Negócio**:

- ✅ Transações com `direction: 'in'` aumentam o saldo
- ✅ Transações com `direction: 'out'` diminuem o saldo
- ❌ Transações futuras são ignoradas até chegarem na data
- ❌ Transações de cartão de crédito são ignoradas (gerenciadas separadamente)

**Exemplo de Fluxo**:

```
1. Usuário cria transação de R$ 100,00 (receita) para hoje
   → Função executa automaticamente
   → Saldo da conta aumenta R$ 100,00

2. Usuário cria transação de R$ 50,00 (despesa) para amanhã
   → Função executa mas ignora (transação futura)
   → Saldo não muda

3. Amanhã às 20:00
   → Função executa via schedule
   → Detecta transação de R$ 50,00 que chegou na data
   → Saldo da conta diminui R$ 50,00
```

## Integração com o Código Next.js

### Server Actions

O código Next.js já está integrado com a lógica de sincronização de saldo através de Server Actions:

```typescript
// actions/transaction.actions.ts

// Processa transações futuras manualmente
export async function processDueTransactionsAction(): Promise<{ processed: number }> {
  const user = await requireAuth();
  const balanceSyncService = new BalanceSyncService();
  const processed = await balanceSyncService.processDueTransactions(user.sub);

  if (processed > 0) {
    revalidatePath('/transactions');
    revalidatePath('/overview');
    revalidatePath('/accounts');
  }

  return { processed };
}

// Recalcula todos os saldos do zero
export async function reprocessAllBalancesAction(): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth();
  const balanceSyncService = new BalanceSyncService();
  await balanceSyncService.recalculateAllBalances(user.sub);

  revalidatePath('/transactions');
  revalidatePath('/overview');
  revalidatePath('/accounts');

  return {
    success: true,
    message: 'Saldos recalculados com sucesso!',
  };
}
```

### Serviço de Sincronização

O serviço `BalanceSyncService` implementa a lógica de sincronização:

```typescript
// lib/services/balance-sync.service.ts

export class BalanceSyncService {
  // Sincroniza saldo de uma conta específica
  async syncAccountBalance(accountId: string): Promise<number>;

  // Processa transações futuras que chegaram na data
  async processDueTransactions(userId: string): Promise<number>;

  // Recalcula todos os saldos de um usuário
  async recalculateAllBalances(userId: string): Promise<void>;
}
```

## Quando Usar Função vs Server Action

### Use Função Appwrite quando:

✅ Precisa executar automaticamente em eventos de database
✅ Precisa executar em horários específicos (schedule)
✅ Precisa processar dados de múltiplos usuários
✅ Precisa executar independente de requisições HTTP
✅ Precisa garantir execução mesmo se o servidor Next.js estiver offline

### Use Server Action quando:

✅ Precisa executar sob demanda do usuário
✅ Precisa acesso ao contexto de autenticação do Next.js
✅ Precisa revalidar cache do Next.js
✅ Precisa resposta imediata para o usuário
✅ Precisa lógica específica da aplicação

### Abordagem Híbrida (Recomendado)

A melhor abordagem é usar ambos:

1. **Função Appwrite**: Automação e processamento em background
2. **Server Action**: Interface para o usuário e casos específicos

Exemplo:

```typescript
// Função Appwrite: Executa automaticamente às 20:00
// → Processa transações futuras de TODOS os usuários

// Server Action: Usuário clica em "Processar Agora"
// → Processa transações futuras apenas do usuário atual
// → Retorna feedback imediato
```

## Configuração e Deploy

### Pré-requisitos

1. Conta no Appwrite Cloud ou instância self-hosted
2. API Key com permissões:
   - `databases.read`
   - `databases.write`

### Passo a Passo

1. **Preparar o código**:

   ```bash
   cd functions/balance-sync
   ./deploy.sh
   ```

2. **Criar função no Appwrite Console**:
   - Functions > Create Function
   - Nome: Balance Sync
   - Runtime: Node.js 20.x
   - Entrypoint: `src/main.ts`

3. **Configurar variáveis de ambiente**:

   ```
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_DATABASE_ID=seu-database-id
   APPWRITE_API_KEY=sua-api-key
   ```

4. **Configurar triggers**:
   - **Eventos**:
     ```
     databases.*.collections.transactions.documents.*.create
     databases.*.collections.transactions.documents.*.update
     databases.*.collections.transactions.documents.*.delete
     ```
   - **Schedule**: `0 20 * * *` (20:00 diariamente)

5. **Deploy**:
   - Upload do arquivo `balance-sync.tar.gz`
   - Aguardar build completar

6. **Testar**:
   - Criar uma transação
   - Verificar logs da função
   - Confirmar que saldo foi atualizado

### Documentação Detalhada

Para instruções completas de deploy, consulte:

- [functions/balance-sync/DEPLOYMENT.md](../functions/balance-sync/DEPLOYMENT.md)

## Monitoramento

### Logs

Acesse logs no Appwrite Console:

```
Functions > Balance Sync > Executions
```

Logs importantes:

```
[BalanceSync] Syncing account {accountId}
[BalanceSync] - Total transactions: {count}
[BalanceSync] - Final balance: {balance}
[BalanceSync] Account {accountId} updated successfully
```

### Métricas

Monitore:

- **Taxa de Sucesso**: Deve estar > 95%
- **Tempo de Execução**:
  - Eventos: < 5s
  - Schedule: < 5min
- **Frequência**:
  - Eventos: Conforme transações
  - Schedule: 1x por dia às 20:00

### Alertas

Configure alertas para:

- Taxa de erro > 5%
- Timeout frequente
- Falhas consecutivas > 3

## Troubleshooting

### Saldo Incorreto

**Problema**: Saldo da conta não está correto

**Solução**:

1. Execute manualmente a função com o userId
2. Ou use a Server Action:
   ```typescript
   await reprocessAllBalancesAction();
   ```

### Função Não Executa

**Problema**: Função não executa automaticamente

**Solução**:

1. Verifique triggers configurados
2. Verifique variáveis de ambiente
3. Verifique permissões da API Key
4. Verifique logs de erro no Console

### Transações Futuras Não Processadas

**Problema**: Transações futuras não são processadas quando chegam na data

**Solução**:

1. Verifique schedule configurado: `0 20 * * *`
2. Verifique timezone correto
3. Verifique logs da execução agendada
4. Execute manualmente se necessário

### Timeout

**Problema**: Função atinge timeout

**Solução**:

1. Aumente timeout nas configurações (máximo 900s)
2. Otimize código para processar menos dados
3. Use paginação adequada

## Melhores Práticas

### 1. Idempotência

Garanta que a função pode ser executada múltiplas vezes sem efeitos colaterais:

```typescript
// ✅ Bom: Recalcula do zero
const newBalance = calculateBalanceFromTransactions();

// ❌ Ruim: Incrementa valor existente
const newBalance = currentBalance + transactionAmount;
```

### 2. Tratamento de Erros

Sempre trate erros e retorne status apropriado:

```typescript
try {
  await syncAccountBalance(accountId);
  return res.json({ success: true });
} catch (error) {
  log('Error:', error);
  return res.json({ success: false, error: error.message }, 500);
}
```

### 3. Logging

Use logs para debug e monitoramento:

```typescript
log(`Processing account ${accountId}`);
log(`Found ${transactions.length} transactions`);
log(`New balance: ${newBalance}`);
```

### 4. Performance

Otimize para grandes volumes:

```typescript
// Use paginação
const limit = 500;
let offset = 0;

while (true) {
  const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(limit), Query.offset(offset)]);

  if (result.documents.length === 0) break;

  // Processar documentos

  offset += limit;
}
```

### 5. Segurança

- Nunca exponha API Keys no código
- Use variáveis de ambiente
- Valide dados de entrada
- Limite acesso à função

## Próximos Passos

### Funções Futuras

Considere implementar:

1. **Credit Card Bill Processor**
   - Gera faturas de cartão de crédito automaticamente
   - Executa mensalmente

2. **Recurring Transaction Creator**
   - Cria transações recorrentes automaticamente
   - Executa diariamente

3. **Budget Alert**
   - Envia alertas quando orçamento é excedido
   - Executa em tempo real

4. **Data Cleanup**
   - Remove dados antigos ou temporários
   - Executa semanalmente

### Melhorias

1. **Retry Logic**: Implementar retry automático em caso de falha
2. **Dead Letter Queue**: Armazenar falhas para análise
3. **Metrics**: Exportar métricas para ferramentas de monitoramento
4. **Testing**: Adicionar testes automatizados

## Recursos

- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Functions Quick Start](https://appwrite.io/docs/products/functions/quick-start)
- [Appwrite Functions Runtimes](https://appwrite.io/docs/products/functions/runtimes)
- [Cron Expression Generator](https://crontab.guru/)

## Suporte

Para dúvidas ou problemas:

1. Consulte a documentação oficial do Appwrite
2. Verifique os logs de execução no Console
3. Revise a configuração da função
4. Teste localmente antes de fazer deploy
