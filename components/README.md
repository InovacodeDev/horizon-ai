# Components

Componentes React reutilizáveis da aplicação.

## Estrutura

### assets/

Componentes de assets visuais:

- **BankLogos.tsx** - Logos de bancos brasileiros
- **Icons.tsx** - Ícones SVG customizados

### examples/

Exemplos de uso de features do React 19:

- **React19FeaturesDemo.tsx** - Demonstração de novas features
- **AccountListOptimistic.tsx** - Exemplo de useOptimistic
- **TransactionListWithUse.tsx** - Exemplo do hook use()
- **CreateTransactionForm.tsx** - Exemplo de useFormStatus

### invoices/

Componentes relacionados a notas fiscais:

- **InvoiceCard.tsx** - Card de exibição de NFe
- **PriceComparisonTable.tsx** - Tabela de comparação de preços
- **PriceHistoryChart.tsx** - Gráfico de histórico de preços
- **ShoppingListBuilder.tsx** - Construtor de lista de compras

### layout/

Componentes de estrutura da aplicação:

- **Header.tsx** - Cabeçalho com navegação
- **Footer.tsx** - Rodapé
- **DashboardLayout.tsx** - Layout do dashboard

### modals/

Componentes de modais/dialogs:

- **AddAccountModal.tsx** - Modal para adicionar conta
- **AddTransactionModal.tsx** - Modal para adicionar transação
- **AddCreditCardModal.tsx** - Modal para adicionar cartão
- **InvoiceDetailsModal.tsx** - Modal de detalhes da NFe
- E outros modais...

### transactions/

Componentes específicos de transações:

- **ImportTransactionsModal.tsx** - Modal de importação
- **ImportPreview.tsx** - Preview de importação
- **ImportHistory.tsx** - Histórico de importações

### ui/

Componentes de UI base (design system):

- **Button.tsx** - Botão customizado
- **Input.tsx** - Input de texto
- **Modal.tsx** - Modal base
- **Card.tsx** - Card container
- **Spinner.tsx** - Loading spinner
- E outros componentes base...

### Arquivos Raiz

- **AccountBalanceDisplay.tsx** - Display de saldo de conta
- **CashFlowProjection.tsx** - Componente de projeção de fluxo de caixa
- **ProcessDueTransactions.tsx** - Processador de transações vencidas
