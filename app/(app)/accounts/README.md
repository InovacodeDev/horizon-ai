# Accounts Page

Gerenciamento completo de contas bancárias.

## Rota

`/accounts`

## Propósito

Permitir que usuários visualizem, criem, editem e gerenciem suas contas bancárias.

## Funcionalidades

### 1. Lista de Contas

**Visualização**:

- Cards em grid (desktop) ou lista (mobile)
- Cada card mostra:
  - Nome da conta
  - Tipo (Corrente, Poupança, Investimento)
  - Saldo atual
  - Logo do banco
  - Badge "Compartilhada" (se aplicável)
  - Última atualização

**Ordenação**:

- Por nome (A-Z, Z-A)
- Por saldo (maior/menor)
- Por data de criação (mais recente/antiga)
- Por tipo

**Filtros**:

- Tipo de conta
- Apenas minhas contas
- Apenas compartilhadas
- Saldo positivo/negativo

### 2. Adicionar Conta

**Modal de Criação**:

**Campos**:

- Nome da conta (obrigatório, 3-100 caracteres)
- Tipo (obrigatório):
  - Conta Corrente
  - Conta Poupança
  - Conta Investimento
  - Conta Salário
- Banco (opcional, autocomplete)
- Saldo inicial (opcional, padrão: 0)
- Moeda (padrão: BRL)
- Cor (para identificação visual)

**Validações**:

- Nome único por usuário
- Saldo inicial pode ser negativo
- Tipo deve ser válido

**Fluxo**:

```
1. Click em "Nova Conta"
2. Preenche formulário
3. Submit → Server Action
4. Cria conta no banco
5. Fecha modal
6. Atualiza lista (Realtime)
7. Toast de sucesso
```

### 3. Editar Conta

**Modal de Edição**:

**Campos Editáveis**:

- Nome
- Tipo
- Banco
- Cor
- Observações

**Campos Não Editáveis**:

- Saldo (calculado automaticamente)
- Data de criação
- ID

**Validações**:

- Mesmo que criação
- Verifica permissão (owner ou write)

### 4. Deletar Conta

**Confirmação**:

- Modal de confirmação
- Aviso sobre transações associadas
- Opções:
  - Deletar conta e transações
  - Deletar apenas conta (move transações para "Sem conta")
  - Cancelar

**Restrições**:

- Não pode deletar se tem transações futuras
- Não pode deletar se compartilhada (precisa remover compartilhamento primeiro)
- Apenas owner pode deletar

### 5. Detalhes da Conta

**Informações Exibidas**:

- Saldo atual
- Saldo inicial
- Total de receitas
- Total de despesas
- Quantidade de transações
- Data de criação
- Última transação
- Compartilhada com (se aplicável)

**Gráficos**:

- Evolução do saldo (últimos 6 meses)
- Receitas vs Despesas
- Transações por categoria

**Ações**:

- Adicionar transação
- Ver todas as transações
- Exportar extrato
- Compartilhar conta
- Editar
- Deletar

### 6. Compartilhamento

**Compartilhar Conta**:

- Click em "Compartilhar"
- Insere email do usuário
- Seleciona permissão (Leitura/Escrita)
- Envia convite
- Usuário recebe email

**Gerenciar Compartilhamentos**:

- Lista de usuários com acesso
- Permissão de cada um
- Opção de revogar acesso
- Alterar permissão

**Permissões**:

- **Leitura**: Ver saldo e transações
- **Escrita**: Criar/editar/deletar transações

### 7. Sincronização de Saldo

**Botão "Reprocessar Saldo"**:

- Recalcula saldo baseado em transações
- Útil se saldo estiver incorreto
- Mostra loading durante processo
- Toast com resultado

**Sincronização Automática**:

- Trigger ao criar/editar/deletar transação
- Appwrite Function processa em background
- Atualização via Realtime

### 8. Importação de Transações

**Botão "Importar Extrato"**:

- Upload de arquivo (OFX, CSV, PDF)
- Preview das transações
- Seleção de quais importar
- Detecção de duplicatas
- Confirmação e importação

## Dados Carregados

### Server Component

```typescript
const user = await verifyAuth();
const accounts = await dataAccessService.getAccessibleAccounts(user.id);
```

### Client Component (Realtime)

```typescript
useAppwriteRealtime(`databases.${DB}.collections.accounts.documents`, (event) => {
  if (event.events.includes('create')) {
    // Adiciona nova conta à lista
  }
  if (event.events.includes('update')) {
    // Atualiza conta na lista
  }
  if (event.events.includes('delete')) {
    // Remove conta da lista
  }
});
```

## Estados da Página

### Loading

- Skeleton cards
- Shimmer effect
- Botões desabilitados

### Empty State

- Ilustração
- Mensagem "Nenhuma conta cadastrada"
- Botão "Criar primeira conta"
- Dicas de uso

### Error State

- Mensagem de erro
- Botão "Tentar novamente"
- Link para suporte

### Success State

- Lista de contas
- Todas as funcionalidades habilitadas

## Componentes

### AccountCard

```typescript
interface AccountCardProps {
  account: Account;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}
```

### AddAccountModal

```typescript
interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: Account) => void;
}
```

### AccountDetailsModal

```typescript
interface AccountDetailsModalProps {
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

## Integração com Server Actions

```typescript
import { createAccountAction, deleteAccountAction, updateAccountAction } from '@/actions/account.actions';

// Criar
const [createState, createAction, isCreating] = useActionState(createAccountAction, { success: false });

// Atualizar
const [updateState, updateAction, isUpdating] = useActionState(updateAccountAction.bind(null, accountId), {
  success: false,
});

// Deletar
const handleDelete = async (id: string) => {
  const result = await deleteAccountAction(id);
  if (result.success) {
    toast.success('Conta removida');
  }
};
```

## Responsividade

### Desktop

- Grid 3 colunas
- Cards com mais informações
- Sidebar visível

### Tablet

- Grid 2 colunas
- Cards médios
- Sidebar colapsável

### Mobile

- Lista vertical
- Cards compactos
- Bottom navigation

## Acessibilidade

- Landmarks (main, nav)
- Headings hierárquicos
- Labels em formulários
- Mensagens de erro anunciadas
- Navegação por teclado
- Foco visível

## Performance

### Otimizações

- Server Components
- Streaming
- Suspense boundaries
- Prefetch de modais
- Lazy load de gráficos

### Métricas

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## Segurança

### Validações

- Server-side com Zod
- Client-side para UX
- Sanitização de inputs

### Permissões

- Verifica ownership
- Valida permissões de compartilhamento
- Rate limiting em criação

## Analytics

**Eventos**:

- `accounts_viewed`
- `account_created`
- `account_edited`
- `account_deleted`
- `account_shared`
- `balance_synced`

## Testes

```bash
pnpm test:accounts
```

### Casos de Teste

1. Criar conta
2. Editar conta
3. Deletar conta
4. Listar contas
5. Filtrar contas
6. Ordenar contas
7. Compartilhar conta
8. Sincronizar saldo

## Melhorias Futuras

- [ ] Integração com Open Banking
- [ ] Sincronização automática com bancos
- [ ] Categorização automática de transações
- [ ] Alertas de saldo baixo
- [ ] Metas por conta
- [ ] Comparação entre contas
- [ ] Export para Excel/PDF
