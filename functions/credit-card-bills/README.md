# Credit Card Bills Function

Gerencia automaticamente as transações de fatura de cartão de crédito.

## 📋 Visão Geral

Esta função é executada **a cada 5 minutos via schedule** e processa transações de cartão de crédito com `sync_status='pending'`. Ela:

1. **Busca** todas as transações de cartão de crédito com `sync_status='pending'`
2. **Agrupa** as transações pendentes por cartão de crédito
3. Para cada cartão, busca **TODAS** as transações (incluindo as já sincronizadas) para calcular o valor correto da fatura
4. **Agrupa** as transações por mês de vencimento (considerando `closing_day` e `due_day` do cartão)
5. **Calcula** o total de cada fatura, considerando parcelamentos
6. **Cria ou atualiza** uma `transaction` (expense) para cada fatura com:
   - Valor total da fatura (calculado a partir de TODAS as transações do cartão)
   - Data de vencimento do cartão
   - Categoria "Cartão de Crédito"
   - Descrição com nome do cartão e mês/ano
7. **Atualiza** o `sync_status` das transações processadas de 'pending' para 'synced'
8. **Remove** transactions de faturas antigas quando não há mais transações de cartão

## 🔄 Fluxo de Sincronização

### Antes (Event-Based)

- ❌ Acionada a cada CREATE/UPDATE/DELETE de `credit_card_transaction`
- ❌ Processava apenas o cartão afetado
- ❌ Podia criar inconsistências com múltiplas execuções simultâneas
- ❌ Não garantia que o valor da fatura estava correto

### Agora (Schedule-Based)

- ✅ Executada a cada 5 minutos
- ✅ Processa apenas transações com `sync_status='pending'`
- ✅ Busca TODAS as transações do cartão para calcular valor correto
- ✅ Marca transações como 'synced' após processar
- ✅ Evita processamento duplicado
- ✅ Garante consistência do valor da fatura

## 🎯 Objetivo

Facilitar a visualização e projeção de gastos mensais, criando uma transação de despesa para cada fatura de cartão de crédito em aberto. Isso permite:

- Ver o valor total que será cobrado em cada fatura
- Incluir automaticamente as faturas nas projeções de cash flow
- Ter uma visão clara de quando cada fatura vence
- Simplificar o planejamento financeiro mensal

## 💡 Exemplo de Uso

### Cenário 1: Compra Parcelada

**Transação de Cartão de Crédito:**

- Valor: R$ 1.000,00
- Parcelas: 10x de R$ 100,00
- Data da compra: 05/12/2024
- Cartão: Nubank (vencimento dia 15)

**Resultado:**
A função criará 10 `transactions` (expense):

- R$ 100,00 em 15/12/2024
- R$ 100,00 em 15/01/2025
- R$ 100,00 em 15/02/2025
- ... (até a última parcela)

### Cenário 2: Múltiplas Compras no Mês

**Transações de Cartão de Crédito em Novembro:**

- Compra 1: R$ 200,00 (à vista)
- Compra 2: R$ 300,00 (à vista)
- Compra 3: R$ 600,00 (3x de R$ 200,00)

**Resultado:**

- Fatura de 15/12/2024: R$ 700,00 (200 + 300 + 200 da 1ª parcela)
- Fatura de 15/01/2025: R$ 200,00 (2ª parcela)
- Fatura de 15/02/2025: R$ 200,00 (3ª parcela)

## 🔧 Como Funciona

### 1. Cálculo de Datas de Fatura

A função calcula a data de vencimento de cada compra baseado em:

- **`closing_day`**: Dia de fechamento da fatura (ex: 10)
- **`due_day`**: Dia de vencimento da fatura (ex: 15)
- **Data da compra**: Se comprar antes do `closing_day`, entra na fatura do mês atual. Se comprar depois, vai para o próximo mês.

### 2. Tratamento de Parcelamentos

Para compras parceladas:

- Cada parcela é atribuída a uma fatura diferente
- O valor total é dividido pelo número de parcelas
- As parcelas são distribuídas sequencialmente pelos próximos meses

### 3. Sincronização Automática

A função é acionada por eventos do Appwrite:

- `databases.*.collections.credit_card_transactions.documents.*.create`
- `databases.*.collections.credit_card_transactions.documents.*.update`
- `databases.*.collections.credit_card_transactions.documents.*.delete`

## 📦 Estrutura de Dados

### CreditCard

```typescript
{
  $id: string;
  account_id: string;
  name: string;
  closing_day: number; // Dia de fechamento (1-31)
  due_day: number; // Dia de vencimento (1-31)
  credit_limit: number;
  used_limit: number;
}
```

### CreditCardTransaction

```typescript
{
  $id: string;
  user_id: string;
  credit_card_id: string;
  amount: number;
  date: string;          // Data de vencimento desta parcela
  purchase_date: string; // Data da compra original
  installment?: number;  // Número da parcela (1, 2, 3...)
  installments?: number; // Total de parcelas (10 para 10x)
  status: 'pending' | 'completed' | 'cancelled';
}
```

### Transaction (Fatura)

```typescript
{
  $id: string;
  user_id: string;
  account_id: string;
  credit_card_id: string;
  amount: number;
  type: 'expense';
  date: string; // Data de vencimento da fatura
  direction: 'out';
  category: 'Cartão de Crédito';
  description: string; // "Fatura [Nome do Cartão] - [Mês/Ano]"
  merchant: string; // Nome do cartão
  status: 'pending';
}
```

## 🚀 Deployment

### Pré-requisitos

- Node.js 20+
- Acesso ao Appwrite Cloud
- Variáveis de ambiente configuradas

### Variáveis de Ambiente

```bash
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=<seu-project-id>
APPWRITE_API_KEY=<sua-api-key>
APPWRITE_DATABASE_ID=<seu-database-id>
```

## **Configuração no Appwrite**

- **Variáveis de ambiente (Function > Environment Variables):**
  - `APPWRITE_ENDPOINT` — Endpoint do Appwrite (ex: `https://nyc.cloud.appwrite.io/v1`).
  - `APPWRITE_FUNCTION_PROJECT_ID` — ID do projeto onde a Function será executada.
  - `APPWRITE_API_KEY` — _Service API Key_ com permissões de acesso a Databases (capaz de `list`, `create`, `update` e `delete` nas coleções usadas). Use uma API Key de Serviço (não um token de usuário) para que a função consiga acessar dados com row security ativado.
  - `APPWRITE_DATABASE_ID` — ID do database onde as coleções `credit_cards`, `credit_card_transactions` e `transactions` estão.

- **Permissões / API Key:**
  - Crie uma _API Key_ do tipo Service / Server com permissões para executar operações em Tables/Databases. A função precisa ler e escrever nas coleções mencionadas e também deletar rows em operações de limpeza.
  - Se você usa Row-Level Security (rowSecurity: true), assegure que a API Key tem privilégios suficientes para ignorar restrições (Service Key normalmente já tem).

- **Triggers / Agendamento:**
  - Esta função deve ser executada via Schedule (cron). Configure o agendamento para rodar a cada 5 minutos, por exemplo: `*/5 * * * *`.
  - NÃO é necessário configurar triggers event-based (a função foi migrada para schedule-based). Você pode manter manual trigger para testes.

- **Timeout / Recursos:**
  - Dependendo do volume de transações, aumente o `timeout` da Function para um valor suficiente (ex: 60–120s ou mais conforme necessidade). Ajuste memória/CPU se observar timeouts.
  - Habilite prevenção de execuções concorrentes (se a sua instalação Appwrite suportar essa opção) para evitar múltiplas instâncias processando os mesmos dados simultaneamente.

- **Coleções requeridas:**
  - `credit_cards` — deve conter pelo menos: `$id`, `account_id`, `name`, `closing_day`, `due_day`.
  - `credit_card_transactions` — campos necessários: `$id`, `user_id`, `credit_card_id`, `amount`, `purchase_date`, `installment` (opcional), `installments` (opcional), `status`, `sync_status`.
  - `transactions` — a função cria/atualiza rows nesta coleção. As rows criadas usarão campos como: `user_id`, `account_id`, `amount`, `type` (`expense`), `date`, `status`, `direction` (`out`), `category` (deve ser `Cartão de Crédito`), `description`, `merchant`.

- **Observações de segurança e operação:**
  - Use uma API Key de serviço com escopo mínimo necessário. Nunca commit a chave em repositório.
  - Teste a função em um ambiente de staging com um conjunto reduzido de transações antes de ativar em produção.

### Deploy

1. **Instalar dependências:**

```bash
npm install
```

2. **Build:**

```bash
npm run build
```

3. **Deploy via Appwrite CLI:**

```bash
appwrite functions createDeployment \
  --functionId=credit-card-bills \
  --entrypoint=index.js \
  --activate=true
```

Ou faça o deploy pelo Appwrite Console:

1. Acesse o console do Appwrite
2. Vá em Functions → Create Function
3. Configure conforme `appwrite.json`
4. Faça upload dos arquivos ou conecte ao Git

## 🔍 Logs e Debugging

A função registra logs detalhados:

```
[CreditCardBills] Starting sync for credit card <id>
[CreditCardBills] Processing card: <nome>
[CreditCardBills] Found X credit card transactions
[CreditCardBills] Grouped into Y bills
[CreditCardBills] Found Z existing bill transactions
[CreditCardBills] Creating new bill transaction for <date>
[CreditCardBills] Updating bill transaction <id>
[CreditCardBills] Removing obsolete bill transaction <id>
[CreditCardBills] Sync completed for credit card <id>
```

## 🧪 Testes

Para testar localmente:

1. Configure as variáveis de ambiente em `.env`
2. Execute com dados de teste
3. Verifique os logs no console

## 📝 Considerações

- As transactions de fatura são criadas com `status: 'pending'`
- Quando a fatura é paga, você deve atualizar o status manualmente ou criar outra function
- A função não remove automaticamente as transactions quando o status muda para 'cancelled'
- O cálculo considera apenas transações com status diferente de 'cancelled'

## 🔄 Integração com o Sistema

Esta function trabalha em conjunto com:

- **CreditCardTransactionService**: Gerencia as transações de cartão
- **TransactionService**: Gerencia as transactions de fatura
- **Projection System**: Usa as transactions para calcular projeções de cash flow
- **Balance Sync**: Atualiza saldos das contas

## 📚 Referências

- [Appwrite Functions Documentation](https://appwrite.io/docs/functions)
- [Appwrite Events](https://appwrite.io/docs/events)
- [TablesDB SDK](https://appwrite.io/docs/references/cloud/server-nodejs/databases)
