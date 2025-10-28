# Migração de Dados de Transações

## Visão Geral

Este script migra os dados da coluna JSON `data` para colunas individuais na tabela `transactions`, permitindo melhor indexação e filtragem.

## Estrutura Antiga vs Nova

### Antes (Coluna JSON "data"):

```json
{
  "category": "food",
  "description": "Almoço no restaurante",
  "currency": "BRL",
  "source": "manual",
  "merchant": "Restaurante XYZ",
  "tags": ["alimentação", "trabalho"],
  "is_recurring": false
}
```

### Depois (Colunas Individuais):

- `category` (string, indexed)
- `description` (string)
- `currency` (string, default: "BRL")
- `source` (enum: manual, integration, import)
- `merchant` (string, indexed)
- `tags` (string - comma-separated)
- `is_recurring` (boolean)

## Benefícios

1. **Melhor Performance**: Índices em colunas individuais são muito mais rápidos
2. **Filtros Eficientes**: Queries podem usar índices nativos do banco
3. **Validação de Dados**: Enums garantem valores válidos
4. **Facilidade de Uso**: Não precisa fazer parse de JSON em cada query

## Como Executar

### Passo 1: Executar a Migration

```bash
npm run migrate:up
```

Isso criará as novas colunas na tabela `transactions`.

### Passo 2: Migrar os Dados Existentes

```bash
npx tsx scripts/migrate-transactions-data.ts
```

O script irá:

- Buscar todas as transações existentes
- Extrair dados da coluna `data` (JSON)
- Copiar para as novas colunas individuais
- Pular transações já migradas
- Mostrar progresso e estatísticas

### Passo 3: Verificar os Resultados

O script mostrará um resumo:

```
📊 Migration Summary:
   Total processed: 150
   Successfully migrated: 145
   Errors: 0
   Skipped (already migrated): 5
```

## Segurança

- ✅ **Não destrutivo**: A coluna `data` original é mantida
- ✅ **Idempotente**: Pode ser executado múltiplas vezes
- ✅ **Rollback**: A migration pode ser revertida com `npm run migrate:down`
- ✅ **Validação**: Verifica se transações já foram migradas

## Rollback

Se precisar reverter:

```bash
npm run migrate:down
```

Isso removerá as novas colunas e índices.

## Notas Importantes

1. **Backup**: Sempre faça backup antes de executar migrations em produção
2. **Downtime**: A migration pode levar alguns minutos dependendo do volume de dados
3. **Rate Limiting**: O script inclui delays para evitar rate limiting do Appwrite
4. **Logs**: Todos os erros são logados para análise

## Troubleshooting

### Erro: "Missing API Key"

Certifique-se de que `APPWRITE_API_KEY` está definida no `.env.local`

### Erro: "Rate Limit Exceeded"

Aumente o delay no script (linha com `setTimeout`)

### Transações não migradas

Execute o script novamente - ele é idempotente e processará apenas as pendentes
