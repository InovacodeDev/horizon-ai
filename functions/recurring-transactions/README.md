# Recurring Transactions Function

Função Appwrite para processar transações recorrentes mensalmente.

## Funcionalidade

Esta função é executada automaticamente todo dia 1º de cada mês às 00:00 (UTC) e:

1. Busca todas as transações marcadas como `is_recurring: true`
2. Para cada transação recorrente, cria uma nova transação para o mês atual
3. Mantém o mesmo dia da transação original (ex: dia 10)
4. Copia todos os valores da transação original (valor, categoria, descrição, etc.)
5. Evita duplicatas verificando se já existe transação para o mês atual

## Campos Necessários na Collection `transactions`

A collection de transações deve ter os seguintes campos:

- `is_recurring` (boolean): Indica se a transação é recorrente
- `recurring_parent_id` (string, opcional): ID da transação original que gerou esta
- `user_id` (string): ID do usuário
- `account_id` (string, opcional): ID da conta
- `credit_card_id` (string, opcional): ID do cartão de crédito
- `amount` (number): Valor da transação
- `direction` (string): "in" ou "out"
- `date` (datetime): Data da transação
- `category` (string, opcional): Categoria
- `description` (string, opcional): Descrição
- `status` (string): Status da transação

## Configuração

1. Copie `appwrite.json.example` para `appwrite.json`
2. Preencha os valores:
   - `projectId`: ID do seu projeto Appwrite
   - `APPWRITE_DATABASE_ID`: ID do seu database

3. Configure no Appwrite Console:
   - **Schedule**: `0 0 1 * *` (todo dia 1º às 00:00 UTC)
   - **Timeout**: 900 segundos (15 minutos)
   - **Runtime**: node-20.0

## Deploy

### Via Git (Recomendado)

1. Configure o repositório Git no Appwrite
2. Defina o Root directory como `./functions/recurring-transactions`
3. O Appwrite fará deploy automaticamente a cada push

### Via CLI

```bash
cd functions/recurring-transactions
npm install
npm run build
appwrite deploy function
```

## Teste Manual

Você pode executar a função manualmente no Appwrite Console:

1. Vá em Functions → Recurring Transactions
2. Clique em "Execute now"
3. Não precisa passar nenhum body
4. Verifique os logs para ver quantas transações foram criadas

## Exemplo de Uso

### Criar uma transação recorrente

```javascript
// Criar transação que se repete todo dia 10
await databases.createDocument('horizon_ai_db', 'transactions', ID.unique(), {
  user_id: 'user123',
  account_id: 'account456',
  amount: 1500.0,
  direction: 'out',
  date: '2024-11-10T00:00:00.000Z',
  category: 'Aluguel',
  description: 'Aluguel mensal',
  status: 'completed',
  is_recurring: true, // ← Marca como recorrente
});
```

### Resultado

No dia 1º de dezembro, a função criará automaticamente:

```javascript
{
  user_id: 'user123',
  account_id: 'account456',
  amount: 1500.00,
  direction: 'out',
  date: '2024-12-10T00:00:00.000Z', // ← Mesmo dia, mês seguinte
  category: 'Aluguel',
  description: 'Aluguel mensal',
  status: 'completed',
  is_recurring: false, // ← Nova transação não é recorrente
  recurring_parent_id: 'original_transaction_id', // ← Referência ao original
}
```

## Logs

A função gera logs detalhados:

```
[RecurringTransactions] Starting processing
[RecurringTransactions] Found 5 recurring transactions
Created recurring transaction for 67890abc on 2024-12-10T00:00:00.000Z
[RecurringTransactions] Created 5 new transactions
```

## Tratamento de Casos Especiais

### Dias que não existem no mês

Se a transação original é dia 31 e o mês atual tem apenas 30 dias, a função usa o último dia do mês (dia 30).

### Duplicatas

A função verifica se já existe uma transação para o mês atual antes de criar, evitando duplicatas se a função for executada múltiplas vezes.

### Erros

Se houver erro ao processar uma transação específica, a função continua processando as demais e registra o erro nos logs.
