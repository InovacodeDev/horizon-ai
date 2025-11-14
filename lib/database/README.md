# Lib / Database

Sistema de migrações e gerenciamento do banco de dados Appwrite.

## Estrutura

### migrations/

Scripts de migração do banco de dados:

- **cli.ts** - CLI para executar migrações
- Arquivos de migração numerados (001*\*, 002*\*, etc.)

## Comandos

```bash
# Executar migrações pendentes
pnpm migrate:up

# Reverter última migração
pnpm migrate:down

# Ver status das migrações
pnpm migrate:status

# Resetar banco (cuidado!)
pnpm migrate:reset
```

## Como Criar uma Migração

1. Crie um novo arquivo em `migrations/` seguindo o padrão:
   - `XXX_nome_descritivo.ts`
   - XXX = número sequencial (ex: 015)

2. Implemente as funções `up()` e `down()`:

```typescript
export async function up() {
  // Código para aplicar a migração
}

export async function down() {
  // Código para reverter a migração
}
```

3. Execute: `pnpm migrate:up`

## Convenções

- Migrações são executadas em ordem numérica
- Sempre implemente `down()` para permitir rollback
- Teste migrações em ambiente de desenvolvimento primeiro
- Documente mudanças significativas no código
