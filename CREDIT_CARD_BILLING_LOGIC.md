# Lógica de Faturamento de Cartão de Crédito

## Regra de Fechamento de Fatura

A lógica de faturamento de cartão de crédito segue a seguinte regra:

### Período da Fatura

**Regra:** Uma fatura é nomeada pelo **mês em que fecha** e inclui todas as transações do **dia de fechamento do mês anterior** até o **dia anterior ao fechamento do mês atual**.

### Exemplos de Período

#### Exemplo 1: Fechamento no dia 5

- **Fatura de Novembro/2024:** Inclui transações de **05/10/2024** até **04/11/2024** (fecha em 05/11)
- **Fatura de Dezembro/2024:** Inclui transações de **05/11/2024** até **04/12/2024** (fecha em 05/12)

#### Exemplo 2: Fechamento no dia 30

- **Fatura de Novembro/2024:** Inclui transações de **30/10/2024** até **29/11/2024** (fecha em 30/11)
- **Fatura de Dezembro/2024:** Inclui transações de **30/11/2024** até **29/12/2024** (fecha em 30/12)

### Quando uma transação aparece em uma fatura?

Considerando um cartão com **dia de fechamento = 5**:

#### Exemplo 1: Transação no dia 10/10

- Data da transação: 10/10/2024
- Dia da transação (10) >= Dia de fechamento (5)? **SIM**
- **Resultado:** Aparece na fatura de **Novembro/2024** (período: 05/10 a 04/11, fecha em 05/11)

#### Exemplo 2: Transação no dia 03/11

- Data da transação: 03/11/2024
- Dia da transação (03) < Dia de fechamento (5)? **SIM**
- **Resultado:** Aparece na fatura de **Novembro/2024** (período: 05/10 a 04/11, fecha em 05/11)

#### Exemplo 3: Transação no dia 05/11 (exatamente no dia de fechamento)

- Data da transação: 05/11/2024
- Dia da transação (05) >= Dia de fechamento (5)? **SIM**
- **Resultado:** Aparece na fatura de **Dezembro/2024** (período: 05/11 a 04/12, fecha em 05/12)

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

Compra de R$ 1.200,00 em 12x no dia 22/10/2024, com fechamento no dia 5:

- Dia da compra (22) >= Dia de fechamento (5)? **SIM**
- Primeira parcela: **Novembro/2024** (data: 22/10/2024, período da fatura: 05/10 a 04/11, fecha em 05/11)
- Segunda parcela: **Dezembro/2024** (data: 22/11/2024, período da fatura: 05/11 a 04/12, fecha em 05/12)
- Terceira parcela: **Janeiro/2025** (data: 22/12/2024, período da fatura: 05/12 a 04/01, fecha em 05/01)
- ... e assim por diante

Se a mesma compra fosse feita no dia 03/11/2024:

- Dia da compra (03) < Dia de fechamento (5)? **SIM**
- Primeira parcela: **Novembro/2024** (data: 03/11/2024, período da fatura: 05/10 a 04/11, fecha em 05/11)
- Segunda parcela: **Dezembro/2024** (data: 03/12/2024, período da fatura: 05/11 a 04/12, fecha em 05/12)
- Terceira parcela: **Janeiro/2025** (data: 03/01/2025, período da fatura: 05/12 a 04/01, fecha em 05/01)
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
