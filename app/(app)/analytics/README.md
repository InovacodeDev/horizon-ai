# Analytics Page

Dashboard de análises e insights financeiros.

## Rota
`/analytics`

## Propósito
Fornecer análises detalhadas e insights sobre a situação financeira do usuário.

## Funcionalidades

### 1. Gastos por Categoria
- Gráfico de pizza interativo
- Top 10 categorias
- Comparação com mês anterior
- Drill-down para transações

### 2. Tendências Mensais
- Gráfico de linha (12 meses)
- Receitas vs Despesas
- Saldo acumulado
- Projeções futuras

### 3. Comparação de Períodos
- Mês atual vs anterior
- Trimestre vs trimestre
- Ano vs ano
- Variação percentual

### 4. Análise de Padrões
- Dia da semana com mais gastos
- Horário de maior consumo
- Estabelecimentos frequentes
- Categorias recorrentes

### 5. Metas e Objetivos
- Progresso de metas
- Economia vs planejado
- Alertas de desvio
- Sugestões de ajuste

### 6. Insights com IA
- Detecção de anomalias
- Sugestões de economia
- Previsão de gastos
- Recomendações personalizadas

## Dados Carregados
```typescript
const stats = await analyticsService.getStats(user.id);
const trends = await analyticsService.getTrends(user.id, 12);
const insights = await analyticsService.getInsights(user.id);
```

## Componentes
- SpendingByCategory
- MonthlyTrendsChart
- PeriodComparison
- InsightsPanel

## Testes
```bash
pnpm test:analytics
```
