# API: Transactions

Endpoints para gerenciamento de transações financeiras.

## Base Path

`/api/transactions`

## Autenticação

Todos os endpoints requerem autenticação via JWT cookie.

## Endpoints

### GET /api/transactions

Lista transações com filtros avançados.

**Query Parameters**:

- `account_id` (string): Filtrar por conta específica
- `category` (string): Filtrar por categoria
- `type` (enum): 'income' | 'expense' | 'transfer'
- `start_date` (string): Data inicial (ISO 8601)
- `end_date` (string): Data final (ISO 8601)
- `status` (enum): 'confirmed' | 'pending'
- `is_recurring` (boolean): Apenas recorrentes
- `min_amount` (number): Valor mínimo
- `max_amount` (number): Valor máximo
- `search` (string): Busca textual em descrição
- `page` (number): Página (default: 1)
- `limit` (number): Itens por página (default: 50, max: 100)
- `order` (enum): 'asc' | 'desc' (default: 'desc')

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "$id": "tx123",
      "user_id": "user123",
      "account_id": "acc123",
      "amount": 50.0,
      "type": "expense",
      "direction": "out",
      "category": "Alimentação",
      "description": "Supermercado",
      "date": "2024-01-15",
      "status": "confirmed",
      "is_recurring": false,
      "recurrence_frequency": null,
      "tags": ["mercado", "mensal"],
      "notes": "Compras do mês",
      "attachments": [],
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**Lógica**:

1. Verifica autenticação
2. Constrói queries do Appwrite baseado nos filtros
3. Busca transações do usuário
4. Inclui transações de contas compartilhadas (se tiver acesso)
5. Aplica paginação
6. Retorna lista ordenada

**Performance**:

- Cache: 30 segundos
- Índices: account_id, user_id, date, category
- Paginação server-side

### POST /api/transactions

Cria nova transação.

**Request Body**:

```json
{
  "account_id": "acc123",
  "amount": 50.0,
  "type": "expense",
  "category": "Alimentação",
  "description": "Supermercado",
  "date": "2024-01-15",
  "status": "confirmed",
  "is_recurring": false,
  "recurrence_frequency": null,
  "tags": ["mercado"],
  "notes": "Compras do mês"
}
```

**Validações**:

- `account_id`: string, obrigatório, deve existir
- `amount`: number > 0, obrigatório
- `type`: enum ['income', 'expense', 'transfer'], obrigatório
- `category`: string, obrigatório
- `description`: string, 3-200 caracteres, opcional
- `date`: string ISO 8601, obrigatório
- `status`: enum ['confirmed', 'pending'], default: 'confirmed'
- `is_recurring`: boolean, default: false
- `recurrence_frequency`: enum ['daily', 'weekly', 'monthly', 'yearly'], se is_recurring=true

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "$id": "tx456",
    "account_id": "acc123",
    "amount": 50.0,
    "type": "expense",
    "category": "Alimentação",
    "description": "Supermercado",
    "date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Side Effects**:

1. Trigger de sincronização de saldo (Appwrite Function)
2. Invalidação de cache
3. Notificação Realtime
4. Analytics event

**Lógica**:

1. Verifica autenticação
2. Valida dados com Zod
3. Verifica se conta existe e usuário tem acesso
4. Verifica permissão (owner ou write)
5. Converte valor para centavos internamente
6. Cria documento no Appwrite
7. Trigger: balance-sync function
8. Retorna transação criada

### PUT /api/transactions/[id]

Atualiza transação existente.

**Path Parameters**:

- `id`: ID da transação

**Request Body** (campos opcionais):

```json
{
  "amount": 55.0,
  "description": "Supermercado Extra",
  "category": "Alimentação",
  "date": "2024-01-15"
}
```

**Campos Editáveis**:

- `amount`
- `description`
- `category`
- `date`
- `status`
- `tags`
- `notes`

**Campos NÃO Editáveis**:

- `account_id` (precisa deletar e recriar)
- `type` (precisa deletar e recriar)
- `user_id`

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "$id": "tx456",
    "amount": 55.0,
    "description": "Supermercado Extra",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Side Effects**:

- Re-sincroniza saldo se valor mudou
- Registra em audit log
- Invalidação de cache

### DELETE /api/transactions/[id]

Remove transação (soft delete).

**Path Parameters**:

- `id`: ID da transação

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Transação removida com sucesso"
}
```

**Side Effects**:

- Re-sincroniza saldo da conta
- Marca como deletada (soft delete)
- Invalidação de cache

### POST /api/transactions/import

Importa transações de arquivo.

**Request** (multipart/form-data):

```
file: arquivo.ofx
account_id: acc123
```

**Formatos Suportados**:

- OFX (Open Financial Exchange)
- CSV (valores separados por vírgula)
- PDF (extrato bancário)

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "total_parsed": 50,
    "imported": 45,
    "duplicates": 5,
    "errors": 0,
    "transactions": [
      {
        "$id": "tx789",
        "description": "Compra 1",
        "amount": 100.0,
        "date": "2024-01-10"
      }
    ]
  }
}
```

**Lógica**:

1. Verifica autenticação
2. Valida arquivo (tamanho, formato)
3. Detecta formato automaticamente
4. Parse do arquivo
5. Normaliza dados
6. Detecta duplicatas (data + valor + descrição)
7. Cria transações em batch
8. Trigger: balance-sync
9. Retorna relatório

**Detecção de Duplicatas**:

```typescript
function isDuplicate(newTx, existingTxs) {
  return existingTxs.some(
    (existing) =>
      existing.date === newTx.date &&
      Math.abs(existing.amount - newTx.amount) < 0.01 &&
      similarity(existing.description, newTx.description) > 0.8,
  );
}
```

### GET /api/transactions/stats

Estatísticas de transações.

**Query Parameters**:

- `start_date` (string): Data inicial
- `end_date` (string): Data final
- `account_id` (string, opcional): Conta específica

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "total_income": 5000.0,
    "total_expenses": 3500.0,
    "net_balance": 1500.0,
    "transaction_count": 45,
    "average_transaction": 166.67,
    "by_category": {
      "Alimentação": 1500.0,
      "Transporte": 800.0,
      "Lazer": 300.0
    },
    "by_month": [
      {
        "month": "2024-01",
        "income": 5000.0,
        "expenses": 3500.0
      }
    ]
  }
}
```

**Lógica**:

1. Verifica autenticação
2. Busca transações no período
3. Calcula estatísticas
4. Agrupa por categoria e mês
5. Retorna dados agregados

## Schemas de Validação

### CreateTransactionSchema

```typescript
z.object({
  account_id: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().min(1),
  description: z.string().min(3).max(200).optional(),
  date: z.string().datetime(),
  status: z.enum(['confirmed', 'pending']).default('confirmed'),
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});
```

## Rate Limiting

- **GET**: 100 requests/minuto
- **POST**: 20 requests/minuto
- **PUT**: 30 requests/minuto
- **DELETE**: 10 requests/minuto
- **POST /import**: 5 requests/hora

## Caching

- **GET /transactions**: Cache de 30 segundos
- **GET /transactions/stats**: Cache de 1 minuto
- Invalidação automática em mutações

## Webhooks

Eventos disparados:

- `transaction.created`
- `transaction.updated`
- `transaction.deleted`
- `transactions.imported`

## Exemplos de Uso

### JavaScript/TypeScript

```typescript
// Listar transações
const response = await fetch('/api/transactions?account_id=acc123&start_date=2024-01-01');
const { data, pagination } = await response.json();

// Criar transação
const response = await fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    account_id: 'acc123',
    amount: 50.00,
    type: 'expense',
    category: 'Alimentação',
    description: 'Supermercado',
    date: '2024-01-15'
  })
});

// Importar transações
const formData = new FormData();
formData.append('file', file);
formData.append('account_id', 'acc123');

const response = await fetch('/api/transactions/import', {
  method: 'POST',
  body: formData
});
```

## Testes

```bash
pnpm test:api:transactions
```
