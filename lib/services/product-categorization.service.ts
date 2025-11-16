/**
 * Product Categorization Service
 *
 * Serviço para categorizar produtos automaticamente usando IA
 * Identifica categoria, subcategoria, unidade e preço por kg
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { encode as encodeToon } from '@toon-format/toon';

// ============================================
// Types
// ============================================

export interface ProductToCategorize {
  description: string;
  product_code?: string;
  ncm_code?: string;
  quantity: number;
  unit_price: number;
}

export interface CategorizedProduct {
  description: string;
  category: string; // supermercado, farmacia, hortifruti, padaria, acougue, etc.
  subcategory?: string; // mais específico
  unit_type: string; // g, kg, ml, l, un, caixa, etc.
  unit_quantity?: number; // quantidade da unidade (ex: 700 para "700g")
  price_per_kg?: number; // preço por kg quando aplicável
}

// ============================================
// Service
// ============================================

export class ProductCategorizationService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private cache: Map<string, CategorizedProduct> = new Map();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Usar gemini-2.5-flash que tem melhor suporte a cache e maior cota
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1, // Baixa temperatura para respostas mais consistentes
      },
    });
  }

  /**
   * Categoriza um único produto
   */
  async categorizeProduct(product: ProductToCategorize): Promise<CategorizedProduct> {
    const results = await this.categorizeProducts([product]);
    return results[0];
  }

  /**
   * Categoriza múltiplos produtos em lote (mais eficiente)
   * Usa TOON para economia de tokens
   */
  async categorizeProducts(products: ProductToCategorize[]): Promise<CategorizedProduct[]> {
    if (products.length === 0) {
      return [];
    }

    // Verificar cache primeiro
    const uncachedProducts: ProductToCategorize[] = [];
    const cachedResults: (CategorizedProduct | null)[] = [];

    for (const product of products) {
      const cacheKey = this.getCacheKey(product);
      const cached = this.cache.get(cacheKey);

      if (cached) {
        cachedResults.push(cached);
      } else {
        cachedResults.push(null);
        uncachedProducts.push(product);
      }
    }

    // Se todos estão em cache, retornar
    if (uncachedProducts.length === 0) {
      return cachedResults as CategorizedProduct[];
    }

    // Categorizar produtos não cacheados
    const newResults = await this.categorizeBatch(uncachedProducts);

    // Atualizar cache
    for (let i = 0; i < uncachedProducts.length; i++) {
      const cacheKey = this.getCacheKey(uncachedProducts[i]);
      this.cache.set(cacheKey, newResults[i]);
    }

    // Mesclar resultados
    const finalResults: CategorizedProduct[] = [];
    let uncachedIndex = 0;

    for (const cached of cachedResults) {
      if (cached) {
        finalResults.push(cached);
      } else {
        finalResults.push(newResults[uncachedIndex]);
        uncachedIndex++;
      }
    }

    return finalResults;
  }

  /**
   * Categoriza um lote de produtos usando IA
   */
  private async categorizeBatch(products: ProductToCategorize[]): Promise<CategorizedProduct[]> {
    // Converter para TOON (formato compacto)
    const toonData = encodeToon(products);

    // IMPORTANTE: Prompt estruturado para maximizar cache
    // Parte estática (cacheável) vem primeiro, dados variáveis (TOON) no final
    const prompt = `Você é um especialista em categorização de produtos de notas fiscais brasileiras.

CATEGORIAS PRINCIPAIS:
- supermercado: produtos gerais de supermercado (alimentos, bebidas, limpeza, higiene)
- farmacia: medicamentos, suplementos, produtos de farmácia
- hortifruti: frutas, verduras, legumes frescos
- padaria: pães, bolos, doces de padaria
- acougue: carnes, frangos, peixes
- lanchonete: lanches, salgados, fast food
- restaurante: refeições prontas
- bebidas: bebidas alcoólicas, refrigerantes
- outros: quando não se encaixa nas categorias acima

UNIDADES:
- Identifique a unidade do produto: g, kg, ml, l, un (unidade), cx (caixa), pct (pacote), etc.
- Extraia a quantidade da unidade do nome do produto
  Exemplos:
  * "arroz 5kg" -> unit_quantity: 5000, unit_type: "g"
  * "leite 1l" -> unit_quantity: 1000, unit_type: "ml"
  * "suco 500ml" -> unit_quantity: 500, unit_type: "ml"
  * "refrigerante 2l" -> unit_quantity: 2000, unit_type: "ml"
- Para produtos de farmácia, a unidade padrão é "cx" (caixa)
- Sempre converta para a menor unidade (g ao invés de kg, ml ao invés de l)

PREÇO POR KG/LITRO:
- Para produtos sólidos (g): calcule price_per_kg = (unit_price / unit_quantity) * 1000
- Para produtos líquidos (ml): calcule price_per_kg = (unit_price / unit_quantity) * 1000 (representa preço por litro)
- Apenas para produtos que fazem sentido ter preço por kg/litro (alimentos, bebidas, não medicamentos)
- Exemplos:
  * Arroz 1kg por R$ 5,00 -> price_per_kg: 5.00
  * Leite 1L por R$ 4,50 -> price_per_kg: 4.50 (preço por litro)
  * Suco 500ml por R$ 3,00 -> price_per_kg: 6.00 (preço por litro)

FORMATO DE SAÍDA:
Retorne um JSON array com a mesma ordem dos itens de entrada:
[
  {
    "description": "nome original do produto",
    "category": "categoria principal",
    "subcategory": "subcategoria opcional",
    "unit_type": "g|kg|ml|l|un|cx|pct",
    "unit_quantity": número ou null,
    "price_per_kg": número ou null
  }
]

IMPORTANTE:
- Mantenha a MESMA ORDEM dos itens de entrada
- Retorne APENAS o JSON, sem texto adicional
- Se não conseguir identificar algo, use null

---

Analise os produtos abaixo (em formato TOON) e categorize cada um:

${toonData}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Extrair JSON da resposta
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém JSON válido');
      }

      const categorized = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(categorized) || categorized.length !== products.length) {
        throw new Error(`IA retornou ${categorized.length} itens, esperado ${products.length}`);
      }

      return categorized;
    } catch (error) {
      console.error('Erro ao categorizar produtos:', error);

      // Fallback: retornar categorização básica
      return products.map((p) => ({
        description: p.description,
        category: 'outros',
        unit_type: 'un',
        unit_quantity: undefined,
        price_per_kg: undefined,
      }));
    }
  }

  /**
   * Gera chave de cache para um produto
   */
  private getCacheKey(product: ProductToCategorize): string {
    return `${product.description}|${product.product_code || ''}|${product.ncm_code || ''}`;
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let _instance: ProductCategorizationService | null = null;

export function getProductCategorizationService(): ProductCategorizationService {
  if (!_instance) {
    _instance = new ProductCategorizationService();
  }
  return _instance;
}

export const productCategorizationService = {
  get instance() {
    return getProductCategorizationService();
  },
};
