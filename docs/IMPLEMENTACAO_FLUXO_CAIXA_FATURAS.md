# Implementação: Fluxo de Caixa com Faturas de Cartão

## Resumo das Mudanças

Esta implementação adiciona três funcionalidades principais:

1. **Despesas em vermelho no fluxo de caixa**
2. **Faturas de cartão de crédito incluídas no fluxo de caixa**
3. **Pagamento de fatura sem duplicação de transações**

## 1. Despesas em Vermelho

### Mudança Visual

As despesas agora aparecem em **vermelho** (`text-error`) em vez de cinza, facilitando a identificação visual.

**Arquivo:** `app/(app)/overview/page.tsx`

```typescript
const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const isIncome = transaction.amount > 0;
  const amountColor = isIncome ? 'text-secondary' : 'text-error'; // ← Mudou de text-on-surface para text-error
  // ...
};
```

## 2. Faturas no Fluxo de Caixa

### Lógica de Cálculo

As faturas de cartão de crédito agora são incluídas no cálculo do fluxo de caixa mensal.

**Arquivo:** `app/(app)/overview/page.tsx`

```typescript
const monthlyMetrics = useMemo(() => {
  // ... código existente ...

  // Calcular faturas de cartão por mês
  const creditCardBillsByMonth = useMemo(() => {
    const billsMap = new Map<string, number>();

    creditCards.forEach((card) => {
      const closingDay = card.closing_day || 10;

      creditCardTransactions
        .filter((tx) => tx.credit_card_id === card.$id)
        .forEach((tx) => {
          const txDate = new Date(tx.date);
          const txDay = txDate.getDate();
          let billMonth = txDate.getMonth();
          let billYear = txDate.getFullYear();

          // Se a transação é no ou após o dia de fechamento,
          // pertence à fatura do próximo mês
          if (txDay >= closingDay) {
            billMonth += 1;
            if (billMonth > 11) {
              billMonth = 0;
              billYear += 1;
            }
          }

          const billKey = `${billYear}-${String(billMonth + 1).padStart(2, '0')}`;
          billsMap.set(billKey, (billsMap.get(billKey) || 0) + tx.amount);
        });
    });

    return billsMap;
  }, [creditCardTransactions, creditCards]);

  // Incluir fatura no cálculo de despesas
  const currentCreditCardBill = -(creditCardBillsByMonth.get(currentMonthKey) || 0);
  const currentNet = currentIncome + currentExpenses + currentCreditCardBill;

  // ...
}, [apiTransactions, creditCardTransactions, accounts, creditCards]);
```

### Gráfico de Fluxo de Caixa

O gráfico agora mostra despesas + faturas de cartão:

```typescript
const chartData = useMemo(() => {
  const lastSixMonths = getLastSixMonths();
  return lastSixMonths.map((monthKey) => {
    const monthData = monthlyMetrics.transactionsByMonth[monthKey] || { income: 0, expenses: 0 };
    const creditCardBill = monthlyMetrics.creditCardBillsByMonth.get(monthKey) || 0;
    return {
      month: getMonthName(monthKey),
      income: monthData.income,
      expenses: monthData.expenses + creditCardBill, // ← Inclui fatura
    };
  });
}, [monthlyMetrics]);
```

### Cards de Métricas

Os cards agora mostram:

- **Receitas do mês**: Apenas receitas
- **Despesas do mês**: Despesas diretas (sem cartão)
- **Fatura do mês**: Total das faturas de cartão
- **Saldo do mês**: Receitas - Despesas - Faturas

## 3. Pagamento de Fatura

### Modal de Pagamento

**Arquivo:** `app/(app)/credit-card-bills/PayBillModal.tsx`

Novo componente que permite pagar uma fatura selecionando:

- Conta de origem
- Data do pagamento
- Validação de saldo suficiente

```typescript
const PayBillModal: React.FC<PayBillModalProps> = ({ bill, creditCard, onClose, onSuccess }) => {
  const { accounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    // Chama API de pagamento
    const response = await fetch('/api/credit-cards/bills/pay', {
      method: 'POST',
      body: JSON.stringify({
        credit_card_id: creditCard.$id,
        account_id: selectedAccountId,
        amount: bill.totalAmount,
        bill_month: bill.month,
        bill_year: bill.year,
        payment_date: paymentDate,
      }),
    });
    // ...
  };
};
```

### Botão de Pagamento

**Arquivo:** `app/(app)/credit-card-bills/page.tsx`

Adicionado botão "Pagar Fatura" na página de faturas:

```typescript
{selectedBill && !selectedBill.isPaid && (
  <div className="mb-4">
    <Button
      onClick={() => setPayingBill(selectedBill)}
      variant="filled"
      className="w-full sm:w-auto"
    >
      Pagar Fatura - {formatCurrency(selectedBill.totalAmount)}
    </Button>
  </div>
)}
```

### API de Pagamento

**Arquivo:** `app/api/credit-cards/bills/pay/route.ts` (já existente)

A API cria uma transação de pagamento que:

✅ **Consome o saldo da conta** (transação tipo `expense`)  
✅ **NÃO tem `credit_card_id`** (não aparece na fatura)  
✅ **Registra o pagamento** com descrição clara  
❌ **NÃO duplica despesas** no fluxo de caixa

```typescript
const transaction = await transactionService.createManualTransaction({
  userId,
  amount: body.amount,
  type: 'expense',
  category: 'Pagamento de Fatura',
  description: `Pagamento Fatura ${creditCardName}${billPeriod}`,
  accountId: body.account_id,
  // NÃO incluir credit_card_id - é uma transação normal da conta
  date: body.payment_date,
  currency: 'BRL',
  status: 'completed',
});
```

## Como Funciona

### Cenário Completo

#### 1. Compras no Cartão (Novembro)

```
05/11: Supermercado - R$ 234,10
12/11: Gasolina - R$ 150,00
18/11: Farmácia - R$ 350,00
```

**Resultado:**

- Saldo da conta: **R$ 5.000,00** (não mudou)
- Fatura de Novembro: **R$ 734,10**
- Fluxo de caixa de Novembro: **-R$ 734,10** (fatura aparece)

#### 2. Pagamento da Fatura (15/12)

Usuário clica em "Pagar Fatura" e seleciona a conta.

**Resultado:**

- Saldo da conta: **R$ 4.265,90** (reduziu R$ 734,10)
- Transação criada: "Pagamento Fatura Nubank - Novembro/2025"
- Fatura marcada como paga
- **NÃO há duplicação** no fluxo de caixa

### Fluxo de Caixa

**Novembro:**

- Receitas: R$ 0,00
- Despesas: R$ 0,00
- Fatura: **-R$ 734,10** ← Aparece aqui
- **Saldo: -R$ 734,10**

**Dezembro:**

- Receitas: R$ 0,00
- Despesas: **-R$ 734,10** ← Pagamento da fatura
- Fatura: R$ 0,00
- **Saldo: -R$ 734,10**

### Por Que Não Duplica?

1. **Compras no cartão** têm `credit_card_id` → Aparecem na fatura do mês da compra
2. **Pagamento da fatura** NÃO tem `credit_card_id` → Aparece como despesa do mês do pagamento
3. **Fluxo de caixa** mostra:
   - Mês da compra: Fatura (previsão de gasto)
   - Mês do pagamento: Despesa (gasto real)

## Benefícios

### 1. Visibilidade Clara

✅ Despesas em vermelho são fáceis de identificar  
✅ Faturas aparecem separadas das despesas diretas  
✅ Saldo do mês considera tudo (despesas + faturas)

### 2. Controle de Fluxo de Caixa

✅ Sabe quanto vai gastar no mês (incluindo faturas)  
✅ Pode planejar pagamento das faturas  
✅ Evita surpresas no vencimento

### 3. Sem Duplicação

✅ Compras no cartão aparecem na fatura do mês da compra  
✅ Pagamento aparece como despesa do mês do pagamento  
✅ Não há contagem dupla no fluxo de caixa

## Arquivos Modificados

1. **`app/(app)/overview/page.tsx`**
   - Despesas em vermelho
   - Cálculo de faturas por mês
   - Inclusão de faturas no gráfico

2. **`app/(app)/credit-card-bills/page.tsx`**
   - Botão de pagamento de fatura
   - Estado para modal de pagamento

3. **`app/(app)/credit-card-bills/PayBillModal.tsx`** (novo)
   - Modal de pagamento de fatura
   - Seleção de conta
   - Validação de saldo

4. **`app/api/credit-cards/bills/pay/route.ts`** (já existente)
   - API de pagamento de fatura

## Próximos Passos

- [ ] Adicionar histórico de pagamentos
- [ ] Marcar faturas como pagas no banco de dados
- [ ] Notificações de vencimento
- [ ] Relatório de faturas pagas vs pendentes
- [ ] Pagamento parcial de faturas
- [ ] Agendamento de pagamento automático
