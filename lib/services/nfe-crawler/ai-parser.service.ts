/**
 * NFe AI Parser Service
 *
 * Uses AI (Anthropic Claude, OpenAI, or Google Gemini) to parse HTML content from Brazilian
 * fiscal invoices into structured data. Optimized for prompt caching by
 * placing static instructions first and variable HTML content last.
 *
 * Note: TOON format is NOT used here because:
 * 1. The AI needs to OUTPUT structured JSON, not parse TOON input
 * 2. HTML input is already compact and doesn't benefit from TOON encoding
 * 3. JSON schema validation requires JSON output format
 */
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { DEFAULT_AI_CONFIG, MIN_CACHE_TOKENS } from './constants';
import { AIParseError } from './errors';
import { IAIParserServiceExtended } from './interfaces';
import { loggerService } from './logger.service';
import { AIConfig, AIParseResponse, AIProvider } from './types';

export class AIParserService implements IAIParserServiceExtended {
  private config: AIConfig;
  private anthropicClient?: Anthropic;
  private openaiClient?: any; // OpenAI client type
  private geminiClient?: GoogleGenerativeAI;

  constructor(config?: Partial<AIConfig>) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.initializeClient();
  }

  /**
   * Initialize AI client based on provider
   * Requirement 3.1, 7.1
   */
  private initializeClient(): void {
    const apiKey =
      process.env.AI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'AI API key not found. Set AI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY environment variable.',
      );
    }

    if (this.config.provider === 'anthropic') {
      this.anthropicClient = new Anthropic({
        apiKey,
      });
    } else if (this.config.provider === 'openai') {
      // OpenAI client initialization would go here
      throw new Error('OpenAI provider not yet implemented');
    } else if (this.config.provider === 'gemini') {
      this.geminiClient = new GoogleGenerativeAI(apiKey);
    } else {
      throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  /**
   * Parse HTML content into structured invoice data
   * Requirement 3.2, 3.7, 3.8
   */
  async parseInvoiceHtml(html: string, invoiceKey: string): Promise<AIParseResponse> {
    const startTime = loggerService.startPerformanceTracking('ai-parse-html');

    try {
      loggerService.info('ai-parser', 'parse-html', 'Starting AI parsing', {
        invoiceKey,
        htmlSize: html.length,
        model: this.config.model,
      });

      // Build optimized prompt with caching
      const prompt = this.buildPrompt(html);

      // Call AI based on provider
      let responseText: string;

      if (this.config.provider === 'anthropic' && this.anthropicClient) {
        responseText = await this.callAnthropic(prompt);
      } else if (this.config.provider === 'openai' && this.openaiClient) {
        responseText = await this.callOpenAI(prompt);
      } else if (this.config.provider === 'gemini' && this.geminiClient) {
        responseText = await this.callGemini(prompt);
      } else {
        throw new AIParseError('AI client not initialized', {
          provider: this.config.provider,
        });
      }

      // Parse JSON response
      const parsedData = this.parseAIResponse(responseText);

      // Validate response structure
      if (!this.validateAIResponse(parsedData)) {
        loggerService.error('ai-parser', 'parse-html', 'AI response validation failed', {
          invoiceKey,
          response: parsedData,
        });
        throw new AIParseError('AI response does not match expected schema', {
          response: parsedData,
        });
      }

      loggerService.info('ai-parser', 'parse-html', 'AI parsing completed successfully', {
        invoiceKey,
        itemCount: parsedData.items.length,
      });
      loggerService.endPerformanceTracking(startTime, true);

      return parsedData;
    } catch (error) {
      loggerService.error('ai-parser', 'parse-html', 'AI parsing failed', {
        invoiceKey,
        error: error instanceof Error ? error.message : String(error),
      });
      loggerService.endPerformanceTracking(startTime, false, error instanceof Error ? error.message : String(error));

      if (error instanceof AIParseError) {
        throw error;
      }

      throw new AIParseError(error instanceof Error ? error.message : String(error), {
        invoiceKey,
        originalError: error instanceof Error ? error.name : typeof error,
      });
    }
  }

  /**
   * Build optimized prompt with caching
   * Static section first (cached), variable HTML content last
   * Requirement 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
   */
  buildPrompt(html: string): string {
    const staticSection = this.getStaticPromptSection();
    const variableSection = this.getVariablePromptSection(html);

    return staticSection + variableSection;
  }

  /**
   * Get static prompt section (for caching)
   * This section is at least 1024 tokens and includes all instructions
   * Requirement 7.1, 7.2, 7.3, 7.5, 7.6
   */
  getStaticPromptSection(): string {
    return `You are an expert at extracting structured data from Brazilian fiscal invoices (NFe/NFCe).

Your task is to extract invoice information from HTML content and return it in the following JSON format:

{
  "merchant": {
    "cnpj": "string (14 digits, numbers only)",
    "name": "string",
    "tradeName": "string (optional)",
    "address": "string",
    "city": "string",
    "state": "string (2 letters)"
  },
  "invoice": {
    "number": "string",
    "series": "string",
    "issueDate": "string (ISO 8601 format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD)"
  },
  "items": [
    {
      "description": "string",
      "productCode": "string (optional)",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "discountAmount": number
    }
  ],
  "totals": {
    "subtotal": number,
    "discount": number,
    "tax": number,
    "total": number
  }
}

IMPORTANT RULES:
1. Extract ALL items from the invoice, do not skip any
2. Convert all currency values to numbers (remove R$, dots for thousands, use dot for decimal)
3. Convert dates from DD/MM/YYYY HH:mm:ss to YYYY-MM-DDTHH:mm:ss format (ISO 8601 with time)
4. If time is not available, use YYYY-MM-DD format
5. Remove all formatting from CNPJ (dots, slashes, hyphens)
6. If a field is not found, use null for optional fields or empty string for required fields
7. Ensure all numeric calculations are correct
8. Return ONLY valid JSON, no additional text or explanation
9. For items without explicit quantity, assume quantity is 1
10. If discount is not shown, use 0
11. If tax is not shown separately, use 0
12. Subtotal should be the sum of all item totalPrice values
13. Total should equal subtotal - discount + tax

EXAMPLE INPUT:
<html>
  <div class="txtTopo">SUPERMERCADO EXEMPLO LTDA</div>
  <div>CNPJ: 12.345.678/0001-90</div>
  <div>Número: 123456 Série: 1 Emissão: 03/11/2025 14:30:45</div>
  <table id="tabResult">
    <tr id="Item + 1">
      <td><span class="txtTit">ARROZ 5KG</span></td>
      <td><span class="valor">25,90</span></td>
    </tr>
  </table>
  <div>Valor total R$: 25,90</div>
</html>

EXAMPLE OUTPUT:
{
  "merchant": {
    "cnpj": "12345678000190",
    "name": "SUPERMERCADO EXEMPLO LTDA",
    "tradeName": null,
    "address": "",
    "city": "",
    "state": ""
  },
  "invoice": {
    "number": "123456",
    "series": "1",
    "issueDate": "2025-11-03T14:30:45"
  },
  "items": [
    {
      "description": "ARROZ 5KG",
      "productCode": null,
      "quantity": 1,
      "unitPrice": 25.90,
      "totalPrice": 25.90,
      "discountAmount": 0
    }
  ],
  "totals": {
    "subtotal": 25.90,
    "discount": 0,
    "tax": 0,
    "total": 25.90
  }
}

ADDITIONAL EXAMPLES:

Example 2 - Multiple items with quantities:
<html>
  <div>FARMACIA SAUDE LTDA</div>
  <div>CNPJ: 98.765.432/0001-10</div>
  <div>NF-e: 789012 Serie: 2 Data: 05/11/2025 09:15:30</div>
  <table>
    <tr><td>DIPIRONA 500MG</td><td>Qtd: 2</td><td>Unit: R$ 8,50</td><td>Total: R$ 17,00</td></tr>
    <tr><td>PARACETAMOL 750MG</td><td>Qtd: 1</td><td>Unit: R$ 12,30</td><td>Total: R$ 12,30</td></tr>
  </table>
  <div>Total: R$ 29,30</div>
</html>

Expected output:
{
  "merchant": {
    "cnpj": "98765432000110",
    "name": "FARMACIA SAUDE LTDA",
    "tradeName": null,
    "address": "",
    "city": "",
    "state": ""
  },
  "invoice": {
    "number": "789012",
    "series": "2",
    "issueDate": "2025-11-05T09:15:30"
  },
  "items": [
    {
      "description": "DIPIRONA 500MG",
      "productCode": null,
      "quantity": 2,
      "unitPrice": 8.50,
      "totalPrice": 17.00,
      "discountAmount": 0
    },
    {
      "description": "PARACETAMOL 750MG",
      "productCode": null,
      "quantity": 1,
      "unitPrice": 12.30,
      "totalPrice": 12.30,
      "discountAmount": 0
    }
  ],
  "totals": {
    "subtotal": 29.30,
    "discount": 0,
    "tax": 0,
    "total": 29.30
  }
}

Example 3 - With discount and full address:
<html>
  <div>LOJA DE ROUPAS FASHION</div>
  <div>Nome Fantasia: Fashion Store</div>
  <div>CNPJ: 11.222.333/0001-44</div>
  <div>Rua das Flores, 123 - Centro - São Paulo - SP</div>
  <div>Nota: 555666 Serie: 1 Emissao: 10/11/2025 18:45:00</div>
  <table>
    <tr><td>CAMISETA BASICA</td><td>Cod: 1001</td><td>R$ 49,90</td></tr>
    <tr><td>CALCA JEANS</td><td>Cod: 2002</td><td>R$ 129,90</td></tr>
  </table>
  <div>Subtotal: R$ 179,80</div>
  <div>Desconto: R$ 17,98</div>
  <div>Total: R$ 161,82</div>
</html>

Expected output:
{
  "merchant": {
    "cnpj": "11222333000144",
    "name": "LOJA DE ROUPAS FASHION",
    "tradeName": "Fashion Store",
    "address": "Rua das Flores, 123 - Centro",
    "city": "São Paulo",
    "state": "SP"
  },
  "invoice": {
    "number": "555666",
    "series": "1",
    "issueDate": "2025-11-10T18:45:00"
  },
  "items": [
    {
      "description": "CAMISETA BASICA",
      "productCode": "1001",
      "quantity": 1,
      "unitPrice": 49.90,
      "totalPrice": 49.90,
      "discountAmount": 0
    },
    {
      "description": "CALCA JEANS",
      "productCode": "2002",
      "quantity": 1,
      "unitPrice": 129.90,
      "totalPrice": 129.90,
      "discountAmount": 0
    }
  ],
  "totals": {
    "subtotal": 179.80,
    "discount": 17.98,
    "tax": 0,
    "total": 161.82
  }
}

`;
  }

  /**
   * Get variable prompt section (HTML content)
   * Requirement 7.2, 7.4
   */
  getVariablePromptSection(html: string): string {
    return `Now extract data from this HTML:

${html}

CRITICAL: Return ONLY the raw JSON object with no markdown formatting, no code blocks, no explanations, and no additional text before or after the JSON. Start your response with { and end with }.`;
  }

  /**
   * Call Anthropic API with prompt caching
   */
  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.anthropicClient) {
      throw new AIParseError('Anthropic client not initialized');
    }

    try {
      const response = await this.anthropicClient.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
                cache_control: { type: 'ephemeral' } as any,
              },
            ],
          },
        ],
      });

      // Log token usage
      const usage = response.usage;
      loggerService.logAITokenUsage(
        this.config.model,
        usage.input_tokens,
        usage.output_tokens,
        (usage as any).cache_read_input_tokens || 0,
      );

      // Extract text from response
      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      throw new AIParseError('Unexpected response format from Anthropic', {
        contentType: content.type,
      });
    } catch (error) {
      throw new AIParseError(`Anthropic API error: ${error instanceof Error ? error.message : String(error)}`, {
        originalError: error instanceof Error ? error.name : typeof error,
      });
    }
  }

  /**
   * Call OpenAI API (placeholder for future implementation)
   */
  private async callOpenAI(prompt: string): Promise<string> {
    throw new AIParseError('OpenAI provider not yet implemented');
  }

  /**
   * Call Google Gemini API with retry logic for 503 errors
   */
  private async callGemini(prompt: string): Promise<string> {
    if (!this.geminiClient) {
      throw new AIParseError('Gemini client not initialized');
    }

    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Use gemini-2.5-flash or gemini-2.5-pro
        const modelName = this.config.model || 'gemini-2.5-flash';
        const model = this.geminiClient.getGenerativeModel({
          model: modelName,
        });

        // Try with JSON mime type first, fallback to text if it fails
        let result;
        try {
          result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxTokens,
              responseMimeType: 'application/json', // Force JSON response
            },
          });
        } catch (jsonError) {
          // Fallback: try without JSON mime type
          loggerService.warn('ai-parser', 'call-gemini', 'JSON mime type failed, retrying without it', {
            error: jsonError instanceof Error ? jsonError.message : String(jsonError),
          });

          result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxTokens,
            },
          });
        }

        const response = result.response;

        // Log token usage if available
        if (response.usageMetadata) {
          loggerService.logAITokenUsage(
            this.config.model,
            response.usageMetadata.promptTokenCount || 0,
            response.usageMetadata.candidatesTokenCount || 0,
            0, // Gemini doesn't have cache tokens in the same way
          );
        }

        // Check if response was blocked or empty
        if (!response.candidates || response.candidates.length === 0) {
          loggerService.error('ai-parser', 'call-gemini', 'No candidates in response', {
            promptFinishReason: response.promptFeedback,
          });
          throw new AIParseError('Gemini returned no response candidates', {
            promptFeedback: response.promptFeedback,
          });
        }

        const candidate = response.candidates[0];

        // Check if content was blocked
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          loggerService.error('ai-parser', 'call-gemini', 'Response blocked or incomplete', {
            finishReason: candidate.finishReason,
            safetyRatings: candidate.safetyRatings,
          });
          throw new AIParseError(`Gemini response blocked: ${candidate.finishReason}`, {
            finishReason: candidate.finishReason,
            safetyRatings: candidate.safetyRatings,
          });
        }

        const text = response.text();

        if (!text || text.trim().length === 0) {
          loggerService.error('ai-parser', 'call-gemini', 'Empty response text', {
            candidate,
          });
          throw new AIParseError('Gemini returned empty response text');
        }

        // Success - return the text
        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a 503 Service Unavailable error (model overloaded)
        const errorMessage = lastError.message.toLowerCase();
        const is503Error =
          errorMessage.includes('503') ||
          errorMessage.includes('service unavailable') ||
          errorMessage.includes('overloaded');

        // Only retry on 503 errors
        if (is503Error && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff: 2s, 4s, 8s
          loggerService.warn('ai-parser', 'call-gemini', `Gemini API overloaded (503), retrying in ${delay}ms`, {
            attempt: attempt + 1,
            maxRetries,
            error: lastError.message,
          });

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        // If it's already an AIParseError, rethrow it
        if (error instanceof AIParseError) {
          throw error;
        }

        // For non-503 errors or after max retries, throw immediately
        throw new AIParseError(`Gemini API error: ${lastError.message}`, {
          originalError: lastError.name,
          attempt: attempt + 1,
          maxRetries,
        });
      }
    }

    // If we exhausted all retries, throw the last error
    throw new AIParseError(`Gemini API error after ${maxRetries} retries: ${lastError?.message || 'Unknown error'}`, {
      originalError: lastError?.name,
      maxRetries,
    });
  }

  /**
   * Parse AI response text into JSON
   * Handles cases where AI might include markdown code blocks or extra text
   */
  private parseAIResponse(responseText: string): any {
    try {
      let cleanedText = responseText.trim();

      // Strategy 1: Try to parse as-is
      try {
        return JSON.parse(cleanedText);
      } catch {
        // Continue to other strategies
      }

      // Strategy 2: Remove markdown code blocks
      if (cleanedText.includes('```')) {
        // Remove ```json or ``` markers
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        try {
          return JSON.parse(cleanedText.trim());
        } catch {
          // Continue to other strategies
        }
      }

      // Strategy 3: Extract JSON object using regex
      // Look for content between first { and last }
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Continue to other strategies
        }
      }

      // Strategy 4: Try to find JSON after common prefixes
      const prefixes = ['Here is the JSON:', "Here's the JSON:", 'JSON:', 'Result:', 'Output:', 'Response:'];

      for (const prefix of prefixes) {
        const index = cleanedText.indexOf(prefix);
        if (index !== -1) {
          const afterPrefix = cleanedText.substring(index + prefix.length).trim();
          try {
            return JSON.parse(afterPrefix);
          } catch {
            // Try extracting JSON object from after prefix
            const jsonMatch = afterPrefix.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                return JSON.parse(jsonMatch[0]);
              } catch {
                // Continue
              }
            }
          }
        }
      }

      // If all strategies fail, throw error with debug info
      throw new Error('Could not extract valid JSON from response');
    } catch (error) {
      throw new AIParseError('Failed to parse AI response as JSON', {
        responseText: responseText.substring(0, 500), // First 500 chars for debugging
        parseError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate AI response structure
   * Requirement 3.7, 3.8
   */
  validateAIResponse(response: any): response is AIParseResponse {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Validate merchant
    if (!response.merchant || typeof response.merchant !== 'object') {
      return false;
    }
    if (typeof response.merchant.cnpj !== 'string') {
      return false;
    }
    if (typeof response.merchant.name !== 'string') {
      return false;
    }

    // Validate invoice
    if (!response.invoice || typeof response.invoice !== 'object') {
      return false;
    }
    if (typeof response.invoice.number !== 'string') {
      return false;
    }
    if (typeof response.invoice.series !== 'string') {
      return false;
    }
    if (typeof response.invoice.issueDate !== 'string') {
      return false;
    }

    // Validate items
    if (!Array.isArray(response.items) || response.items.length === 0) {
      return false;
    }
    for (const item of response.items) {
      if (typeof item.description !== 'string') {
        return false;
      }
      if (typeof item.quantity !== 'number') {
        return false;
      }
      if (typeof item.unitPrice !== 'number') {
        return false;
      }
      if (typeof item.totalPrice !== 'number') {
        return false;
      }
    }

    // Validate totals
    if (!response.totals || typeof response.totals !== 'object') {
      return false;
    }
    if (typeof response.totals.total !== 'number') {
      return false;
    }

    return true;
  }

  /**
   * Map AI response to ParsedInvoice interface
   * Requirement 3.3, 3.4, 3.5, 3.6
   */
  mapToParsedInvoice(aiResponse: AIParseResponse, invoiceKey: string, html: string): any {
    // Convert ISO date string to Date object
    const issueDate = new Date(aiResponse.invoice.issueDate);

    return {
      invoiceKey,
      invoiceNumber: aiResponse.invoice.number,
      series: aiResponse.invoice.series,
      issueDate,
      merchant: {
        cnpj: aiResponse.merchant.cnpj,
        name: aiResponse.merchant.name,
        tradeName: aiResponse.merchant.tradeName || undefined,
        address: aiResponse.merchant.address,
        city: aiResponse.merchant.city,
        state: aiResponse.merchant.state,
      },
      items: aiResponse.items.map((item) => ({
        description: item.description,
        productCode: item.productCode || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discountAmount: item.discountAmount,
      })),
      totals: {
        subtotal: aiResponse.totals.subtotal,
        discount: aiResponse.totals.discount,
        tax: aiResponse.totals.tax,
        total: aiResponse.totals.total,
      },
      xmlData: html, // Store original HTML for reference
      metadata: {
        parsedAt: new Date(),
        fromCache: false,
        parsingMethod: 'ai' as const,
      },
    };
  }
}

// Export singleton instance
export const aiParserService = new AIParserService();
