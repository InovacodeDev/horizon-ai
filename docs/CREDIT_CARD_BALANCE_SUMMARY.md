# Resumo: Saldo da Conta e Cartão de Crédito

## Como Funciona

### ✅ Compras no Cartão de Crédito

**NÃO afetam o saldo da conta imediatamente**

```typescript
// Compra de R$ 100,00 no cartão
{
  amount: 100.00,
  type: 'expense',
  credit_card_id: 'card_123',  // ← TEM credit_card_id
  account_id: 'account_123'
}
```

**Resultado:**

- ❌ Saldo da conta: **NÃO muda**
- ✅ Fatura do cartão: **+R$ 100,00**
- ✅ Limite disponível: **-R$ 100,00**

### ✅ Pagamento da Fatura

**Afeta o saldo da conta**

```typescript
// Pagamento de R$ 1.500,00
{
  amount: 1500.00,
  type: 'expense',
  // NÃO tem credit_card_id  // ← NÃO TEM credit_card_id
  account_id: 'account_123'
}
```

**Resultado:**

- ✅ Saldo da conta: **-R$ 1.500,00**
- ✅ Fatura: **Paga**
- ✅ Limite disponível: **Restaurado**

## Implementação

### 1. Balance Sync Service

```typescript
// lib/services/balance-sync.service.ts

// Ao calcular saldo
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

### 2. Transaction Service

```typescript
// lib/services/transaction.service.ts

// Ao criar transação
if (data.accountId && !data.creditCardId) {
  // Apenas sincroniza saldo se NÃO for transação de cartão
  await balanceSyncService.syncAfterCreate(data.accountId, id);
}
```

### 3. API de Pagamento

```typescript
// app/api/credit-cards/bills/pay/route.ts

// Criar transação de pagamento
await transactionService.createManualTransaction({
  amount: billAmount,
  type: 'expense',
  category: 'Pagamento de Fatura',
  accountId: accountId,
  // NÃO incluir credit_card_id
  date: paymentDate,
});
```

## Exemplo Prático

### Cenário Completo

**Saldo Inicial:** R$ 5.000,00

**Novembro - Compras no Cartão:**

- 05/11: Supermercado R$ 234,10
- 12/11: Gasolina R$ 150,00
- 18/11: Farmácia R$ 350,00

**Saldo da Conta:** R$ 5.000,00 ✅ (não mudou)
**Fatura Novembro:** R$ 734,10

**10/12: Fechamento da Fatura**

- Total: R$ 734,10
- Vencimento: 15/12

**15/12: Pagamento da Fatura**

```typescript
await payBill({
  amount: 734.1,
  account_id: 'account_123',
  payment_date: '2025-12-15',
});
```

**Saldo da Conta:** R$ 4.265,90 ✅ (reduziu R$ 734,10)
**Fatura:** Paga ✅

## Vantagens

### 1. Clareza Financeira

- Saldo da conta = dinheiro disponível
- Fatura do cartão = dívida a pagar
- Não confunde "gastei" com "paguei"

### 2. Controle de Fluxo de Caixa

- Sabe quanto tem disponível
- Pode planejar pagamento da fatura
- Evita surpresas no saldo

### 3. Relatórios Precisos

- Gastos no cartão separados
- Fácil reconciliar com extrato
- Análise de fluxo de caixa correta

## Checklist

- [x] Transações com `credit_card_id` não afetam saldo
- [x] Balance Sync Service ignora transações de cartão
- [x] Transaction Service não sincroniza saldo para cartão
- [x] API para pagar fatura criada
- [ ] Interface para pagar fatura
- [ ] Botão "Pagar Fatura" na tela de faturas
- [ ] Modal de confirmação de pagamento
- [ ] Histórico de pagamentos

## Próximos Passos

1. Adicionar botão "Pagar Fatura" na interface
2. Criar modal de pagamento
3. Mostrar histórico de pagamentos
4. Adicionar notificações de vencimento
