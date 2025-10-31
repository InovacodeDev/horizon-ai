# Diferença entre `date` e `purchase_date`

## Campos na Tabela `credit_card_transactions`

### `purchase_date` (Data da Compra Original)

- **O que é:** A data em que a compra foi realmente feita
- **Valor:** Sempre a mesma para todas as parcelas de uma compra
- **Exemplo:** Se você comprou algo em 04/03/2024, todas as 12 parcelas terão `purchase_date = 04/03/2024`

### `date` (Data da Parcela)

- **O que é:** A data da parcela específica, mantendo o mesmo dia da compra mas no mês correspondente
- **Valor:** Diferente para cada parcela
- **Exemplo:**
  - Parcela 1: `date = 04/03/2024`
  - Parcela 2: `date = 04/04/2024`
  - Parcela 3: `date = 04/05/2024`

## Por Que Dois Campos?

### `purchase_date` - Para Agrupar Parcelas

Usado para identificar que várias transações fazem parte da mesma compra parcelada.

```sql
-- Buscar todas as parcelas de uma compra
SELECT * FROM credit_card_transactions
WHERE purchase_date = '2024-03-04'
  AND credit_card_id = 'card_123'
ORDER BY installment;
```

### `date` - Para Determinar a Fatura

Usado para calcular em qual fatura a parcela aparece.

```typescript
// Determinar a fatura
const transactionDay = new Date(transaction.date).getUTCDate();

if (transactionDay < closingDay) {
  // Fatura do mês da transação
} else {
  // Fatura do próximo mês
}
```

## Exemplos Práticos

### Exemplo 1: Compra em 04/03/2024 em 3x (fechamento dia 5)

| Parcela | `date`     | `purchase_date` | Dia | Comparação | Fatura |
| ------- | ---------- | --------------- | --- | ---------- | ------ |
| 1/3     | 04/03/2024 | 04/03/2024      | 4   | 4 < 5      | Março  |
| 2/3     | 04/04/2024 | 04/03/2024      | 4   | 4 < 5      | Abril  |
| 3/3     | 04/05/2024 | 04/03/2024      | 4   | 4 < 5      | Maio   |

**Observação:** Todas têm o mesmo `purchase_date`, mas `date` diferente.

### Exemplo 2: Compra em 20/08/2024 em 12x (fechamento dia 30)

| Parcela | `date`     | `purchase_date` | Dia | Comparação | Fatura     |
| ------- | ---------- | --------------- | --- | ---------- | ---------- |
| 1/12    | 20/08/2024 | 20/08/2024      | 20  | 20 < 30    | Agosto     |
| 2/12    | 20/09/2024 | 20/08/2024      | 20  | 20 < 30    | Setembro   |
| 3/12    | 20/10/2024 | 20/08/2024      | 20  | 20 < 30    | Outubro    |
| ...     | ...        | 20/08/2024      | ... | ...        | ...        |
| 12/12   | 20/07/2025 | 20/08/2024      | 20  | 20 < 30    | Julho/2025 |

### Exemplo 3: Compra em 30/08/2024 em 12x (fechamento dia 30)

| Parcela | `date`     | `purchase_date` | Dia | Comparação | Fatura        |
| ------- | ---------- | --------------- | --- | ---------- | ------------- |
| 1/12    | 30/08/2024 | 30/08/2024      | 30  | 30 >= 30   | Setembro      |
| 2/12    | 30/09/2024 | 30/08/2024      | 30  | 30 >= 30   | Outubro       |
| 3/12    | 30/10/2024 | 30/08/2024      | 30  | 30 >= 30   | Novembro      |
| ...     | ...        | 30/08/2024      | ... | ...        | ...           |
| 12/12   | 30/08/2025 | 30/08/2024      | 30  | 30 >= 30   | Setembro/2025 |

## Como o Sistema Usa Cada Campo

### Frontend - Exibição de Faturas

```typescript
// Usa o campo 'date' para determinar a fatura
const transactionDay = new Date(transaction.date).getUTCDate();
const transactionMonth = new Date(transaction.date).getUTCMonth();

if (transactionDay >= closingDay) {
  // Vai para próxima fatura
  billMonth = transactionMonth + 1;
} else {
  // Fica na fatura do mês
  billMonth = transactionMonth;
}
```

### Frontend - Agrupamento de Parcelas

```typescript
// Usa 'purchase_date' para agrupar parcelas da mesma compra
const groupedByPurchase = transactions.reduce((acc, t) => {
  const key = t.purchase_date;
  if (!acc[key]) acc[key] = [];
  acc[key].push(t);
  return acc;
}, {});
```

### Backend - Criação de Parcelas

```typescript
// Cada parcela tem:
// - date: dia da compra no mês correspondente
// - purchase_date: data original da compra (igual para todas)

for (let i = 0; i < installments; i++) {
  const installmentMonth = purchaseMonth + i;
  const installmentDate = new Date(year, installmentMonth, purchaseDay);

  transactions.push({
    date: installmentDate.toISOString(), // Diferente para cada parcela
    purchase_date: originalPurchaseDate, // Igual para todas
    installment: i + 1,
    installments: totalInstallments,
  });
}
```

## Casos Especiais

### Meses com Menos Dias

Se a compra foi no dia 31 e o mês seguinte tem apenas 30 dias:

| Parcela | `date`     | `purchase_date` | Observação                       |
| ------- | ---------- | --------------- | -------------------------------- |
| 1/3     | 31/01/2024 | 31/01/2024      | Janeiro tem 31 dias              |
| 2/3     | 29/02/2024 | 31/01/2024      | Fevereiro tem 29 dias (ajustado) |
| 3/3     | 31/03/2024 | 31/01/2024      | Março tem 31 dias                |

**Importante:** O `date` é ajustado para o último dia do mês quando necessário, mas `purchase_date` permanece inalterado.

## Resumo

| Campo           | Propósito                  | Valor                        | Uso Principal                     |
| --------------- | -------------------------- | ---------------------------- | --------------------------------- |
| `purchase_date` | Data da compra original    | Igual para todas as parcelas | Agrupar parcelas da mesma compra  |
| `date`          | Data da parcela específica | Diferente para cada parcela  | Determinar em qual fatura aparece |

**Regra de Ouro:**

- `purchase_date` = "Quando comprei?"
- `date` = "Quando essa parcela específica vence?"
