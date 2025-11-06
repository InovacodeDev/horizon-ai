/**
 * Product Normalization Service
 *
 * Handles normalization of product names and matching similar products
 * across different invoices to maintain a consistent product catalog.
 */

// ============================================
// Types and Interfaces
// ============================================

export interface NormalizedProduct {
  normalizedName: string;
  originalName: string;
  productCode?: string;
  ncmCode?: string;
}

export interface ProductMatchResult {
  isMatch: boolean;
  confidence: number;
  matchedProductId?: string;
}

// ============================================
// Constants
// ============================================

// Words to remove from product names
const NOISE_WORDS = [
  'un',
  'und',
  'unid',
  'unidade',
  'pc',
  'pct',
  'pacote',
  'cx',
  'caixa',
  'kg',
  'g',
  'mg',
  'l',
  'ml',
  'lt',
  'litro',
  'lata',
  'garrafa',
  'pet',
  'vidro',
];

// Common abbreviations to expand
const ABBREVIATIONS: Record<string, string> = {
  refrig: 'refrigerante',
  choc: 'chocolate',
  desc: 'descartavel',
  'desc.': 'descartavel',
  desod: 'desodorante',
  shamp: 'shampoo',
  cond: 'condicionador',
  sab: 'sabonete',
  sabao: 'sabão',
  deterg: 'detergente',
  amaciante: 'amaciante',
  amac: 'amaciante',
  limp: 'limpeza',
  desinf: 'desinfetante',
  alcool: 'álcool',
  alc: 'álcool',
};

// Minimum similarity threshold for matching (0-1)
const SIMILARITY_THRESHOLD = 0.75;

// ============================================
// Product Normalization Service
// ============================================

export class ProductNormalizationService {
  /**
   * Normalize a product name
   */
  normalizeProductName(productName: string): string {
    if (!productName) return '';

    let normalized = productName;

    // Convert to lowercase
    normalized = normalized.toLowerCase();

    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Remove special characters but keep accents
    normalized = normalized.replace(/[^\w\sáàâãéèêíïóôõöúçñ]/gi, ' ');

    // Expand common abbreviations
    for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      normalized = normalized.replace(regex, full);
    }

    // Remove noise words
    const words = normalized.split(' ');
    const filteredWords = words.filter((word) => !NOISE_WORDS.includes(word.toLowerCase()) && word.length > 1);
    normalized = filteredWords.join(' ');

    // Remove duplicate words
    const uniqueWords = [...new Set(normalized.split(' '))];
    normalized = uniqueWords.join(' ');

    // Final trim
    normalized = normalized.trim();

    return normalized;
  }

  /**
   * Normalize a product with all its information
   */
  normalizeProduct(productName: string, productCode?: string, ncmCode?: string): NormalizedProduct {
    return {
      normalizedName: this.normalizeProductName(productName),
      originalName: productName,
      productCode,
      ncmCode,
    };
  }

  /**
   * Check if two products match based on name, code, or NCM
   */
  matchProducts(product1: NormalizedProduct, product2: NormalizedProduct): ProductMatchResult {
    // Exact match on product code (EAN/GTIN)
    if (product1.productCode && product2.productCode && product1.productCode === product2.productCode) {
      return {
        isMatch: true,
        confidence: 1.0,
      };
    }

    // High confidence match on NCM code + similar name
    if (product1.ncmCode && product2.ncmCode && product1.ncmCode === product2.ncmCode) {
      const nameSimilarity = this.calculateSimilarity(product1.normalizedName, product2.normalizedName);

      if (nameSimilarity >= 0.6) {
        return {
          isMatch: true,
          confidence: 0.9,
        };
      }
    }

    // Name-based matching
    const nameSimilarity = this.calculateSimilarity(product1.normalizedName, product2.normalizedName);

    if (nameSimilarity >= SIMILARITY_THRESHOLD) {
      return {
        isMatch: true,
        confidence: nameSimilarity,
      };
    }

    return {
      isMatch: false,
      confidence: nameSimilarity,
    };
  }

  /**
   * Find matching product from a list of existing products
   */
  findMatchingProduct(
    newProduct: NormalizedProduct,
    existingProducts: Array<NormalizedProduct & { id: string }>,
  ): ProductMatchResult {
    let bestMatch: ProductMatchResult = {
      isMatch: false,
      confidence: 0,
    };

    for (const existingProduct of existingProducts) {
      const matchResult = this.matchProducts(newProduct, existingProduct);

      if (matchResult.isMatch && matchResult.confidence > bestMatch.confidence) {
        bestMatch = {
          ...matchResult,
          matchedProductId: existingProduct.id,
        };

        // If we found a perfect match, no need to continue
        if (matchResult.confidence === 1.0) {
          break;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;

    // Use Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    // Convert distance to similarity (0-1)
    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Extract brand from product name (if present)
   */
  extractBrand(productName: string): string | null {
    // Common brand patterns (usually at the start or in uppercase)
    const words = productName.split(' ');

    // Check if first word is all uppercase (likely a brand)
    if (words[0] && words[0] === words[0].toUpperCase() && words[0].length > 2) {
      return words[0];
    }

    return null;
  }

  /**
   * Extract size/quantity from product name
   */
  extractSize(productName: string): string | null {
    // Common size patterns: 500ml, 1kg, 2l, etc.
    const sizePattern = /(\d+(?:\.\d+)?)\s*(ml|l|kg|g|mg|un|unid)/i;
    const match = productName.match(sizePattern);

    if (match) {
      return `${match[1]}${match[2].toLowerCase()}`;
    }

    return null;
  }

  /**
   * Generate a canonical product key for grouping
   */
  generateProductKey(product: NormalizedProduct): string {
    const parts: string[] = [];

    // Use product code if available (most reliable)
    if (product.productCode) {
      parts.push(`code:${product.productCode}`);
    }

    // Use NCM code
    if (product.ncmCode) {
      parts.push(`ncm:${product.ncmCode}`);
    }

    // Use normalized name
    if (product.normalizedName) {
      // Take first 3 significant words
      const words = product.normalizedName.split(' ').slice(0, 3);
      parts.push(`name:${words.join('-')}`);
    }

    return parts.join('|');
  }

  /**
   * Batch normalize multiple products
   */
  batchNormalize(
    products: Array<{
      name: string;
      productCode?: string;
      ncmCode?: string;
    }>,
  ): NormalizedProduct[] {
    return products.map((product) => this.normalizeProduct(product.name, product.productCode, product.ncmCode));
  }

  /**
   * Group similar products together
   */
  groupSimilarProducts(products: NormalizedProduct[]): Map<string, NormalizedProduct[]> {
    const groups = new Map<string, NormalizedProduct[]>();

    for (const product of products) {
      const key = this.generateProductKey(product);

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(product);
    }

    return groups;
  }
}

// Export singleton instance
export const productNormalizationService = new ProductNormalizationService();
