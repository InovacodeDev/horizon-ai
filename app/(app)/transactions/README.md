# Transactions Page

Gerenciamento completo de transações financeiras.

## Rota

`/transactions`

## Propósito

Visualizar, criar, editar e gerenciar todas as transações financeiras do usuário.

## Funcionalidades

### 1. Lista de Transações

**Visualização**:

- Tabela responsiva (desktop)
- Cards em lista (mobile)
- Paginação (50 por página)
- Scroll infinito (opcional)

**Colunas da Tabela**:

- Data
- Descrição
- Categoria (com ícone)
- Conta
- Valor (colorido: verde receita, vermelho despesa)
- Status (confirmada/pendente)
- Ações (editar, deletar)

**Agrupamento**:

- Por data (Hoje, Ontem, Esta semana, Este mês)
- Por categoria
- Por conta
- Por tipo (receita/despesa)

### 2. Filtros Avançados

**Filtros Disponíveis**:

**Período**:

- Hoje
- Esta semana
- Este mês
- Últimos 30 dias
- Últimos 3 meses
- Personalizado (data início/fim)

**Tipo**:

- Todas
- Receitas
- Despesas
- Transferências

**Conta**:

- Todas as contas
- Conta específica
- Múltiplas contas

**Categoria**:

- Todas
- Categoria específica
- Múltiplas categorias

**Status**:

- Todas
- Confirmadas
- Pendentes
- Recorrentes

**Valor**:

- Qualquer valor
- Maior que X
- Menor que X
- Entre X e Y

**Busca Textual**:

- Pesquisa em descrição
- Pesquisa em notas
- Pesquisa em tags

### 3. Adicionar Transação

**Modal de Criação**:

**Campos Obrigatórios**:

- Tipo (Receita/Despesa/Transferência)
- Valor (em reais)
- Data
- Conta
- Categoria

**Campos Opcionais**:

- Descrição
- Notas
- Tags
- Anexos (comprovantes)
- Recorrente (sim/não)
- Frequência (se recorrente)

**Tipos de Transação**:

**Receita**:

- Salário
- Freelance
- Investimentos
- Outros

**Despesa**:

- Alimentação
- Transporte
- Moradia
- Saúde
- Lazer
- Outros

**Transferência**:

- Entre contas próprias
- Para terceiros

**Validações**:

- Valor deve ser positivo
- Data não pode ser muito futura (> 1 ano)
- Conta deve existir
- Categoria deve ser válida

### 4. Editar Transação

**Modal de Edição**:

**Campos Editáveis**:

- Todos os campos da criação
- Pode mudar tipo (receita ↔ despesa)
- Pode mudar conta

**Restrições**:

- Apenas owner ou usuário com permissão write
- Transações de cartão de crédito têm regras especiais
- Transações recorrentes: editar uma ou todas

**Histórico de Edições**:

- Mostra quem editou
- Quando editou
- O que mudou

### 5. Deletar Transação

**Confirmação**:

- Modal de confirmação
- Aviso sobre impacto no saldo
- Opção de deletar recorrências futuras

**Soft Delete**:

- Marca como deletada
- Não remove do banco
- Pode ser recuperada (admin)

### 6. Transações Recorrentes

**Criar Recorrência**:

- Marca checkbox "Recorrente"
- Seleciona frequência:
  - Diária
  - Semanal
  - Quinzenal
  - Mensal
  - Anual
- Define data de início
- Define data de fim (opcional)

**Gerenciar Recorrências**:

- Ver todas as recorrências
- Editar recorrência:
  - Apenas esta
  - Esta e futuras
  - Todas
- Pausar recorrência
- Cancelar recorrência

**Processamento**:

- Appwrite Function cria automaticamente
- Roda dia 1 de cada mês (00:00 UTC)
- Cria transações do mês

### 7. Importação de Transações

**Formatos Suportados**:

- OFX (Open Financial Exchange)
- CSV (valores separados por vírgula)
- PDF (extrato bancário)

**Fluxo de Importação**:

```
1. Upload de arquivo
2. Detecção automática de formato
3. Parse do arquivo
4. Preview das transações
5. Seleção de quais importar
6. Detecção de duplicatas
7. Mapeamento de categorias
8. Confirmação
9. Importação em batch
10. Relatório de sucesso
```

**Detecção de Duplicatas**:

- Compara: data + valor + descrição
- Marca duplicatas em amarelo
- Opção de importar mesmo assim
- Opção de mesclar com existente

### 8. Exportação de Transações

**Formatos de Export**:

- CSV (Excel)
- PDF (relatório formatado)
- JSON (backup)
- OFX (importação em outros apps)

**Opções**:

- Período específico
- Contas específicas
- Categorias específicas
- Incluir anexos

### 9. Categorização Automática

**IA Sugere Categoria**:

- Baseado em descrição
- Baseado em histórico
- Baseado em valor
- Aprende com correções do usuário

**Regras Customizadas**:

- Se descrição contém "Uber" → Transporte
- Se descrição contém "iFood" → Alimentação
- Se valor = 1500 → Aluguel

### 10. Anexos

**Upload de Comprovantes**:

- Imagens (JPG, PNG)
- PDFs
- Máximo 5MB por arquivo
- Múltiplos arquivos por transação

**Visualização**:

- Thumbnail na lista
- Modal para ver completo
- Download disponível

## Dados Carregados

### Server Component

```typescript
const user = await verifyAuth();
const transactions = await dataAccessService.getAccessibleTransactions(user.id, {
  limit: 50,
  offset: 0,
  order: 'desc',
});
```

### Client Component (Realtime)

```typescript
useAppwriteRealtime(`databases.${DB}.collections.transactions.documents`, (event) => {
  // Atualiza lista em tempo real
});
```

## Estados da Página

### Loading

- Skeleton rows
- Shimmer effect

### Empty State

- Ilustração
- "Nenhuma transação encontrada"
- Botão "Adicionar primeira transação"

### Filtered Empty

- "Nenhuma transação com esses filtros"
- Botão "Limpar filtros"

### Error State

- Mensagem de erro
- Botão "Tentar novamente"

## Componentes

### TransactionRow

```typescript
interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### AddTransactionModal

```typescript
interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccount?: string;
  defaultType?: 'income' | 'expense';
}
```

### ImportTransactionsModal

```typescript
interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}
```

## Integração com Server Actions

```typescript
import {
  bulkImportTransactionsAction,
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from '@/actions/transaction.actions';
```

## Atalhos de Teclado

- `N`: Nova transação
- `F`: Abrir filtros
- `E`: Exportar
- `I`: Importar
- `/`: Buscar
- `Esc`: Fechar modal

## Responsividade

### Desktop

- Tabela completa
- Filtros na sidebar
- Múltiplas colunas

### Tablet

- Tabela simplificada
- Filtros em modal
- Colunas essenciais

### Mobile

- Cards em lista
- Filtros em bottom sheet
- Swipe para ações

## Acessibilidade

- Tabela semântica
- Labels em filtros
- Anúncios de mudanças
- Navegação por teclado
- Foco visível

## Performance

### Otimizações

- Virtualização de lista (react-window)
- Lazy load de imagens
- Debounce em busca (300ms)
- Paginação server-side
- Cache de 1 minuto

### Métricas

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## Segurança

### Validações

- Server-side com Zod
- Sanitização de inputs
- Validação de arquivos

### Permissões

- Verifica ownership
- Valida permissões de conta
- Rate limiting

## Analytics

**Eventos**:

- `transactions_viewed`
- `transaction_created`
- `transaction_edited`
- `transaction_deleted`
- `transactions_imported`
- `transactions_exported`
- `filter_applied`

## Testes

```bash
pnpm test:transactions
```

## Melhorias Futuras

- [ ] Reconhecimento de voz para adicionar
- [ ] OCR em comprovantes
- [ ] Split de transações
- [ ] Transações em grupo
- [ ] Lembretes de pagamento
- [ ] Análise de padrões
- [ ] Sugestões de economia
