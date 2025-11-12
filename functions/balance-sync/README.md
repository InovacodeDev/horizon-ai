# Balance Sync Function

Função Appwrite para gerenciar automaticamente o saldo das contas baseado nas transações.

## 📖 Documentação

### Para Começar

- **[QUICKSTART.md](./QUICKSTART.md)** - Guia rápido de 5 minutos ⚡
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guia completo de deploy 🚀

### Referência

- **[EXAMPLES.md](./EXAMPLES.md)** - Exemplos práticos de uso 💡
- **[FAQ.md](./FAQ.md)** - Perguntas frequentes ❓
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura técnica 🏗️

### Operacional

- **[CHECKLIST.md](./CHECKLIST.md)** - Checklist de verificação ✅
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solução de problemas 🔧
- **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** - Sumário executivo 📊

### Geral

- **[../../docs/APPWRITE_FUNCTIONS.md](../../docs/APPWRITE_FUNCTIONS.md)** - Guia completo de funções 📚

## Funcionalidades

1. **Sincronização Automática**: Atualiza o saldo da conta sempre que uma transação é criada, editada ou removida
2. **Processamento Diário**: Executa diariamente às 20:00 para processar transações que chegaram na data de hoje
3. **Ignora Transações Futuras**: Transações com data futura não são contabilizadas no saldo até chegarem na data
4. **Ignora Cartão de Crédito**: Transações de cartão de crédito são gerenciadas separadamente

## Configuração no Appwrite Console

### 1. Criar a Função

1. Acesse o Appwrite Console
2. Vá em **Functions** > **Create Function**
3. Configure:
   - **Name**: Balance Sync
   - **Runtime**: Node.js 20.x (ou superior)
   - **Entrypoint**: `src/main.ts`
   - **Build Commands**: `npm install && npm run build`

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente na função:

```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_DATABASE_ID=seu-database-id
APPWRITE_API_KEY=sua-api-key
```

### 3. Configurar Triggers

#### A. Eventos de Database (Sincronização em Tempo Real)

Adicione os seguintes eventos para sincronizar automaticamente quando transações são modificadas:

```
databases.*.collections.transactions.documents.*.create
databases.*.collections.transactions.documents.*.update
databases.*.collections.transactions.documents.*.delete
```

#### B. Schedule (Execução Diária)

Configure um schedule para executar diariamente às 20:00:

```
Cron Expression: 0 20 * * *
Timezone: America/Sao_Paulo (ou seu timezone)
```

### 4. Deploy

1. Faça upload do código da função:

   ```bash
   cd functions/balance-sync
   tar -czf balance-sync.tar.gz .
   ```

2. No Appwrite Console, vá em **Functions** > **Balance Sync** > **Deployments**
3. Faça upload do arquivo `balance-sync.tar.gz`
4. Aguarde o build completar

### 5. Testar

#### Teste Manual

Execute a função manualmente com o seguinte payload:

```json
{
  "userId": "seu-user-id"
}
```

#### Teste de Evento

Crie, edite ou remova uma transação no banco de dados. A função será executada automaticamente.

#### Teste de Schedule

Aguarde a execução agendada às 20:00 ou force uma execução manual do schedule.

## Estrutura do Código

```
functions/balance-sync/
├── src/
│   └── main.ts          # Código principal da função
├── package.json         # Dependências
├── tsconfig.json        # Configuração TypeScript
├── .gitignore          # Arquivos ignorados
└── README.md           # Esta documentação
```

## Como Funciona

### Sincronização de Saldo

1. Busca todas as transações da conta
2. Filtra transações futuras e de cartão de crédito
3. Calcula o saldo: soma receitas (`direction: 'in'`) e subtrai despesas (`direction: 'out'`)
4. Atualiza o campo `balance` da conta

### Processamento de Transações Futuras

1. Busca todas as transações do usuário
2. Identifica transações que eram futuras mas agora são de hoje ou passado
3. Agrupa por conta
4. Recalcula o saldo de cada conta afetada

### Execução Agendada

1. Busca todas as contas do sistema
2. Para cada usuário único, processa transações futuras
3. Atualiza os saldos conforme necessário

## Logs

A função gera logs detalhados para debug:

```
[BalanceSync] Syncing account {accountId}
[BalanceSync] - Total transactions: {count}
[BalanceSync] - Final balance: {balance}
[BalanceSync] Account {accountId} updated successfully
```

## Troubleshooting

### Saldo Incorreto

Se o saldo estiver incorreto, você pode forçar um recálculo:

1. Execute a função manualmente com o `userId`
2. Ou use a action `reprocessAllBalancesAction` no código Next.js

### Função Não Executa

Verifique:

1. Variáveis de ambiente configuradas corretamente
2. Triggers configurados (eventos e schedule)
3. Permissões da API Key (deve ter acesso ao database)
4. Logs de execução no Appwrite Console

### Transações Futuras Não Processadas

Verifique:

1. Schedule configurado corretamente (cron: `0 20 * * *`)
2. Timezone correto
3. Logs da execução agendada

## Manutenção

### Atualizar a Função

1. Modifique o código em `src/main.ts`
2. Crie um novo deployment no Appwrite Console
3. Aguarde o build completar
4. Teste a nova versão

### Monitoramento

Monitore as execuções da função no Appwrite Console:

1. **Functions** > **Balance Sync** > **Executions**
2. Verifique logs de erro
3. Monitore tempo de execução
4. Verifique taxa de sucesso

## Referências

- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Functions Quick Start](https://appwrite.io/docs/products/functions/quick-start)
- [Appwrite Functions Deployments](https://appwrite.io/docs/products/functions/deployments)
- [Appwrite Functions Executions](https://appwrite.io/docs/products/functions/executions)
