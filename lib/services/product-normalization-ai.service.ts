import { NormalizedProduct } from './product-normalization.service';

type AIResult = {
  normalized_name: string;
  brand?: string | null;
  is_promotion?: boolean;
  is_pharmacy?: boolean;
  pill_count?: number | null;
};

type BatchAIResult = {
  products: Array<{
    index: number;
    normalized_name: string;
    brand?: string | null;
    is_promotion?: boolean;
    is_pharmacy?: boolean;
    pill_count?: number | null;
  }>;
};

// Rate limiting for free tier (10 requests per minute)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests (10 req/min = 1 req/6s)

async function rateLimitedDelay() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    if (process.env.DEBUG_AI === 'true') {
      console.log(`Rate limiting: waiting ${waitTime}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

async function callGemini(prompt: string, retries = 2): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  // Apply rate limiting
  await rateLimitedDelay();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8000,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
              },
            ],
          }),
        },
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => '');

        // Handle rate limiting with exponential backoff
        if (res.status === 429 && attempt < retries) {
          const retryAfter = res.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt + 1) * 1000;

          console.warn(`Rate limit hit (429), waiting ${waitTime}ms before retry ${attempt + 2}/${retries + 1}`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        if (attempt < retries) {
          console.warn(`Gemini error on attempt ${attempt + 1}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(`Gemini error: ${res.status} ${res.statusText} ${txt}`);
      }

      const data = await res.json();

      // Debug logging
      if (process.env.DEBUG_AI === 'true') {
        console.log('Gemini response:', JSON.stringify(data, null, 2));
      }

      // Handle different response structures
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      // Check for safety/content filtering
      if (!content) {
        const finishReason = data?.candidates?.[0]?.finishReason;
        const blockReason = data?.promptFeedback?.blockReason;

        if (blockReason) {
          console.warn(`Gemini blocked prompt: ${blockReason}, attempt ${attempt + 1}/${retries + 1}`);
        } else if (finishReason === 'SAFETY') {
          console.warn(`Gemini safety filter triggered: ${finishReason}, attempt ${attempt + 1}/${retries + 1}`);
        } else {
          console.warn(
            `Gemini returned empty content, finishReason: ${finishReason}, attempt ${attempt + 1}/${retries + 1}`,
          );
        }

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        throw new Error('Gemini returned empty content after retries');
      }

      return content;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Error on attempt ${attempt + 1}, retrying...`, error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed after all retries');
}

/**
 * Heurística para detectar se uma descrição parece ser de medicamento / farmácia
 */
function isLikelyPharmacyDescription(raw: string): boolean {
  if (!raw) return false;

  const text = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  // Palavras-chave de forma farmacêutica
  const hasPharmaKeyword =
    /\b(CPR|COMP|COMPRIM(?:IDOS)?|CAPS|CAPSULAS?|GTS|GOTAS|XPE|XAROPE|SUSP(?:ENSAO)? ?ORAL|SUS ORAL)\b/.test(text);

  // Dosagem típica: 500MG, 100MG/ML, 750 MG, etc.
  const hasDosage = /\b\d+\s*(MG|MCG|G|ML)(\/\s*\d+\s*ML)?\b/.test(text);

  // Indícios de cartela/caixa de comprimidos
  const hasPillCount = /\b(C\/\s*\d+|\d+\s*(COMP|CPR|CAPS|COMPRIMIDOS))\b/.test(text);

  // Alguns termos genéricos de medicamento
  const hasMedicineHint = /\b(ANALGESICO|ANTIINFLAMATORIO|ANTIALERGICO|ANTIBIOTICO|MEDICAMENTO|GENERICO)\b/.test(text);

  if (hasPharmaKeyword && (hasDosage || hasPillCount)) return true;
  if (hasPharmaKeyword && hasMedicineHint) return true;
  if (hasDosage && hasMedicineHint) return true;

  return false;
}

type PromptMode = 'general' | 'pharmacy';

/**
 * Decide automaticamente se o batch deve usar prompt de farmácia ou geral.
 */
function decidePromptMode(productNames: string[]): PromptMode {
  if (!productNames || productNames.length === 0) return 'general';

  const pharmacyCount = productNames.filter(isLikelyPharmacyDescription).length;
  const ratio = pharmacyCount / productNames.length;

  // Threshold conservador: só considera farmácia quando quase tudo tem cara de medicamento
  if (ratio >= 0.8 && pharmacyCount >= 2) {
    return 'pharmacy';
  }

  return 'general';
}

/**
 * Gera o prompt completo (general ou pharmacy) com o input do usuário SEMPRE no final.
 */
function buildPrompt(productNames: string[], mode: PromptMode): string {
  const productsList = productNames.map((name, idx) => `${idx}: "${name}"`).join('\n');

  if (mode === 'pharmacy') {
    return `Você é um normalizador de itens de nota fiscal de FARMÁCIA no Brasil.

Seu objetivo é transformar cada descrição em um "normalized_name" limpo, genérico e padronizado,
adequado para agrupamento de gastos.

TODOS os itens são de farmácia, ou seja:
- "is_pharmacy" deve ser SEMPRE true.
- Tente SEMPRE extrair "pill_count" quando fizer sentido (comprimidos, cápsulas, etc.).

⚠️ Regras anti-alucinação (muito importantes):
- NÃO invente produtos, ingredientes, princípios ativos, dosagens ou quantidades que não estejam claramente indicados no texto.
- NÃO invente "pill_count": só preencha se houver um número claro na descrição (ex: C/20, 10 COMP, 12 CAPS).
  - Se não houver número de comprimidos/cápsulas, use "pill_count": null.
- NÃO invente marca. Só preencha "brand" se houver um nome comercial ou de laboratório claro na descrição.
- Se houver dúvida entre duas interpretações, escolha SEMPRE a opção mais neutra e genérica.
- Quando tiver pouca informação, mantenha o normalized_name próximo do texto original, apenas limpando abreviações óbvias.

Estrutura e campos obrigatórios:

Você deve responder APENAS com um JSON VÁLIDO neste formato exato:

{
  "products": [
    {
      "index": 0,
      "normalized_name": "nome genérico normalizado do medicamento",
      "brand": "nome da marca ou null",
      "is_promotion": false,
      "is_pharmacy": true,
      "pill_count": 20
    },
    ...
  ]
}

Regras gerais:
- Você deve processar TODOS os ${productNames.length} itens, do índice 0 até ${productNames.length - 1}.
- "index" DEVE ser o mesmo índice do item original (0, 1, 2, ..., ${productNames.length - 1}).
- Deve haver EXATAMENTE ${productNames.length} objetos dentro de "products".
- NÃO use comentários, NÃO use markdown, NÃO use texto fora do JSON.

1) Campo "normalized_name":
- Deve ser um nome genérico de medicamento, em português, com:
  - Nome do princípio ativo OU nome genérico do produto (sem inventar princípios ativos que não estejam no texto).
  - Dosagem (ex: 500mg, 750mg, 20mg/ml) — use somente o que estiver no texto.
  - Forma farmacêutica: "Comprimidos", "Cápsulas", "Gotas", "Xarope", "Suspensão Oral", etc.
  - Quantidade total de comprimidos/cápsulas quando houver, no formato: "20 Comprimidos", "10 Cápsulas".
- Exemplos:
  - "DIPIRONA SODICA 500MG CPR C/20" →
    - normalized_name: "Dipirona Sódica 500mg 20 Comprimidos"
  - "PARACETAMOL 750MG 10 COMP" →
    - normalized_name: "Paracetamol 750mg 10 Comprimidos"
  - "AMOXICILINA 500MG CAPS C/21" →
    - normalized_name: "Amoxicilina 500mg 21 Cápsulas"
  - "LORATADINA 10MG 12 COMP REV" →
    - normalized_name: "Loratadina 10mg 12 Comprimidos Revestidos"
  - "IBUPROFENO 100MG/ML GOTAS 20ML" →
    - normalized_name: "Ibuprofeno 100mg/ml Gotas 20ml"

2) Marca ("brand"):
- Se a descrição indicar marca comercial (ex: "Neosaldina", "Dorflex", "Torsilax"), coloque em "brand" e tente manter o normalized_name genérico.
- Exemplos:
  - "NEOSALDINA CPR C/20" →
    - normalized_name: "Analgésico 20 Comprimidos" (se os componentes não estiverem no texto)
    - brand: "Neosaldina"
  - "DORFLEX 36 CPR" →
    - normalized_name: "Analgésico 36 Comprimidos"
    - brand: "Dorflex"
- Se não for possível identificar claramente a marca: use "brand": null.
- NÃO invente marca com base em suposição.

3) Quantidade de comprimidos/cápsulas (pill_count):
- Use um número inteiro sempre que encontrar referência do tipo:
  - "C/20", "C/ 20", "C/ 20 COMP", "20 COMP", "20 CPR", "10 CAPS", etc.
- Exemplos:
  - "DIPIRONA 500MG CPR C/20" → pill_count: 20
  - "PARACETAMOL 750MG 10 COMP" → pill_count: 10
  - "LORATADINA 10MG 12 COMP REV" → pill_count: 12
- Se não houver quantidade claramente indicada: pill_count: null.
- NÃO chute valores. Se tiver dúvida, use null.

4) Forma farmacêutica:
- CPR, COMP, COMPR, COMPRIMIDOS → "Comprimidos"
- CAPS, CAP, CAPSULAS → "Cápsulas"
- GTS, GOTAS → "Gotas"
- XPE, XAROPE → "Xarope"
- SUS OR, SUSP ORAL → "Suspensão Oral"

5) Dosagem:
- Preserve a dosagem como aparece, apenas padronizando:
  - Ex: "500MG" → "500mg"
  - Ex: "100MG/ML" → "100mg/ml"

6) Promoções:
- Se a descrição indicar promoção (ex: "OFERTA", "PROMOÇÃO", "LEVE 3 PAGUE 2"), defina "is_promotion": true. Caso contrário, false.

7) Campos fixos para farmácia:
- "is_pharmacy": sempre true.
- "pill_count": número extraído ou null.

Lembre-se:
- Responda APENAS com o JSON, sem explicações.
- Nenhum texto fora do JSON.
- Não invente informações que não estejam claramente no texto.

ITENS PARA PROCESSAR (cada linha tem um índice e a descrição original):
${productsList}`;
  }

  // Prompt geral (mercado + potencialmente farmácia misturado)
  return `Você é um normalizador de itens de nota fiscal brasileira.

Seu objetivo é transformar cada descrição em um "normalized_name" limpo, genérico e padronizado,
adequado para agrupamento de gastos.

⚠️ Regras anti-alucinação (muito importantes):
- NÃO invente produtos, categorias, sabores, tipos de carne, volumes, pesos ou marcas que não estejam claramente indicados.
- NÃO invente "pill_count": só use se houver um número explícito na descrição (ex: C/20, 10 COMP, 12 CAPS). Caso contrário, use null.
- NÃO invente marca. Só preencha "brand" se houver um nome claro de marca na descrição.
- Se não tiver certeza da categoria, prefira um normalized_name mais genérico, mantendo palavras do texto original.
- Se houver dúvida entre duas interpretações, escolha SEMPRE a opção mais neutra e genérica.
- Não altere quantidades (não mude 1L para 2L, nem 500g para 1kg, etc.).

Estrutura e campos obrigatórios:

Você deve responder APENAS com um JSON VÁLIDO neste formato exato:

{
  "products": [
    {
      "index": 0,
      "normalized_name": "nome genérico normalizado sem marca",
      "brand": "nome da marca ou null",
      "is_promotion": false,
      "is_pharmacy": false,
      "pill_count": null
    },
    ...
  ]
}

Regras gerais IMPORTANTES:
- Você deve processar TODOS os ${productNames.length} itens, do índice 0 até ${productNames.length - 1}.
- "index" DEVE ser o mesmo índice do item original (0, 1, 2, ..., ${productNames.length - 1}).
- Deve haver EXATAMENTE ${productNames.length} objetos dentro de "products".
- NÃO use comentários, NÃO use markdown, NÃO use texto fora do JSON.
- O campo "normalized_name" deve ser um nome genérico de produto, em português, com:
  - categoria + características essenciais (sabor/teor/tipo) + volume/peso (se existir)
  - SEM marca
  - SEM informações irrelevantes (como "UHT", código interno, etc.), a menos que sejam necessárias pra diferenciar o produto.
- O campo "brand" deve conter APENAS o nome da marca, se identificado (ex: "Italac", "Parmalat", "Nescau"). Caso não seja possível identificar, use null.
- Itens em promoção:
  - Se a descrição indicar promoção (ex: "OFERTA", "PROMOÇÃO", "LEVE 3 PAGUE 2"), defina "is_promotion": true. Caso contrário, false.
- Farmácia:
  - Se o produto for claramente farmacêutico (remédio, comprimidos, cápsulas, etc.), defina "is_pharmacy": true, senão false.
  - Para farmácia, tente extrair a quantidade de comprimidos/cápsulas e colocar em "pill_count" como número.
  - Se não for farmacêutico ou não informar quantidade, use null em "pill_count".

Regras específicas de normalização (muito importantes):

1) LEITE – EXEMPLO OBRIGATÓRIO:
- Exemplos de descrição:
  - "Leite UHT Italac Int 1L"
  - "Leite Parmalat Int 1L"
  - "Leite UHT Parmalat Integral 1L"
- Para itens assim, o "normalized_name" deve ser SEMPRE no formato:
  - "Leite <Teor> <Volume>"
- Teores comuns:
  - INT, INTEGRAL → Integral
  - DESN, DESNATADO → Desnatado
  - SEMI → Semidesnatado
  - ZERO LACT, ZL → Zero Lactose
- Volume:
  - Ex: "1L", "1 L", "1000ML" → "1L"
- "UHT" NÃO deve aparecer no normalized_name.
- Marca deve ir para "brand".
- Assim:
  - "Leite UHT Italac Int 1L" → 
    - normalized_name: "Leite Integral 1L"
    - brand: "Italac"
  - "Leite Parmalat Int 1L" →
    - normalized_name: "Leite Integral 1L"
    - brand: "Parmalat"
- Ou seja: descrições diferentes, MESMA normalização de produto.

2) ARROZ:
- Palavras-chave: "ARROZ".
- O normalized_name deve seguir o formato:
  - "Arroz <Tipo opcional> <Variedade opcional> <Peso>"
- Exemplos:
  - "ARROZ CAMIL TIPO 1 5KG" →
    - normalized_name: "Arroz Tipo 1 5kg"
    - brand: "Camil"
  - "ARROZ BRANCO T1 1KG" →
    - normalized_name: "Arroz Tipo 1 1kg"
    - brand: null
  - "ARROZ PARB T1 5KG" →
    - normalized_name: "Arroz Parboilizado Tipo 1 5kg"
    - brand: null
- Expanda abreviações comuns:
  - T1, TIPO1 → "Tipo 1"
  - T2, TIPO2 → "Tipo 2"
  - PARB, PARBOIL → "Parboilizado"

3) FEIJÃO:
- Palavras-chave: "FEIJAO", "FEIJÃO".
- O normalized_name deve seguir o formato:
  - "Feijão <Variedade> <Peso>"
- Variedades comuns:
  - "Carioca", "Preto", "Fradinho", etc.
- Exemplos:
  - "FEIJAO CARIOCA 1KG" →
    - normalized_name: "Feijão Carioca 1kg"
    - brand: null ou a marca, se aparecer.
  - "FEIJAO PRETO KICALDO 1KG" →
    - normalized_name: "Feijão Preto 1kg"
    - brand: "Kicaldo"

4) REFRIGERANTE:
- Palavras-chave: "REFRIG", "REFRIGERANTE", às vezes só o sabor + marca com volume (ex: "COCA COLA 2L").
- O normalized_name deve seguir o formato:
  - "Refrigerante <Sabor ou Tipo> <Volume>"
- Exemplos:
  - "REFRIG COCA COLA 2L" →
    - normalized_name: "Refrigerante Cola 2L"
    - brand: "Coca Cola"
  - "REFRIG GUARANA ANTARCTICA 1,5L" →
    - normalized_name: "Refrigerante Guaraná 1,5L"
    - brand: "Antarctica"
  - "COCA COLA ZERO 2L" →
    - normalized_name: "Refrigerante Cola Zero 2L"
    - brand: "Coca Cola"

5) MACARRÃO / MASSA SECA:
- Palavras-chave: "MACARRAO", "MACARRÃO", "ESPAGUETE", "PARAFUSO", "PENNE", "FUSILLI", etc.
- O normalized_name deve seguir o formato:
  - "Macarrão <Formato> <Tipo opcional> <Peso>"
- Exemplos:
  - "MACARRAO ESPAGUETE RENATA 500G" →
    - normalized_name: "Macarrão Espaguete 500g"
    - brand: "Renata"
  - "MACARRAO PARAFUSO T2 1KG" →
    - normalized_name: "Macarrão Parafuso 1kg"
    - brand: null
- Expanda abreviações como:
  - "ESP" → "Espaguete"
  - "PARAF" → "Parafuso"

6) LATICÍNIOS (EXCETO LEITE):
- Produtos como: "QUEIJO", "IOGURTE", "MANTEIGA", "REQUEIJÃO", "CREME DE LEITE", etc.
- Exemplos:
  - "QUEIJO MUSSARELA FATIADO 200G" →
    - normalized_name: "Queijo Mussarela Fatiado 200g"
    - brand: null ou marca, se aparecer.
  - "IOGURTE NESTLE MORANGO 170G" →
    - normalized_name: "Iogurte Sabor Morango 170g"
    - brand: "Nestlé"
  - "MANTEIGA AVIAÇÃO 200G" →
    - normalized_name: "Manteiga 200g"
    - brand: "Aviação"

7) CARNES:
- Produtos como: "CARNE BOVINA", "CARNE SUÍNA", "FRANGO", "PEITO", "COXA", "ASA", "MOÍDA", etc.
- O normalized_name deve seguir o formato:
  - "Carne Bovina <Corte opcional> <Peso>"
  - "Carne Suína <Corte opcional> <Peso>"
  - "Frango <Corte opcional> <Peso>"
- Exemplos:
  - "CARNE BOV MOIDA 1KG" →
    - normalized_name: "Carne Bovina Moída 1kg"
  - "PEITO DE FRANGO SASSAMI 1KG" →
    - normalized_name: "Frango Peito Sassami 1kg"
  - "LINGUICA TOSCANA SUINA 700G" →
    - normalized_name: "Linguiça Toscana Suína 700g"
- NÃO invente o tipo/corte da carne se não estiver claro: use algo genérico como "Carne Bovina 1kg" quando a descrição for vaga.

8) HIGIENE E LIMPEZA:
- Exemplos de categorias:
  - Sabão em pó, detergente, desinfetante, água sanitária, sabonete, shampoo, condicionador, pasta de dente, papel higiênico, etc.
- Exemplos:
  - "SABAO PO OMO 2KG" →
    - normalized_name: "Sabão em Pó 2kg"
    - brand: "Omo"
  - "DETERGENTE YPE NEUTRO 500ML" →
    - normalized_name: "Detergente Neutro 500ml"
    - brand: "Ypê"
  - "PAPEL HIGIÊNICO NEVE LEVE 12 PAGUE 11" →
    - normalized_name: "Papel Higiênico 12 Rolos"
    - brand: "Neve"
    - is_promotion: true

9) FARMÁCIA (is_pharmacy, pill_count) DENTRO DO GERAL:
- Se o item for remédio (ex: menciona CPR, COMP, COMPR, COMPRIMIDOS, CAPS, CAP, CAPSULAS, GOTAS, ML + MG típicos de medicamento etc.), faça:
  - "is_pharmacy": true
  - Tente extrair a quantidade de comprimidos/cápsulas:
    - Ex: "DIPIRONA SODICA 500MG CPR C/20" → pill_count: 20
    - Ex: "PARACETAMOL 750MG 10 COMP" → pill_count: 10
- normalized_name deve ser genérico, ex:
  - "Dipirona Sódica 500mg 20 Comprimidos"
  - "Paracetamol 750mg 10 Comprimidos"
- Caso não seja farmacêutico: 
  - "is_pharmacy": false
  - "pill_count": null

10) ABREVIAÇÕES E SIGLAS (expanda adequadamente):
- INT → Integral
- DESN → Desnatado
- SEMI → Semidesnatado
- CPR, COMP, COMPR → Comprimidos
- REV → Revestido
- CAPS → Cápsulas
- LT → L
- ML → ml (mas pode ser convertido para L quando claramente equivalente: ex: 1000ML → 1L)
- KG → kg
- G → g
- T1, TIPO1 → "Tipo 1"
- T2, TIPO2 → "Tipo 2"
- PARB, PARBOIL → "Parboilizado"

11) REMOÇÃO DE MARCA DO normalized_name:
- Se aparecer uma marca conhecida ou claramente uma marca,
  coloque no campo "brand" e NÃO inclua a marca no normalized_name.
- Ex:
  - "REFRIG COCA COLA 2L" →
    - normalized_name: "Refrigerante Cola 2L"
    - brand: "Coca Cola"
  - "ARROZ CAMIL TIPO 1 5KG" →
    - normalized_name: "Arroz Tipo 1 5kg"
    - brand: "Camil"
  - "LEITE UHT ITALAC INT 1L" →
    - normalized_name: "Leite Integral 1L"
    - brand: "Italac"

12) Quando não tiver certeza:
- Faça o melhor esforço possível com as informações do nome.
- Se não conseguir achar marca: use "brand": null.
- Se não conseguir saber se é farmácia: "is_pharmacy": false, "pill_count": null.
- Prefira sempre manter termos do texto original em vez de inventar novas informações.

ITENS PARA PROCESSAR (cada linha tem um índice e a descrição original):
${productsList}`;
}

export async function aiNormalizeProduct(productName: string): Promise<NormalizedProduct | null> {
  if (!productName) return null;

  try {
    // Prompt melhorado, com regras anti-alucinação e input no final
    const prompt = `Você é um normalizador de um único item de nota fiscal brasileira.

Seu objetivo é transformar a descrição abaixo em um "normalized_name" limpo, genérico e padronizado,
adequado para agrupamento de gastos.

⚠️ Regras anti-alucinação (muito importantes):
- NÃO invente produtos, categorias, sabores, tipos de carne, volumes, pesos ou marcas que não estejam claramente indicados.
- NÃO invente "pill_count": só use se houver um número explícito na descrição (ex: C/20, 10 COMP, 12 CAPS). Caso contrário, use null.
- NÃO invente marca. Só preencha "brand" se houver um nome claro de marca na descrição.
- Se não tiver certeza da categoria, prefira um normalized_name mais genérico, mantendo palavras do texto original.
- Se houver dúvida entre duas interpretações, escolha SEMPRE a opção mais neutra e genérica.
- Não altere quantidades (não mude 1L para 2L, nem 500g para 1kg, etc.).

Estrutura de resposta OBRIGATÓRIA:
Você deve responder APENAS com um JSON VÁLIDO neste formato:

{
  "normalized_name": "nome genérico normalizado sem marca",
  "brand": "nome da marca ou null",
  "is_promotion": false,
  "is_pharmacy": false,
  "pill_count": null
}

Regras de normalização:
- "normalized_name" deve ser um nome genérico em português, com:
  - categoria + características essenciais (sabor/teor/tipo) + volume/peso (se existir),
  - SEM marca.
- Remova quaisquer marcas do "normalized_name" e coloque apenas em "brand".
- Expanda abreviações quando fizer sentido:
  - INT → Integral
  - DESN → Desnatado
  - SEMI → Semidesnatado
  - CPR, COMP, COMPR → Comprimidos
  - REV → Revestido
  - CAPS → Cápsulas
- Para produtos de farmácia:
  - Se a descrição indicar medicamento (CPR, COMP, CAPS, dosagens como 500MG, etc.), defina "is_pharmacy": true.
  - Tente extrair "pill_count" a partir de padrões como C/20, 10 COMP, 12 CAPS.
- Itens em promoção:
  - Se aparecer "OFERTA", "PROMOÇÃO", "LEVE 3 PAGUE 2" etc., use "is_promotion": true. Caso contrário, false.

Produto para processar (apenas um):
${productName}`;

    const content = await callGemini(prompt);

    // Check if content is empty (safety filter)
    if (!content || content.trim() === '') {
      if (process.env.DEBUG_AI === 'true') {
        console.warn('Empty content from Gemini, using fallback');
      }
      return null;
    }

    // The model might return JSON wrapped in markdown code blocks or with extra text
    let jsonText = content.trim();

    if (process.env.DEBUG_AI === 'true') {
      console.log('Raw Gemini response:', jsonText);
    }

    // Remove markdown code blocks if present
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (match) {
        jsonText = match[1];
      } else {
        // Try to remove any ``` markers
        jsonText = jsonText.replace(/```json?\s*/g, '').replace(/```\s*/g, '');
      }
    }

    // Try to extract JSON object if there's extra text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/\n/g, ' ') // Remove newlines
      .replace(/\s+/g, ' '); // Normalize whitespace

    if (process.env.DEBUG_AI === 'true') {
      console.log('Cleaned JSON:', jsonText);
    }

    const parsed: AIResult = JSON.parse(jsonText);

    // Build NormalizedProduct compatible object
    const normalized: NormalizedProduct = {
      normalizedName: parsed.normalized_name?.trim() || '',
      originalName: productName,
      productCode: undefined,
      ncmCode: undefined,
      brand: parsed.brand || undefined,
      isPromotion: !!parsed.is_promotion,
    } as NormalizedProduct;

    // If pharmacy and pill_count exists, ensure normalizedName contains the pill suffix
    if (parsed.is_pharmacy && parsed.pill_count && normalized.normalizedName) {
      const suffix = `${parsed.pill_count} Comprimidos`;
      if (!normalized.normalizedName.toLowerCase().includes('comprimid')) {
        normalized.normalizedName = `${normalized.normalizedName} ${suffix}`.trim();
      }
    }

    return normalized;
  } catch (err) {
    // On any error, return null so caller can fallback to static normalizer
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_AI === 'true') {
      console.error('aiNormalizeProduct error:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
      }
    }
    return null;
  }
}

export default aiNormalizeProduct;

/**
 * Normalize multiple products in a single API call (batch processing)
 * This significantly reduces API calls and avoids rate limiting
 */
export async function aiNormalizeProductsBatch(
  productNames: string[],
  modeOverride?: PromptMode,
): Promise<(NormalizedProduct | null)[]> {
  if (!productNames || productNames.length === 0) return [];

  try {
    const mode: PromptMode = modeOverride ?? decidePromptMode(productNames);
    const prompt = buildPrompt(productNames, mode);

    const content = await callGemini(prompt);

    if (!content || content.trim() === '') {
      console.warn('Empty content from Gemini batch, using fallback for all');
      return productNames.map(() => null);
    }

    let jsonText = content.trim();

    if (process.env.DEBUG_AI === 'true') {
      console.log('Raw Gemini batch response:', jsonText);
    }

    // Remove markdown code blocks
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (match) {
        jsonText = match[1];
      } else {
        jsonText = jsonText.replace(/```json?\s*/g, '').replace(/```\s*/g, '');
      }
    }

    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ');

    const parsed: BatchAIResult = JSON.parse(jsonText);

    if (!parsed.products || !Array.isArray(parsed.products)) {
      console.error('Invalid batch response structure, using fallback');
      return productNames.map(() => null);
    }

    // Create result array with nulls as default
    const results: (NormalizedProduct | null)[] = productNames.map(() => null);

    // Fill in the results based on index
    for (const product of parsed.products) {
      const idx = product.index;
      if (idx >= 0 && idx < productNames.length) {
        const normalized: NormalizedProduct = {
          normalizedName: product.normalized_name?.trim() || '',
          originalName: productNames[idx],
          productCode: undefined,
          ncmCode: undefined,
          brand: product.brand || undefined,
          isPromotion: !!product.is_promotion,
        } as NormalizedProduct;

        // Handle pharmacy products
        if (product.is_pharmacy && product.pill_count && normalized.normalizedName) {
          const suffix = `${product.pill_count} Comprimidos`;
          if (!normalized.normalizedName.toLowerCase().includes('comprimid')) {
            normalized.normalizedName = `${normalized.normalizedName} ${suffix}`.trim();
          }
        }

        results[idx] = normalized;
      }
    }

    if (process.env.DEBUG_AI === 'true') {
      const successCount = results.filter((r) => r !== null).length;
      console.log(`Batch processed (mode=${mode}): ${successCount}/${productNames.length} successful`);
    }

    return results;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_AI === 'true') {
      console.error('aiNormalizeProductsBatch error:', err);
    }
    // Return all nulls on error (will use static normalizer)
    return productNames.map(() => null);
  }
}
