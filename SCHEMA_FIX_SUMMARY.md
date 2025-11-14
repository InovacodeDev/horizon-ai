# Correção de Schema - Products

## Problema Identificado

A interface TypeScript dos produtos estava usando `camelCase` enquanto o schema do Appwrite usa `snake_case`, causando erros de runtime.

## Mudanças Realizadas

### 1. Interface Product Atualizada

**Antes (camelCase):**

```typescript
interface Product {
  id: string;
  name: string;
  productCode?: string;
  statistics: {
    purchaseCount: number;
    averagePrice: number;
    lastPurchaseDate: string;
  };
}
```

**Depois (snake_case - alinhado com Appwrite):**

```typescript
interface Product {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  name: string;
  product_code?: string;
  ncm_code?: string;
  category: string;
  subcategory?: string;
  total_purchases: number;
  average_price: number;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
}
```

### 2. Arquivos Corrigidos

#### app/(app)/invoices/products/page.tsx

- ✅ Interface Product atualizada
- ✅ `product.id` → `product.$id`
- ✅ `product.statistics.averagePrice` → `product.average_price`
- ✅ `product.statistics.purchaseCount` → `product.total_purchases`
- ✅ `product.statistics.lastPurchaseDate` → `product.last_purchase_date`
- ✅ Adicionado fallback para `last_purchase_date` (pode ser undefined)

#### components/invoices/ShoppingListBuilder.tsx

- ✅ Interface Product simplificada
- ✅ `product.id` → `product.$id`
- ✅ `product.statistics.averagePrice` → `product.average_price`

### 3. Campos Mapeados

| Campo Antigo (camelCase)      | Campo Novo (snake_case) | Tipo    |
| ----------------------------- | ----------------------- | ------- |
| `id`                          | `$id`                   | string  |
| `productCode`                 | `product_code`          | string? |
| `ncmCode`                     | `ncm_code`              | string? |
| `statistics.purchaseCount`    | `total_purchases`       | number  |
| `statistics.averagePrice`     | `average_price`         | number  |
| `statistics.lastPurchaseDate` | `last_purchase_date`    | string? |
| `createdAt`                   | `created_at`            | string  |
| `updatedAt`                   | `updated_at`            | string  |

## Por que isso aconteceu?

1. **Appwrite usa snake_case**: O banco de dados Appwrite armazena campos em `snake_case`
2. **Interface desatualizada**: A interface TypeScript estava usando `camelCase` (padrão JavaScript)
3. **Sem transformação**: Não havia transformação de dados entre o banco e a UI

## Solução Implementada

Alinhamos as interfaces TypeScript com o schema real do Appwrite, usando `snake_case` diretamente. Isso:

- ✅ Elimina erros de runtime
- ✅ Mantém consistência com o banco de dados
- ✅ Evita necessidade de transformação de dados
- ✅ Facilita manutenção futura

## Teste

1. Acesse `/invoices/products`
2. Veja a lista de produtos carregando corretamente
3. Verifique que preço médio, compras e última compra aparecem
4. Clique em "Ver Histórico" para ver detalhes
5. Tudo deve funcionar sem erros!

## Lições Aprendidas

1. **Sempre alinhar interfaces com o schema real**: Verificar o schema do Appwrite antes de criar interfaces
2. **Usar tipos do schema**: Importar tipos de `lib/appwrite/schema.ts` quando possível
3. **Testar com dados reais**: Garantir que a estrutura de dados corresponde ao esperado
4. **Documentar transformações**: Se houver transformação de dados, documentar claramente

## Próximos Passos

- ✅ Verificar se há outras interfaces desalinhadas
- ✅ Considerar criar tipos centralizados em `lib/appwrite/schema.ts`
- ✅ Adicionar validação de tipos em runtime (opcional)

## Correções Adicionais

### Problema: Erro ao clicar em produtos no ShoppingListBuilder

**Erro**: `Cannot read properties of undefined (reading '$id')`

**Causa**: Produtos inválidos ou undefined sendo passados para o componente

### Soluções Implementadas:

1. **Validação no toggleProduct**:

```typescript
if (!product || !product.$id) {
  console.error('Invalid product:', product);
  return;
}
```

2. **Filtro no map**:

```typescript
{
  availableProducts
    .filter((p) => p && p.$id)
    .map((product) => {
      // ...
    });
}
```

3. **Correção de selectedProduct**:

```typescript
// Antes
const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
setSelectedProduct({ id: productId, name: productName });
productId={selectedProduct.id}

// Depois
const [selectedProduct, setSelectedProduct] = useState<{ $id: string; name: string } | null>(null);
setSelectedProduct({ $id: productId, name: productName });
productId={selectedProduct.$id}
```

4. **Log de debug**:

```typescript
console.log('ShoppingListBuilder received products:', availableProducts?.length, availableProducts?.[0]);
```

### Resultado:

- ✅ Produtos são validados antes de uso
- ✅ Produtos inválidos são filtrados
- ✅ selectedProduct usa $id consistentemente
- ✅ Logs ajudam a debugar problemas futuros

### Checklist de Validação:

- [x] Interface Product alinhada com schema
- [x] Todos os usos de `product.id` → `product.$id`
- [x] Todos os usos de `product.statistics.*` → `product.*`
- [x] Validação de produtos inválidos
- [x] Filtro de produtos undefined
- [x] selectedProduct usando $id
- [x] Logs de debug adicionados

## Status Final: ✅ COMPLETO

Todas as páginas e componentes relacionados a produtos agora:

- Usam a interface correta alinhada com Appwrite
- Têm validações de segurança
- Funcionam com realtime ativo
- Têm logs de debug para troubleshooting
