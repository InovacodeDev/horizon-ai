# Overview Page (Dashboard)

Dashboard principal da aplicação - primeira página após login.

## Rota

`/overview`

## Propósito

Fornecer uma visão geral consolidada da situação financeira do usuário.

## Componentes Principais

### 1. Resumo Financeiro (Cards Superiores)

**Total em Contas**:

- Soma de saldos de todas as contas
- Inclui contas compartilhadas (se habilitado)
- Atualização em tempo real via Realtime
- Indicador de variação vs mês anterior

**Receitas do Mês**:

- Total de receitas confirmadas
- Comparação com mês anterior (%)
- Gráfico sparkline de tendência
- Próximas receitas esperadas

**Despesas do Mês**:

- Total de despesas confirmadas
- Comparação com mês anterior (%)
- Gráfico sparkline de tendência
- Alerta se acima da média

**Saldo Projetado**:

- Projeção para fim do mês
- Baseado em transações recorrentes
- Considera receitas/despesas futuras
- Alerta se ficará negativo

### 2. Gráfico de Fluxo de Caixa

**Visualização**:

- Gráfico de linha (últimos 6 meses)
- Linha verde: Receitas
- Linha vermelha: Despesas
- Linha azul: Saldo acumulado

**Interatividade**:

- Hover mostra valores exatos
- Click em ponto mostra transações do mês
- Zoom para ver mais detalhes
- Export para PNG/CSV

**Dados Exibidos**:

```typescript
[
  { month: 'Jan', income: 5000, expenses: 3500, balance: 1500 },
  { month: 'Fev', income: 5200, expenses: 3800, balance: 1400 },
  // ...
];
```

### 3. Transações Recentes

**Lista**:

- Últimas 10 transações
- Ordenadas por data (mais recentes primeiro)
- Ícone da categoria
- Valor colorido (verde receita, vermelho despesa)

**Informações por Transação**:

- Descrição
- Categoria
- Conta
- Valor
- Data
- Status (confirmada/pendente)

**Ações Rápidas**:

- Editar transação
- Deletar transação
- Ver detalhes
- Duplicar

**Link**: "Ver todas" → `/transactions`

### 4. Gastos por Categoria

**Gráfico de Pizza**:

- Top 5 categorias de despesas
- Percentual de cada categoria
- Cores distintas por categoria
- Legenda interativa

**Detalhes ao Hover**:

- Nome da categoria
- Valor total
- Percentual do total
- Quantidade de transações

**Link**: "Ver detalhes" → `/analytics`

### 5. Contas Bancárias

**Cards de Contas**:

- Nome da conta
- Tipo (corrente, poupança, investimento)
- Saldo atual
- Logo do banco (se disponível)
- Badge "Compartilhada" (se aplicável)

**Ações por Conta**:

- Ver transações
- Adicionar transação
- Editar conta
- Ver detalhes

**Botão**: "Gerenciar contas" → `/accounts`

### 6. Cartões de Crédito

**Cards de Cartões**:

- Nome do cartão
- Últimos 4 dígitos
- Fatura atual (valor)
- Limite disponível
- Barra de progresso (uso do limite)

**Alertas**:

- Vermelho: > 80% do limite
- Amarelo: 50-80% do limite
- Verde: < 50% do limite

**Link**: "Ver faturas" → `/credit-card-bills`

### 7. Metas Financeiras (Se houver)

**Progresso de Metas**:

- Nome da meta
- Valor alvo
- Valor atual
- Percentual atingido
- Prazo restante

**Visualização**:

- Barra de progresso
- Ícone da meta
- Estimativa de conclusão

**Link**: "Gerenciar metas" → `/planning-goals`

### 8. Alertas e Notificações

**Tipos de Alerta**:

- Fatura vencendo em 3 dias
- Saldo baixo (< R$ 100)
- Meta próxima de ser atingida
- Transação duplicada detectada
- Gasto acima da média

**Ações**:

- Marcar como lido
- Ver detalhes
- Resolver agora
- Ignorar

## Dados Carregados

### Server Component (SSR)

```typescript
// Dados carregados no servidor
const user = await verifyAuth();
const accounts = await accountService.list(user.id);
const recentTransactions = await transactionService.list({
  user_id: user.id,
  limit: 10,
  order: 'desc',
});
const monthlyStats = await analyticsService.getMonthlyStats(user.id);
```

### Client Component (Realtime)

```typescript
// Atualização em tempo real
useAppwriteRealtime(
  [`databases.${DB}.collections.accounts.documents`, `databases.${DB}.collections.transactions.documents`],
  (event) => {
    // Atualiza UI automaticamente
  },
);
```

## Performance

### Otimizações

1. **Server Components**: Renderiza no servidor
2. **Streaming**: Envia HTML progressivamente
3. **Suspense**: Carrega componentes independentemente
4. **Cache**: Dados cacheados por 1 minuto
5. **Prefetch**: Prefetch de páginas linkadas

### Loading States

```typescript
<Suspense fallback={<SkeletonCard />}>
  <AccountsWidget />
</Suspense>

<Suspense fallback={<SkeletonChart />}>
  <CashFlowChart />
</Suspense>
```

### Métricas Alvo

- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)
- **TTI**: < 3.5s (Time to Interactive)

## Responsividade

### Desktop (> 1024px)

- Layout em grid 3 colunas
- Gráficos lado a lado
- Sidebar visível

### Tablet (768px - 1024px)

- Layout em grid 2 colunas
- Gráficos empilhados
- Sidebar colapsável

### Mobile (< 768px)

- Layout em coluna única
- Cards empilhados
- Navegação bottom bar
- Gráficos simplificados

## Acessibilidade

- Landmarks semânticos (main, aside, nav)
- Headings hierárquicos (h1, h2, h3)
- Labels em gráficos
- Alternativas textuais para visualizações
- Navegação por teclado
- Anúncios de mudanças dinâmicas

## Segurança

### Proteções

- Dados sensíveis mascarados por padrão
- Opção "Ocultar valores" (toggle)
- Timeout de sessão (15 min inatividade)
- Reautenticação para ações sensíveis

### Permissões

- Usuário vê apenas seus dados
- Dados compartilhados marcados claramente
- Ações restritas por permissão (read/write)

## Personalização

### Configurações Disponíveis

**Widgets**:

- Mostrar/ocultar widgets
- Reordenar widgets (drag & drop)
- Tamanho dos widgets

**Período**:

- Últimos 7 dias
- Últimos 30 dias
- Últimos 3 meses
- Últimos 6 meses
- Ano atual

**Filtros**:

- Incluir contas compartilhadas
- Incluir transações pendentes
- Categorias específicas

## Ações Rápidas

**Botões Flutuantes**:

- ➕ Nova transação
- 📊 Ver relatório
- 🔄 Sincronizar dados
- ⚙️ Configurações

**Atalhos de Teclado**:

- `N`: Nova transação
- `R`: Atualizar página
- `S`: Buscar
- `/`: Foco na busca

## Analytics

**Eventos Rastreados**:

- `dashboard_viewed`: Usuário acessou dashboard
- `widget_clicked`: Click em widget
- `quick_action_used`: Uso de ação rápida
- `filter_applied`: Aplicação de filtro

## Testes

### Casos de Teste

1. Renderização com dados
2. Renderização sem dados (empty state)
3. Atualização em tempo real
4. Responsividade
5. Acessibilidade
6. Performance (Lighthouse)

### Comandos

```bash
pnpm test:dashboard
```

## Melhorias Futuras

- [ ] Widgets customizáveis
- [ ] Temas personalizados
- [ ] Comparação com outros usuários (anônimo)
- [ ] Insights com IA
- [ ] Recomendações personalizadas
- [ ] Export de relatórios
- [ ] Modo offline
