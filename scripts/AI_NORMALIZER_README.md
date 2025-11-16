# Normalizador AI de Produtos

Este projeto suporta normalização de produtos usando **Gemini (Google AI)** ao invés da lógica estática.

## 🚀 Como Usar

### 1. Obter uma API Key do Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crie ou selecione um projeto
3. Clique em "Get API Key" e copie sua chave
4. A API key terá formato: `AIza...`

### 2. Configurar Variáveis de Ambiente

Adicione no seu arquivo `.env.local`:

```bash
# Habilitar normalizador AI (opcional - padrão: false)
USE_AI_NORMALIZER=true

# API Key do Gemini (obrigatória se USE_AI_NORMALIZER=true)
GEMINI_API_KEY=AIzaSy...your_key_here...

# Modelo do Gemini (opcional - padrão: gemini-2.5-flash)
# Opções: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash-exp
GEMINI_MODEL=gemini-2.5-flash

# Debug mode (opcional - mostra detalhes das chamadas AI)
DEBUG_AI=false
```

### 3. Executar Script de Regeneração

```bash
# Com AI habilitado
pnpm tsx scripts/regenerate-products.ts

# Ou explicitamente
USE_AI_NORMALIZER=true pnpm tsx scripts/regenerate-products.ts
```

### 4. Testar Batch Processing (Novo!)

```bash
# Testa 10 produtos em um único lote
USE_AI_NORMALIZER=true pnpm tsx scripts/test-ai-batch.ts
```

## 📊 Comportamento

### Com `USE_AI_NORMALIZER=true`

1. **Processa em lotes de 20 produtos** por chamada à API (batch processing)
2. **Se falhar** (erro de API, timeout, etc): usa normalizador estático como fallback
3. **Vantagens**:
   - ✅ **17x menos chamadas à API** (344 items = 18 chamadas vs 344)
   - ✅ **Evita erro 429** (rate limit) - free tier: 10 req/min
   - ✅ Mais inteligente: entende contexto e variações
   - ✅ Detecta marcas automaticamente (sem lista fixa)
   - ✅ Expande abreviações de forma contextual
   - ✅ Identifica produtos de farmácia e quantidade de comprimidos
   - ✅ **Fallback automático** se falhar

### Com `USE_AI_NORMALIZER=false` (padrão)

- Usa apenas o normalizador estático existente
- Sem custos de API
- Mais rápido mas menos flexível

## 💡 Exemplo de Normalização

### Entrada (invoice item)

```
"LEITE ITALAC INT 1L"
```

### Saída AI

```json
{
  "normalized_name": "Leite Integral",
  "brand": "Italac",
  "is_promotion": false,
  "is_pharmacy": false,
  "pill_count": null
}
```

### Entrada (farmácia)

```
"ESCITALOPRAM EMS 30 CPR REV 15MG GEN"
```

### Saída AI

```json
{
  "normalized_name": "Escitalopram 30 Comprimidos",
  "brand": "EMS",
  "is_promotion": false,
  "is_pharmacy": true,
  "pill_count": 30
}
```

## 💰 Custos e Performance

### Gemini 2.5 Flash (recomendado) com Batch Processing

- **Custo**: ~$0.075 por 1M tokens de entrada, ~$0.30 por 1M tokens de saída
- **Velocidade**: ~2-5 segundos por lote de 20 produtos
- **Para 344 items**:
  - **18 chamadas API** (lotes de 20) vs 344 individuais
  - **Estimativa**: ~$0.01-0.03 total
  - **Tempo**: ~36-90 segundos vs 10+ minutos (sem rate limit)
  - **Evita erro 429**: Rate limit (10 req/min) não é problema!

### Gemini 2.5 Pro

- **Custo**: ~$1.25 por 1M tokens de entrada, ~$5.00 por 1M tokens de saída
- **Velocidade**: mais lento que Flash
- **Use apenas se**: precisar de máxima qualidade

### Dicas de Otimização

1. **Teste primeiro com poucos items**:

   ```bash
   # Edite regenerate-products.ts para processar apenas 10 items
   # Veja custo e qualidade antes de processar tudo
   ```

2. **Use cache** (futuro): implemente cache local para não reconsultar AI para textos repetidos

3. **Rate limiting**: Gemini tem limites (15 RPM para free tier)

## 🔧 Troubleshooting

### Erro: "GEMINI_API_KEY is not set"

- Verifique se adicionou a chave em `.env.local`
- Execute `source .env.local` se estiver usando terminal

### Erro: "Gemini error: 429"

- Você atingiu o rate limit
- Espere 1 minuto ou reduza velocidade de chamadas

### Erro: "Gemini returned empty content"

- Pode ser problema temporário da API
- O script usa fallback automático para normalizador estático

### AI retorna JSON inválido

- Configurado `responseMimeType: 'application/json'` para forçar JSON válido
- Se ainda falhar, usa normalizador estático

## 🎯 Quando Usar AI vs Estático

### Use AI se:

- ✅ Tem muitos produtos novos/desconhecidos
- ✅ Produtos com nomes muito variados
- ✅ Quer detecção automática de marcas
- ✅ Custo não é problema (~$0.01-0.05 por regeneração completa)

### Use Estático se:

- ✅ Produtos já bem mapeados
- ✅ Velocidade é crítica
- ✅ Quer zero custos
- ✅ Ambiente sem internet/API externa

## 📝 Arquivos Relacionados

- `lib/services/product-normalization-ai.service.ts` - Serviço AI
- `lib/services/product-normalization.service.ts` - Normalizador estático (fallback)
- `scripts/regenerate-products.ts` - Script que usa ambos

## 🔐 Segurança

- ⚠️ **NUNCA** commite sua `GEMINI_API_KEY` no repositório
- ✅ Adicione `.env.local` no `.gitignore`
- ✅ Use variáveis de ambiente em produção
- ✅ Rotacione chaves periodicamente

## 📚 Referências

- [Gemini API Docs](https://ai.google.dev/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [Get API Key](https://aistudio.google.com/app/apikey)
