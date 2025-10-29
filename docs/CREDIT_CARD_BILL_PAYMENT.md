# Pagamento de Fatura de Cartão de Crédito

## Visão Geral

Compras no cartão de crédito **NÃO afetam o saldo da conta imediatamente**. O saldo só é afetado quando a fatura é paga no vencimento.

## Fluxo Completo

### 1. Compra no Cartão de Crédito

```typescript
// Usuário faz uma compra de R$ 100,00 no cartão
await createTransaction({
  amount: 100.0,
  type: 'expense',
  category: 'Alimentação',
  credit_card_id: 'card_123',
  account_id: 'account_123',
  date: '2025-10-29',
});
```

**Resultado:**

- ✅ Transação criada
- ✅ Aparece na fatura do cartão
- ❌ **Saldo da conta NÃO é afetado**
- ✅ Limite do cartão é reduzido

### 2. Fechamento da Fatura

No dia do fechamento (ex: dia 10), o sistema:

- Calcula o total da fatura
- Gera um resumo das transações
- Define a data de vencimento (ex: dia 15)

### 3. Pagamento da Fatura

No vencimento (ou quando o usuário pagar), criar uma transação de pagamento:

```typescript
// Usuário paga a fatura de R$ 1.500,00
await createTransaction({
  amount: 1500.0,
  type: 'expense',
  category: 'Pagamento de Fatura',
  description: 'Pagamento Fatura Nubank - Novembro/2025',
  account_id: 'account_123',
  date: '2025-11-15', // Data do vencimento
  // NÃO tem credit_card_id (é uma transação normal da conta)
});
```

**Resultado:**

- ✅ Transação de pagamento criada
- ✅ **Saldo da conta É reduzido em R$ 1.500,00**
- ✅ Fatura marcada como paga
- ✅ Limite do cartão é restaurado

## Diferença Entre Transações

### Transação de Compra no Cartão

```json
{
  "amount": 100.0,
  "type": "expense",
  "category": "Alimentação",
  "credit_card_id": "card_123", // ← TEM credit_card_id
  "account_id": "account_123",
  "description": "Supermercado"
}
```

**Efeitos:**

- ❌ NÃO afeta saldo da conta
- ✅ Aparece na fatura do cartão
- ✅ Reduz limite disponível do cartão

### Transação de Pagamento da Fatura

```json
{
  "amount": 1500.0,
  "type": "expense",
  "category": "Pagamento de Fatura",
  // NÃO tem credit_card_id  // ← NÃO TEM credit_card_id
  "account_id": "account_123",
  "description": "Pagamento Fatura Nubank - Nov/2025"
}
```

**Efeitos:**

- ✅ Afeta saldo da conta (reduz R$ 1.500,00)
- ❌ NÃO aparece na fatura do cartão
- ✅ Registra o pagamento da fatura

## Lógica de Sincronização de Saldo

### Balance Sync Service

```typescript
// Ao calcular saldo da conta
for (const transaction of transactions) {
  // Ignorar transações de cartão de crédito
  if (transaction.credit_card_id) continue;

  // Apenas transações SEM credit_card_id afetam o saldo
  if (transaction.type === 'income') {
    balance += transaction.amount;
  } else if (transaction.type === 'expense') {
    balance -= transaction.amount;
  }
}
```

### Transaction Service

```typescript
// Ao criar transação
if (data.accountId && !data.creditCardId) {
  // Apenas sincroniza saldo se NÃO for transação de cartão
  await balanceSyncService.syncAfterCreate(data.accountId, id);
}
```

## Exemplo Completo

### Cenário: Compras de Novembro

**Dia 05/11:** Compra no supermercado

```typescript
await createTransaction({
  amount: 234.1,
  credit_card_id: 'card_123',
  account_id: 'account_123',
  // ...
});
// Saldo da conta: R$ 5.000,00 (não mudou)
// Fatura do cartão: R$ 234,10
```

**Dia 12/11:** Compra de gasolina

```typescript
await createTransaction({
  amount: 150.0,
  credit_card_id: 'card_123',
  account_id: 'account_123',
  // ...
});
// Saldo da conta: R$ 5.000,00 (não mudou)
// Fatura do cartão: R$ 384,10
```

**Dia 18/11:** Compra na farmácia

```typescript
await createTransaction({
  amount: 350.0,
  credit_card_id: 'card_123',
  account_id: 'account_123',
  // ...
});
// Saldo da conta: R$ 5.000,00 (não mudou)
// Fatura do cartão: R$ 734,10
```

**Dia 10/12:** Fechamento da fatura

```
Fatura de Novembro/2025
Total: R$ 734,10
Vencimento: 15/12/2025
```

**Dia 15/12:** Pagamento da fatura

```typescript
await createTransaction({
  amount: 734.1,
  type: 'expense',
  category: 'Pagamento de Fatura',
  description: 'Pagamento Fatura Nubank - Novembro/2025',
  account_id: 'account_123',
  // NÃO tem credit_card_id
  date: '2025-12-15',
});
// Saldo da conta: R$ 4.265,90 (reduziu R$ 734,10)
// Fatura marcada como paga
```

## API para Pagamento de Fatura

### POST /api/credit-cards/bills/pay

Cria uma transação de pagamento de fatura.

**Request Body:**

```json
{
  "credit_card_id": "card_123",
  "account_id": "account_123",
  "amount": 734.1,
  "bill_month": "11",
  "bill_year": "2025",
  "payment_date": "2025-12-15"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transaction_id": "trans_456",
    "amount": 734.1,
    "account_balance": 4265.9,
    "message": "Fatura paga com sucesso"
  }
}
```

## Implementação da API

```typescript
// app/api/credit-cards/bills/pay/route.ts
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  // Validar campos
  if (!body.credit_card_id || !body.account_id || !body.amount) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  // Criar transação de pagamento
  const transactionService = new TransactionService();
  const transaction = await transactionService.createManualTransaction({
    userId,
    amount: body.amount,
    type: 'expense',
    category: 'Pagamento de Fatura',
    description: `Pagamento Fatura - ${body.bill_month}/${body.bill_year}`,
    accountId: body.account_id,
    // NÃO incluir credit_card_id
    date: body.payment_date,
    currency: 'BRL',
    status: 'completed',
  });

  // Marcar fatura como paga (se houver tabela de faturas)
  // await markBillAsPaid(body.credit_card_id, body.bill_month, body.bill_year);

  return NextResponse.json({
    success: true,
    data: {
      transaction_id: transaction.$id,
      amount: body.amount,
      message: 'Fatura paga com sucesso',
    },
  });
}
```

## Interface do Usuário

### Botão de Pagar Fatura

```tsx
<button onClick={() => handlePayBill(bill)}>
  Pagar Fatura - {formatCurrency(bill.totalAmount)}
</button>
```

### Modal de Pagamento

```tsx
<PayBillModal
  bill={selectedBill}
  creditCard={selectedCard}
  onSuccess={() => {
    // Recarregar faturas
    // Atualizar saldo da conta
  }}
/>
```

## Relatórios e Análises

### Gastos Reais vs Gastos no Cartão

**Gastos no Cartão (Novembro):**

```typescript
// Buscar transações com credit_card_id
const creditCardExpenses = await listTransactions({
  credit_card_id: 'card_123',
  startDate: '2025-11-01',
  endDate: '2025-11-30',
});
// Total: R$ 734,10
```

**Gastos Reais da Conta (Dezembro):**

```typescript
// Buscar transações SEM credit_card_id
const accountExpenses = await listTransactions({
  account_id: 'account_123',
  type: 'expense',
  startDate: '2025-12-01',
  endDate: '2025-12-31',
});
// Inclui: Pagamento da fatura (R$ 734,10) + outras despesas
```

## Vantagens desta Abordagem

### 1. Separação Clara

- ✅ Compras no cartão não afetam saldo imediatamente
- ✅ Saldo reflete apenas dinheiro disponível
- ✅ Fácil ver quanto deve no cartão vs quanto tem na conta

### 2. Controle de Fluxo de Caixa

- ✅ Sabe exatamente quanto tem disponível
- ✅ Pode planejar pagamento da fatura
- ✅ Evita confusão entre "gastei" e "paguei"

### 3. Relatórios Precisos

- ✅ Gastos no cartão separados de gastos diretos
- ✅ Fácil reconciliar com extrato bancário
- ✅ Análise de fluxo de caixa mais precisa

## Casos Especiais

### Pagamento Parcial

```typescript
// Fatura total: R$ 1.500,00
// Pagamento parcial: R$ 1.000,00
await createTransaction({
  amount: 1000.0,
  description: 'Pagamento Parcial Fatura - Nov/2025',
  // ...
});

// Saldo da conta: reduz R$ 1.000,00
// Fatura: ainda deve R$ 500,00
```

### Pagamento Antecipado

```typescript
// Pagar antes do vencimento
await createTransaction({
  amount: 1500.0,
  date: '2025-11-10', // Antes do vencimento (15/11)
  description: 'Pagamento Antecipado Fatura - Nov/2025',
  // ...
});
```

### Pagamento em Atraso

```typescript
// Pagar depois do vencimento
await createTransaction({
  amount: 1500.0,
  date: '2025-11-20', // Depois do vencimento (15/11)
  description: 'Pagamento Fatura - Nov/2025 (Atraso)',
  // ...
});
```

## Checklist de Implementação

- [x] Transações com `credit_card_id` não afetam saldo da conta
- [x] Balance Sync Service ignora transações de cartão
- [x] Transaction Service não sincroniza saldo para transações de cartão
- [ ] API para pagar fatura (`/api/credit-cards/bills/pay`)
- [ ] Interface para pagar fatura
- [ ] Marcar fatura como paga
- [ ] Histórico de pagamentos
- [ ] Notificações de vencimento

## Próximos Passos

1. Criar API de pagamento de fatura
2. Adicionar botão "Pagar Fatura" na interface
3. Criar modal de confirmação de pagamento
4. Adicionar histórico de pagamentos
5. Implementar notificações de vencimento
6. Criar relatório de faturas pagas vs pendentes
