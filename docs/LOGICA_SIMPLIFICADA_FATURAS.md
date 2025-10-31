# Lógica Simplificada de Faturas de Cartão de Crédito

## Regra Principal

**Uma compra entra na fatura do mês em que foi feita, a menos que seja feita no dia de fechamento ou depois.**

## Como Funciona

### Regra Simples

```
Se dia_da_compra < dia_de_fechamento:
  → Compra entra na fatura do mês atual

Se dia_da_compra >= dia_de_fechamento:
  → Compra entra na fatura do próximo mês
```

## Exemplos Práticos

### Exemplo 1: Fechamento dia 30 de Agosto

| Dia da Compra | Comparação | Fatura       |
| ------------- | ---------- | ------------ |
| 20/08         | 20 < 30    | **Agosto**   |
| 29/08         | 29 < 30    | **Agosto**   |
| 30/08         | 30 >= 30   | **Setembro** |
| 31/08         | 31 >= 30   | **Setembro** |

### Exemplo 2: Fechamento dia 5

| Dia da Compra | Comparação | Fatura       |
| ------------- | ---------- | ------------ |
| 03/10         | 3 < 5      | **Outubro**  |
| 04/10         | 4 < 5      | **Outubro**  |
| 05/10         | 5 >= 5     | **Novembro** |
| 10/10         | 10 >= 5    | **Novembro** |

### Exemplo 3: Fechamento dia 1

| Dia da Compra | Comparação | Fatura    |
| ------------- | ---------- | --------- |
| 01/03         | 1 >= 1     | **Abril** |
| 05/03         | 5 >= 1     | **Abril** |
| 31/03         | 31 >= 1    | **Abril** |

**Observação:** Com fechamento dia 1, praticamente todas as compras do mês vão para a fatura do próximo mês.

## Parcelamento

### Como as Parcelas São Distribuídas

Cada parcela mantém o mesmo dia da compra original, mas no mês correspondente. A fatura em que aparece depende da comparação do dia com o dia de fechamento.

**Exemplo: Compra de R$ 1.200,00 em 12x no dia 20/08 (fechamento dia 30)**

| Parcela | Data da Parcela | Comparação | Fatura     |
| ------- | --------------- | ---------- | ---------- |
| 1/12    | 20/08           | 20 < 30    | Agosto     |
| 2/12    | 20/09           | 20 < 30    | Setembro   |
| 3/12    | 20/10           | 20 < 30    | Outubro    |
| 4/12    | 20/11           | 20 < 30    | Novembro   |
| ...     | ...             | ...        | ...        |
| 12/12   | 20/07/2025      | 20 < 30    | Julho/2025 |

**Exemplo: Compra de R$ 1.200,00 em 12x no dia 30/08 (fechamento dia 30)**

| Parcela | Data da Parcela | Comparação | Fatura        |
| ------- | --------------- | ---------- | ------------- |
| 1/12    | 30/08           | 30 >= 30   | Setembro      |
| 2/12    | 30/09           | 30 >= 30   | Outubro       |
| 3/12    | 30/10           | 30 >= 30   | Novembro      |
| 4/12    | 30/11           | 30 >= 30   | Dezembro      |
| ...     | ...             | ...        | ...           |
| 12/12   | 30/08/2025      | 30 >= 30   | Setembro/2025 |

**Importante:** A data da parcela (`date`) é sempre no mesmo dia da compra original, mas no mês correspondente. A fatura em que ela aparece é determinada pela comparação do dia com o dia de fechamento.

## Implementação no Código

### Backend (API)

```typescript
// Parse da data para evitar timezone
const [purchaseYear, purchaseMonth, purchaseDay] = body.purchase_date.split('-').map(Number);

let firstInstallmentMonth = purchaseMonth - 1; // 0-indexed
let firstInstallmentYear = purchaseYear;

// Se compra é no dia de fechamento ou depois, vai para próximo mês
if (purchaseDay >= closingDay) {
  firstInstallmentMonth += 1;
  if (firstInstallmentMonth > 11) {
    firstInstallmentMonth = 0;
    firstInstallmentYear += 1;
  }
}
```

### Frontend (Exibição)

```typescript
// Parse da data
const transactionDay = transactionDate.getUTCDate();
const transactionMonth = transactionDate.getUTCMonth();
const transactionYear = transactionDate.getUTCFullYear();

let billMonth = transactionMonth;
let billYear = transactionYear;

// Se transação é no dia de fechamento ou depois, vai para próximo mês
if (transactionDay >= settings.closingDay) {
  billMonth += 1;
  if (billMonth > 11) {
    billMonth = 0;
    billYear += 1;
  }
}
```

## Vantagens da Lógica Simplificada

✅ **Fácil de entender:** Regra clara e direta
✅ **Intuitivo:** Compra do mês entra na fatura do mês
✅ **Previsível:** Usuário sabe exatamente quando a parcela vai cair
✅ **Sem mistério:** Não precisa calcular períodos complexos

## Casos Especiais

### Meses com Menos Dias

Se a compra foi feita no dia 31 e o mês seguinte tem apenas 30 dias, a parcela é ajustada para o dia 30.

**Exemplo:**

- Compra: 31/01 em 3x
- Parcela 1: 31/01 (Janeiro)
- Parcela 2: 28/02 (Fevereiro - ajustado)
- Parcela 3: 31/03 (Março)

### Fechamento no Último Dia do Mês

Se o fechamento é no dia 31, meses com 30 dias usam o dia 30 como fechamento.

**Exemplo com fechamento dia 31:**

- Compra em 30/04: 30 < 31 → Fatura de Abril
- Compra em 01/05: 1 < 31 → Fatura de Maio

## Resumo

A lógica é simples: **compra do mês entra na fatura do mês, exceto se for no dia de fechamento ou depois**.

Isso torna o sistema:

- Mais fácil de usar
- Mais fácil de manter
- Mais fácil de explicar para os usuários
