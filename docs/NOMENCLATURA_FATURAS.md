# Nomenclatura de Faturas de Cartão de Crédito

## Regra Principal

**O nome da fatura é baseado no mês do VENCIMENTO, não no mês de fechamento.**

## Por Quê?

Essa é a convenção padrão dos cartões de crédito no Brasil:

- ✅ "Fatura de Novembro" = Fatura que vence em Novembro
- ❌ "Fatura de Outubro" (se vence em Novembro) = Confuso!

## Exemplos Práticos

### Exemplo 1: Fechamento dia 30, Vencimento dia 10

| Compra | Fechamento | Vencimento | Nome da Fatura            |
| ------ | ---------- | ---------- | ------------------------- |
| 20/08  | 30/08      | 10/09      | **Fatura de Setembro** ✅ |
| 30/08  | 30/09      | 10/10      | **Fatura de Outubro** ✅  |
| 31/08  | 30/09      | 10/10      | **Fatura de Outubro** ✅  |

**Observação:** Mesmo que a compra seja em Agosto e feche em Agosto, a fatura é de Setembro porque vence em Setembro.

### Exemplo 2: Fechamento dia 5, Vencimento dia 15

| Compra | Fechamento | Vencimento | Nome da Fatura            |
| ------ | ---------- | ---------- | ------------------------- |
| 03/10  | 05/10      | 15/10      | **Fatura de Outubro** ✅  |
| 05/10  | 05/11      | 15/11      | **Fatura de Novembro** ✅ |
| 10/10  | 05/11      | 15/11      | **Fatura de Novembro** ✅ |

### Exemplo 3: Fechamento dia 1, Vencimento dia 10

| Compra | Fechamento | Vencimento | Nome da Fatura         |
| ------ | ---------- | ---------- | ---------------------- |
| 05/03  | 01/04      | 10/04      | **Fatura de Abril** ✅ |
| 31/03  | 01/04      | 10/04      | **Fatura de Abril** ✅ |
| 01/04  | 01/05      | 10/05      | **Fatura de Maio** ✅  |

## Caso Especial: Vencimento Antes do Fechamento

Quando o dia de vencimento é menor ou igual ao dia de fechamento, o vencimento é no mês seguinte.

### Exemplo: Fechamento dia 30, Vencimento dia 5

| Compra | Fechamento | Vencimento | Nome da Fatura            |
| ------ | ---------- | ---------- | ------------------------- |
| 20/08  | 30/08      | 05/09      | **Fatura de Setembro** ✅ |
| 30/08  | 30/09      | 05/10      | **Fatura de Outubro** ✅  |

**Lógica:**

```typescript
if (dueDay <= closingDay) {
  // Vencimento é no mês seguinte ao fechamento
  dueMonth = closingMonth + 1;
}
```

## Implementação no Código

### Frontend (Exibição)

```typescript
// Calcular mês de fechamento
let billMonth = transactionMonth;
if (transactionDay >= closingDay) {
  billMonth += 1;
}

// Calcular mês de vencimento
let dueMonth = billMonth;
if (dueDay <= closingDay) {
  dueMonth += 1; // Vencimento no mês seguinte
}

// Nome da fatura baseado no vencimento
const billName = `Fatura de ${monthNames[dueMonth]}`;
```

### Backend (Criação)

```typescript
// O nome da fatura é determinado pelo mês do vencimento
const closingDate = new Date(year, month, closingDay);
let dueMonth = month;

if (dueDay <= closingDay) {
  dueMonth += 1;
}

const dueDate = new Date(year, dueMonth, dueDay);
const billName = `${monthNames[dueMonth]}/${year}`;
```

## Timeline Visual

### Exemplo: Fechamento dia 30/10, Vencimento dia 10/11

```
Agosto                 Setembro               Outubro
├─────────────────────┼─────────────────────┼─────────────────────┤
│                     │                     │                     │
│  Compra: 20/08      │                     │                     │
│  ↓                  │                     │                     │
│  Entra na fatura    │                     │                     │
│  que fecha 30/08 ───┼──→ Vence 10/09      │                     │
│                     │     ↓               │                     │
│                     │  "Fatura de         │                     │
│                     │   Setembro" ✅      │                     │
│                     │                     │                     │
│                     │  Compra: 30/08      │                     │
│                     │  ↓                  │                     │
│                     │  Entra na fatura    │                     │
│                     │  que fecha 30/09 ───┼──→ Vence 10/10      │
│                     │                     │     ↓               │
│                     │                     │  "Fatura de         │
│                     │                     │   Outubro" ✅       │
```

## Comparação: Antes vs Depois

### ❌ Antes (Incorreto)

```
Compra: 20/08
Fechamento: 30/08
Vencimento: 10/09
Nome: "Fatura de Agosto" ❌ (baseado no mês de fechamento)
```

### ✅ Depois (Correto)

```
Compra: 20/08
Fechamento: 30/08
Vencimento: 10/09
Nome: "Fatura de Setembro" ✅ (baseado no mês de vencimento)
```

## Benefícios

1. **Consistência:** Segue o padrão dos cartões de crédito brasileiros
2. **Clareza:** Usuário sabe que "Fatura de Novembro" vence em Novembro
3. **Intuitividade:** Mais fácil de entender e lembrar
4. **Padrão do mercado:** Alinhado com bancos e fintechs

## Resumo

| Elemento              | Baseado em                                        |
| --------------------- | ------------------------------------------------- |
| **Entrada na fatura** | Dia da compra vs dia de fechamento                |
| **Nome da fatura**    | Mês do vencimento ✅                              |
| **Fechamento**        | Dia configurado no cartão                         |
| **Vencimento**        | Dia configurado no cartão (pode ser mês seguinte) |

**Regra de Ouro:** A fatura é nomeada pelo mês em que você precisa pagar (vencimento), não pelo mês em que ela fecha.
