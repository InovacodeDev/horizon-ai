# TOON + Prompt Caching - Máxima Economia de Tokens

## 🎯 Dupla Otimização

Combine **TOON** + **Prompt Caching** para economia máxima de tokens:

1. **TOON**: 20-70% menos tokens vs JSON
2. **Prompt Caching**: 50-90% menos tokens em prompts repetidos

**Resultado**: Até **95% de economia** em chamadas subsequentes! 🚀

## 🔑 Regra de Ouro

> **Coloque instruções estáticas PRIMEIRO, dados variáveis NO FINAL**

Isso permite que LLMs façam cache da parte estática do prompt.

## ❌ Antes (Sem Caching)

```typescript
const prompt = `
Analyze this purchase data:

${formatForAIPrompt(purchaseHistory, 'Purchase History')}

Instructions:
1. Identify spending patterns
2. Suggest savings opportunities
3. Format in Markdown
`;
```

**Problema**: Dados variáveis no meio impedem o cache efetivo.

## ✅ Depois (Com Caching)

```typescript
const prompt = `
You are a financial advisor specialized in personal finance.

Instructions:
1. Analyze spending patterns from the purchase data
2. Identify opportunities to save money
3. Provide 2-3 specific, actionable recommendations
4. Format response in Markdown with clear sections

Response Format:
## Your Savings Insights

- **Insight 1**: [specific recommendation]
- **Insight 2**: [specific recommendation]

---

Now analyze the following purchase history (TOON format):

${formatForAIPrompt(purchaseHistory, 'Purchase History')}
`;
```

**Benefício**: Instruções são cacheadas, apenas os dados variáveis são processados!

## 📊 Economia Real

### Primeira Chamada

- **JSON sem cache**: 1000 tokens
- **TOON sem cache**: 400 tokens (60% economia)

### Chamadas Subsequentes (com cache)

- **JSON sem cache**: 1000 tokens
- **TOON com cache**: 50 tokens (95% economia!)

## 🎨 Padrão de Implementação

### Template Recomendado

```typescript
import { formatForAIPrompt } from '@/lib/utils/toon';

async function analyzeData(data: any[]) {
  const toonData = formatForAIPrompt({ items: data }, 'Data Description');

  const prompt = `
[PARTE ESTÁTICA - CACHEÁVEL]
=================================

You are a [role description].

Instructions:
1. [instruction 1]
2. [instruction 2]
3. [instruction 3]

Response Format:
[expected format]

Example Response:
[example output]

=================================
[FIM DA PARTE ESTÁTICA]

Now analyze the following data:

${toonData}
`;

  return await callAI(prompt);
}
```

## 🔍 Exemplos Práticos

### Exemplo 1: Análise de Gastos

```typescript
async function analyzeSpending(transactions: Transaction[]) {
  const toonData = formatForAIPrompt({ transactions }, 'Transactions');

  // Instruções estáticas primeiro (cacheáveis)
  const prompt = `
You are a financial advisor specialized in expense analysis.

Analysis Guidelines:
1. Calculate total spending by category
2. Identify unusual or high-value transactions
3. Compare spending to typical patterns
4. Suggest 2-3 actionable ways to reduce expenses

Response Format:
## Spending Analysis

**Total by Category:**
- [category]: R$ [amount]

**Notable Transactions:**
- [description]: R$ [amount] - [reason why notable]

**Savings Recommendations:**
1. [specific recommendation with estimated savings]
2. [specific recommendation with estimated savings]

---

Analyze these transactions (TOON format):

${toonData}
`;

  return await callAI(prompt);
}
```

### Exemplo 2: Geração de Insights

```typescript
async function generateInsights(purchaseHistory: Purchase[]) {
  const toonData = formatForAIPrompt({ purchases: purchaseHistory }, 'Purchase History');

  // Parte estática (cacheável)
  const prompt = `
You are a shopping advisor helping users save money on groceries.

Analysis Focus:
1. Brand alternatives (cheaper options with similar quality)
2. Bulk buying opportunities (items frequently purchased)
3. Unnecessary purchases (non-essential items)
4. Price patterns (items bought at higher prices)

Response Guidelines:
- Be specific with product names and prices
- Include estimated savings percentages
- Use friendly, encouraging tone
- Format in Markdown with clear sections

Example Response:
## Your Personalized Savings Insights 💰

**Brand Alternatives:**
- Switch from [Brand A] to [Brand B]: Save R$ X.XX (Y%)

**Bulk Buying:**
- Buy [item] in larger quantities: Save R$ X.XX per month

**Reduce Non-Essentials:**
- Consider reducing [item]: Save R$ X.XX per month

---

Analyze this purchase history (TOON format):

${toonData}
`;

  return await geminiAPI.generateContent(prompt);
}
```

### Exemplo 3: Comparação de Preços

```typescript
async function comparePrices(products: Product[]) {
  const toonData = formatForAIPrompt({ products }, 'Product Prices');

  const prompt = `
You are a price comparison expert helping users find the best deals.

Comparison Criteria:
1. Current price vs average price
2. Current price vs lowest historical price
3. Price trends (increasing/decreasing)
4. Best value for money

Highlight products that are:
- Below average price (good deal)
- At or near lowest price (best deal)
- Above average price (wait for better price)

Response Format:
## Price Analysis

**Best Deals Right Now:**
- [product]: R$ [price] (X% below average)

**Wait for Better Prices:**
- [product]: R$ [price] (X% above average)

**Price Trends:**
- [product]: [trend description]

---

Compare these product prices (TOON format):

${toonData}
`;

  return await callAI(prompt);
}
```

## 🎓 Melhores Práticas

### 1. Separe Claramente as Seções

```typescript
const prompt = `
[INSTRUÇÕES ESTÁTICAS]
...

---

[DADOS VARIÁVEIS]
${toonData}
`;
```

Use `---` ou outra marcação clara para separar.

### 2. Inclua Exemplos na Parte Estática

```typescript
const prompt = `
Instructions: [...]

Example Response:
[exemplo completo]

---

Now analyze: ${toonData}
`;
```

Exemplos ajudam a IA e são cacheados!

### 3. Seja Específico nas Instruções

```typescript
// ❌ Vago
const prompt = `Analyze this data: ${toonData}`;

// ✅ Específico (e cacheável)
const prompt = `
You are a financial advisor.

Instructions:
1. Calculate total by category
2. Identify top 3 expenses
3. Suggest 2 ways to save money
4. Format in Markdown

---

Analyze: ${toonData}
`;
```

### 4. Reutilize Templates

```typescript
// Crie templates reutilizáveis
const FINANCIAL_ADVISOR_TEMPLATE = `
You are a financial advisor specialized in personal finance.

Instructions:
1. Analyze spending patterns
2. Identify savings opportunities
3. Provide actionable recommendations
4. Format in Markdown

---

Analyze the following data:
`;

// Use em múltiplas funções
const prompt = FINANCIAL_ADVISOR_TEMPLATE + toonData;
```

## 📈 Monitoramento

### Rastrear Economia de Cache

```typescript
import { calculateTokenSavings } from '@/lib/utils/toon';

function logCacheEfficiency(data: unknown, context: string) {
  const savings = calculateTokenSavings(data);

  // Economia do TOON
  console.log(`[${context}] TOON Savings:`, {
    json: savings.jsonTokens,
    toon: savings.toonTokens,
    saved: `${savings.savedPercentage}%`,
  });

  // Economia estimada com cache (assumindo 90% de cache hit)
  const cacheHitRate = 0.9;
  const cachedTokens = Math.floor(savings.toonTokens * (1 - cacheHitRate));
  const totalSavings = savings.jsonTokens - cachedTokens;
  const totalPercentage = ((totalSavings / savings.jsonTokens) * 100).toFixed(1);

  console.log(`[${context}] With Cache (90% hit rate):`, {
    tokens: cachedTokens,
    totalSaved: `${totalPercentage}%`,
  });
}
```

## 🚀 Resultado Final

Combinando TOON + Prompt Caching:

| Cenário                             | Tokens | Economia   |
| ----------------------------------- | ------ | ---------- |
| JSON sem cache                      | 1000   | 0%         |
| TOON sem cache                      | 400    | 60%        |
| TOON com cache (primeira chamada)   | 400    | 60%        |
| TOON com cache (chamadas seguintes) | 50     | **95%** 🎉 |

## 📚 Referências

- [Anthropic Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)
- [Google Gemini Context Caching](https://ai.google.dev/gemini-api/docs/caching)
- [TOON Format](https://github.com/toon-format/toon)

## ✅ Checklist de Implementação

Ao criar um novo prompt com TOON:

- [ ] Instruções estáticas no início
- [ ] Dados variáveis no final
- [ ] Separação clara entre seções (---)
- [ ] Exemplos incluídos na parte estática
- [ ] Template reutilizável criado
- [ ] Monitoramento de economia implementado
- [ ] Testado com dados reais

## 🎉 Conclusão

**TOON + Prompt Caching = Máxima Economia de Tokens!**

Siga o padrão: **Instruções primeiro, dados no final** para aproveitar ao máximo ambas as otimizações.
