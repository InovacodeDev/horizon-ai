/**
 * Google AI Service
 *
 * Handles all interactions with Google Generative AI (Gemini) API.
 * Provides typed methods for shopping list generation, NFe parsing, and insights generation.
 * This service ensures API keys are only accessed server-side.
 *
 * Uses TOON format for token-efficient data transmission (20-60% token savings).
 */
import type { PurchaseRecord, PurchasedItem } from '@/lib/types';
import { formatForAIPrompt } from '@/lib/utils/toon';
import { GoogleGenAI, Type } from '@google/genai';

// ============================================
// Types and Interfaces
// ============================================

/**
 * Parsed purchase data from NFe
 */
export interface ParsedPurchase {
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  items: PurchasedItem[];
}

// ============================================
// Error Classes
// ============================================

export class GoogleAIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'GoogleAIServiceError';
  }
}

// ============================================
// Google AI Service
// ============================================

export class GoogleAIService {
  private client: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new GoogleAIServiceError('Google AI API key is not configured', 'MISSING_API_KEY', {
        hint: 'Set GEMINI_API_KEY environment variable',
      });
    }

    this.client = new GoogleGenAI({ apiKey });
  }

  // ============================================
  // Shopping List Generation
  // ============================================

  /**
   * Generate a shopping list from a user prompt
   * @param prompt - User's shopping list request (e.g., "Compras da semana")
   * @returns Array of shopping list item names
   */
  async generateShoppingList(prompt: string): Promise<string[]> {
    try {
      if (!prompt || prompt.trim().length === 0) {
        throw new GoogleAIServiceError('Prompt cannot be empty', 'INVALID_PROMPT');
      }

      const apiPrompt = `Based on the following request, create a shopping list. The response must be a valid JSON array of strings. Request: "${prompt}"`;

      const response = await this.client.models.generateContent({
        model: this.model,
        contents: apiPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      if (!response.text) {
        throw new GoogleAIServiceError('Empty response from Google AI', 'EMPTY_RESPONSE');
      }

      const items = JSON.parse(response.text);

      // Validate response is an array of strings
      if (!Array.isArray(items)) {
        throw new GoogleAIServiceError('Invalid response format: expected array', 'INVALID_RESPONSE_FORMAT');
      }

      if (items.length === 0) {
        throw new GoogleAIServiceError('No items generated from prompt', 'EMPTY_RESULT');
      }

      // Ensure all items are strings
      const validItems = items.filter((item) => typeof item === 'string' && item.trim().length > 0);

      if (validItems.length === 0) {
        throw new GoogleAIServiceError('No valid items in response', 'INVALID_ITEMS');
      }

      return validItems;
    } catch (error) {
      if (error instanceof GoogleAIServiceError) {
        throw error;
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        throw new GoogleAIServiceError('Failed to parse AI response', 'PARSE_ERROR', {
          originalError: error.message,
        });
      }

      // Handle Google AI API errors
      throw new GoogleAIServiceError('Failed to generate shopping list', 'GENERATION_ERROR', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ============================================
  // NFe Parsing
  // ============================================

  /**
   * Parse a Brazilian electronic invoice (NFe) from URL
   * @param nfeUrl - URL of the NFe to parse
   * @returns Parsed purchase data
   */
  async parseNFe(nfeUrl: string): Promise<ParsedPurchase> {
    try {
      if (!nfeUrl || nfeUrl.trim().length === 0) {
        throw new GoogleAIServiceError('NFe URL cannot be empty', 'INVALID_URL');
      }

      // Basic URL validation
      try {
        new URL(nfeUrl);
      } catch {
        throw new GoogleAIServiceError('Invalid NFe URL format', 'INVALID_URL_FORMAT');
      }

      const prompt = `
            Assume the role of an expert data extractor for Brazilian electronic invoices (NF-e/NFC-e).
            
            Extract the following information:
            1.  'storeName': The name of the commercial establishment.
            2.  'purchaseDate': The date of the purchase in ISO 8601 format (YYYY-MM-DD).
            3.  'totalAmount': The total value of the purchase as a number.
            4.  'items': An array of all purchased items. For each item, extract:
                - 'name': The full product name.
                - 'brand': The product's brand, if available.
                - 'quantity': The quantity purchased as a number.
                - 'unitPrice': The price per unit as a number.
                - 'totalPrice': The total price for that item line as a number.

            Your response MUST be a single, valid JSON object following the specified structure. Do not include any other text or explanations.

            Given the following URL, imagine you can access and parse its HTML content to extract the purchase details.
            URL: ${nfeUrl}
        `;

      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              storeName: { type: Type.STRING },
              purchaseDate: { type: Type.STRING },
              totalAmount: { type: Type.NUMBER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    brand: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    totalPrice: { type: Type.NUMBER },
                  },
                  required: ['name', 'quantity', 'unitPrice', 'totalPrice'],
                },
              },
            },
            required: ['storeName', 'purchaseDate', 'totalAmount', 'items'],
          },
        },
      });

      if (!response.text) {
        throw new GoogleAIServiceError('Empty response from Google AI', 'EMPTY_RESPONSE');
      }

      const parsedData = JSON.parse(response.text);

      // Validate required fields
      this.validateParsedPurchase(parsedData);

      return parsedData as ParsedPurchase;
    } catch (error) {
      if (error instanceof GoogleAIServiceError) {
        throw error;
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        throw new GoogleAIServiceError('Failed to parse AI response', 'PARSE_ERROR', {
          originalError: error.message,
        });
      }

      // Handle Google AI API errors
      console.error('NFe parsing error details:', error);
      throw new GoogleAIServiceError('Failed to parse NFe', 'NFE_PARSE_ERROR', {
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Validate parsed purchase data
   */
  private validateParsedPurchase(data: any): void {
    if (!data.storeName || typeof data.storeName !== 'string') {
      throw new GoogleAIServiceError('Invalid or missing storeName in parsed data', 'INVALID_PARSED_DATA');
    }

    if (!data.purchaseDate || typeof data.purchaseDate !== 'string') {
      throw new GoogleAIServiceError('Invalid or missing purchaseDate in parsed data', 'INVALID_PARSED_DATA');
    }

    if (typeof data.totalAmount !== 'number' || data.totalAmount <= 0) {
      throw new GoogleAIServiceError('Invalid or missing totalAmount in parsed data', 'INVALID_PARSED_DATA');
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new GoogleAIServiceError('Invalid or missing items in parsed data', 'INVALID_PARSED_DATA');
    }

    // Validate each item
    for (const item of data.items) {
      if (!item.name || typeof item.name !== 'string') {
        throw new GoogleAIServiceError('Invalid item name in parsed data', 'INVALID_PARSED_DATA');
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new GoogleAIServiceError('Invalid item quantity in parsed data', 'INVALID_PARSED_DATA');
      }

      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        throw new GoogleAIServiceError('Invalid item unitPrice in parsed data', 'INVALID_PARSED_DATA');
      }

      if (typeof item.totalPrice !== 'number' || item.totalPrice < 0) {
        throw new GoogleAIServiceError('Invalid item totalPrice in parsed data', 'INVALID_PARSED_DATA');
      }
    }
  }

  // ============================================
  // Insights Generation
  // ============================================

  /**
   * Generate savings insights from purchase history
   * Uses TOON format for 20-60% token savings compared to JSON
   * Optimized for prompt caching: static instructions first, variable data last
   * @param purchaseHistory - Array of past purchases
   * @returns Markdown-formatted insights
   */
  async generateInsights(purchaseHistory: PurchaseRecord[]): Promise<string> {
    try {
      if (!Array.isArray(purchaseHistory)) {
        throw new GoogleAIServiceError('Purchase history must be an array', 'INVALID_INPUT');
      }

      if (purchaseHistory.length === 0) {
        throw new GoogleAIServiceError('Purchase history cannot be empty', 'EMPTY_HISTORY');
      }

      // Format purchase history using TOON for token efficiency
      const formattedHistory = formatForAIPrompt({ purchases: purchaseHistory }, 'Purchase History');

      // IMPORTANT: Static instructions first (cacheable), variable data last
      // This allows LLMs to cache the instructions and save even more tokens
      const prompt = `
            You are a helpful financial assistant focused on saving money on groceries and shopping.
            
            Instructions:
            1. Analyze the items, brands, prices, and stores from the purchase data.
            2. Identify patterns like frequent purchases of the same item or brand loyalty.
            3. Provide 2-3 specific, concrete saving tips in a friendly tone.
            4. Use Markdown for formatting (headings with ##, lists with *, bold with **).
            5. Examples of insights: Suggesting a cheaper alternative brand, recommending buying in bulk, or pointing out frequent purchases of non-essential items.
            
            Example response format:
            "## Your Personalized Savings Insights 💰

            Here are a few ways you might be able to save based on your recent purchases:

            *   **Switch your coffee brand:** You frequently buy **Café em Pó 3 Corações** for **R$ 18.50**. Consider trying the store brand, which often costs around R$ 12-14, saving you over 20% on this item!
            *   **Buy milk in larger quantities:** We noticed you buy milk in 1-liter cartons. If your family consumes it quickly, buying a larger pack or "caixa fechada" can often reduce the per-liter price.
            "

            ---

            Now analyze the following purchase history (provided in TOON format - a token-efficient tabular format):

            ${formattedHistory}
        `;

      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      if (!response.text) {
        throw new GoogleAIServiceError('Empty response from Google AI', 'EMPTY_RESPONSE');
      }

      const insights = response.text.trim();

      if (insights.length === 0) {
        throw new GoogleAIServiceError('No insights generated', 'EMPTY_RESULT');
      }

      return insights;
    } catch (error) {
      if (error instanceof GoogleAIServiceError) {
        throw error;
      }

      // Handle Google AI API errors
      throw new GoogleAIServiceError('Failed to generate insights', 'INSIGHTS_ERROR', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ============================================
  // AI Shopping List Generation
  // ============================================

  /**
   * Generate intelligent shopping list based on purchase history
   * Uses TOON format for token efficiency and analyzes consumption patterns
   * @param invoiceHistory - Array of past invoices with items
   * @param category - Category to filter (e.g., 'supermarket', 'pharmacy')
   * @returns Array of shopping list items with quantities and reasoning
   */
  async generateIntelligentShoppingList(
    invoiceHistory: Array<{
      merchant_name: string;
      issue_date: string;
      total_amount: number;
      items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
    }>,
    category: string,
  ): Promise<
    Array<{
      product_name: string;
      quantity: number;
      unit: string;
      estimated_price: number;
      category?: string;
      subcategory?: string;
      ai_confidence: number;
      ai_reasoning: string;
    }>
  > {
    try {
      if (!Array.isArray(invoiceHistory) || invoiceHistory.length === 0) {
        throw new GoogleAIServiceError('Invoice history cannot be empty', 'EMPTY_HISTORY');
      }

      // Format invoice history using TOON format for token efficiency
      // Aggregate and analyze consumption patterns for each product
      const aggregatedProducts = new Map<
        string,
        {
          name: string;
          totalQuantity: number;
          totalSpent: number;
          purchaseCount: number;
          avgUnitPrice: number;
          lastPurchaseDate: string;
          purchaseDates: string[];
          // New: consumption pattern fields
          avgDaysBetweenPurchases: number;
          avgQuantityPerPurchase: number;
          daysSinceLastPurchase: number;
        }
      >();

      const now = new Date();

      invoiceHistory.forEach((invoice) => {
        invoice.items.forEach((item) => {
          const key = item.description.toLowerCase().trim();
          const existing = aggregatedProducts.get(key);

          if (existing) {
            existing.totalQuantity += item.quantity;
            existing.totalSpent += item.total_price;
            existing.purchaseCount++;
            existing.avgUnitPrice = existing.totalSpent / existing.totalQuantity;
            existing.purchaseDates.push(invoice.issue_date);
            if (invoice.issue_date > existing.lastPurchaseDate) {
              existing.lastPurchaseDate = invoice.issue_date;
            }
          } else {
            aggregatedProducts.set(key, {
              name: item.description,
              totalQuantity: item.quantity,
              totalSpent: item.total_price,
              purchaseCount: 1,
              avgUnitPrice: item.unit_price,
              lastPurchaseDate: invoice.issue_date,
              purchaseDates: [invoice.issue_date],
              avgDaysBetweenPurchases: 0,
              avgQuantityPerPurchase: item.quantity,
              daysSinceLastPurchase: 0,
            });
          }
        });
      });

      // Calculate consumption patterns for each product
      aggregatedProducts.forEach((product) => {
        // Calculate average quantity per purchase
        product.avgQuantityPerPurchase = product.totalQuantity / product.purchaseCount;

        // Calculate days since last purchase
        const lastPurchase = new Date(product.lastPurchaseDate);
        product.daysSinceLastPurchase = Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate average days between purchases (if multiple purchases)
        if (product.purchaseDates.length > 1) {
          const sortedDates = product.purchaseDates.map((d) => new Date(d).getTime()).sort();
          const intervals: number[] = [];
          for (let i = 1; i < sortedDates.length; i++) {
            const daysDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
            intervals.push(daysDiff);
          }
          product.avgDaysBetweenPurchases = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        } else {
          // Single purchase: use days since last purchase as estimate
          product.avgDaysBetweenPurchases = product.daysSinceLastPurchase;
        }
      });

      // Convert to simplified format for AI with consumption metrics
      const simplifiedHistory = Array.from(aggregatedProducts.values()).map((product) => ({
        product: product.name,
        total_qty: product.totalQuantity,
        avg_price: product.avgUnitPrice,
        times_purchased: product.purchaseCount,
        last_purchase: product.lastPurchaseDate,
        purchase_dates: product.purchaseDates.slice(-5), // Only last 5 dates
        avg_days_between: Math.round(product.avgDaysBetweenPurchases),
        avg_qty_per_purchase: product.avgQuantityPerPurchase,
        days_since_last: product.daysSinceLastPurchase,
      }));

      console.log(`Aggregated ${simplifiedHistory.length} unique products from ${invoiceHistory.length} invoices`);

      if (simplifiedHistory.length === 0) {
        throw new GoogleAIServiceError('No products found in invoice history', 'EMPTY_HISTORY');
      }

      const formattedHistory = formatForAIPrompt({ products: simplifiedHistory }, 'Aggregated Products');

      const prompt = `
You are an AI shopping assistant that analyzes purchase history to predict future shopping needs using consumption pattern analysis.

TASK: Generate an intelligent shopping list based on CONSUMPTION PATTERNS, not just summing quantities.

CONSUMPTION PATTERN ANALYSIS:
1. **Purchase Frequency**: Use "avg_days_between" to understand how often the product is bought
2. **Time Since Last Purchase**: Use "days_since_last" to determine urgency
3. **Consumption Rate**: Calculate daily consumption = avg_qty_per_purchase / avg_days_between
4. **Replenishment Logic**: 
   - If days_since_last ≥ avg_days_between * 0.8: SUGGEST (80% of typical cycle passed)
   - Suggested quantity = avg_qty_per_purchase (rounded to nearest integer)
   - If days_since_last < avg_days_between * 0.5: SKIP (still have supply)

EXAMPLE REASONING:
Product: "Leite Integral 1L"
- avg_days_between: 30 days
- avg_qty_per_purchase: 12 unidades
- days_since_last: 25 days
- Analysis: Compra a cada 30 dias. Última compra há 25 dias (83% do ciclo). Sugerindo 12 unidades para os próximos 30 dias.
- Result: SUGGEST with quantity=12

Product: "Arroz 5kg"
- avg_days_between: 60 days
- avg_qty_per_purchase: 2 pacotes
- days_since_last: 20 days
- Analysis: Compra a cada 60 dias. Última compra há apenas 20 dias (33% do ciclo). Ainda não precisa repor.
- Result: SKIP

QUANTITY CALCULATION RULES:
1. Base quantity = avg_qty_per_purchase (NOT total_qty!)
2. Round to nearest integer (use Math.round)
3. Consider package optimization:
   - If bought "6 unidades de 200g" and "2 unidades de 500g":
     * Total consumed: 6*200g + 2*500g = 2.2kg
     * Suggest cost-efficient option: e.g., "2 unidades de 1kg" if cheaper per gram
4. Never suggest more than 2x avg_qty_per_purchase (avoid over-buying)

IMPORTANT:
- Return quantities as INTEGER numbers (1, 2, 3, not 1.5)
- Use simple units: "unidades", "kg", "litros", "pacotes"
- Only suggest products that match category: "${category}"
- Filter OUT products where days_since_last < avg_days_between * 0.5

RESPONSE FORMAT: Return valid JSON array:
[
  {
    "product_name": "Leite Integral 1L",
    "quantity": 12,
    "unit": "unidades",
    "estimated_price": 4.50,
    "category": "Laticínios",
    "subcategory": "Leite",
    "ai_confidence": 0.95,
    "ai_reasoning": "Compra a cada 30 dias. Última compra há 25 dias (83% do ciclo). Sugerindo 12 unidades para os próximos 30 dias."
  }
]

HISTORICAL DATA:
${formattedHistory}
        `;

      console.log(`Sending ${formattedHistory.length} characters to AI for category: ${category}`);

      let response;
      try {
        response = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  product_name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  estimated_price: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  subcategory: { type: Type.STRING },
                  ai_confidence: { type: Type.NUMBER },
                  ai_reasoning: { type: Type.STRING },
                },
                required: ['product_name', 'quantity', 'unit', 'estimated_price', 'ai_confidence', 'ai_reasoning'],
              },
            },
          },
        });
      } catch (apiError) {
        console.error('Google AI API call failed:', apiError);
        throw new GoogleAIServiceError('Failed to call Google AI API', 'API_ERROR', {
          originalError: apiError instanceof Error ? apiError.message : String(apiError),
        });
      }

      console.log('AI response received');

      if (!response.text) {
        console.error('Empty response from Google AI');
        throw new GoogleAIServiceError('Empty response from Google AI', 'EMPTY_RESPONSE');
      }

      console.log(`AI response length: ${response.text.length} characters`);

      const items = JSON.parse(response.text);

      console.log(`Parsed ${Array.isArray(items) ? items.length : 0} items from AI response`);

      // Validate response
      if (!Array.isArray(items)) {
        throw new GoogleAIServiceError('Invalid response format: expected array', 'INVALID_RESPONSE_FORMAT');
      }

      if (items.length === 0) {
        throw new GoogleAIServiceError('No items generated from history', 'EMPTY_RESULT');
      }

      // Validate and sanitize each item
      const sanitizedItems = items.map((item, index) => {
        // Validate and convert product_name
        if (!item.product_name || typeof item.product_name !== 'string') {
          throw new GoogleAIServiceError(`Invalid item ${index}: missing or invalid product_name`, 'INVALID_ITEM');
        }

        // Validate and convert quantity (handle string numbers)
        let quantity = item.quantity;
        if (typeof quantity === 'string') {
          quantity = parseFloat(quantity);
        }
        if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) {
          console.warn(`Invalid quantity for ${item.product_name}: ${item.quantity}, defaulting to 1`);
          quantity = 1;
        }
        quantity = Math.max(1, Math.round(quantity)); // Ensure positive integer

        // Validate and convert estimated_price
        let estimatedPrice = item.estimated_price;
        if (typeof estimatedPrice === 'string') {
          estimatedPrice = parseFloat(estimatedPrice);
        }
        if (typeof estimatedPrice !== 'number' || isNaN(estimatedPrice) || estimatedPrice < 0) {
          console.warn(`Invalid price for ${item.product_name}: ${item.estimated_price}, defaulting to 0`);
          estimatedPrice = 0;
        }

        // Validate and convert ai_confidence
        let confidence = item.ai_confidence;
        if (typeof confidence === 'string') {
          confidence = parseFloat(confidence);
        }
        if (typeof confidence !== 'number' || isNaN(confidence) || confidence < 0 || confidence > 1) {
          console.warn(`Invalid confidence for ${item.product_name}: ${item.ai_confidence}, defaulting to 0.5`);
          confidence = 0.5;
        }

        return {
          product_name: item.product_name.trim(),
          quantity,
          unit: item.unit || 'unidades',
          estimated_price: estimatedPrice,
          category: item.category || '',
          subcategory: item.subcategory || '',
          ai_confidence: confidence,
          ai_reasoning: item.ai_reasoning || 'Baseado no histórico de compras',
        };
      });

      return sanitizedItems;
    } catch (error) {
      console.error('Error in generateIntelligentShoppingList:', error);

      if (error instanceof GoogleAIServiceError) {
        throw error;
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        console.error('JSON parse error:', error.message);
        throw new GoogleAIServiceError('Failed to parse AI response', 'PARSE_ERROR', {
          originalError: error.message,
        });
      }

      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }

      // Handle Google AI API errors
      throw new GoogleAIServiceError('Failed to generate intelligent shopping list', 'GENERATION_ERROR', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// ============================================
// Export Singleton Instance
// ============================================

let _googleAIServiceInstance: GoogleAIService | null = null;

/**
 * Get the Google AI service singleton instance
 * Lazy initialization to avoid issues in tests and edge cases
 */
export function getGoogleAIService(): GoogleAIService {
  if (!_googleAIServiceInstance) {
    _googleAIServiceInstance = new GoogleAIService();
  }
  return _googleAIServiceInstance;
}

// For backward compatibility and convenience
export const googleAIService = {
  get instance() {
    return getGoogleAIService();
  },
};
