# 🤖 Lista de Compras Inteligente com IA

## Visão Geral

A funcionalidade de **Lista de Compras Inteligente** usa Inteligência Artificial para analisar seu histórico de compras e gerar automaticamente listas de compras personalizadas baseadas no seu padrão de consumo real.

## 🎯 Características Principais

### 1. Análise Inteligente de Padrões

- **Frequência de Compra**: Identifica produtos comprados semanalmente, quinzenalmente ou mensalmente
- **Quantidade Média**: Calcula a quantidade média consumida de cada produto
- **Ciclos de Reposição**: Detecta quando você normalmente precisa repor cada item
- **Sazonalidade**: Considera padrões sazonais quando detectados

### 2. Geração Automática de Listas

- **Por Categoria**: Gere listas específicas para supermercado, farmácia, mercearia, etc.
- **Período Configurável**: Analise de 3 meses até 2 anos de histórico
- **Confiança da IA**: Cada item vem com um score de confiança e justificativa
- **Organização Inteligente**: Items agrupados por categoria e subcategoria

### 3. Exportação em PDF

- **Formato Profissional**: PDF formatado com cabeçalho, categorias e checkbox
- **Pronto para Usar**: Imprima e use no supermercado
- **Estimativa de Preços**: Inclui preços estimados e total da compra
- **Visual Atraente**: Layout limpo com cores e ícones

## 🚀 Como Usar

### Passo 1: Acesse a Página de Produtos

```
Navegue para: Notas Fiscais → Produtos
```

### Passo 2: Clique em "🤖 Lista Inteligente"

O botão roxo no topo da página ativa o gerador de IA.

### Passo 3: Configure a Geração

1. **Selecione a Categoria**: Escolha o tipo de lista (Supermercado, Farmácia, etc.)
2. **Defina o Período**: Escolha quantos meses de histórico analisar (recomendado: 1 ano)
3. **Clique em "Gerar Lista com IA"**

### Passo 4: Revise a Lista Gerada

- Veja os itens sugeridos com quantidades
- Leia a justificativa da IA para cada item
- Marque itens como comprados usando os checkboxes
- Veja o score de confiança de cada sugestão

### Passo 5: Exporte para PDF

Clique em "📄 Exportar PDF" para baixar uma versão imprimível.

## 📊 Como Funciona a IA

### Análise de Padrões

```
Exemplo: Leite Integral 1L

Histórico detectado:
- Jan: 12 unidades
- Fev: 12 unidades
- Mar: 10 unidades
- Abr: 14 unidades

Análise da IA:
- Média mensal: 12 unidades
- Frequência: 100% dos meses
- Última compra: há 28 dias
- Sugestão: 12 unidades
- Confiança: 95%
- Raciocínio: "Compra 12 unidades mensalmente. Última compra há 28 dias."
```

### Score de Confiança

| Score   | Significado                               | Cor     |
| ------- | ----------------------------------------- | ------- |
| 80-100% | Alta confiança - Padrão muito consistente | Verde   |
| 60-79%  | Média confiança - Padrão razoável         | Amarelo |
| 0-59%   | Baixa confiança - Padrão irregular        | Laranja |

## 🗄️ Estrutura do Banco de Dados

### Tabela: `shopping_lists`

```typescript
{
  user_id: string;              // ID do usuário
  title: string;                // "Lista Inteligente - Supermercado"
  category: CategoryType;       // Categoria da lista
  generated_by_ai: boolean;     // true para listas geradas por IA
  estimated_total: number;      // Valor total estimado
  actual_total?: number;        // Valor real gasto (opcional)
  completed: boolean;           // Se a compra foi realizada
  completed_at?: string;        // Data de conclusão
  metadata: JSON;               // Parâmetros de geração da IA
  created_at: string;
  updated_at: string;
}
```

### Tabela: `shopping_list_items`

```typescript
{
  shopping_list_id: string;     // Referência à lista
  user_id: string;              // ID do usuário
  product_name: string;         // Nome do produto
  product_id?: string;          // ID do produto (opcional)
  quantity: number;             // Quantidade sugerida
  unit: string;                 // Unidade (unidades, kg, L, etc)
  estimated_price: number;      // Preço estimado unitário
  actual_price?: number;        // Preço real pago (opcional)
  checked: boolean;             // Se foi comprado
  category: string;             // Categoria (Laticínios, Frutas, etc)
  subcategory?: string;         // Subcategoria (Leite, Maçã, etc)
  ai_confidence: number;        // Score de confiança (0-1)
  ai_reasoning: string;         // Justificativa da IA
  created_at: string;
}
```

## 🔧 APIs Disponíveis

### POST `/api/shopping-list/generate-ai`

Gera uma lista inteligente baseada no histórico.

**Request:**

```json
{
  "category": "supermarket",
  "historicalMonths": 12
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "shoppingList": {
      /* ShoppingList */
    },
    "items": [
      /* ShoppingListItem[] */
    ],
    "summary": {
      "totalItems": 45,
      "estimatedTotal": 487.5,
      "category": "supermarket",
      "historicalMonths": 12,
      "invoiceCount": 24
    }
  }
}
```

## 🎨 Componentes React

### `<AIShoppingListBuilder>`

Componente principal para geração de listas com IA.

```tsx
import AIShoppingListBuilder from '@/components/invoices/AIShoppingListBuilder';

<AIShoppingListBuilder userId={userId} />
```

### Props:

- `userId: string` - ID do usuário autenticado

## 📄 Geração de PDF

### Função: `generateShoppingListPDF()`

```typescript
import { downloadPDF, generateShoppingListPDF } from '@/lib/utils/pdf-generator';

const pdfBlob = generateShoppingListPDF({
  title: 'Lista de Compras - Supermercado',
  category: 'supermarket',
  items: shoppingListItems,
  estimatedTotal: 487.5,
  generatedByAI: true,
  generatedDate: '14/11/2025',
});

downloadPDF(pdfBlob, 'lista-compras.pdf');
```

## 🧠 Prompt Engineering

A IA usa o formato **TOON** (Token-Optimized Object Notation) para economizar 20-60% de tokens:

```typescript
// Formato TOON (eficiente)
INVOICE_HISTORY
merchant_name | issue_date | total_amount | items
"Supermercado X" | "2025-01-15" | 145.80 | [{...}]
"Supermercado X" | "2025-02-12" | 152.30 | [{...}]

// vs JSON tradicional (verbose)
{
  "invoices": [
    {
      "merchant_name": "Supermercado X",
      "issue_date": "2025-01-15",
      "total_amount": 145.80,
      "items": [...]
    }
  ]
}
```

## 📈 Exemplos de Uso

### Caso de Uso 1: Compras Mensais do Supermercado

```typescript
// Usuário tem 12 meses de notas fiscais de supermercado
// IA detecta:
// - 45 produtos comprados regularmente
// - Padrões de consumo mensais e semanais
// - Produtos sazonais (frutas de verão vs inverno)
// - Gera lista com 38 itens prioritários
```

### Caso de Uso 2: Reposição de Farmácia

```typescript
// Usuário tem 6 meses de compras de farmácia
// IA detecta:
// - Medicamentos contínuos (comprados todo mês)
// - Produtos de higiene (comprados a cada 2 meses)
// - Vitaminas (compradas trimestralmente)
// - Gera lista focada em itens que precisam reposição
```

## 🔒 Segurança e Privacidade

- ✅ Listas são privadas por usuário (row-level security)
- ✅ Dados nunca são compartilhados entre usuários
- ✅ IA processa dados apenas no momento da geração
- ✅ Histórico de listas salvo para melhorar precisão futura

## 🐛 Troubleshooting

### "Nenhuma nota fiscal encontrada"

**Solução**: Adicione notas fiscais na categoria selecionada antes de gerar a lista.

### "IA não conseguiu gerar itens"

**Solução**:

1. Verifique se tem pelo menos 3 meses de histórico
2. Tente reduzir o período de análise
3. Verifique se as notas fiscais têm itens detalhados

### Itens com baixa confiança

**Solução**: Items com padrão irregular são marcados com baixa confiança. Revise manualmente antes de comprar.

## 📚 Referências

- [Documentação Google AI](https://ai.google.dev/)
- [TOON Format Specification](https://github.com/yourusername/toon-format)
- [jsPDF Documentation](https://rawgit.com/MrRio/jsPDF/master/docs/)

## 🎯 Roadmap Futuro

- [ ] Sugestões de produtos alternativos mais baratos
- [ ] Comparação de preços entre supermercados
- [ ] Alertas de promoções baseados na lista
- [ ] Integração com calendário para sugerir dia ideal de compra
- [ ] Compartilhamento de listas com família
- [ ] Modo "lista colaborativa" com múltiplos usuários

## 💡 Dicas de Uso

1. **Use 12 meses de histórico** para melhor precisão
2. **Revise itens de baixa confiança** antes de comprar
3. **Exporte para PDF** para levar ao supermercado
4. **Marque itens comprados** para tracking de gastos reais
5. **Gere listas regularmente** para treinar a IA com seus padrões

---

Criado com ❤️ usando Google AI (Gemini 2.5 Flash) e TOON Format
