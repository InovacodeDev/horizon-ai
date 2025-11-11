# TOON Format - Token Optimization Guide

## O que é TOON?

TOON (Tabular Object Oriented Notation) é um formato de dados otimizado para reduzir o uso de tokens em chamadas de IA, economizando **20-60% de tokens** comparado ao JSON, mantendo alta precisão de compreensão pelos LLMs.

## Por que usar TOON?

- **Economia de tokens**: 20-60% menos tokens que JSON
- **Melhor tokenização**: Delimitadores tab são mais eficientes
- **Alta precisão**: LLMs compreendem TOON naturalmente
- **Estrutura clara**: Headers explícitos (`[N]` para arrays, `{fields}` para tabelas)

## Quando usar TOON?

### ✅ Use TOON para:

1. **Dados tabulares uniformes** (arrays de objetos com mesmos campos)
   - Histórico de compras
   - Listas de transações
   - Dados analíticos

2. **Entrada de dados para IA** (quando você envia dados para o LLM processar)
   - Análise de padrões
   - Geração de insights
   - Recomendações baseadas em dados

### ❌ NÃO use TOON para:

1. **Saída estruturada da IA** (quando você quer que a IA retorne JSON)
   - Parsing de NFe (precisa de JSON schema validation)
   - APIs que retornam JSON estruturado

2. **Dados não-uniformes ou profundamente aninhados**
   - Objetos com estruturas variáveis
   - Configurações complexas

## Como usar no projeto

### 1. Importar utilitários

```typescript
import { calculateTokenSavings, formatForAIPrompt } from '@/lib/utils/toon';
```

### 2. Formatar dados para prompts de IA

```typescript
// Dados de exemplo
const purchaseHistory = [
  { id: 1, store: 'Supermercado A', total: 150.5, date: '2025-01-01' },
  { id: 2, store: 'Farmácia B', total: 45.3, date: '2025-01-02' },
];

// Formatar para TOON
const toonData = formatForAIPrompt({ purchases: purchaseHistory }, 'Purchase History');

// Usar no prompt
const prompt = `
Analyze the following purchase data and provide insights:

${toonData}

Instructions:
1. Identify spending patterns
2. Suggest ways to save money
`;
```

### 3. Calcular economia de tokens

```typescript
const savings = calculateTokenSavings(purchaseHistory);

console.log(`JSON: ${savings.jsonTokens} tokens`);
console.log(`TOON: ${savings.toonTokens} tokens`);
console.log(`Saved: ${savings.savedTokens} tokens (${savings.savedPercentage}%)`);
```

## Exemplo de conversão

### JSON (126 tokens)

```json
{
  "purchases": [
    {
      "id": 1,
      "store": "Supermercado A",
      "total": 150.5,
      "date": "2025-01-01"
    },
    {
      "id": 2,
      "store": "Farmácia B",
      "total": 45.3,
      "date": "2025-01-02"
    }
  ]
}
```

### TOON (49 tokens - 61% de economia!)

```toon
purchases[2]{id	store	total	date}:
  1	Supermercado A	150.5	2025-01-01
  2	Farmácia B	45.3	2025-01-02
```

## Implementações no projeto

### ✅ Implementado

1. **Google AI Service** (`lib/services/google-ai.service.ts`)
   - `generateInsights()`: Usa TOON para enviar histórico de compras

### 🔄 Oportunidades futuras

1. **Analytics Service**: Enviar dados analíticos em TOON
2. **Transaction Service**: Formatar listas de transações
3. **Price Tracking**: Histórico de preços em TOON

## Referências

- [TOON GitHub](https://github.com/toon-format/toon)
- [TOON Specification](https://github.com/toon-format/spec)
- [Benchmarks](https://github.com/toon-format/toon#benchmarks)

## Utilitários disponíveis

### `encodeToToon(data: unknown): string`

Converte dados JavaScript para formato TOON com delimitadores tab.

### `decodeFromToon(toonData: string): unknown`

Converte TOON de volta para JavaScript.

### `formatForAIPrompt(data: unknown, description?: string): string`

Formata dados em TOON com instruções para IA (envolve em code block).

### `calculateTokenSavings(data: unknown): TokenSavings`

Calcula economia de tokens comparando JSON vs TOON.

## Dicas de uso

1. **Use tab delimiters**: Já configurado por padrão para máxima eficiência
2. **Dados uniformes**: TOON brilha com arrays de objetos uniformes
3. **Teste a economia**: Use `calculateTokenSavings()` para validar benefícios
4. **Documente no prompt**: Sempre mencione que os dados estão em formato TOON
