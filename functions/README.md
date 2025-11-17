# Functions

Appwrite Functions (serverless) para lógica de negócio executada no backend.

## Functions Disponíveis

### balance-sync/

Sincronização automática de saldos de contas.

**Triggers:**

- Eventos de transação (create, update, delete)
- Schedule diário (20:00 UTC)

**Função:** Recalcula e atualiza saldos das contas baseado nas transações.

### recurring-transactions/

Criação automática de transações recorrentes.

**Trigger:** Schedule mensal (dia 1 às 00:00 UTC)

**Função:** Cria transações recorrentes (salário, aluguel, assinaturas, etc.)

### expire-invitations/

Expiração automática de convites antigos.

**Trigger:** Schedule diário (00:00 UTC)

**Função:** Expira convites de compartilhamento não aceitos após X dias.

### credit-card-bills/

Gerenciamento automático de faturas de cartão de crédito.

**Triggers:**

- Eventos de transação de cartão de crédito (create, update, delete)

**Função:** Cria ou atualiza transactions de despesa para cada fatura de cartão de crédito, consolidando todas as compras e parcelamentos do mês em uma única transação com o valor total da fatura e data de vencimento.

## Deploy

Cada function tem seu próprio script de deploy:

```bash
cd functions/balance-sync
./deploy.sh

cd functions/recurring-transactions
./deploy.sh

cd functions/expire-invitations
./deploy.sh

cd functions/credit-card-bills
npm install && npm run build
# Deploy via Appwrite Console ou CLI
```

## Estrutura

Cada function contém:

- **src/** - Código fonte TypeScript
- **package.json** - Dependências
- **tsconfig.json** - Configuração TypeScript
- **appwrite.json** - Configuração da function
- **deploy.sh** - Script de deploy
- **README.md** - Documentação específica

## Documentação Adicional

- **TIMEOUT_FIX.md** - Guia para resolver problemas de timeout

## Desenvolvimento

1. Desenvolva localmente em `src/`
2. Teste com scripts de teste incluídos
3. Build: `npm run build`
4. Deploy: `./deploy.sh`

## Logs

Acesse logs no Appwrite Console:

- Functions > [Nome da Function] > Executions
