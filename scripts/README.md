# Scripts

Scripts utilitários para desenvolvimento, manutenção e testes.

## Scripts Disponíveis

### Validação e Verificação

- **validate-env.ts** - Valida variáveis de ambiente (usado em `pnpm validate:env`)
- **validate-appwrite.ts** - Valida configuração do Appwrite (usado em `pnpm validate:appwrite`)
- **pre-push-check.sh** - Verificações antes do push (usado em `pnpm pre-push`)

### Testes

- **test-realtime.ts** - Testa conexão Realtime do Appwrite (usado em `pnpm test:realtime`)
- **test-balance-sync.ts** - Testa sincronização de saldos
- **test-timezone.ts** - Testa tratamento de timezone

### Migrações e Manutenção

- **migrate-transactions-data.ts** - Migra dados de transações (migração histórica)
- **migrate-add-salary-type.ts** - Adiciona tipo de salário (migração histórica)
- **recalculate-all-balances.ts** - Recalcula saldos de todas as contas
- **reset-balances-and-transactions.ts** - Reseta saldos e transações (usado em `pnpm reset:balances`)

### Demonstrações

- **demo-toon-savings.ts** - Demonstra economia de tokens com formato TOON (usado em `pnpm demo:toon`)

### Documentação

- **README-BALANCE-SYNC.md** - Documentação sobre sincronização de saldos
- **README-MIGRATION.md** - Documentação sobre migrações
- **tsconfig.json** - Configuração TypeScript para scripts

## Uso

Scripts podem ser executados diretamente com tsx:

```bash
tsx scripts/nome-do-script.ts
```

Ou através dos comandos npm definidos no package.json:

```bash
pnpm validate:env
pnpm test:realtime
pnpm demo:toon
```
