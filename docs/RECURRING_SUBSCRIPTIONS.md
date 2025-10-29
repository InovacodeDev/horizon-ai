# Assinaturas Recorrentes - Cartão de Crédito

## Resumo

Sistema de assinaturas recorrentes para transações de cartão de crédito que cria automaticamente transações mensais em um dia específico do mês.

## Funcionalidades

### 1. Criar Assinatura Recorrente

Ao criar uma transação de cartão de crédito, você pode marcar a opção "Assinatura Recorrente" e escolher o dia do mês em que a cobrança deve ocorrer.

**Campos:**

- `amount`: Valor da assinatura
- `category`: Categoria da transação
- `description`: Descrição (ex: "Netflix", "Spotify")
- `merchant`: Estabelecimento
- `recurring_day`: Dia do mês (1-31) em que a cobrança ocorre
- `start_date`: Data de início da assinatura

### 2. Processamento Automático

Um cron job roda diariamente às 00:00 UTC e:

1. Busca todas as transações com `is_recurring: true`
2. Verifica se o dia atual corresponde ao `recurring_day`
3. Cria uma nova transação para o mês atual (se ainda não existir)

## Estrutura de Dados

### Transaction com Recorrência

```typescript
{
  amount: 49.90,
  type: 'expense',
  category: 'Serviços',
  description: 'Netflix Premium',
  merchant: 'Netflix',
  date: '2025-11-15', // Dia 15 do mês
  is_recurring: true,
  data: JSON.stringify({
    recurring_pattern: {
      frequency: 'monthly',
      interval: 1,
      endDate: undefined // Sem data de término
    }
  }),
  credit_card_id: 'card_id',
  account_id: 'account_id',
  user_id: 'user_id',
  status: 'completed'
}
```

## API Endpoints

### POST /api/credit-cards/recurring

Cria uma nova assinatura recorrente.

**Request Body:**

```json
{
  "credit_card_id": "card_123",
  "amount": 49.9,
  "category": "Serviços",
  "description": "Netflix Premium",
  "merchant": "Netflix",
  "account_id": "account_123",
  "recurring_day": 15,
  "start_date": "2025-10-29"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transaction": { ... },
    "recurring_day": 15,
    "next_charge_date": "2025-11-15T00:00:00.000Z",
    "message": "Assinatura criada com sucesso. Próxima cobrança: dia 15 de cada mês"
  }
}
```

### GET /api/cron/process-recurring

Processa todas as assinaturas recorrentes (chamado automaticamente pelo cron).

**Headers:**

```
Authorization: Bearer <CRON_SECRET>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "processed_count": 5,
    "error_count": 0,
    "processed_transactions": [
      {
        "original_id": "trans_123",
        "new_id": "trans_456",
        "amount": 49.9,
        "date": "2025-11-15T00:00:00.000Z"
      }
    ],
    "errors": [],
    "date": "2025-11-15T00:00:00.000Z",
    "current_day": 15
  }
}
```

## Configuração do Cron Job

### Vercel

O cron job está configurado em `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-recurring",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule:** Diariamente às 00:00 UTC (21:00 horário de Brasília)

### Variáveis de Ambiente

Adicione no `.env.local` e nas configurações do Vercel:

```env
CRON_SECRET=seu_secret_aqui_para_proteger_o_endpoint
```

### Teste Local

Para testar localmente:

```bash
# Adicione o header de autorização
curl -H "Authorization: Bearer seu_secret_aqui" http://localhost:3000/api/cron/process-recurring
```

## Comportamento

### Criação da Primeira Transação

Quando você cria uma assinatura:

1. Se o `recurring_day` já passou no mês atual, a primeira transação é criada para o próximo mês
2. Se o `recurring_day` ainda não passou, a primeira transação é criada para o mês atual

**Exemplo:**

- Hoje: 29/10/2025
- Recurring day: 15
- Primeira transação: 15/11/2025 (próximo mês)

### Processamento Mensal

Todo dia, o cron job:

1. Verifica se hoje é o dia de alguma assinatura
2. Verifica se já existe uma transação para este mês
3. Se não existir, cria uma nova transação

### Prevenção de Duplicatas

O sistema verifica se já existe uma transação no mês atual com:

- Mesmo `user_id`
- Mesmo `credit_card_id`
- Mesma `category`
- Mesmo `merchant`
- Mesmo `amount`
- Data dentro do mês atual

## Gerenciamento de Assinaturas

### Cancelar Assinatura

Para cancelar uma assinatura, você pode:

1. **Deletar a transação original** (com `is_recurring: true`)
2. **Atualizar a transação** para `is_recurring: false`

```typescript
// Opção 1: Deletar
await transactionService.deleteTransaction(transactionId);

// Opção 2: Desativar
await transactionService.updateTransaction(transactionId, {
  isRecurring: false,
});
```

### Pausar Temporariamente

Atualize a transação para `is_recurring: false` e depois volte para `true` quando quiser reativar.

### Alterar Valor

Atualize o `amount` da transação original. As próximas cobranças usarão o novo valor.

```typescript
await transactionService.updateTransaction(transactionId, {
  amount: 59.9, // Novo valor
});
```

### Alterar Dia de Cobrança

Atualize a `date` da transação original para o novo dia desejado.

```typescript
// Mudar de dia 15 para dia 20
const newDate = new Date();
newDate.setDate(20);

await transactionService.updateTransaction(transactionId, {
  date: newDate.toISOString(),
});
```

## Exemplos de Uso

### Netflix (R$ 49,90 - Dia 15)

```typescript
const netflix = await fetch('/api/credit-cards/recurring', {
  method: 'POST',
  body: JSON.stringify({
    credit_card_id: 'card_123',
    amount: 49.9,
    category: 'Lazer',
    description: 'Netflix Premium',
    merchant: 'Netflix',
    account_id: 'account_123',
    recurring_day: 15,
    start_date: new Date().toISOString(),
  }),
});
```

### Spotify (R$ 21,90 - Dia 1)

```typescript
const spotify = await fetch('/api/credit-cards/recurring', {
  method: 'POST',
  body: JSON.stringify({
    credit_card_id: 'card_123',
    amount: 21.9,
    category: 'Lazer',
    description: 'Spotify Premium',
    merchant: 'Spotify',
    account_id: 'account_123',
    recurring_day: 1,
    start_date: new Date().toISOString(),
  }),
});
```

### Academia (R$ 150,00 - Dia 5)

```typescript
const gym = await fetch('/api/credit-cards/recurring', {
  method: 'POST',
  body: JSON.stringify({
    credit_card_id: 'card_123',
    amount: 150.0,
    category: 'Saúde',
    description: 'Mensalidade Academia',
    merchant: 'Smart Fit',
    account_id: 'account_123',
    recurring_day: 5,
    start_date: new Date().toISOString(),
  }),
});
```

## Monitoramento

### Logs

O cron job registra:

- Número de transações processadas
- Erros encontrados
- Data e hora da execução

### Verificar Execução

Acesse os logs do Vercel para ver as execuções do cron:

```
Vercel Dashboard > Project > Deployments > Functions > /api/cron/process-recurring
```

## Limitações

1. **Dias Inválidos**: Se o dia escolhido não existe no mês (ex: 31 em fevereiro), a transação não será criada
2. **Timezone**: O cron roda em UTC, considere o fuso horário ao escolher o dia
3. **Limite de Transações**: O cron processa até 1000 transações recorrentes por execução

## Melhorias Futuras

- [ ] Suporte para recorrência semanal/anual
- [ ] Data de término para assinaturas temporárias
- [ ] Notificações antes da cobrança
- [ ] Dashboard de gerenciamento de assinaturas
- [ ] Histórico de cobranças por assinatura
- [ ] Ajuste automático para dias inválidos (ex: 31 → último dia do mês)
