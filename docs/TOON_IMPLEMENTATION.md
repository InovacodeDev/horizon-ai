# Implementação TOON - Otimização de Tokens para IA

## 📦 Instalação

A biblioteca `@toon-format/toon` foi instalada com sucesso:

```bash
pnpm add @toon-format/toon
```

## 🎯 Objetivo

Reduzir o consumo de tokens nas chamadas de IA em **20-60%** usando o formato TOON (Tabular Object Oriented Notation) ao invés de JSON para transmitir dados estruturados.

## 📁 Arquivos Criados

### 1. Utilitário TOON (`lib/utils/toon.ts`)

Funções auxiliares para trabalhar com TOON:

- `encodeToToon(data)`: Converte dados para TOON com delimitadores tab
- `decodeFromToon(toonData)`: Converte TOON de volta para JavaScript
- `formatForAIPrompt(data, description)`: Formata dados em TOON para prompts de IA
- `calculateTokenSavings(data)`: Calcula economia de tokens vs JSON

### 2. Declarações de Tipo (`toon.d.ts`)

Tipos TypeScript para a biblioteca `toon`, incluindo:

- `EncodeOptions`: Opções de codificação
- `DecodeOptions`: Opções de decodificação
- Funções `encode()` e `decode()`

### 3. Documentação (`docs/TOON_USAGE.md`)

Guia completo de uso com:

- Explicação do formato TOON
- Quando usar e quando não usar
- Exemplos práticos
- Comparações de economia de tokens

### 4. Exemplos de Teste (`tests/toon-usage.example.ts`)

Exemplos executáveis demonstrando:

- Histórico de compras
- Lista de transações
- Dados analíticos
- Prompts completos para IA

## ✅ Serviços Atualizados

### Google AI Service (`lib/services/google-ai.service.ts`)

**Método atualizado**: `generateInsights()`

**Antes** (JSON):

```typescript
const prompt = `
  Purchase History:
  ${JSON.stringify(purchaseHistory, null, 2)}
`;
```

**Depois** (TOON):

```typescript
const formattedHistory = formatForAIPrompt({ purchases: purchaseHistory }, 'Purchase History');

const prompt = `
  ${formattedHistory}
`;
```

**Economia estimada**: 40-60% de tokens para dados tabulares uniformes

## 📊 Exemplo de Economia

### Dados de entrada (2 compras com itens):

**JSON**: ~126 tokens

```json
{
  "purchases": [
    {
      "id": 1,
      "storeName": "Supermercado A",
      "totalAmount": 150.50,
      "items": [...]
    }
  ]
}
```

**TOON**: ~49 tokens (61% de economia!)

```toon
purchases[2]{id	storeName	totalAmount	items}:
  1	Supermercado A	150.5	[...]
  2	Farmácia B	45.3	[...]
```

## 🚀 Como Usar

### 1. Importar utilitários

```typescript
import { calculateTokenSavings, formatForAIPrompt } from '@/lib/utils/toon';
```

### 2. Formatar dados para IA

```typescript
const data = { transactions: [...] };
const toonPrompt = formatForAIPrompt(data, 'Transaction History');

// Use no prompt da IA
const prompt = `
  Analyze the following data:
  ${toonPrompt}
`;
```

### 3. Verificar economia

```typescript
const savings = calculateTokenSavings(data);
console.log(`Saved ${savings.savedPercentage}% tokens!`);
```

## 📈 Oportunidades Futuras

Outros serviços que podem se beneficiar do TOON:

1. **Analytics Service**: Dados de métricas e relatórios
2. **Transaction Service**: Listas de transações para análise
3. **Price Tracking Service**: Histórico de preços
4. **Invoice Service**: Dados de faturas para processamento

## ⚠️ Quando NÃO usar TOON

1. **Saída estruturada da IA**: Quando você precisa que a IA retorne JSON validado
2. **APIs REST**: Mantenha JSON para compatibilidade
3. **Dados não-uniformes**: TOON é otimizado para dados tabulares
4. **Parsing de NFe**: Requer JSON schema validation

## 🔗 Referências

- [TOON GitHub](https://github.com/toon-format/toon)
- [Documentação completa](https://github.com/toon-format/spec)
- [Benchmarks de performance](https://github.com/toon-format/toon#benchmarks)

## 🧪 Testar a Implementação

Execute o exemplo de teste:

```bash
pnpm tsx tests/toon-usage.example.ts
```

Isso mostrará:

- Comparações de tokens entre JSON e TOON
- Exemplos de dados formatados
- Prompts completos para IA

## 📝 Próximos Passos

1. ✅ Biblioteca instalada
2. ✅ Utilitários criados
3. ✅ Google AI Service atualizado
4. ✅ Documentação completa
5. ⏳ Monitorar economia real em produção
6. ⏳ Expandir para outros serviços conforme necessário

## 💡 Dicas

- Use `calculateTokenSavings()` antes de implementar para validar benefícios
- TOON funciona melhor com arrays de objetos uniformes (mesmos campos)
- Delimitadores tab (padrão) são mais eficientes que vírgulas
- Sempre mencione no prompt que os dados estão em formato TOON
