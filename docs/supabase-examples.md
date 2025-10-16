# Exemplos de Uso do Supabase

Este documento contém exemplos práticos de como usar o Supabase client no projeto.

## Importação

```typescript
import { supabase, supabaseAdmin } from "@/lib/db";
import { createId } from "@paralleldrive/cuid2";
```

## Operações CRUD

### Create (Insert)

#### Inserir um usuário

```typescript
const { data, error } = await supabaseAdmin
  .from("users")
  .insert({
    id: createId(),
    email: "user@example.com",
    password_hash: hashedPassword,
    first_name: "João",
    last_name: "Silva",
    role: "FREE",
  })
  .select()
  .single();

if (error) {
  console.error("Erro ao criar usuário:", error);
  throw error;
}

console.log("Usuário criado:", data);
```

#### Inserir múltiplas transações

```typescript
const transactions = [
  {
    id: createId(),
    account_id: accountId,
    user_id: userId,
    external_id: "tx_001",
    type: "DEBIT",
    amount: "150.00",
    description: "Compra no supermercado",
    category: "Alimentação",
    transaction_date: new Date().toISOString(),
  },
  {
    id: createId(),
    account_id: accountId,
    user_id: userId,
    external_id: "tx_002",
    type: "CREDIT",
    amount: "3000.00",
    description: "Salário",
    category: "Renda",
    transaction_date: new Date().toISOString(),
  },
];

const { data, error } = await supabase
  .from("transactions")
  .insert(transactions)
  .select();
```

### Read (Select)

#### Buscar usuário por email

```typescript
const { data: user, error } = await supabaseAdmin
  .from("users")
  .select("*")
  .eq("email", "user@example.com")
  .single();

if (error) {
  if (error.code === "PGRST116") {
    console.log("Usuário não encontrado");
  } else {
    throw error;
  }
}
```

#### Buscar transações com filtros e ordenação

```typescript
const { data: transactions, error } = await supabase
  .from("transactions")
  .select("*")
  .eq("user_id", userId)
  .gte("transaction_date", startDate)
  .lte("transaction_date", endDate)
  .order("transaction_date", { ascending: false })
  .limit(50);
```

#### Buscar com joins (relacionamentos)

```typescript
const { data: accounts, error } = await supabase
  .from("accounts")
  .select(
    `
    *,
    connections (
      id,
      institution_name,
      status
    )
  `
  )
  .eq("user_id", userId);
```

#### Buscar com contagem

```typescript
const { count, error } = await supabase
  .from("transactions")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId);

console.log(`Total de transações: ${count}`);
```

#### Paginação

```typescript
const pageSize = 20;
const page = 1;
const from = page * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from("transactions")
  .select("*", { count: "exact" })
  .eq("user_id", userId)
  .order("transaction_date", { ascending: false })
  .range(from, to);

const totalPages = Math.ceil((count || 0) / pageSize);
```

### Update

#### Atualizar status de conexão

```typescript
const { error } = await supabase
  .from("connections")
  .update({
    status: "ACTIVE",
    last_sync_at: new Date().toISOString(),
  })
  .eq("id", connectionId)
  .eq("user_id", userId);
```

#### Atualizar com retorno dos dados

```typescript
const { data, error } = await supabase
  .from("users")
  .update({
    first_name: "João",
    last_name: "Silva",
    updated_at: new Date().toISOString(),
  })
  .eq("id", userId)
  .select()
  .single();
```

### Delete

#### Deletar refresh token

```typescript
const { error } = await supabase
  .from("refresh_tokens")
  .delete()
  .eq("id", tokenId)
  .eq("user_id", userId);
```

#### Deletar com cascade (automático via FK)

```typescript
// Deletar conexão (automaticamente deleta accounts e transactions relacionadas)
const { error } = await supabase
  .from("connections")
  .delete()
  .eq("id", connectionId)
  .eq("user_id", userId);
```

## Operações Avançadas

### Upsert (Insert ou Update)

```typescript
const { data, error } = await supabase
  .from("accounts")
  .upsert(
    {
      id: accountId,
      user_id: userId,
      balance: "1500.00",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    }
  )
  .select();
```

### Busca com OR

```typescript
const { data, error } = await supabase
  .from("connections")
  .select("*")
  .eq("user_id", userId)
  .or("status.eq.ACTIVE,status.eq.EXPIRED");
```

### Busca com IN

```typescript
const accountIds = ["acc_1", "acc_2", "acc_3"];

const { data, error } = await supabase
  .from("transactions")
  .select("*")
  .in("account_id", accountIds)
  .eq("user_id", userId);
```

### Busca com LIKE (case-insensitive)

```typescript
const { data, error } = await supabase
  .from("transactions")
  .select("*")
  .eq("user_id", userId)
  .ilike("description", "%uber%");
```

### Agregações

```typescript
// Soma total de transações
const { data, error } = await supabase.rpc("sum_transactions", {
  p_user_id: userId,
  p_start_date: startDate,
  p_end_date: endDate,
});
```

## Transações (Database Transactions)

O Supabase JS client não suporta transações diretamente. Para operações que precisam ser atômicas, use stored procedures:

```sql
-- Criar stored procedure no Supabase
CREATE OR REPLACE FUNCTION transfer_balance(
  p_from_account_id TEXT,
  p_to_account_id TEXT,
  p_amount DECIMAL,
  p_user_id TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Debitar da conta origem
  UPDATE accounts
  SET balance = balance - p_amount
  WHERE id = p_from_account_id AND user_id = p_user_id;

  -- Creditar na conta destino
  UPDATE accounts
  SET balance = balance + p_amount
  WHERE id = p_to_account_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Chamar stored procedure
const { error } = await supabase.rpc("transfer_balance", {
  p_from_account_id: fromAccountId,
  p_to_account_id: toAccountId,
  p_amount: 100.0,
  p_user_id: userId,
});
```

## Tratamento de Erros

```typescript
try {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    // Erros específicos do Supabase
    switch (error.code) {
      case "PGRST116":
        throw new Error("Usuário não encontrado");
      case "23505":
        throw new Error("Email já cadastrado");
      case "23503":
        throw new Error("Referência inválida");
      default:
        console.error("Erro do Supabase:", error);
        throw new Error("Erro ao buscar usuário");
    }
  }

  return data;
} catch (error) {
  console.error("Erro:", error);
  throw error;
}
```

## Uso em API Routes (Next.js)

### GET Endpoint

```typescript
// app/api/v1/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Pegar userId do middleware/auth
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### POST Endpoint

```typescript
// app/api/v1/connections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

const createConnectionSchema = z.object({
  institution_id: z.string(),
  institution_name: z.string(),
  access_token: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createConnectionSchema.parse(body);

    // Criptografar token (implementar função de criptografia)
    const encryptedToken = await encryptToken(validated.access_token);

    const { data, error } = await supabaseAdmin
      .from("connections")
      .insert({
        id: createId(),
        user_id: userId,
        institution_id: validated.institution_id,
        institution_name: validated.institution_name,
        encrypted_access_token: encryptedToken,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create connection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ connection: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Uso em Server Components

```typescript
// app/dashboard/page.tsx
import { supabase } from "@/lib/db";
import { cookies } from "next/headers";

async function getDashboardData(userId: string) {
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select(
      `
      *,
      connections (
        institution_name,
        status
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to fetch accounts");
  }

  return accounts;
}

export default async function DashboardPage() {
  // Pegar userId do cookie/session
  const userId = "user_123"; // Implementar auth

  const accounts = await getDashboardData(userId);

  return (
    <div>
      <h1>Dashboard</h1>
      {accounts.map((account) => (
        <div key={account.id}>
          <p>{account.name}</p>
          <p>{account.balance}</p>
        </div>
      ))}
    </div>
  );
}
```

## Uso com React Query

```typescript
// hooks/useTransactions.ts
import { useQuery } from "@tanstack/react-query";

export function useTransactions(userId: string) {
  return useQuery({
    queryKey: ["transactions", userId],
    queryFn: async () => {
      const response = await fetch("/api/v1/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Uso no componente
function TransactionList() {
  const { data, isLoading, error } = useTransactions("user_123");

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.transactions.map((tx) => (
        <li key={tx.id}>
          {tx.description} - {tx.amount}
        </li>
      ))}
    </ul>
  );
}
```

## Dicas e Best Practices

1. **Use supabaseAdmin para operações server-side** que precisam bypassar RLS
2. **Use supabase (anon key) para operações client-side** que respeitam RLS
3. **Sempre filtre por userId** em queries para garantir segurança
4. **Use .single()** quando espera apenas um resultado
5. **Use .select()** após insert/update para retornar os dados
6. **Trate erros específicos** usando error.code
7. **Use tipos TypeScript** gerados automaticamente
8. **Implemente paginação** para listas grandes
9. **Use índices** para queries frequentes
10. **Teste RLS policies** para garantir segurança

## Referências

- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)
- [PostgREST API](https://postgrest.org/en/stable/api.html)
