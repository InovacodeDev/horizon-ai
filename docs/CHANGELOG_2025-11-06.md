# Changelog - 06/11/2025

## Funcionalidades Implementadas

### 1. Remoção de "Listas de Compras" do Menu Lateral

**Arquivos Modificados:**

- `components/layout/DashboardLayout.tsx`

**Alterações:**

- Removida a opção "Listas de Compras" da seção "Intelligence" do menu lateral
- A funcionalidade de listas de compras ainda existe na página de produtos, mas não é mais acessível diretamente pelo menu

### 2. Novo Tipo de Conta: "Vale"

**Descrição:**
Adicionado novo tipo de conta "vale" para controle de vale alimentação e vale flexível.

**Arquivos Modificados:**

- `lib/appwrite/schema.ts` - Atualizado enum de account_type
- `lib/types/index.ts` - Atualizado tipo AccountType
- `lib/services/account.service.ts` - Atualizado tipos de CreateAccountData e UpdateAccountData
- `actions/account.actions.ts` - Atualizado tipos nas actions
- `components/modals/AddAccountModal.tsx` - Adicionada opção "Vale (Alimentação/Flexível)" no select
- `app/api/accounts/route.ts` - Atualizada validação de account_type
- `app/api/accounts/[id]/route.ts` - Atualizada validação de account_type

**Migração de Banco de Dados:**

- `lib/database/migrations/20251106_000020_add_vale_account_type.ts` - Nova migração criada
- `lib/database/migrations/index.ts` - Migração registrada

**Como Usar:**

1. Execute a migração: `pnpm migrate:up`
2. Ao criar uma nova conta, selecione "Vale (Alimentação/Flexível)" no tipo de conta
3. O tipo "vale" agora está disponível em todas as operações de conta

### 3. Modal de Histórico de Preços com Gráfico

**Descrição:**
Implementado modal que exibe o histórico completo de preços de um produto com gráfico de linha interativo.

**Novos Arquivos:**

- `components/modals/PriceHistoryModal.tsx` - Componente do modal
- `app/api/products/[id]/price-history/route.ts` - API endpoint para buscar histórico

**Arquivos Modificados:**

- `app/(app)/invoices/products/page.tsx` - Integração do modal na página de produtos
- `components/ui/Modal.tsx` - Adicionado suporte para tamanho "large"

**Funcionalidades do Modal:**

- **Gráfico de Linha**: Visualização da evolução de preços ao longo do tempo usando Recharts
- **Estatísticas**: Cards com preço mínimo, máximo, médio e total de compras
- **Tabela Detalhada**: Lista completa de todas as compras com data, estabelecimento, quantidade e preço
- **Responsivo**: Layout adaptável para diferentes tamanhos de tela
- **Estados de Loading e Erro**: Feedback visual durante carregamento e em caso de erros

**Como Usar:**

1. Acesse a página de Produtos em "Notas Fiscais > Produtos"
2. Clique no botão "Ver Histórico de Preços" em qualquer produto
3. O modal será aberto mostrando o gráfico e histórico completo

**Tecnologias Utilizadas:**

- Recharts para visualização de dados
- React Hooks para gerenciamento de estado
- API REST para buscar dados do histórico

## Detalhes Técnicos

### Tipo de Conta "Vale"

O novo tipo "vale" foi adicionado ao enum `account_type` que agora suporta:

- `checking` - Conta Corrente
- `savings` - Poupança
- `investment` - Investimento
- `vale` - Vale (Alimentação/Flexível) **[NOVO]**
- `other` - Outro

### API de Histórico de Preços

**Endpoint:** `GET /api/products/[id]/price-history`

**Resposta:**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "purchaseDate": "ISO 8601 date",
      "unitPrice": number,
      "quantity": number,
      "merchantName": "string",
      "merchantCnpj": "string",
      "invoiceId": "string"
    }
  ],
  "total": number
}
```

**Autenticação:** Requer usuário autenticado
**Limite:** Retorna até 100 compras mais recentes
**Ordenação:** Por data de compra (mais recente primeiro)

### 4. Ajuste de Cálculos para Tipo "Salary"

**Descrição:**
Ajustado todos os cálculos financeiros para tratar transações do tipo "salary" como positivas (receita), não como negativas.

**Arquivos Modificados:**

- `lib/services/balance-sync.service.ts` - Atualizado cálculo de saldo
- `lib/services/transaction.service.ts` - Atualizado cálculo de estatísticas
- `actions/projection.actions.ts` - Atualizado cálculo de projeções
- `hooks/useFinancialInsights.ts` - Atualizado cálculo de insights
- `components/CashFlowProjection.tsx` - Atualizado agrupamento de transações
- `scripts/test-balance-sync.ts` - Atualizado script de teste
- `lib/database/migrations/20251027_000012_migrate_account_id_and_sync_balances.ts` - Atualizado migração

**Impacto:**

- Transações de salário agora são contabilizadas corretamente como receita em todos os cálculos
- Saldo de contas é calculado corretamente incluindo salários
- Projeções de fluxo de caixa incluem salários como receita
- Insights de IA consideram salários como receita
- Gráficos e estatísticas exibem salários corretamente

## Próximos Passos

1. Considerar adicionar filtros de data no modal de histórico de preços
2. Implementar comparação de preços entre diferentes estabelecimentos
3. Adicionar alertas de variação de preço
4. Criar relatórios de economia baseados no histórico de preços

## Notas de Migração

**IMPORTANTE:** Antes de usar o novo tipo de conta "vale", execute a migração:

```bash
pnpm migrate:up
```

Esta migração irá:

1. Remover a coluna `account_type` existente
2. Recriar a coluna com o novo valor "vale" incluído
3. Manter todos os dados existentes intactos

**Rollback:** Se necessário, execute `pnpm migrate:down` para reverter a alteração.

**Correções Adicionais:**

- `app/(app)/overview/page.tsx` - Corrigido para não forçar todas as transações como 'expense'
- Criado script `scripts/recalculate-all-balances.ts` para recalcular todos os saldos existentes

**Como Recalcular Saldos:**
Se você tem transações de salário antigas que foram criadas antes desta correção, execute:

```bash
npx tsx scripts/recalculate-all-balances.ts
```

Este script irá:

1. Buscar todas as contas do banco de dados
2. Recalcular o saldo de cada conta usando a lógica correta (salary como receita)
3. Atualizar os saldos no banco de dados
4. Exibir um relatório com as diferenças encontradas
