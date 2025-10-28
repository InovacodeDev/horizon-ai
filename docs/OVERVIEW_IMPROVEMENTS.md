# Melhorias na Tela de Overview (Home)

## Visão Geral

A tela de overview foi atualizada para exibir corretamente as transações e resumos financeiros baseados nas transações vinculadas às contas do usuário.

## Mudanças Implementadas

### 1. Loading Automático de Transações

Transações são carregadas automaticamente ao acessar a página.

```typescript
useEffect(() => {
  if (userId) {
    refetch();
  }
}, [userId, refetch]);
```

**Benefícios:**

- Dados sempre atualizados ao acessar a página
- Sincronização automática com o backend
- Melhor experiência do usuário

### 2. Integração com Sistema de Categorias

Agora usa o novo sistema de categorias com ícones.

```typescript
// Get icon for category using new category system
const category = getCategoryById(apiTx.category || '');
const categoryIcon = category?.icon || fallbackIcon;
```

**Benefícios:**

- Ícones consistentes em toda a aplicação
- Nomes de categorias traduzidos
- Fallback para categorias antigas

### 3. Filtro por Contas do Usuário

Métricas calculadas apenas com transações das contas do usuário.

```typescript
// Get user's account IDs
const userAccountIds = new Set(accounts.map((acc) => acc.$id));

// Filter transactions to only include those from user's accounts
const userTransactions = apiTransactions.filter((tx) => tx.account_id && userAccountIds.has(tx.account_id));
```

**Benefícios:**

- Dados precisos e relevantes
- Evita contabilizar transações de outras contas
- Métricas corretas por mês

### 4. Transações Manuais vs Importadas

Todas as transações criadas manualmente são marcadas corretamente.

#### Transações Manuais (`source: 'manual'`)

**Criadas em:**

1. Modal de adicionar transação
2. Saldo inicial ao criar conta
3. Qualquer transação criada via `createManualTransaction()`

**Código:**

```typescript
// TransactionService.createManualTransaction()
const transactionData: any = {
  category: data.category,
  description: data.description,
  currency: data.currency,
  source: 'manual', // ← Marcado como manual
};
```

#### Transações Importadas (`source: 'integration'`)

**Criadas em:**

1. Importação de integrações bancárias
2. Qualquer transação criada via `createIntegrationTransaction()`

**Código:**

```typescript
// TransactionService.createIntegrationTransaction()
const transactionData: any = {
  category: data.category,
  description: data.description,
  currency: data.currency,
  source: 'integration', // ← Marcado como integração
};
```

## Métricas Exibidas

### 1. Total Balance

Soma do saldo de todas as contas do usuário.

### 2. Income (Receitas)

Total de transações do tipo `income` no mês atual.

### 3. Expenses (Despesas)

Total de transações do tipo `expense` no mês atual (exibido como negativo).

### 4. Net (Líquido)

Diferença entre receitas e despesas: `income + expenses`

### 5. Comparação com Mês Anterior

Percentual de variação em relação ao mês anterior.

## Gráfico de Barras

Exibe os últimos 6 meses com:

- Barras verdes: Receitas
- Barras vermelhas: Despesas
- Eixo Y: Valores formatados (ex: 5k = R$ 5.000)

```typescript
const chartData = useMemo(() => {
  const lastSixMonths = getLastSixMonths();
  return lastSixMonths.map((monthKey) => {
    const monthData = monthlyMetrics.transactionsByMonth[monthKey] || {
      income: 0,
      expenses: 0,
    };
    return {
      month: getMonthName(monthKey),
      income: monthData.income,
      expenses: monthData.expenses,
    };
  });
}, [monthlyMetrics]);
```

## Últimas Transações

Exibe as 5 transações mais recentes com:

- Ícone da categoria
- Descrição
- Nome da conta
- Valor formatado (verde para receitas, vermelho para despesas)

## Insights Financeiros (AI)

Gerados automaticamente baseados nas transações reais:

- Oportunidades de economia
- Gastos incomuns
- Previsões de fluxo de caixa

```typescript
const aiInsights = useFinancialInsights(apiTransactions);
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    Overview Page                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   useTransactions Hook                       │
│  • Busca transações do usuário                              │
│  • Filtra por userId                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Filter by Accounts                         │
│  • Pega IDs das contas do usuário                           │
│  • Filtra transações por account_id                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Calculate Metrics                          │
│  • Agrupa por mês                                            │
│  • Soma receitas e despesas                                  │
│  • Calcula variações                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Display Results                            │
│  • Cards com métricas                                        │
│  • Gráfico de barras                                         │
│  • Lista de transações                                       │
│  • Insights AI                                               │
└─────────────────────────────────────────────────────────────┘
```

## Validação de Dados

### Transações Consideradas

✅ Transações com `account_id` válido
✅ Transações vinculadas às contas do usuário
✅ Transações com data válida
✅ Transações com tipo válido (income/expense)

### Transações Ignoradas

❌ Transações sem `account_id`
❌ Transações de contas de outros usuários
❌ Transações com dados inválidos

## Exemplo de Cálculo

### Cenário:

- Conta A: R$ 1.000,00
- Conta B: R$ 500,00
- Transações do mês:
  - +R$ 3.000,00 (Salário - Conta A)
  - -R$ 500,00 (Supermercado - Conta A)
  - -R$ 200,00 (Transporte - Conta B)

### Resultado:

```
Total Balance: R$ 1.500,00 (soma dos saldos)
Income: R$ 3.000,00
Expenses: -R$ 700,00
Net: R$ 2.300,00
```

## Formatação de Valores

### Moeda Brasileira

```typescript
value.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
// Resultado: R$ 1.234,56
```

### Valores Compactos (Gráfico)

```typescript
if (value >= 1000) {
  return `${(value / 1000).toFixed(0)}k`;
}
// Resultado: 5k (para R$ 5.000)
```

### Percentuais

```typescript
const percentChange = ((current - previous) / previous) * 100;
// Resultado: +15.5% ou -8.2%
```

## Estados de Loading

### Loading Inicial

```typescript
if (isLoadingTransactions || loadingBalance) {
  return <OverviewScreenSkeleton />;
}
```

### Sem Transações

```typescript
if (!hasTransactions) {
  return <EmptyState />;
}
```

### Com Dados

Exibe todos os cards, gráfico e lista de transações.

## Boas Práticas

### 1. Sempre Filtrar por Contas do Usuário

```typescript
const userAccountIds = new Set(accounts.map((acc) => acc.$id));
const userTransactions = transactions.filter((tx) => tx.account_id && userAccountIds.has(tx.account_id));
```

### 2. Usar useMemo para Cálculos Pesados

```typescript
const monthlyMetrics = useMemo(() => {
  // Cálculos complexos aqui
}, [apiTransactions, accounts]);
```

### 3. Carregar Dados Automaticamente

```typescript
useEffect(() => {
  if (userId) {
    refetch();
  }
}, [userId, refetch]);
```

### 4. Tratar Casos de Dados Vazios

```typescript
const currentMonth = transactionsByMonth[currentMonthKey] || {
  income: 0,
  expenses: 0,
};
```

## Troubleshooting

### Métricas Incorretas

**Problema:** Valores não batem com as transações
**Solução:**

1. Verificar se transações têm `account_id`
2. Verificar se contas pertencem ao usuário
3. Verificar filtro por mês

### Transações Não Aparecem

**Problema:** Transações criadas não aparecem na overview
**Solução:**

1. Verificar se `refetch()` foi chamado
2. Verificar se transação tem `account_id`
3. Verificar se conta pertence ao usuário

### Gráfico Vazio

**Problema:** Gráfico não exibe dados
**Solução:**

1. Verificar se há transações nos últimos 6 meses
2. Verificar se transações têm data válida
3. Verificar console para erros

### Categorias Sem Ícone

**Problema:** Categorias antigas sem ícone
**Solução:**

1. Sistema usa fallback automático
2. Migrar categorias antigas para novo sistema
3. Usar `getCategoryById()` para buscar categoria

## Próximas Melhorias

- [ ] Cache de métricas para melhor performance
- [ ] Filtros de período personalizados
- [ ] Exportação de relatórios
- [ ] Comparação entre períodos
- [ ] Gráficos adicionais (pizza, linha)
- [ ] Insights AI mais avançados
- [ ] Notificações de gastos incomuns
- [ ] Metas financeiras na overview
