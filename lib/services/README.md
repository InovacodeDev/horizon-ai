# Lib / Services

Camada de serviços - toda a lógica de negócio da aplicação.

## Arquitetura de Serviços

### Por que separar em serviços?

1. **Separação de responsabilidades**: Cada serviço tem um propósito único e bem definido
2. **Reutilização**: Mesma lógica usada em Server Actions, API Routes e Appwrite Functions
3. **Testabilidade**: Serviços podem ser testados isoladamente sem dependências externas
4. **Manutenibilidade**: Mudanças ficam localizadas, facilitando refatoração
5. **Type-safety**: TypeScript garante contratos entre camadas

### Padrão de implementação

Todos os serviços seguem este padrão:

```typescript
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(3),
  amount: z.number().positive()
});

export class AccountService {
  private db: any;

  constructor() {
    this.db = getAppwriteDatabases();
  }

  async create(data: unknown) {
    const validated = CreateSchema.parse(data);
    const result = await this.db.createDocument(...);
    return result;
  }

  private async helper() {
    // Métodos privados para lógica interna
  }
}

export const accountService = new AccountService();
```

## Serviços Principais

### balance-sync.service.ts

**Propósito**: Sincronização automática de saldos de contas baseado em transações.

**Problema que resolve**:

- Saldo pode ficar dessincronizado quando transações são criadas/editadas/deletadas
- Calcular saldo em tempo real a cada query é muito lento (O(n) transações)
- Múltiplas operações simultâneas podem causar race conditions

**Solução implementada**:

- Saldo é armazenado no campo `balance` da conta
- Recalculado automaticamente quando transações mudam
- Campo `synced_transaction_ids` rastreia quais transações já foram contabilizadas
- Permite sync incremental no futuro (apenas processar transações novas)

**Métodos principais**:

`getAllTransactions(accountId, startDate?, endDate?)` - Privado

- Busca todas as transações de uma conta com paginação
- Usa lotes de 500 transações para evitar timeout
- Suporta filtros opcionais de data
- Retorna array completo de transações

`syncAccountBalance(accountId, startDate?, endDate?)`

- Recalcula saldo completo da conta
- Algoritmo: `balance = initial_balance + Σ(receitas) - Σ(despesas)`
- Considera apenas transações confirmadas (não pendentes)
- Atualiza campos: `balance`, `synced_transaction_ids`, `last_sync_at`
- Retorna o novo saldo calculado

`syncAfterCreate(accountId, transactionId)`

- Chamado após criar nova transação
- Executa sync completo da conta
- Garante consistência imediata

`syncAfterUpdate(accountId, transactionId)`

- Chamado após editar transação existente
- Recalcula saldo considerando mudanças
- Importante quando valor ou tipo da transação muda

`syncAfterDelete(accountId, transactionId)`

- Chamado após deletar transação
- Remove transação do cálculo de saldo
- Atualiza `synced_transaction_ids`

`recalculateAllBalances(userId, startDate?, endDate?)`

- Recalcula saldos de todas as contas de um usuário
- Útil para correção em massa ou migração
- Processa contas em paralelo para performance
- Retorna relatório de sucesso/erro

`processDueTransactions(userId)`

- Processa transações futuras que chegaram na data de hoje
- Muda status de "pendente" para "confirmada"
- Trigger para recalcular saldo
- Retorna quantidade de transações processadas

**Algoritmo de sincronização detalhado**:

```typescript
1. Buscar conta atual
2. Buscar TODAS as transações da conta (com paginação)
3. Inicializar balance = initial_balance || 0
4. Para cada transação:
   - Se tipo = 'income': balance += amount
   - Se tipo = 'expense': balance -= amount
   - Se tipo = 'transfer_in': balance += amount
   - Se tipo = 'transfer_out': balance -= amount
5. Atualizar conta com:
   - balance calculado
   - synced_transaction_ids (array de IDs)
   - last_sync_at (timestamp atual)
6. Retornar balance final
```

**Por que armazenar synced_transaction_ids?**

Permite otimização futura com sync incremental:

```typescript
const newTransactions = allTransactions.filter((tx) => !account.synced_transaction_ids.includes(tx.$id));
// Processar apenas transações novas
```

**Quando sincronizar?**

1. **Automático via Appwrite Function**: Trigger em eventos de transação
2. **Manual via botão na UI**: Usuário clica "Reprocessar Saldo"
3. **Scheduled job**: Backup diário às 20:00 UTC
4. **Após importação**: Quando múltiplas transações são importadas

### account.service.ts

**Propósito**: Gerenciamento completo de contas bancárias.

**Métodos**:

`create(data)` - Cria nova conta

- Valida dados com Zod schema
- Define saldo inicial
- Cria documento no Appwrite
- Retorna conta criada

`update(accountId, data)` - Atualiza conta

- Verifica permissões do usuário
- Permite atualização parcial
- Mantém audit trail
- Revalida cache

`delete(accountId)` - Remove conta

- Soft delete (marca deleted_at)
- Verifica transações pendentes
- Remove relacionamentos
- Preserva dados para auditoria

`list(userId)` - Lista contas do usuário

- Retorna contas próprias
- Ordena por data de criação
- Inclui saldo atual
- Aplica filtros de permissão

`getById(accountId)` - Busca conta por ID

- Verifica permissões
- Retorna dados completos
- Inclui estatísticas

### transaction.service.ts

**Propósito**: Operações CRUD de transações financeiras.

**Métodos**:

`create(data)` - Cria transação

- Valida campos obrigatórios
- Converte valor para centavos (evita problemas de float)
- Associa à conta
- Trigger: Chama balance-sync
- Suporta anexos

`update(transactionId, data)` - Atualiza transação

- Verifica permissões
- Permite edição parcial
- Mantém histórico
- Re-sincroniza se valor mudou

`delete(transactionId)` - Remove transação

- Soft delete
- Trigger: Re-sincroniza saldo
- Preserva para auditoria

`list(filters)` - Lista com filtros

- Suporta: conta, categoria, período, tipo
- Paginação: 50 por página
- Ordenação: Data decrescente
- Busca textual em descrição

`categorize(transactionId, categoryId)` - Categoriza

- Atribui categoria manualmente
- Aprende padrões para auto-categorização
- Sugere baseado em histórico

`bulkImport(transactions)` - Importação em lote

- Cria múltiplas transações
- Detecta duplicatas
- Mais rápido que criar uma por uma
- Retorna relatório

**Por que valores em centavos?**

JavaScript tem problemas com decimais:

```javascript
0.1 + 0.2 = 0.30000000000000004 // ❌
```

Solução: Armazenar em centavos:

```javascript
10 + 20 = 30 // ✅
// Exibir: R$ 0,30 (divide por 100)
```

### credit-card.service.ts

**Propósito**: Gerenciamento de cartões de crédito.

**Métodos**:

`create(data)` - Cria cartão

- Valida dados do cartão
- Criptografa últimos 4 dígitos
- Define limite e dia de fechamento
- Cria primeira fatura

`update(cardId, data)` - Atualiza cartão

- Permite mudar limite
- Atualiza dia de fechamento
- Recalcula faturas futuras

`delete(cardId)` - Remove cartão

- Verifica faturas pendentes
- Soft delete
- Mantém histórico

`list(userId)` - Lista cartões

- Retorna cartões ativos
- Inclui saldo atual da fatura
- Ordena por nome

`getCurrentBill(cardId)` - Busca fatura atual

- Retorna fatura do mês corrente
- Inclui transações
- Calcula total

### import.service.ts

**Propósito**: Importação de transações de arquivos externos.

**Fluxo completo**:

1. **Upload**: Recebe arquivo (OFX, CSV, PDF)
2. **Detecção**: Identifica formato automaticamente
3. **Parse**: Extrai transações usando parser específico
4. **Normalização**: Converte para formato padrão
5. **Deduplicação**: Remove transações duplicadas
6. **Preview**: Retorna para usuário confirmar
7. **Importação**: Cria transações no banco
8. **Categorização**: Sugere categorias automaticamente

**Métodos**:

`detectFormat(file)` - Detecta formato

- Analisa extensão e conteúdo
- Retorna: 'ofx', 'csv', 'pdf'
- Lança erro se formato não suportado

`parseFile(file, format)` - Faz parse

- Delega para parser específico
- Retorna array de transações
- Trata erros de parsing

`deduplicateTransactions(newTxs, existingTxs)` - Remove duplicatas

- Compara: data + valor + descrição
- Retorna apenas transações novas
- Evita importação duplicada

`import(transactions, accountId)` - Importa

- Cria transações em batch
- Mais rápido que uma por uma
- Trigger: Sincroniza saldo ao final
- Retorna relatório

**Detecção de duplicatas**:

```typescript
function isDuplicate(newTx, existingTxs) {
  return existingTxs.some(
    (existing) =>
      existing.date === newTx.date &&
      Math.abs(existing.amount - newTx.amount) < 0.01 &&
      similarity(existing.description, newTx.description) > 0.8,
  );
}
```

### export.service.ts

**Propósito**: Exportação de dados financeiros.

**Formatos suportados**:

- CSV: Compatível com Excel
- PDF: Relatório formatado
- JSON: Backup completo
- OFX: Importação em outros apps

**Métodos**:

`exportTransactions(filters, format)` - Exporta transações

- Aplica filtros
- Gera arquivo no formato escolhido
- Retorna URL para download

`exportAccounts(userId, format)` - Exporta contas

- Inclui saldos e estatísticas
- Gera relatório completo

`exportFullBackup(userId)` - Backup completo

- Exporta todos os dados do usuário
- Formato JSON estruturado
- Permite restauração completa

### analytics.service.ts

**Propósito**: Análises e insights financeiros.

**Métricas calculadas**:

`getSpendingByCategory(userId, period)` - Gastos por categoria

```typescript
{
  'Alimentação': 1500.00,
  'Transporte': 800.00,
  'Lazer': 300.00
}
```

`getMonthlyTrends(userId, months)` - Tendências mensais

```typescript
[
  { month: '2024-01', income: 5000, expenses: 3500, balance: 1500 },
  { month: '2024-02', income: 5000, expenses: 4000, balance: 1000 },
];
```

`compareWithPreviousMonth(userId)` - Comparação

```typescript
{
  income: { current: 5000, previous: 4800, change: +4.2% },
  expenses: { current: 3500, previous: 3200, change: +9.4% }
}
```

`detectAnomalies(userId)` - Detecta anomalias

- Usa desvio padrão
- Identifica gastos atípicos
- Pode indicar fraude

**Algoritmo de detecção de anomalias**:

```typescript
1. Buscar transações dos últimos 3 meses
2. Calcular média e desvio padrão dos valores
3. Transações > 2σ da média são anomalias
4. Retornar lista de anomalias com score
```

### auth.service.ts

**Propósito**: Autenticação e gerenciamento de sessões.

**Métodos**:

`login(email, password)` - Autentica

- Valida credenciais com Appwrite
- Gera JWT token
- Define cookie httpOnly
- Retorna dados do usuário

`register(data)` - Registra usuário

- Valida força da senha
- Cria usuário no Appwrite Auth
- Cria perfil no banco
- Faz login automático

`logout(userId)` - Encerra sessão

- Remove cookie
- Invalida token (blacklist)
- Limpa cache

`verifyToken(token)` - Valida token

- Verifica assinatura JWT
- Checa expiração
- Retorna payload ou null

`refreshToken(oldToken)` - Renova token

- Gera novo token
- Mantém sessão ativa
- Rotação de tokens

### sharing.service.ts

**Propósito**: Compartilhamento de contas (joint accounts).

**Métodos**:

`createInvitation(data)` - Cria convite

- Gera token único
- Envia email
- Define expiração (7 dias)

`acceptInvitation(token)` - Aceita convite

- Valida token
- Cria relacionamento
- Notifica dono

`revokeAccess(relationshipId)` - Remove acesso

- Termina relacionamento
- Notifica usuário
- Mantém histórico

`updatePermission(relationshipId, permission)` - Muda permissão

- Altera entre read/write
- Valida permissões
- Notifica usuário

### data-access.service.ts

**Propósito**: Acesso unificado a dados próprios e compartilhados.

**Métodos**:

`getAccessibleAccounts(userId)` - Lista contas acessíveis

- Retorna contas próprias + compartilhadas
- Adiciona metadata de ownership
- Aplica permissões

`getAccessibleTransactions(userId, filters)` - Lista transações

- De contas próprias e compartilhadas
- Aplica filtros
- Adiciona ownership

`canAccessResource(userId, resourceId)` - Verifica acesso

- Checa se é dono
- Checa relacionamentos
- Retorna boolean

**Metadata de ownership**:

```typescript
{
  ...originalData,
  is_owner: true,
  owner_id: 'user123',
  owner_name: 'João Silva',
  permission: 'write'
}
```

### invoice-parser.service.ts

**Propósito**: Parse de notas fiscais (NFe) com IA.

**Métodos**:

`parseNFe(xmlContent)` - Parse XML

- Extrai dados estruturados
- Valida assinatura digital
- Retorna produtos e valores

`extractWithAI(imageOrPdf)` - Extração com IA

- Usa Google AI (Gemini)
- Extrai dados de imagem/PDF
- Retorna JSON estruturado

`categorizeProducts(products)` - Categoriza produtos

- Usa IA para categorizar
- Aprende com histórico
- Retorna categorias sugeridas

### product-normalization.service.ts

**Propósito**: Normalização de nomes de produtos.

**Problema**: Mesmo produto com nomes diferentes

- "COCA COLA 2L" vs "Coca-Cola 2 Litros"
- "ARROZ TIPO 1 5KG" vs "Arroz Branco 5kg"

**Solução**: Normalizar para nome padrão

- Remove variações
- Padroniza unidades
- Agrupa produtos similares

**Métodos**:

`normalize(productName)` - Normaliza nome

- Remove acentos e caracteres especiais
- Padroniza unidades (kg, l, un)
- Retorna nome normalizado

`findSimilar(productName)` - Busca similares

- Usa algoritmo de similaridade
- Retorna produtos parecidos
- Permite agrupamento

### price-tracking.service.ts

**Propósito**: Tracking de preços de produtos.

**Métodos**:

`trackPrice(product, price, store, date)` - Registra preço

- Salva histórico de preços
- Associa a estabelecimento
- Permite comparação

`getPriceHistory(productId)` - Histórico

- Retorna preços ao longo do tempo
- Agrupa por estabelecimento
- Calcula tendências

`compareStores(productId)` - Compara lojas

- Mostra preço em cada loja
- Identifica mais barato
- Calcula economia potencial

`getAlerts(userId)` - Alertas de preço

- Notifica quando preço cai
- Baseado em threshold definido
- Retorna lista de alertas

## Subpastas

### mappers/

Mapeadores de dados entre formatos.

**transaction.mapper.ts**:

- `mapOFXToTransaction()` - OFX → formato interno
- `mapCSVToTransaction()` - CSV → formato interno
- `mapDatabaseToAPI()` - Database → API response
- `mapAPIToDatabase()` - API request → Database

### parsers/

Parsers para diferentes formatos de arquivo.

**ofx.parser.ts**:

- Parse de arquivos OFX (Open Financial Exchange)
- Formato XML usado por bancos brasileiros
- Extrai transações, saldos, datas

**csv.parser.ts**:

- Parse de arquivos CSV
- Suporta diferentes delimitadores
- Mapeamento customizável de colunas

**pdf.parser.ts**:

- Extração de texto de PDFs
- Usa regex patterns para identificar transações
- Suporta múltiplos formatos de extrato

### nfe-crawler/

Crawler para buscar NFes automaticamente.

**Funcionalidades**:

- Busca NFes em fontes configuradas
- Download automático de XMLs
- Processamento em background
- Armazenamento estruturado

## Padrões e Convenções

### Validação com Zod

```typescript
const schema = z.object({
  name: z.string().min(3).max(100),
  amount: z.number().positive(),
  date: z.string().datetime(),
});

const validated = schema.parse(data);
```

### Tratamento de erros

```typescript
try {
  // Operação
} catch (error) {
  if (error instanceof AppwriteException) {
    throw new DatabaseError(error.message);
  }
  if (error instanceof ZodError) {
    throw new ValidationError(error.errors);
  }
  throw new UnexpectedError();
}
```

### Logging

```typescript
console.log('[SERVICE] operation', { userId, data });
```

### Retorno padronizado

```typescript
return {
  success: true,
  data: result,
  message: 'Operação realizada'
};
```

## Testing

Teste serviços isoladamente:

```typescript
import { accountService } from './account.service';

test('cria conta', async () => {
  const result = await accountService.create({
    name: 'Teste',
    type: 'checking',
  });

  expect(result.name).toBe('Teste');
});
```

## Performance

### Batch operations

```typescript
// ❌ Lento
for (const item of items) {
  await create(item);
}

// ✅ Rápido
await bulkCreate(items);
```

### Caching

```typescript
import { cache } from '@/lib/utils/cache';

async function getAccounts(userId) {
  const cached = cache.get(`accounts:${userId}`);
  if (cached) return cached;

  const accounts = await fetchAccounts(userId);
  cache.set(`accounts:${userId}`, accounts, 300); // 5 min
  return accounts;
}
```

### Paginação

```typescript
async function listAll(collection) {
  const items = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const batch = await list(collection, { limit, offset });
    items.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return items;
}
```
