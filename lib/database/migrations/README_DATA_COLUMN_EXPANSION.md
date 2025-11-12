# Expansão das Colunas "data"

## Visão Geral

Este conjunto de migrações remove a coluna "data" (JSON) de todas as tabelas e adiciona colunas individuais nullable para cada campo que estava armazenado no JSON.

## Migrações Criadas

### 1. `20251111_000030_expand_investments_data_column.ts`

- **Tabela**: `investments`
- **Ação**: Remove coluna `data`
- **Nota**: Adicione colunas específicas conforme necessário para os dados armazenados no JSON

### 2. `20251111_000031_expand_credit_cards_data_column.ts`

- **Tabela**: `credit_cards`
- **Ação**: Remove coluna `data` e adiciona:
  - `brand` (string, 50 chars, nullable)
  - `network` (string, 50 chars, nullable)
  - `color` (string, 20 chars, nullable)

### 3. `20251111_000032_expand_invoices_data_column.ts`

- **Tabela**: `invoices`
- **Ação**: Remove coluna `data` e adiciona:
  - `series` (string, 50 chars, nullable)
  - `merchant_address` (string, 500 chars, nullable)
  - `discount_amount` (float, nullable)
  - `tax_amount` (float, nullable)
  - `custom_category` (string, 100 chars, nullable)
  - `source_url` (url, nullable)
  - `qr_code_data` (string, 1000 chars, nullable)
  - `xml_data` (string, 4000 chars, nullable)
  - `transaction_id` (string, 255 chars, nullable)
  - `account_id` (string, 255 chars, nullable)

### 4. `20251111_000033_expand_accounts_data_column.ts`

- **Tabela**: `accounts`
- **Ação**: Remove coluna `data` e adiciona:
  - `bank_id` (string, 255 chars, nullable)
  - `last_digits` (string, 10 chars, nullable)
  - `status` (enum: active, inactive, closed, pending, nullable)

### 5. `20251111_000034_expand_transactions_data_column.ts`

- **Tabela**: `transactions`
- **Ação**: Remove coluna `data` e adiciona:
  - `category` (string, 100 chars, nullable)
  - `description` (string, 500 chars, nullable)
  - `currency` (string, 10 chars, nullable)
  - `source` (enum: manual, integration, import, nullable)
  - `account_id` (string, 255 chars, nullable)
  - `merchant` (string, 255 chars, nullable)
  - `integration_id` (string, 255 chars, nullable)
  - `integration_data` (string/JSON, 2000 chars, nullable)
  - `tags` (string/JSON array, 500 chars, nullable)
  - `location` (string/JSON, 1000 chars, nullable)
  - `receipt_url` (url, nullable)
  - `is_recurring` (boolean, nullable)
  - `recurring_pattern` (string/JSON, 500 chars, nullable)

## Como Executar

```bash
# Execute as migrações
npm run migrate:up
```

## Rollback

Todas as migrações incluem um método `down()` que:

1. Remove as colunas individuais criadas
2. Recria a coluna `data` original

**⚠️ ATENÇÃO**: O rollback resultará em perda de dados das colunas individuais!

```bash
# Para reverter
npm run migrate:down
```

## Considerações

- Todas as novas colunas são **nullable** (não obrigatórias)
- Alguns campos complexos (como `integration_data`, `tags`, `location`, `recurring_pattern`) continuam como strings JSON
- A migração da tabela `investments` pode precisar de colunas adicionais dependendo dos dados armazenados
- Certifique-se de atualizar os tipos TypeScript e queries após executar as migrações
