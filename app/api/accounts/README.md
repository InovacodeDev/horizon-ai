# API: Accounts

Endpoints para gerenciamento de contas bancárias.

## Base Path

`/api/accounts`

## Autenticação

Todos os endpoints requerem autenticação via JWT cookie.

## Endpoints

### GET /api/accounts

Lista todas as contas do usuário autenticado.

**Query Parameters**:

- `include_shared` (boolean, opcional): Incluir contas compartilhadas
  - Default: `false`
  - Exemplo: `/api/accounts?include_shared=true`

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "$id": "acc123",
      "user_id": "user123",
      "name": "Conta Corrente",
      "type": "checking",
      "balance": 1500.5,
      "initial_balance": 1000.0,
      "currency": "BRL",
      "bank_name": "Nubank",
      "color": "#8A05BE",
      "is_owner": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 3
}
```

**Errors**:

- 401: Não autenticado
- 500: Erro interno

**Lógica**:

1. Verifica autenticação (JWT cookie)
2. Extrai `user_id` do token
3. Busca contas do usuário no banco
4. Se `include_shared=true`, busca também contas compartilhadas
5. Adiciona metadata de ownership
6. Retorna lista ordenada por data de criação

**Performance**:

- Cache: 1 minuto
- Revalidação: Automática ao criar/editar/deletar conta

### POST /api/accounts

Cria nova conta bancária.

**Request Body**:

```json
{
  "name": "Conta Poupança",
  "type": "savings",
  "initial_balance": 1000.0,
  "currency": "BRL",
  "bank_name": "Nubank",
  "color": "#8A05BE"
}
```

**Validações**:

- `name`: string, 3-100 caracteres, obrigatório
- `type`: enum ['checking', 'savings', 'investment', 'salary'], obrigatório
- `initial_balance`: number, opcional, default: 0
- `currency`: string, 3 caracteres, opcional, default: 'BRL'
- `bank_name`: string, opcional
- `color`: string, hex color, opcional

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "$id": "acc456",
    "user_id": "user123",
    "name": "Conta Poupança",
    "type": "savings",
    "balance": 1000.0,
    "initial_balance": 1000.0,
    "currency": "BRL",
    "bank_name": "Nubank",
    "color": "#8A05BE",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors**:

- 400: Dados inválidos
- 401: Não autenticado
- 409: Nome de conta já existe
- 500: Erro interno

**Lógica**:

1. Verifica autenticação
2. Valida dados com Zod schema
3. Verifica se nome já existe para o usuário
4. Cria documento no Appwrite
5. Se `initial_balance > 0`, cria transação inicial
6. Revalida cache
7. Retorna conta criada

**Side Effects**:

- Cria transação de saldo inicial (se > 0)
- Invalida cache de contas
- Trigger de analytics

### GET /api/accounts/[id]

Busca conta específica por ID.

**Path Parameters**:

- `id`: ID da conta

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "$id": "acc123",
    "user_id": "user123",
    "name": "Conta Corrente",
    "type": "checking",
    "balance": 1500.5,
    "initial_balance": 1000.0,
    "currency": "BRL",
    "bank_name": "Nubank",
    "color": "#8A05BE",
    "is_owner": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "stats": {
      "total_transactions": 45,
      "total_income": 5000.0,
      "total_expenses": 3500.0,
      "last_transaction_date": "2024-01-15"
    }
  }
}
```

**Errors**:

- 401: Não autenticado
- 403: Sem permissão para acessar
- 404: Conta não encontrada
- 500: Erro interno

**Lógica**:

1. Verifica autenticação
2. Busca conta no banco
3. Verifica se usuário é owner ou tem acesso compartilhado
4. Calcula estatísticas
5. Retorna dados completos

### PUT /api/accounts/[id]

Atualiza conta existente.

**Path Parameters**:

- `id`: ID da conta

**Request Body** (campos opcionais):

```json
{
  "name": "Nova Conta Corrente",
  "bank_name": "Inter",
  "color": "#FF7A00"
}
```

**Campos Editáveis**:

- `name`
- `bank_name`
- `color`
- `notes`

**Campos NÃO Editáveis**:

- `balance` (calculado automaticamente)
- `type` (não pode mudar após criação)
- `initial_balance` (histórico)
- `user_id`

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "$id": "acc123",
    "name": "Nova Conta Corrente",
    "bank_name": "Inter",
    "color": "#FF7A00",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Errors**:

- 400: Dados inválidos
- 401: Não autenticado
- 403: Sem permissão (precisa ser owner ou ter write)
- 404: Conta não encontrada
- 500: Erro interno

**Lógica**:

1. Verifica autenticação
2. Busca conta
3. Verifica permissões (owner ou write)
4. Valida dados
5. Atualiza apenas campos fornecidos
6. Registra em audit log
7. Revalida cache
8. Retorna conta atualizada

### DELETE /api/accounts/[id]

Remove conta (soft delete).

**Path Parameters**:

- `id`: ID da conta

**Query Parameters**:

- `delete_transactions` (boolean, opcional): Deletar transações também
  - Default: `false`
  - Se `false`, transações ficam sem conta

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Conta removida com sucesso",
  "data": {
    "deleted_transactions": 0
  }
}
```

**Errors**:

- 401: Não autenticado
- 403: Sem permissão (apenas owner pode deletar)
- 404: Conta não encontrada
- 409: Conta tem transações futuras
- 500: Erro interno

**Lógica**:

1. Verifica autenticação
2. Busca conta
3. Verifica se é owner
4. Verifica se tem transações futuras
5. Se `delete_transactions=true`, deleta transações
6. Marca conta como deletada (soft delete)
7. Remove compartilhamentos
8. Revalida cache
9. Retorna confirmação

**Restrições**:

- Apenas owner pode deletar
- Não pode deletar se tem transações futuras
- Não pode deletar se é única conta do usuário

### POST /api/accounts/[id]/sync-balance

Recalcula saldo da conta manualmente.

**Path Parameters**:

- `id`: ID da conta

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "old_balance": 1500.5,
    "new_balance": 1550.75,
    "difference": 50.25,
    "synced_transactions": 45
  }
}
```

**Errors**:

- 401: Não autenticado
- 403: Sem permissão
- 404: Conta não encontrada
- 500: Erro interno

**Lógica**:

1. Verifica autenticação e permissões
2. Busca todas as transações da conta
3. Recalcula saldo do zero
4. Atualiza conta com novo saldo
5. Registra em audit log
6. Retorna diferença

**Quando Usar**:

- Saldo parece incorreto
- Após importação em massa
- Após correção de transações
- Troubleshooting

## Schemas de Validação

### CreateAccountSchema

```typescript
z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['checking', 'savings', 'investment', 'salary']),
  initial_balance: z.number().optional().default(0),
  currency: z.string().length(3).optional().default('BRL'),
  bank_name: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
});
```

### UpdateAccountSchema

```typescript
z.object({
  name: z.string().min(3).max(100).optional(),
  bank_name: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  notes: z.string().max(500).optional(),
});
```

## Rate Limiting

- **GET**: 100 requests/minuto
- **POST**: 10 requests/minuto
- **PUT**: 20 requests/minuto
- **DELETE**: 5 requests/minuto

## Caching

- **GET /accounts**: Cache de 1 minuto
- **GET /accounts/[id]**: Cache de 30 segundos
- Invalidação automática em mutações

## Webhooks

Eventos disparados:

- `account.created`
- `account.updated`
- `account.deleted`
- `account.balance_synced`

## Exemplos de Uso

### JavaScript/TypeScript

```typescript
// Listar contas
const response = await fetch('/api/accounts?include_shared=true');
const { data } = await response.json();

// Criar conta
const response = await fetch('/api/accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Conta Poupança',
    type: 'savings',
    initial_balance: 1000
  })
});

// Atualizar conta
const response = await fetch('/api/accounts/acc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Nova Conta'
  })
});

// Deletar conta
const response = await fetch('/api/accounts/acc123', {
  method: 'DELETE'
});
```

### cURL

```bash
# Listar contas
curl -X GET https://api.horizon-ai.com/api/accounts \
  -H "Cookie: auth_token=..."

# Criar conta
curl -X POST https://api.horizon-ai.com/api/accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=..." \
  -d '{
    "name": "Conta Poupança",
    "type": "savings",
    "initial_balance": 1000
  }'
```

## Testes

```bash
pnpm test:api:accounts
```

## Logs

Todos os endpoints logam:

- Request (método, path, user_id)
- Response (status, duration)
- Erros (stack trace)

Formato:

```
[API] GET /api/accounts user=user123 status=200 duration=45ms
```
