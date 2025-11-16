# Melhorias no Sistema de Produtos e Lista de Compras Manual

## 📋 Resumo das Alterações

### 1. **Correção da Lista Manual de Compras** ✅

- **Problema**: A lista manual não carregava produtos
- **Solução**: Corrigida a leitura da resposta da API `/api/products` para usar `data.data` ao invés de `data.products`
- **Arquivo**: `components/invoices/ManualShoppingListBuilder.tsx`

### 2. **Integração com Realtime** ✅

- **Adicionado**: Subscrição realtime para atualizar produtos automaticamente
- **Benefício**: Quando novas notas fiscais são processadas, os produtos aparecem instantaneamente na lista manual
- **Canais**: `products.documents` (onCreate, onUpdate, onDelete)

### 3. **Extração de Marca e Detecção de Promoção** 🆕

#### Normalização Inteligente de Produtos

O sistema agora extrai automaticamente:

**Marcas Conhecidas:**

- Nestle, Kitkat, Italac, Tirol, Sadia, Seara, Perdigão
- JCW, Devile, Top Quality, Aurora
- Coca Cola, Pepsi, Ambev
- E muitas outras...

**Exemplos de Normalização:**

| Nome na Nota Fiscal                  | Nome Normalizado   | Marca Extraída | É Promoção? |
| ------------------------------------ | ------------------ | -------------- | ----------- |
| Alface Crespa Devile UN              | Alface Crespa      | Devile         | ❌          |
| Bacon JCW 1kg Cubos                  | Bacon              | JCW            | ❌          |
| Choc Nestle Kitkat Coconut Promocao  | Chocolate Coconut  | Kitkat         | ✅          |
| Carne Moida Bov Top Quality Promocao | Carne Moída Bovino | Top Quality    | ✅          |
| Leite Italac Integral 1 L            | Leite Integral     | Italac         | ❌          |
| Leite UHT Tirol Int 1L               | Leite Integral     | Tirol          | ❌          |

#### Agrupamento Inteligente

- **Leite Italac Integral 1 L** e **Leite UHT Tirol Int 1L** → Mesmo produto: **Leite Integral**
- Cada item da nota fiscal mantém referência ao produto para histórico de preços
- Facilita análise de preços entre marcas diferentes

### 4. **Nova Tabela de Produtos**

#### Campos Adicionados:

- **`brand`** (string, opcional): Marca extraída do nome do produto
- **`is_promotion`** (boolean, padrão: false): Indica se estava em promoção na compra

#### Benefícios para Análise de Preços:

```typescript
// Exemplo: Comparar preços de um produto entre marcas
const leiteIntegral = products.filter((p) => p.name === 'Leite Integral');
// Retorna: [
//   { name: 'Leite Integral', brand: 'Italac', average_price: 4.99 },
//   { name: 'Leite Integral', brand: 'Tirol', average_price: 5.29 }
// ]

// Exemplo: Filtrar produtos em promoção
const promocoes = products.filter((p) => p.is_promotion);
```

### 5. **Detecção de Promoção**

#### Palavras-chave identificadas:

- promocao, promoção, promo
- oferta, desconto
- atacado, combo, kit
- leve X pague Y
- super, mega, hiper

**Exemplo de uso na IA:**

```
Se um produto foi marcado como "promoção", a IA de lista de compras pode:
1. Alertar que o preço atual pode estar mais alto
2. Sugerir esperar por nova promoção
3. Considerar preços "normais" na análise de consumo
```

### 6. **Expansão de Abreviações**

#### Novos mapeamentos:

```typescript
bov → bovino
moida → moída
crescpa → crespa
int → integral
uht → (removido, não adiciona valor)
```

### 7. **Migration Automática**

**Arquivo**: `lib/database/migrations/20251115_000042_add_brand_promotion_to_products.ts`

**Comandos:**

```bash
# Aplicar migration
pnpm migrate:up

# Reverter migration (se necessário)
pnpm migrate:down
```

## 🎯 Impacto no Usuário

### Antes:

```
Nota Fiscal:
- Leite Italac Integral 1 L → Produto: "leite italac integral l"
- Leite UHT Tirol Int 1L → Produto: "leite uht tirol int l"

Resultado: 2 produtos diferentes, difícil comparar preços
```

### Depois:

```
Nota Fiscal:
- Leite Italac Integral 1 L → Produto: "Leite Integral" | Marca: "Italac"
- Leite UHT Tirol Int 1L → Produto: "Leite Integral" | Marca: "Tirol"

Resultado: 1 produto, fácil comparar preços entre marcas
```

## 📊 Casos de Uso

### 1. Lista Manual de Compras

- Usuário vê "Leite Integral" com histórico de preços de múltiplas marcas
- Pode escolher a marca mais barata ou preferida

### 2. Análise de Preços

- Comparar preços do mesmo produto em diferentes marcas
- Identificar quando comprou em promoção vs. preço normal
- Detectar tendências de preço

### 3. IA de Lista de Compras

- Sugerir produtos baseado em histórico normalizado
- Considerar promoções no cálculo de preço estimado
- Recomendar marcas mais econômicas

## 🔧 Arquivos Modificados

1. ✅ `components/invoices/ManualShoppingListBuilder.tsx` - Correção de bug + realtime
2. ✅ `lib/services/product-normalization.service.ts` - Extração de marca e promoção
3. ✅ `lib/services/invoice.service.ts` - Salvar brand e is_promotion
4. ✅ `lib/appwrite/schema.ts` - Tipos atualizados
5. ✅ `lib/database/migrations/20251115_000042_add_brand_promotion_to_products.ts` - Nova migration
6. ✅ `lib/database/migrations/index.ts` - Registrar migration

## 🚀 Próximos Passos

1. **Executar a migration**: `pnpm migrate:up`
2. **Testar lista manual**: Verificar que produtos aparecem corretamente
3. **Processar nova nota fiscal**: Verificar extração de marca e promoção
4. **Verificar agrupamento**: Confirmar que produtos similares são agrupados

## 📝 Notas Técnicas

- A normalização mantém compatibilidade com produtos existentes
- Produtos sem marca terão `brand: null`
- A detecção de promoção é case-insensitive
- O agrupamento usa Levenshtein distance (similaridade > 75%)
