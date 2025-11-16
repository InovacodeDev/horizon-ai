# Script de Regeneração de Produtos

Este script regenera todos os produtos com base nas novas regras de normalização implementadas no `product-normalization.service.ts`.

## O que o script faz

1. **Busca todos os invoice_items** da base de dados
2. **Remove todos os produtos existentes** (⚠️ DESTRUTIVO!)
3. **Regenera os produtos** aplicando as novas regras de normalização que incluem:
   - Extração de marca de uma lista de 400+ marcas brasileiras
   - Detecção de promoções
   - Normalização de nomes (expansão de abreviações, remoção de ruído)
   - Agrupamento inteligente de produtos similares
4. **Atualiza os invoice_items** com as referências aos novos produtos

## Melhorias implementadas

### 1. Lista expandida de marcas (400+)

Baseado no documento de taxonomia do varejo brasileiro, o script agora reconhece:

- **Unilever**: Seda, TRESemmé, Dove, Clear, Omo, Comfort, etc.
- **P&G**: Gillette, Oral-B, Pantene, Always, Pampers, etc.
- **L'Oréal**: Elseve, Garnier, Niely, La Roche-Posay, Vichy, etc.
- **Coty**: Monange, Risqué, Bozzano, etc.
- **BRF**: Sadia, Perdigão, Qualy, etc.
- **JBS**: Seara, Friboi, Swift, etc.
- **Nestlé**: Ninho, Molico, Nescau, Maggi, Moça, etc.
- **Laticínios**: Danone, Parmalat, Batavo, Itambé, Vigor, Piracanjuba, Tirol
- **Biscoitos**: Piraquê, Lacta, Oreo, Passatempo, etc.
- **Bebidas**: Skol, Brahma, Heineken, Itaipava, Coca-Cola, Pepsi, etc.
- **Café**: 3 Corações, Pilão, L'OR, Santa Clara, etc.
- **Limpeza**: Ypê, Bombril, Veja, Vanish, etc.

### 2. Palavras de promoção expandidas

Agora detecta promoções com palavras como:

- promocao, promoção, promo, oferta, desconto
- atacado, combo, kit, pack
- leve, pague, gratis
- venc, prox venc (produtos próximos ao vencimento)
- especial

### 3. Unidades de medida e ruído

Lista expandida de noise words incluindo:

- **Unidades**: un, und, unid, pc, pct, cx, caixa, dz, duzia, etc.
- **Peso**: kg, g, mg, grama
- **Volume**: l, ml, litro
- **Embalagens**: pet, garrafa, lata, tetra pak, bisnaga, refil, sachê, fardo, etc.

### 4. Abreviações comuns

O script agora expande abreviações como:

- **Bebidas**: refrig → refrigerante
- **Alimentos**: bov → bovino, moida → moída, crescpa → crespa, int → integral, uht → (remove)
- **Higiene**: shamp → shampoo, desod → desodorante, cond → condicionador
- **Limpeza**: deterg → detergente, amac → amaciante, desinf → desinfetante

## Exemplos de normalização

### Antes vs Depois

| Nome Original                        | Nome Normalizado   | Marca       | Promoção |
| ------------------------------------ | ------------------ | ----------- | -------- |
| Leite Italac Integral 1 L            | Leite Integral     | Italac      | ❌       |
| Leite UHT Tirol Int 1L               | Leite Integral     | Tirol       | ❌       |
| Alface Crespa Devile UN              | Alface Crespa      | Devile      | ❌       |
| Bacon JCW 1kg Cubos                  | Bacon              | JCW         | ❌       |
| Choc Nestle Kitkat Coconut Promocao  | Chocolate Coconut  | Kitkat      | ✅       |
| Carne Moida Bov Top Quality Promocao | Carne Moída Bovino | Top Quality | ✅       |
| Refrigerante Coca-Cola 2L PET Oferta | Refrigerante       | Coca-Cola   | ✅       |

### Agrupamento inteligente

Produtos similares são agrupados:

- "Leite Italac Integral 1L" + "Leite UHT Tirol Int 1L" = **mesmo produto** "Leite Integral" (marcas diferentes)
- Histórico de preços mantido separado por marca
- Facilita análise de preço médio e comparação entre marcas

## ⚠️ ATENÇÃO - Script Destrutivo

Este script **remove todos os produtos existentes** antes de recriá-los.

### Recomendações antes de executar:

1. **Faça backup do banco de dados**
2. Execute em ambiente de teste primeiro
3. Verifique se todos os invoice_items estão corretos
4. Confirme que as novas regras de normalização estão adequadas

## Como executar

### Pré-requisitos

1. Arquivo `.env` configurado com credenciais do Appwrite
2. Migração `20251115_000042_add_brand_promotion_to_products` aplicada (`pnpm migrate:up`)

### Execução

```bash
# A partir da raiz do projeto
pnpm tsx scripts/regenerate-products.ts
```

### Output esperado

```
🚀 Iniciando regeneração de produtos...

📋 Buscando todos os invoice_items...
  ↳ Carregados 100 invoice_items...
  ↳ Carregados 200 invoice_items...
✅ Total de 250 invoice_items encontrados

🗑️  Removendo produtos existentes...
  ↳ Removidos 10 produtos...
  ↳ Removidos 20 produtos...
✅ 25 produtos removidos

👥 Agrupando invoice_items por usuário...
✅ Encontrados 3 usuários

👤 Processando usuário: user123
  ↳ 100 invoice_items
  ↳ 45 produtos únicos identificados
    ↳ 10 produtos criados...
    ↳ 20 produtos criados...

✨ Regeneração concluída!
📊 Estatísticas:
  - Invoice items processados: 250
  - Produtos antigos removidos: 25
  - Produtos novos criados: 78
  - Invoice items atualizados: 250
  - Usuários processados: 3

🎉 Script executado com sucesso!
```

## Estrutura dos dados

### Produtos criados

Cada produto terá:

```typescript
{
  user_id: string;
  name: string;                    // Nome normalizado
  product_code?: string;           // EAN/GTIN
  ncm_code?: string;               // Código NCM
  category: string;                // Categoria principal
  subcategory?: string;            // Subcategoria
  brand?: string;                  // Marca extraída (NOVO)
  is_promotion?: boolean;          // Detectou promoção (NOVO)
  average_price: number;           // Preço médio calculado
  last_purchase_date: string;      // Data da última compra
  total_purchases: number;         // Total de compras
  created_at: string;
  updated_at: string;
}
```

### Invoice items atualizados

Cada invoice_item manterá:

- Nome original do produto (do cupom fiscal)
- Referência ao produto normalizado via `product_id`

## Monitoramento

Durante a execução, o script exibe:

- Progresso de carregamento de invoice_items
- Quantidade de produtos removidos
- Produtos únicos identificados por usuário
- Progresso de criação de produtos
- Estatísticas finais

## Solução de problemas

### Erro: "Cannot find module"

Verifique se todas as dependências estão instaladas:

```bash
pnpm install
```

### Erro: "Appwrite client not initialized"

Verifique o arquivo `.env`:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=seu_project_id
APPWRITE_API_KEY=sua_api_key
```

### Erro: "Column 'brand' does not exist"

Execute a migração antes do script:

```bash
pnpm migrate:up
```

### Produtos duplicados após execução

Isso não deveria acontecer, mas se ocorrer:

1. Verifique logs de erro durante a criação
2. Execute o script novamente (ele remove tudo antes)

## Próximos passos

Após executar o script:

1. Verifique a lista de produtos no Appwrite Console
2. Teste a criação de listas de compras manuais
3. Processe novas notas fiscais e verifique se as marcas são detectadas
4. Analise o histórico de preços por marca
5. Use as informações de promoção para análise de preços

## Referências

- **Taxonomia**: Documento "Taxonomia Avançada do Ecossistema de Varejo Brasileiro"
- **Normalização**: `lib/services/product-normalization.service.ts`
- **Migração**: `lib/database/migrations/20251115_000042_add_brand_promotion_to_products.ts`
- **Documentação**: `PRODUCT_IMPROVEMENTS.md`
