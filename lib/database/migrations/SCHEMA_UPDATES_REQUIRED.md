# Atualizações Necessárias no Schema

## Visão Geral

Após executar as migrações que expandem as colunas "data", você precisará atualizar os tipos TypeScript no arquivo `lib/appwrite/schema.ts` para refletir as novas colunas.

## Mudanças Necessárias por Tabela

### 1. Account (accounts)

**Remover:**

- `data?: string` (campo JSON)

**Adicionar:**

```typescript
bank_id?: string;
last_digits?: string;
status?: 'active' | 'inactive' | 'closed' | 'pending';
```

### 2. CreditCard (credit_cards)

**Remover:**

- `data?: string` (campo JSON)

**Adicionar:**

```typescript
brand?: string;
network?: string;
color?: string;
```

### 3. Invoice (invoices)

**Remover:**

- `data?: string` (campo JSON)

**Adicionar:**

```typescript
series?: string;
merchant_address?: string;
discount_amount?: number;
tax_amount?: number;
custom_category?: string;
source_url?: string;
qr_code_data?: string;
xml_data?: string;
transaction_id?: string;
account_id?: string;
```

### 4. Transaction (transactions)

**Remover:**

- `data?: string` (campo JSON)

**Adicionar:**

```typescript
category?: string;
description?: string;
currency?: string;
source?: 'manual' | 'integration' | 'import';
merchant?: string;
tags?: string; // JSON array serializado
location?: string; // JSON object serializado
receipt_url?: string;
is_recurring?: boolean;
recurring_pattern?: string; // JSON object serializado
integration_id?: string;
integration_data?: string; // JSON object serializado
linked_transaction_id?: string;
```

### 5. Investment (investments)

**Remover:**

- `data?: string` (campo JSON)

**Nota:** Adicione colunas específicas conforme necessário para os dados que estavam sendo armazenados no JSON.

## Interfaces TypeScript a Atualizar

Atualize as seguintes interfaces em `lib/appwrite/schema.ts`:

1. `Account`
2. `AccountData` (pode ser removida)
3. `CreditCard`
4. `Invoice`
5. `InvoiceData` (pode ser removida)
6. `Transaction`

## Exemplo de Atualização

### Antes (Account):

```typescript
export interface Account {
  $id: string;
  user_id: string;
  name: string;
  account_type: string;
  balance: number;
  is_manual: boolean;
  data?: string; // JSON
  created_at: string;
  updated_at: string;
}
```

### Depois (Account):

```typescript
export interface Account {
  $id: string;
  user_id: string;
  name: string;
  account_type: string;
  balance: number;
  is_manual: boolean;
  bank_id?: string;
  last_digits?: string;
  status?: 'active' | 'inactive' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
}
```

## Próximos Passos

1. Execute as migrações: `npm run migrate:up`
2. Atualize `lib/appwrite/schema.ts` com as novas colunas
3. Verifique se há erros de tipo no código
4. Teste a aplicação para garantir que tudo funciona corretamente
