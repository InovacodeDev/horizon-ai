# Projeção de Fluxo de Caixa

## Visão Geral

A funcionalidade de Projeção de Fluxo de Caixa permite visualizar as entradas e saídas previstas para o próximo mês, ajudando no planejamento financeiro.

## Funcionalidades

### 1. Projeções Automáticas

O sistema projeta automaticamente transações para o próximo mês baseado em:

- **Transações Recorrentes**: Despesas e receitas que se repetem regularmente
- **Transações Agendadas**: Pagamentos e recebimentos com status "pendente" programados para o próximo mês

### 2. Tipos de Recorrência Suportados

#### Mensal

Transações que ocorrem todo mês no mesmo dia.

- Exemplo: Aluguel, assinaturas, salário

#### Semanal

Transações que ocorrem semanalmente no mesmo dia da semana.

- Exemplo: Compras semanais, serviços recorrentes

#### Anual

Transações que ocorrem uma vez por ano.

- Exemplo: IPTU, IPVA, seguros anuais

#### Diária

Transações que ocorrem todos os dias.

- Exemplo: Despesas operacionais diárias

### 3. Visualização

A projeção exibe:

- **Entradas Previstas**: Total de receitas esperadas
- **Saídas Previstas**: Total de despesas esperadas
- **Saldo Projetado**: Saldo estimado ao final do mês
- **Lista Detalhada**: Todas as transações previstas com data, categoria e valor

## Como Usar

### Criar Transação Recorrente

1. Acesse a página de Transações
2. Clique em "Add Transaction"
3. Preencha os dados da transação
4. Marque a opção "Recorrente"
5. Selecione a frequência (mensal, semanal, anual, diária)
6. Defina a data de término (opcional)

### Agendar Transação

1. Acesse a página de Transações
2. Clique em "Add Transaction"
3. Preencha os dados da transação
4. Selecione uma data futura
5. O status será automaticamente definido como "pendente"

### Visualizar Projeções

As projeções aparecem automaticamente na página Overview quando há:

- Transações recorrentes configuradas
- Transações agendadas para o próximo mês

## Componentes

### CashFlowProjection

Componente React que exibe as projeções de forma visual e organizada.

**Props:**

- `currentBalance`: Saldo atual das contas
- `projectedTransactions`: Array de transações projetadas

### useProjections Hook

Hook customizado para buscar e gerenciar projeções.

**Retorna:**

- `projectedTransactions`: Array de transações projetadas
- `loading`: Estado de carregamento
- `error`: Mensagem de erro (se houver)
- `refetch`: Função para recarregar as projeções

## Actions

### getNextMonthProjections()

Busca todas as transações projetadas para o próximo mês.

**Retorna:**

```typescript
{
  projectedTransactions: ProjectedTransaction[];
  success: boolean;
  error?: string;
}
```

### getProjectionSummary()

Retorna um resumo das projeções.

**Retorna:**

```typescript
{
  totalIncome: number;
  totalExpenses: number;
  netProjection: number;
  transactionCount: number;
  success: boolean;
  error?: string;
}
```

## Exemplo de Uso

```typescript
import { useProjections } from '@/hooks/useProjections';
import CashFlowProjection from '@/components/CashFlowProjection';

function MyComponent() {
  const { projectedTransactions, loading } = useProjections();
  const currentBalance = 5000; // Seu saldo atual

  if (loading) return <div>Carregando...</div>;

  return (
    <CashFlowProjection
      currentBalance={currentBalance}
      projectedTransactions={projectedTransactions}
    />
  );
}
```

## Benefícios

1. **Planejamento Financeiro**: Visualize antecipadamente suas finanças
2. **Prevenção de Problemas**: Identifique possíveis déficits antes que ocorram
3. **Automação**: Não precisa calcular manualmente despesas recorrentes
4. **Visibilidade**: Veja todas as obrigações futuras em um só lugar

## Notas Técnicas

- As projeções são calculadas no servidor (Server Actions)
- Transações recorrentes são identificadas pelo campo `is_recurring`
- Transações agendadas têm status `pending`
- O cálculo considera o padrão de recorrência definido em `recurring_pattern`
- Datas de término são respeitadas automaticamente
