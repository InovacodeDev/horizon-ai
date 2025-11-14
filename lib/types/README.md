# Lib / Types

Definições de tipos TypeScript usados em toda a aplicação.

## Arquivos

- **index.ts** - Tipos principais e exports centralizados
- **credit-card.types.ts** - Tipos relacionados a cartões de crédito e faturas
- **import.types.ts** - Tipos para importação de transações (OFX, CSV, PDF)
- **investment.types.ts** - Tipos para investimentos
- **sharing.types.ts** - Tipos para compartilhamento de contas e convites
- **shopping-list-api.types.ts** - Tipos para API de lista de compras

## Convenções

- Use interfaces para objetos que podem ser estendidos
- Use types para unions, intersections e tipos complexos
- Prefixe tipos de API com `API` (ex: `APIResponse`)
- Sufixe tipos de request com `Request` (ex: `CreateAccountRequest`)
- Sufixe tipos de response com `Response` (ex: `AccountResponse`)

## Exemplo

```typescript
export interface Account {
  $id: string;
  name: string;
  balance: number;
  type: AccountType;
}

export type AccountType = 'checking' | 'savings' | 'investment';
```
