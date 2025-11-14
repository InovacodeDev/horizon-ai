# App / API

API Routes do Next.js para endpoints REST.

## Estrutura

- **/accounts** - CRUD de contas bancárias
- **/auth** - Autenticação, login, logout, refresh token
- **/credit-cards** - CRUD de cartões de crédito
- **/family** - Gestão familiar
- **/invoices** - Upload e processamento de NFes
- **/products** - Produtos e comparação de preços
- **/sharing** - Compartilhamento de contas e convites
- **/shopping-list** - Lista de compras
- **/transactions** - CRUD de transações
- **/users** - Gerenciamento de usuários

## Convenções

- Cada pasta contém `route.ts` com handlers HTTP (GET, POST, PUT, DELETE)
- Validação de entrada com Zod
- Autenticação via JWT em cookies httpOnly
- Respostas padronizadas: `{ success, data?, error? }`
- Status codes HTTP apropriados

## Exemplo

```typescript
// app/api/accounts/route.ts
export async function GET(request: Request) {
  // Listar contas
}

export async function POST(request: Request) {
  // Criar conta
}
```
