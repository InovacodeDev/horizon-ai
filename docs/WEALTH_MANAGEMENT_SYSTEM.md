# Sistema de Gestão Patrimonial (Wealth Management)

## Visão Geral

Sistema completo para gerenciar investimentos e faturas de cartão de crédito, incluindo parcelamentos automáticos e cálculo de rentabilidade.

## 1. Total Balance Corrigido

### Problema Resolvido

O Total Balance na home agora é calculado corretamente como a soma dos saldos de todas as contas do usuário.

```typescript
// Cálculo correto do Total Balance
const totalBalance = useMemo(() => {
  return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
}, [accounts]);
```

**Antes:** Usava hook `useTotalBalance` que não funcionava corretamente
**Depois:** Calcula diretamente a partir das contas carregadas

## 2. Sistema de Investimentos

### Estrutura de Dados

#### Investment Interface

```typescript
interface Investment {
  $id: string;
  user_id: string;
  account_id: string; // Conta vinculada
  name: string; // Nome do investimento
  type: InvestmentType; // Tipo do investimento
  ticker?: string; // Código do ativo (PETR4, BTCUSD)
  quantity: number; // Quantidade
  purchase_price: number; // Preço de compra unitário
  purchase_date: string; // Data da compra
  current_price: number; // Preço atual unitário
  status: 'active' | 'sold' | 'matured';
  data?: string; // JSON com dados adicionais
}
```

#### Tipos de Investimento

- **Ações** (`stocks`): Ações da bolsa brasileira
- **FIIs** (`fiis`): Fundos de Investimento Imobiliário
- **Renda Fixa** (`fixed_income`): CDB, LCI, LCA, Tesouro Direto
- **Criptomoedas** (`crypto`): Bitcoin, Ethereum, etc.
- **Fundos** (`funds`): Fundos de investimento
- **ETFs** (`etf`): Exchange Traded Funds
- **Previdência** (`pension`): Previdência privada
- **Outros** (`other`): Outros tipos

### Funcionalidades

#### Cálculo Automático de Rentabilidade

```typescript
const totalInvested = quantity * purchase_price;
const currentValue = quantity * current_price;
const gain = currentValue - totalInvested;
const gainPercentage = (gain / totalInvested) * 100;
```

#### Resumo por Tipo

- Total investido por categoria
- Valor atual por categoria
- Ganho/perda por categoria
- Percentual de rentabilidade por categoria

#### Interface da Página

- **Cards de Resumo**: Total investido, valor atual, ganho/perda, rentabilidade
- **Filtros**: Busca por nome/ticker, filtro por tipo
- **Tabela Detalhada**: Lista todos os investimentos com métricas
- **Modal de Adição**: Formulário para adicionar novos investimentos

## 3. Sistema de Faturas de Cartão de Crédito

### Estrutura de Dados

#### CreditCardBill (Fatura)

```typescript
interface CreditCardBill {
  $id: string;
  credit_card_id: string;
  user_id: string;
  due_date: string; // Data de vencimento
  closing_date: string; // Data de fechamento
  total_amount: number; // Valor total da fatura
  paid_amount: number; // Valor pago
  status: 'open' | 'closed' | 'paid' | 'overdue';
}
```

#### InstallmentPlan (Plano de Parcelamento)

```typescript
interface InstallmentPlan {
  $id: string;
  transaction_id: string; // Transação original
  credit_card_id: string;
  user_id: string;
  total_amount: number; // Valor total parcelado
  installments: number; // Número de parcelas
  current_installment: number; // Parcela atual
  installment_amount: number; // Valor da parcela regular
  first_installment_amount: number; // Primeira parcela (absorve centavos)
  start_date: string; // Data da primeira parcela
  status: 'active' | 'completed' | 'cancelled';
}
```

#### CreditCardTransaction (Transação na Fatura)

```typescript
interface CreditCardTransaction {
  $id: string;
  transaction_id: string; // ID da transação original
  credit_card_bill_id: string; // Fatura vinculada
  installment_plan_id?: string; // Plano de parcelamento (se aplicável)
  amount: number; // Valor da transação/parcela
  installment_number?: number; // Número da parcela (1, 2, 3...)
  description: string;
  date: string; // Data da transação
}
```

### Lógica de Faturas

#### Distribuição de Transações

```typescript
// Lógica para determinar em qual fatura a transação vai
const currentClosingDate = getNextClosingDate(closingDay, purchaseDate);
const shouldUseNextBill = purchaseDate > currentClosingDate;
```

#### Cálculo de Parcelas

```typescript
// Distribui o valor total em parcelas iguais
// A primeira parcela absorve os centavos restantes
const baseAmount = Math.floor((totalAmount * 100) / installments) / 100;
const remainder = Math.round((totalAmount - (baseAmount * installments)) * 100) / 100;

return {
  firstInstallmentAmount: baseAmount + remainder,
  regularInstallmentAmount: baseAmount,
};
```

**Exemplo:**

- Compra de R$ 1.000,00 em 3x
- Parcela base: R$ 333,33
- Resto: R$ 0,01
- Resultado: 1ª parcela R$ 333,34 + 2x R$ 333,33

## 4. Migrations

### Migration 13: Investments Table

Cria tabela de investimentos com campos básicos, quantidade, preços, vinculação com conta e índices.

### Migration 14: Credit Card Bills Tables

Cria 3 tabelas:

- **credit_card_bills**: Faturas do cartão
- **installment_plans**: Planos de parcelamento
- **credit_card_transactions**: Transações nas faturas

## 5. Estrutura de Arquivos

```
lib/
├── types/
│   ├── investment.types.ts
│   └── credit-card.types.ts
├── services/
│   └── credit-card-bill.service.ts
└── database/
    └── migrations/
        ├── 20251027_000013_create_investments_table.ts
        └── 20251027_000014_create_credit_card_bills_table.ts

app/(app)/
└── investments/
    └── page.tsx

docs/
└── WEALTH_MANAGEMENT_SYSTEM.md
```

## 6. Para Ativar

Execute as migrations:

```bash
npm run migrate
```
