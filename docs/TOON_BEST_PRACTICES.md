# TOON - Melhores Práticas

## 🎯 Quando Usar TOON

### ✅ Cenários Ideais

1. **Dados Tabulares Uniformes**

   ```typescript
   // Perfeito para TOON (todos os objetos têm os mesmos campos)
   const transactions = [
     { id: 1, date: '2025-01-01', amount: 100, category: 'food' },
     { id: 2, date: '2025-01-02', amount: 50, category: 'transport' },
   ];
   ```

2. **Históricos e Listas**
   - Histórico de compras
   - Lista de transações
   - Dados analíticos (métricas, views, clicks)
   - Logs estruturados

3. **Entrada de Dados para IA**
   - Quando você envia dados para a IA analisar
   - Quando a IA precisa processar grandes volumes de dados
   - Quando você quer economizar tokens

### ❌ Quando NÃO Usar

1. **Saída Estruturada da IA**

   ```typescript
   // NÃO use TOON aqui - a IA deve retornar JSON
   const prompt = `Parse this invoice and return JSON with schema: {...}`;
   ```

2. **Dados Não-Uniformes**

   ```typescript
   // Ruim para TOON (objetos com campos diferentes)
   const mixed = [
     { id: 1, name: 'John' },
     { id: 2, email: 'jane@example.com', age: 30 },
   ];
   ```

3. **APIs REST**
   - Mantenha JSON para compatibilidade
   - TOON é para comunicação com LLMs, não APIs

## 💡 Dicas de Otimização

### 1. Coloque Dados Variáveis no Final (Prompt Caching) ⭐

**IMPORTANTE**: Esta é a otimização mais importante!

```typescript
// ❌ Ruim: dados variáveis no meio
const prompt = `
Analyze this data:
${toonData}

Instructions: [...]
`;

// ✅ Bom: instruções estáticas primeiro, dados no final
const prompt = `
You are a financial advisor.

Instructions:
1. Analyze spending patterns
2. Identify savings opportunities
3. Format response in Markdown

---

Now analyze the following data:

${toonData}
`;
```

**Por quê?** LLMs como Claude e Gemini podem fazer cache da parte estática do prompt. Quando você coloca as instruções primeiro e os dados variáveis no final, apenas a parte final precisa ser processada em chamadas subsequentes, economizando ainda mais tokens!

**Economia adicional**: 50-90% de tokens em prompts repetidos com instruções similares.

### 2. Use Tab Delimiters (Padrão)

```typescript
// Já configurado por padrão
encodeToToon(data); // Usa tabs automaticamente
```

**Por quê?** Tabs tokenizam melhor que vírgulas.

### 2. Verifique a Economia Antes

```typescript
const savings = calculateTokenSavings(data);

if (savings.savedPercentage > 30) {
  // Vale a pena usar TOON
  const toonData = formatForAIPrompt(data);
} else {
  // JSON pode ser melhor
  const jsonData = JSON.stringify(data);
}
```

### 3. Coloque Dados Variáveis no Final (Prompt Caching)

```typescript
// ❌ Ruim: dados variáveis no meio do prompt
const prompt = `
Analyze this data:
${formatForAIPrompt(data, 'Transaction History')}

Instructions:
1. Identify patterns
2. Suggest improvements
`;

// ✅ Bom: instruções estáticas primeiro, dados variáveis no final
const prompt = `
You are a financial advisor.

Instructions:
1. Identify spending patterns
2. Suggest improvements
3. Format response in Markdown

---

Now analyze the following transaction history:

${formatForAIPrompt(data, 'Transaction History')}
`;
```

**Por quê?** LLMs podem fazer cache da parte estática do prompt, economizando ainda mais tokens em chamadas subsequentes!

### 4. Normalize os Dados Primeiro

```typescript
// Ruim: campos inconsistentes
const data = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane' }, // falta email
];

// Bom: campos consistentes
const normalized = data.map((item) => ({
  id: item.id,
  name: item.name,
  email: item.email || null, // preenche campos faltantes
}));

const toonData = encodeToToon(normalized);
```

## 🔍 Exemplos Práticos

### Exemplo 1: Análise de Gastos

```typescript
import { formatForAIPrompt } from '@/lib/utils/toon';

async function analyzeSpending(transactions: Transaction[]) {
  const toonData = formatForAIPrompt({ transactions }, 'Transaction History');

  const prompt = `
You are a financial advisor. Analyze the spending patterns:

${toonData}

Provide:
1. Top spending categories
2. Unusual transactions
3. Savings recommendations
`;

  return await callAI(prompt);
}
```

### Exemplo 2: Geração de Insights

```typescript
import { calculateTokenSavings, formatForAIPrompt } from '@/lib/utils/toon';

async function generateInsights(purchaseHistory: Purchase[]) {
  // Verificar se vale a pena usar TOON
  const savings = calculateTokenSavings({ purchases: purchaseHistory });

  console.log(`TOON will save ${savings.savedPercentage}% tokens`);

  const toonData = formatForAIPrompt({ purchases: purchaseHistory }, 'Purchase History');

  const prompt = `
Based on the purchase history below, suggest ways to save money:

${toonData}

Focus on:
- Brand alternatives
- Bulk buying opportunities
- Frequent unnecessary purchases
`;

  return await geminiAPI.generateContent(prompt);
}
```

### Exemplo 3: Comparação de Preços

```typescript
import { encodeToToon } from '@/lib/utils/toon';

async function comparePrices(products: Product[]) {
  // Dados uniformes - perfeito para TOON
  const priceHistory = products.map((p) => ({
    name: p.name,
    currentPrice: p.price,
    avgPrice: p.avgPrice,
    lowestPrice: p.lowestPrice,
    store: p.store,
  }));

  const toonData = encodeToToon({ products: priceHistory });

  const prompt = `
Compare these product prices and identify the best deals:

\`\`\`toon
${toonData}
\`\`\`

Highlight products that are:
1. Below average price
2. At or near lowest price
3. Good value for money
`;

  return await callAI(prompt);
}
```

## 📊 Monitoramento

### Rastrear Economia de Tokens

```typescript
import { calculateTokenSavings } from '@/lib/utils/toon';

function logTokenSavings(data: unknown, context: string) {
  const savings = calculateTokenSavings(data);

  console.log(`[${context}] Token Savings:`, {
    json: savings.jsonTokens,
    toon: savings.toonTokens,
    saved: savings.savedTokens,
    percentage: `${savings.savedPercentage}%`,
  });
}

// Uso
const purchaseHistory = [...];
logTokenSavings(purchaseHistory, 'generateInsights');
```

## ⚠️ Armadilhas Comuns

### 1. Dados Não-Uniformes

```typescript
// ❌ Ruim: TOON não otimiza bem
const mixed = [
  { id: 1, name: 'John' },
  { id: 2, email: 'jane@example.com', age: 30 },
];

// ✅ Bom: normalize primeiro
const normalized = mixed.map((item) => ({
  id: item.id,
  name: item.name || null,
  email: item.email || null,
  age: item.age || null,
}));
```

### 2. Dados Aninhados Profundos

```typescript
// ❌ Ruim: TOON não é ideal para estruturas profundas
const deepNested = {
  user: {
    profile: {
      settings: {
        preferences: {
          theme: 'dark',
        },
      },
    },
  },
};

// ✅ Bom: achate a estrutura
const flattened = {
  userId: user.id,
  theme: user.profile.settings.preferences.theme,
};
```

### 3. Esquecer de Documentar

```typescript
// ❌ Ruim: IA pode não entender o formato
const prompt = `Analyze: ${encodeToToon(data)}`;

// ✅ Bom: explique o formato
const prompt = `
Analyze the following data in TOON format:

${formatForAIPrompt(data, 'Data Description')}
`;
```

## 🎓 Recursos Adicionais

- [Guia de Uso](TOON_USAGE.md)
- [Implementação](TOON_IMPLEMENTATION.md)
- [TOON Specification](https://github.com/toon-format/spec)
- [Benchmarks](https://github.com/toon-format/toon#benchmarks)

## 📝 Checklist de Implementação

Antes de usar TOON em um novo serviço:

- [ ] Os dados são tabulares e uniformes?
- [ ] É entrada para IA (não saída)?
- [ ] Calculei a economia de tokens?
- [ ] Documentei o formato no prompt?
- [ ] Testei com dados reais?
- [ ] Adicionei logs de monitoramento?

## 🚀 Conclusão

TOON é uma ferramenta poderosa para economizar tokens, mas deve ser usada nos cenários certos. Siga estas práticas para maximizar os benefícios!
