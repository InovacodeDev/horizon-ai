# Lógica de Faturamento de Cartão de Crédito

## Regra de Fechamento de Fatura

A lógica de faturamento de cartão de crédito segue uma regra simples:

### Regra Principal

**Uma compra entra na fatura do mês em que foi feita, a menos que seja feita no dia de fechamento ou depois.**

- **Compra ANTES do dia de fechamento:** Entra na fatura do mês atual
- **Compra NO dia de fechamento ou DEPOIS:** Entra na fatura do próximo mês

### Nome da Fatura

**O nome da fatura é baseado no mês do VENCIMENTO, não no mês de fechamento.**

Exemplo:

- Fechamento: 30/10
- Vencimento: 10/11
- Nome: **"Fatura de Novembro"** ✅ (não "Fatura de Outubro")

### Exemplos Práticos

#### Exemplo 1: Fechamento dia 30, Vencimento dia 10

- **Compra no dia 20/08:**
  - Entra na fatura que fecha em 30/08
  - Vence em 10/09
  - Nome: **"Fatura de Setembro"** ✅
- **Compra no dia 30/08:**
  - Entra na fatura que fecha em 30/09
  - Vence em 10/10
  - Nome: **"Fatura de Outubro"** ✅

#### Exemplo 2: Fechamento dia 5, Vencimento dia 15

- **Compra no dia 03/10:**
  - Entra na fatura que fecha em 05/10
  - Vence em 15/10
  - Nome: **"Fatura de Outubro"** ✅
- **Compra no dia 05/10:**
  - Entra na fatura que fecha em 05/11
  - Vence em 15/11
  - Nome: **"Fatura de Novembro"** ✅

### Quando uma transação aparece em uma fatura?

Considerando um cartão com **dia de fechamento = 30**:

#### Exemplo 1: Transação no dia 20/08

- Data da transação: 20/08/2024
- Dia da transação (20) < Dia de fechamento (30)? **SIM**
- **Resultado:** Aparece na fatura de **Agosto/2024**

#### Exemplo 2: Transação no dia 30/08 (dia de fechamento)

- Data da transação: 30/08/2024
- Dia da transação (30) >= Dia de fechamento (30)? **SIM**
- **Resultado:** Aparece na fatura de **Setembro/2024**

#### Exemplo 3: Transação no dia 31/08

- Data da transação: 31/08/2024
- Dia da transação (31) >= Dia de fechamento (30)? **SIM**
- **Resultado:** Aparece na fatura de **Setembro/2024**

## Status da Fatura

### Fatura Aberta

Uma fatura está **aberta** quando ainda é possível adicionar transações nela (antes do dia de fechamento).

### Fatura Fechada

Uma fatura está **fechada** quando o dia de fechamento já passou, mas ainda não venceu.

### Visibilidade da Fatura

Uma fatura permanece **visível** até o dia do vencimento. No dia seguinte ao vencimento, ela deixa de aparecer na lista de faturas abertas.

### Exemplo de Status

Considerando:

- Dia de fechamento: **5**
- Dia de vencimento: **10**
- Fatura de Novembro/2024 (período: 05/10 a 04/11, fecha em 05/11)

**Timeline:**

- **05/10 a 04/11:** Fatura está **ABERTA** (pode adicionar transações)
- **05/11 a 10/11:** Fatura está **FECHADA** (não pode adicionar mais transações, mas ainda visível)
- **11/11 em diante:** Fatura **NÃO APARECE** mais na lista (passou do vencimento)

## Implementação

### Frontend: `app/(app)/credit-card-bills/page.tsx`

```typescript
// Se a transação é ANTES do dia de fechamento, pertence à fatura do mês ATUAL
// Se a transação é NO ou APÓS o dia de fechamento, pertence à fatura do PRÓXIMO mês
if (transactionDay < settings.closingDay) {
  // Pertence à fatura do mês atual (que fecha neste mês)
} else {
  // Pertence à fatura do próximo mês (que fecha no próximo mês)
  billMonth += 1;
  if (billMonth > 11) {
    billMonth = 0;
    billYear += 1;
  }
}

// Fatura está fechada se hoje > dia de fechamento
const isClosed = today > closingDate;

// Fatura é visível até o dia do vencimento
const isOpen = today <= dueDate;
```

### Backend: `app/api/credit-cards/installments/route.ts`

```typescript
// Se a compra é ANTES do dia de fechamento, pertence à fatura do mês ATUAL
// Se a compra é NO ou APÓS o dia de fechamento, pertence à fatura do PRÓXIMO mês
if (purchaseDay < closingDay) {
  // Pertence à fatura do mês atual (que fecha neste mês)
} else {
  // Pertence à fatura do próximo mês (que fecha no próximo mês)
  firstInstallmentMonth += 1;
  if (firstInstallmentMonth > 11) {
    firstInstallmentMonth = 0;
    firstInstallmentYear += 1;
  }
}
```

## Fluxo de Parcelamento

Quando uma compra parcelada é criada:

1. A data de compra (`purchaseDate`) é armazenada
2. Cada parcela recebe uma data (`date`) calculada baseada no período da fatura
3. A primeira parcela segue a regra acima
4. As parcelas seguintes são criadas nos meses subsequentes

### Exemplo de Parcelamento

Compra de R$ 1.200,00 em 12x no dia 20/08/2024, com fechamento no dia 30:

- Dia da compra (20) < Dia de fechamento (30)? **SIM**
- Primeira parcela: **Agosto/2024** (compra em 20/08)
- Segunda parcela: **Setembro/2024** (compra em 20/09)
- Terceira parcela: **Outubro/2024** (compra em 20/10)
- ... e assim por diante

Se a mesma compra fosse feita no dia 30/08/2024:

- Dia da compra (30) >= Dia de fechamento (30)? **SIM**
- Primeira parcela: **Setembro/2024** (compra em 30/08)
- Segunda parcela: **Outubro/2024** (compra em 30/09)
- Terceira parcela: **Novembro/2024** (compra em 30/10)
- ... e assim por diante

## UI/UX

### Chip de Status

- **Aberta** (verde): Fatura ainda pode receber transações
- **Fechada** (vermelho): Fatura fechada, aguardando vencimento

### Informações Exibidas

- Data de fechamento
- Data de vencimento
- Valor total da fatura
- Lista de transações agrupadas por tipo (assinaturas, parceladas, à vista)

## Resumo Visual

```
Fatura de Novembro/2024 (Fechamento dia 5, Vencimento dia 10):

Período: 05/10/2024 até 04/11/2024
         └─────────────────────────┘
         Transações incluídas

Fecha em: 05/11/2024
Vence em: 10/11/2024

Timeline:
├─ 05/10 ─────────────────────────┐
│  Início do período               │
│                                  │ ABERTA ✅
│  Transações do período           │ (chip verde)
│                                  │
├─ 04/11 ─────────────────────────┤
│  Fim do período                  │
├─ 05/11 ─────────────────────────┤
│  Fechamento da fatura            │
│                                  │ FECHADA 🔒
│  Aguardando vencimento           │ (chip vermelho)
│                                  │
├─ 10/11 ─────────────────────────┤
│  Vencimento                      │
├─ 11/11 ─────────────────────────┘
   Fatura não aparece mais
```
