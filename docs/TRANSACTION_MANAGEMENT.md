# Gerenciamento de Transações

## Visão Geral

O sistema de gerenciamento de transações permite criar, visualizar, editar e excluir transações manualmente. Transações importadas de integrações não podem ser editadas ou excluídas.

## Funcionalidades

### 1. Loading Inicial

Ao acessar a página de transações, um skeleton loader é exibido enquanto as transações são carregadas do servidor.

```tsx
// Loading automático ao montar o componente
useEffect(() => {
  if (userId) {
    refetch();
  }
}, [userId, refetch]);
```

**Comportamento:**

- Skeleton loader exibido durante o carregamento inicial
- Transações carregadas automaticamente ao acessar a página
- Loading state gerenciado pelo hook `useTransactions`

### 2. Criar Transação

Permite criar novas transações manualmente com todos os campos necessários.

**Campos:**

- Descrição (obrigatório)
- Tipo: Despesa ou Receita (obrigatório)
- Valor com máscara R$ (obrigatório)
- Data (obrigatório)
- Conta (obrigatório)
- Cartão de Crédito (opcional, apenas se conta selecionada)
- Categoria com ícone (obrigatório)
- Tipo de Pagamento (obrigatório)
- Observações (opcional)

**Fluxo:**

1. Clicar em "Add Transaction"
2. Preencher formulário
3. Clicar em "Save Transaction"
4. Transação criada com `source: 'manual'`
5. Balance da conta atualizado automaticamente

### 3. Visualizar Detalhes

Ao clicar em uma transação, um modal exibe todos os detalhes.

**Informações Exibidas:**

- Descrição
- Valor formatado
- Data completa
- Categoria
- Conta
- Tipo de pagamento
- Observações (se houver)
- Badge "Importada" (se não for manual)

**Ações Disponíveis:**

- **Transações Manuais:** Editar e Excluir
- **Transações Importadas:** Apenas visualizar

### 4. Editar Transação

Apenas transações manuais podem ser editadas.

**Validação:**

```typescript
if (transaction.source !== 'manual') {
  alert('Apenas transações manuais podem ser editadas');
  return;
}
```

**Campos Editáveis:**

- Descrição
- Tipo (Despesa/Receita)
- Valor
- Data
- Conta
- Categoria

**Fluxo:**

1. Abrir detalhes da transação
2. Clicar em "Editar"
3. Modificar campos desejados
4. Clicar em "Salvar Alterações"
5. Balance recalculado automaticamente

**Nota:** Ao mudar a conta, o balance de ambas as contas (antiga e nova) é recalculado.

### 5. Excluir Transação

Apenas transações manuais podem ser excluídas.

**Validação:**

```typescript
if (transaction.source !== 'manual') {
  alert('Apenas transações manuais podem ser removidas');
  return;
}
```

**Fluxo:**

1. Abrir detalhes da transação
2. Clicar em "Excluir"
3. Confirmar exclusão no modal
4. Transação removida
5. Balance da conta recalculado automaticamente

**Modal de Confirmação:**

- Exibe detalhes da transação a ser excluída
- Aviso: "Esta ação não pode ser desfeita e o saldo da conta será recalculado"
- Botões: Cancelar ou Excluir Transação

## Diferença entre Transações Manuais e Importadas

### Transações Manuais

- `source: 'manual'`
- Criadas pelo usuário na interface
- **Podem ser editadas**
- **Podem ser excluídas**
- Afetam o balance da conta

### Transações Importadas

- `source: 'integration'` ou `source: 'import'`
- Importadas de integrações bancárias
- **NÃO podem ser editadas**
- **NÃO podem ser excluídas**
- Badge "Importada" exibido nos detalhes
- Afetam o balance da conta

## Sincronização de Balance

Todas as operações de transação sincronizam automaticamente o balance da conta através do `BalanceSyncService`.

### Quando o Balance é Atualizado:

1. **Criar Transação:**
   - Balance da conta aumenta (receita) ou diminui (despesa)

2. **Editar Transação:**
   - Se valor mudou: balance recalculado
   - Se conta mudou: balance de ambas as contas recalculado
   - Se tipo mudou (receita ↔ despesa): balance recalculado

3. **Excluir Transação:**
   - Balance da conta recalculado sem a transação

## Componentes Utilizados

### CurrencyInput

Input com máscara monetária brasileira.

```tsx
<CurrencyInput
  label="Valor"
  value={amount}
  onChange={(value) => setAmount(value)}
  required
/>
```

### CategorySelect

Seletor de categoria com ícone visual.

```tsx
<CategorySelect
  label="Categoria"
  value={categoryId}
  onChange={(categoryId) => setCategory(categoryId)}
  type="expense" // ou "income"
  required
/>
```

### Modal

Modal reutilizável para formulários e confirmações.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título"
>
  {/* Conteúdo */}
</Modal>
```

## Hook useTransactions

Hook personalizado para gerenciar transações com updates otimistas.

```typescript
const {
  transactions, // Lista de transações
  loading, // Estado de loading
  error, // Mensagem de erro
  createTransaction, // Criar transação
  updateTransaction, // Editar transação
  deleteTransaction, // Excluir transação
  refetch, // Recarregar transações
} = useTransactions({ userId });
```

### Métodos:

#### createTransaction

```typescript
await createTransaction({
  amount: 100.0,
  type: 'expense',
  category: 'food',
  description: 'Almoço',
  date: new Date().toISOString(),
  currency: 'BRL',
  account_id: accountId,
});
```

#### updateTransaction

```typescript
await updateTransaction(transactionId, {
  amount: 150.0,
  category: 'transport',
  description: 'Uber',
});
```

#### deleteTransaction

```typescript
await deleteTransaction(transactionId);
```

## Estados do Componente

```typescript
// Modais
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

// Transações selecionadas
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

// Formulário
const [newTransaction, setNewTransaction] = useState({
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  category: '',
  flow: 'expense',
  accountId: '',
  // ...
});
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    Página de Transações                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   useTransactions Hook                       │
│  • Gerencia estado das transações                           │
│  • Updates otimistas                                         │
│  • Chamadas à API                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes                                │
│  • /api/transactions (GET, POST)                            │
│  • /api/transactions/[id] (PATCH, DELETE)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 TransactionService                           │
│  • createManualTransaction()                                 │
│  • updateTransaction()                                       │
│  • deleteTransaction()                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 BalanceSyncService                           │
│  • syncAfterCreate()                                         │
│  • syncAfterUpdate()                                         │
│  • syncAfterDelete()                                         │
│  • syncAccountBalance() ← Recalcula balance                  │
└─────────────────────────────────────────────────────────────┘
```

## Tratamento de Erros

### Validação no Frontend

- Campos obrigatórios validados pelo HTML5
- Validação de tipo de transação (manual vs importada)
- Feedback visual com mensagens de erro

### Validação no Backend

- Validação de dados no TransactionService
- Verificação de permissões
- Tratamento de erros de banco de dados

### Feedback ao Usuário

```typescript
try {
  await updateTransaction(id, data);
  // Sucesso: modal fecha automaticamente
} catch (error) {
  console.error('Error updating transaction:', error);
  // Erro: exibido no console e rollback otimista
}
```

## Boas Práticas

1. **Sempre verificar source antes de editar/excluir:**

   ```typescript
   if (transaction.source !== 'manual') {
     alert('Apenas transações manuais podem ser editadas');
     return;
   }
   ```

2. **Usar updates otimistas para melhor UX:**
   - UI atualiza imediatamente
   - Rollback automático em caso de erro

3. **Recarregar dados após operações:**

   ```typescript
   await createTransaction(data);
   await refetch(); // Garante dados sincronizados
   ```

4. **Fechar modais após sucesso:**

   ```typescript
   await updateTransaction(id, data);
   setIsEditModalOpen(false);
   setTransactionToEdit(null);
   ```

5. **Limpar estado ao fechar modais:**
   ```typescript
   const handleCloseModal = () => {
     setIsAddModalOpen(false);
     setNewTransaction(initialState);
   };
   ```

## Exemplos de Uso

### Criar Transação de Despesa

```typescript
await createTransaction({
  amount: 50.0,
  type: 'expense',
  category: 'food',
  description: 'Almoço no restaurante',
  date: new Date().toISOString(),
  currency: 'BRL',
  account_id: 'account123',
});
```

### Editar Valor da Transação

```typescript
await updateTransaction('transaction456', {
  amount: 75.0,
});
```

### Excluir Transação

```typescript
await deleteTransaction('transaction789');
```

## Troubleshooting

### Transação não aparece após criar

- Verificar se `refetch()` foi chamado
- Verificar console para erros
- Verificar se userId está correto

### Não consigo editar transação

- Verificar se `source === 'manual'`
- Transações importadas não podem ser editadas

### Balance não atualiza

- Verificar se BalanceSyncService está funcionando
- Verificar logs do servidor
- Forçar recálculo com `syncAccountBalance()`

### Modal não fecha após salvar

- Verificar se há erro na requisição
- Verificar se `setIsModalOpen(false)` está sendo chamado
- Verificar console para erros
