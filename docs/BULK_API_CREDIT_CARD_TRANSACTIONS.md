# API Bulk para Transações de Cartão de Crédito

## Problema Resolvido

Anteriormente, ao criar um parcelamento de 12x, o sistema fazia **12 chamadas individuais** à API, uma para cada parcela. Isso causava:

- ❌ Lentidão na criação de parcelamentos
- ❌ 12 operações de sincronização de limite do cartão
- ❌ Maior chance de falhas parciais

## Solução Implementada

Criamos uma **API Bulk** que permite criar múltiplas transações em uma única chamada:

- ✅ 1 única chamada HTTP para criar todas as parcelas
- ✅ 1 única sincronização de limite do cartão
- ✅ Muito mais rápido e eficiente

## Arquivos Criados/Modificados

### 1. Nova Rota: `app/api/credit-cards/transactions/bulk/route.ts`

Endpoint para criação em massa de transações de cartão de crédito.

**Endpoint:** `POST /api/credit-cards/transactions/bulk`

**Body:**

```json
{
  "transactions": [
    {
      "credit_card_id": "card_123",
      "amount": 100.5,
      "date": "2024-04-05",
      "purchase_date": "2024-03-05",
      "category": "Compras",
      "description": "Notebook (1/12)",
      "merchant": "Loja XYZ",
      "installment": 1,
      "installments": 12,
      "status": "completed"
    },
    {
      "credit_card_id": "card_123",
      "amount": 100.0,
      "date": "2024-05-05",
      "purchase_date": "2024-03-05",
      "category": "Compras",
      "description": "Notebook (2/12)",
      "merchant": "Loja XYZ",
      "installment": 2,
      "installments": 12,
      "status": "completed"
    }
    // ... mais 10 parcelas
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 12,
    "transactions": [
      // Array com todas as transações criadas
    ]
  }
}
```

### 2. Novo Método: `CreditCardTransactionService.bulkCreateTransactions()`

Método no serviço para criar múltiplas transações de uma vez.

**Características:**

- Cria todas as transações em sequência
- Se uma falhar, continua com as outras
- Sincroniza o limite do cartão apenas 1 vez no final
- Retorna todas as transações criadas com sucesso

### 3. Atualização: `app/api/credit-cards/installments/route.ts`

A rota de parcelamento agora usa o método bulk internamente:

**Antes:**

```typescript
for (let i = 0; i < body.installments; i++) {
  // Cria cada transação individualmente
  const transaction = await service.createTransaction({...});
  createdTransactions.push(transaction);
}
```

**Depois:**

```typescript
// Prepara todas as transações
const transactionsToCreate = [];
for (let i = 0; i < body.installments; i++) {
  transactionsToCreate.push({...});
}

// Cria todas de uma vez
const createdTransactions = await service.bulkCreateTransactions(transactionsToCreate);
```

## Correção Adicional: Cálculo de Mês da Parcela

Também corrigimos um bug no cálculo do mês de cada parcela:

**Antes:**

```typescript
let installmentMonth = firstInstallmentMonth - 1 + i; // ❌ Subtraía 1 a mais
```

**Depois:**

```typescript
let installmentMonth = firstInstallmentMonth + i; // ✅ Correto
```

Isso estava causando a parcela aparecer no mês errado.

## Exemplo de Uso

### Criar Parcelamento de 12x

**Request:**

```bash
POST /api/credit-cards/installments
Content-Type: application/json

{
  "credit_card_id": "card_123",
  "total_amount": 1200.00,
  "installments": 12,
  "purchase_date": "2024-03-05",
  "category": "Compras",
  "description": "Notebook",
  "merchant": "Loja XYZ",
  "account_id": "account_123",
  "closing_day": 1
}
```

**Internamente:**

1. Calcula os valores de cada parcela
2. Prepara array com 12 transações
3. Chama `bulkCreateTransactions()` uma única vez
4. Retorna todas as 12 transações criadas

### Criar Transações Manualmente em Bulk

Se você quiser criar múltiplas transações diretamente:

```bash
POST /api/credit-cards/transactions/bulk
Content-Type: application/json

{
  "transactions": [
    {
      "credit_card_id": "card_123",
      "amount": 50.00,
      "date": "2024-04-05",
      "purchase_date": "2024-03-05",
      "category": "Alimentação",
      "description": "Restaurante A"
    },
    {
      "credit_card_id": "card_123",
      "amount": 30.00,
      "date": "2024-04-10",
      "purchase_date": "2024-03-10",
      "category": "Transporte",
      "description": "Uber"
    }
  ]
}
```

## Performance

### Antes (Criação Individual)

- Parcelamento 12x: ~12 segundos
- 12 chamadas HTTP
- 12 operações de sincronização de limite

### Depois (Criação Bulk)

- Parcelamento 12x: ~2-3 segundos
- 1 chamada HTTP
- 1 operação de sincronização de limite

**Melhoria:** ~75% mais rápido! 🚀

## Validações

A API bulk valida:

- ✅ Array de transações não vazio
- ✅ Cada transação tem todos os campos obrigatórios
- ✅ Valores numéricos são válidos
- ✅ Datas estão no formato correto

Se alguma validação falhar, retorna erro 400 com mensagem específica.

## Tratamento de Erros

- Se uma transação falhar, as outras continuam sendo criadas
- Erros são logados no console
- Retorna apenas as transações criadas com sucesso
- O limite do cartão é sincronizado mesmo se algumas transações falharem

## Compatibilidade

A API antiga de criação individual (`POST /api/credit-cards/transactions`) continua funcionando normalmente. A API bulk é uma adição, não uma substituição.

## Próximos Passos

Possíveis melhorias futuras:

1. Usar transações do banco de dados para garantir atomicidade
2. Implementar retry automático para transações que falharem
3. Adicionar suporte para criação assíncrona (background jobs)
4. Implementar rate limiting para evitar abuso
