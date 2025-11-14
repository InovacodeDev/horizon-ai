# Actions

Server Actions do Next.js 16 - funções assíncronas executadas exclusivamente no servidor.

## O que são Server Actions?

Server Actions são uma feature do React 19 e Next.js 16 que permite executar código no servidor diretamente de componentes client ou server, sem necessidade de criar API routes. São marcadas com a diretiva `'use server'` no topo do arquivo.

### Por que usar Server Actions?

1. **Segurança**: Código sensível (queries de banco, validações) nunca é exposto ao cliente
2. **Simplicidade**: Não precisa criar endpoints REST separados
3. **Type-Safety**: TypeScript funciona end-to-end entre cliente e servidor
4. **Progressive Enhancement**: Formulários funcionam mesmo sem JavaScript
5. **Otimização Automática**: Next.js otimiza o bundle automaticamente

## Arquivos

### account.actions.ts

Gerenciamento completo de contas bancárias.

**Métodos:**

- `createAccountAction(prevState, formData)` - Cria nova conta bancária
  - Valida dados do formulário (nome, tipo, saldo inicial)
  - Verifica autenticação do usuário
  - Cria documento no Appwrite
  - Revalida cache da página `/accounts`
  - Retorna: `{ success: true, account }` ou `{ success: false, error }`

- `updateAccountAction(accountId, prevState, formData)` - Atualiza conta existente
  - Valida permissões do usuário (owner ou shared com write)
  - Atualiza apenas campos fornecidos (partial update)
  - Mantém histórico de alterações via audit log
  - Revalida cache automaticamente

- `deleteAccountAction(accountId)` - Remove conta
  - Verifica se conta tem transações pendentes
  - Remove relacionamentos (shared accounts, invitations)
  - Soft delete (marca como deleted, não remove fisicamente)
  - Revalida múltiplas páginas afetadas

- `listAccountsAction(userId)` - Lista contas do usuário
  - Retorna contas próprias + contas compartilhadas
  - Inclui saldo calculado em tempo real
  - Ordena por data de criação (mais recentes primeiro)
  - Aplica filtros de permissão automaticamente

**Por que cada método funciona assim:**

- **FormData em vez de JSON**: Permite progressive enhancement (funciona sem JS)
- **prevState**: Usado com `useActionState` para manter estado entre submissões
- **Revalidação explícita**: `revalidatePath()` garante que UI sempre mostra dados atualizados
- **Soft delete**: Mantém integridade referencial e permite auditoria

### auth.actions.ts

Sistema de autenticação com JWT e cookies httpOnly.

**Métodos:**

- `loginAction(prevState, formData)` - Autentica usuário
  - Valida email/senha com Appwrite
  - Gera JWT token com payload customizado
  - Define cookie httpOnly (não acessível via JavaScript)
  - Expira sessões antigas do mesmo usuário
  - Retorna: `{ success: true, user }` ou erro específico

- `registerAction(prevState, formData)` - Registra novo usuário
  - Valida força da senha (mínimo 8 caracteres, letras e números)
  - Verifica se email já existe
  - Cria usuário no Appwrite Auth
  - Cria documento de perfil no banco
  - Faz login automático após registro

- `logoutAction()` - Encerra sessão
  - Remove cookie de autenticação
  - Invalida token no servidor (blacklist)
  - Limpa cache de dados do usuário
  - Redireciona para `/login`

- `verifySessionAction()` - Valida sessão atual
  - Lê cookie httpOnly
  - Verifica assinatura JWT
  - Checa expiração do token
  - Retorna dados do usuário ou null

**Por que JWT + httpOnly cookies:**

- **httpOnly**: Protege contra XSS (JavaScript malicioso não acessa)
- **Secure flag**: Transmite apenas via HTTPS em produção
- **SameSite**: Protege contra CSRF
- **JWT**: Stateless, não precisa consultar banco a cada request
- **Expiration**: Tokens expiram automaticamente (7 dias padrão)

### balance-sync.actions.ts

Sincronização automática de saldos baseada em transações.

**Métodos:**

- `syncAccountBalanceAction(accountId)` - Recalcula saldo de uma conta
  - Busca todas as transações da conta
  - Calcula: `saldo_inicial + receitas - despesas`
  - Considera transações pendentes vs confirmadas
  - Atualiza campo `balance` no documento da conta
  - Registra timestamp da última sincronização

- `syncAllBalancesAction()` - Sincroniza todas as contas
  - Itera sobre todas as contas do sistema
  - Executa sync individual para cada uma
  - Usa batch processing (100 contas por vez)
  - Retorna relatório: `{ synced: 150, errors: 2 }`

- `autoSyncOnTransactionChange(transactionId)` - Trigger automático
  - Chamado automaticamente quando transação é criada/atualizada/deletada
  - Identifica conta(s) afetada(s)
  - Executa sync apenas das contas necessárias
  - Usa debounce (aguarda 500ms) para evitar múltiplos syncs

**Por que sincronização automática:**

- **Consistência**: Saldo sempre reflete transações reais
- **Performance**: Calcula sob demanda, não a cada query
- **Auditoria**: Histórico de quando cada sync ocorreu
- **Resiliência**: Se sync falhar, pode ser reexecutado sem efeitos colaterais

**Lógica de cálculo:**

```
Saldo Final = Saldo Inicial
            + Σ(Receitas confirmadas)
            - Σ(Despesas confirmadas)
            + Σ(Transferências recebidas)
            - Σ(Transferências enviadas)
```

### projection.actions.ts

Projeções de fluxo de caixa futuro baseadas em transações recorrentes.

**Métodos:**

- `calculateProjectionAction(accountId, months)` - Calcula projeção
  - Busca transações recorrentes ativas
  - Projeta receitas/despesas para N meses
  - Considera sazonalidade (ex: 13º salário)
  - Aplica inflação estimada (opcional)
  - Retorna array: `[{ month, projected_balance, income, expenses }]`

- `getRecurringTransactionsAction(accountId)` - Lista recorrências
  - Filtra apenas transações com `is_recurring: true`
  - Agrupa por frequência (mensal, semanal, anual)
  - Calcula próxima data de ocorrência
  - Identifica recorrências vencidas (não criadas)

- `createProjectionScenarioAction(data)` - Cria cenário hipotético
  - Permite simular mudanças (ex: novo emprego, corte de gastos)
  - Compara cenário atual vs projetado
  - Mostra impacto de decisões financeiras
  - Salva cenários para comparação futura

**Por que projeções são importantes:**

- **Planejamento**: Antecipa problemas de fluxo de caixa
- **Decisões**: Ajuda a decidir se pode fazer compra grande
- **Metas**: Mostra quando atingirá objetivo financeiro
- **Alertas**: Avisa se saldo ficará negativo

**Algoritmo de projeção:**

1. Pega saldo atual da conta
2. Para cada mês futuro:
   - Adiciona receitas recorrentes esperadas
   - Subtrai despesas recorrentes esperadas
   - Aplica fator de crescimento/inflação
   - Calcula saldo projetado
3. Identifica meses críticos (saldo < threshold)

### transaction.actions.ts

CRUD completo de transações financeiras.

**Métodos:**

- `createTransactionAction(prevState, formData)` - Cria transação
  - Valida campos obrigatórios (valor, data, categoria)
  - Converte valor para centavos (evita problemas de float)
  - Associa à conta bancária
  - Marca como pendente ou confirmada
  - Trigger: Chama `autoSyncOnTransactionChange()`
  - Suporta anexos (comprovantes)

- `updateTransactionAction(transactionId, prevState, formData)` - Atualiza
  - Verifica permissões (owner da conta)
  - Permite editar: valor, data, categoria, descrição
  - Não permite mudar conta (precisa deletar e recriar)
  - Mantém histórico de edições (audit trail)
  - Re-sincroniza saldo se valor mudou

- `deleteTransactionAction(transactionId)` - Remove transação
  - Soft delete (marca `deleted_at`)
  - Mantém registro para auditoria
  - Remove da UI mas preserva no banco
  - Trigger: Re-sincroniza saldo da conta

- `listTransactionsAction(filters)` - Lista com filtros
  - Suporta filtros: conta, categoria, período, tipo
  - Paginação: 50 transações por página
  - Ordenação: Data decrescente (mais recentes primeiro)
  - Busca textual: Pesquisa em descrição e notas

- `categorizeTransactionAction(transactionId, categoryId)` - Categoriza
  - Atribui categoria manualmente
  - Aprende padrões para auto-categorização futura
  - Sugere categoria baseada em histórico

- `bulkImportTransactionsAction(file)` - Importação em lote
  - Suporta: OFX, CSV, PDF de extrato
  - Parse automático do formato
  - Detecta duplicatas (mesmo valor, data, descrição)
  - Preview antes de confirmar importação
  - Cria todas transações em batch (mais rápido)

**Por que valores em centavos:**

JavaScript tem problemas com decimais:

```javascript
0.1 + 0.2 = 0.30000000000000004 // ❌ Errado
```

Solução: Armazenar em centavos (inteiros):

```javascript
10 + 20 = 30 // ✅ Correto
// Depois divide por 100 para exibir: R$ 0,30
```

**Por que soft delete:**

- Mantém integridade referencial
- Permite auditoria ("quem deletou e quando?")
- Possibilita recuperação acidental
- Relatórios históricos continuam corretos

## Padrão de Resposta

Todas as actions seguem o mesmo padrão de retorno:

```typescript
// Sucesso
{
  success: true,
  data: { /* resultado */ },
  message: "Operação realizada com sucesso"
}

// Erro
{
  success: false,
  error: "Mensagem de erro amigável",
  code: "ERROR_CODE", // Para tratamento programático
  details: { /* informações adicionais */ }
}
```

**Por que esse padrão:**

- **Consistência**: Todos os componentes sabem o que esperar
- **Type-safe**: TypeScript valida estrutura
- **Tratamento de erro**: Fácil verificar `if (!result.success)`
- **Debugging**: `code` permite identificar erro específico
- **UX**: `message` pode ser mostrada diretamente ao usuário

## Validação de Dados

Todas as actions validam entrada usando Zod:

```typescript
const schema = z.object({
  name: z.string().min(3).max(100),
  amount: z.number().positive(),
  date: z.string().datetime(),
});

const validated = schema.parse(data);
```

**Por que Zod:**

- **Runtime validation**: Valida dados em tempo de execução
- **Type inference**: Gera tipos TypeScript automaticamente
- **Mensagens claras**: Erros descritivos para o usuário
- **Composição**: Schemas podem ser reutilizados e combinados

## Autenticação

Todas as actions (exceto login/register) verificam autenticação:

```typescript
const user = await verifyAuth();
if (!user) {
  return { success: false, error: 'Não autenticado' };
}
```

**Fluxo de autenticação:**

1. Action é chamada
2. Lê cookie `auth_token` do request
3. Verifica assinatura JWT
4. Checa expiração
5. Retorna dados do usuário ou null
6. Se null, action retorna erro 401

## Revalidação de Cache

Next.js cacheia páginas por padrão. Actions precisam invalidar cache:

```typescript
import { revalidatePath } from 'next/cache';

// Invalida página específica
revalidatePath('/accounts');

// Invalida todas as páginas de um layout
revalidatePath('/accounts', 'layout');

// Invalida por tag
revalidateTag('accounts-list');
```

**Quando revalidar:**

- Após criar/atualizar/deletar dados
- Quando dados afetam múltiplas páginas
- Após operações que mudam estado global

**Por que não revalidar tudo:**

- Performance: Revalidar tudo é lento
- Especificidade: Só invalida o necessário
- UX: Páginas não relacionadas não recarregam

## Progressive Enhancement

Actions funcionam sem JavaScript habilitado:

```tsx
<form action={createAccountAction}>
  <input name="name" required />
  <button type="submit">Criar</button>
</form>
```

**Como funciona:**

1. Usuário submete formulário
2. Browser faz POST para servidor
3. Action processa no servidor
4. Retorna nova página HTML
5. Se JS habilitado: Intercepta e usa fetch (mais rápido)

## Uso com React 19 Hooks

### useActionState

```typescript
const [state, formAction, isPending] = useActionState(
  createAccountAction,
  { success: false }
);

<form action={formAction}>
  {state.error && <p>{state.error}</p>}
  <button disabled={isPending}>
    {isPending ? 'Criando...' : 'Criar'}
  </button>
</form>
```

### useOptimistic

```typescript
const [optimisticAccounts, addOptimistic] = useOptimistic(accounts, (state, newAccount) => [...state, newAccount]);

async function handleCreate(formData) {
  addOptimistic({ id: 'temp', ...formData }); // UI instantânea
  await createAccountAction(formData); // Confirma no servidor
}
```

## Tratamento de Erros

Actions capturam e tratam erros de forma consistente:

```typescript
try {
  // Operação
} catch (error) {
  if (error instanceof AppwriteException) {
    // Erro do Appwrite
    return { success: false, error: 'Erro ao acessar banco' };
  }
  if (error instanceof ZodError) {
    // Erro de validação
    return { success: false, error: error.errors[0].message };
  }
  // Erro desconhecido
  console.error(error);
  return { success: false, error: 'Erro inesperado' };
}
```

## Performance

### Batch Operations

Para operações em lote, use batch processing:

```typescript
// ❌ Lento: 100 requests
for (const item of items) {
  await createTransaction(item);
}

// ✅ Rápido: 1 request
await bulkCreateTransactions(items);
```

### Debouncing

Para actions chamadas frequentemente:

```typescript
const debouncedSync = debounce(syncAccountBalance, 500);
```

### Caching

Actions podem cachear resultados:

```typescript
export const listAccounts = cache(async (userId) => {
  // Resultado é cacheado durante o request
  return await fetchAccounts(userId);
});
```

## Segurança

### SQL Injection

Appwrite SDK previne automaticamente:

```typescript
// ✅ Seguro: SDK sanitiza
databases.listDocuments(db, collection, [Query.equal('user_id', userId)]);
```

### XSS

Dados são sanitizados antes de salvar:

```typescript
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);
```

### CSRF

Cookies com SameSite previnem CSRF:

```typescript
cookies().set('auth_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
});
```

## Testing

Teste actions isoladamente:

```typescript
import { createAccountAction } from './account.actions';

test('cria conta com sucesso', async () => {
  const formData = new FormData();
  formData.set('name', 'Conta Teste');
  formData.set('type', 'checking');

  const result = await createAccountAction(null, formData);

  expect(result.success).toBe(true);
  expect(result.data.name).toBe('Conta Teste');
});
```

## Debugging

Para debugar actions:

```typescript
console.log('[ACTION] createAccount', { userId, data });
```

Logs aparecem no terminal do servidor, não no browser console.
