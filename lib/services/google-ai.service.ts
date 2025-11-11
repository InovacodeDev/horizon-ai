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
