/**
 * NFe AI Parser Service
 *
 * Uses AI (Anthropic Claude, OpenAI, or Google Gemini) to parse HTML content from Brazilian
 * fiscal invoices into structured data. Optimized for prompt caching by
 * placing static instructions first and variable HTML content last.
 *
 * Token Optimization Strategy:
 * - INPUT: HTML is sent in TOON format to reduce input tokens (~40% savings)
 * - OUTPUT: AI returns standard JSON for reliable parsing and validation
 * - This hybrid approach balances token efficiency with parsing reliability
 */
import { encodeToToon } from '@/lib/utils/toon';
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

      // Optimize HTML before sending to AI
      const optimizedHtml = this.optimizeHtml(html);

      loggerService.info('ai-parser', 'parse-html', 'HTML optimized', {
        invoiceKey,
        originalSize: html.length,
        optimizedSize: optimizedHtml.length,
        reduction: `${(((html.length - optimizedHtml.length) / html.length) * 100).toFixed(1)}%`,
      });

      // Build optimized prompt with caching (HTML in TOON format for input efficiency)
      const prompt = this.buildPrompt(optimizedHtml);

      // Estimate input tokens and cost before making the API call
      const estimatedInputTokens = this.estimateTokenCount(prompt);
      const estimatedInputCost = this.estimateInputCost(this.config.model, estimatedInputTokens);

      loggerService.info('ai-parser', 'parse-html', 'Sending prompt to AI', {
        invoiceKey,
        estimatedInputTokens,
        estimatedInputCost: `$${estimatedInputCost.toFixed(6)}`,
        model: this.config.model,
        promptLength: prompt.length,
      });

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

      // Estimate output tokens and cost
      const estimatedOutputTokens = this.estimateTokenCount(responseText);
      const estimatedOutputCost = this.estimateOutputCost(this.config.model, estimatedOutputTokens);

      loggerService.info('ai-parser', 'parse-html', 'Received AI response', {
        invoiceKey,
        estimatedOutputTokens,
        estimatedOutputCost: `$${estimatedOutputCost.toFixed(6)}`,
        responseLength: responseText.length,
        itemsExtracted: parsedData.items?.length || 0,
      });

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

Your task is to extract invoice information from HTML content and return it as a JSON object.

Expected JSON structure:

{
  "merchant": {
    "cnpj": "<string: 14 digits, numbers only>",
    "name": "<string>",
    "tradeName": "<string or null>",
    "address": "<string>",
    "city": "<string>",
    "state": "<string: 2 letters>"
  },
  "invoice": {
    "number": "<string>",
    "series": "<string>",
    "issueDate": "<string: ISO 8601 format>"
  },
  "items": [
    {
      "description": "<string>",
      "productCode": "<string or null>",
      "quantity": <number>,
      "unitPrice": <number>,
      "totalPrice": <number>,
      "discountAmount": <number>
    }
  ],
  "totals": {
    "subtotal": <number>,
    "discount": <number>,
    "tax": <number>,
    "total": <number>
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
8. Return ONLY valid TOON format (tab-separated), no additional text or explanation
9. For items without explicit quantity, assume quantity is 1
10. If discount is not shown, use 0
11. If tax is not shown separately, use 0
12. Subtotal should be the sum of all item totalPrice values
13. Total should equal subtotal - discount + tax

DISCOUNT AND TAX EXTRACTION RULES:
- Look for "Desconto", "Descontos R$", "Desconto R$" to extract discount value
- Look for "Valor total R$" for subtotal (before discount)
- Look for "Valor a pagar R$" for final total (after discount)
- Look for "Informação dos Tributos" or "Tributos Totais Incidentes" for tax value
- Common patterns: "Descontos R$: 1,00" or "Valor total R$: 107,81"
- If "Valor a pagar" is less than "Valor total", the difference is the discount
- Tax information may appear in footer sections with "Lei Federal 12.741/2012"

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

EXAMPLE OUTPUT (JSON):
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

Expected output (JSON):
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

Expected output (JSON):
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

Example 4 - NFe format with discount and taxes (common format):
<html>
  <div>MUNDIAL MIX COMERCIO DE ALIMENTOS LTDA</div>
  <div>CNPJ: 82.956.160/0042-41</div>
  <div>Número: 4376 Série: 196 Emissão: 07/09/2025</div>
  <table id="tabResult">
    <tr><td>ALHO SAO FRANCISCO 1kg</td><td>Qtd: 1</td><td>Vl. Unit.: 11,88</td><td>Vl. Total: 11,88</td></tr>
    <tr><td>COOKIES NESTLE 60G</td><td>Qtd: 2</td><td>Vl. Unit.: 2,79</td><td>Vl. Total: 5,58</td></tr>
    <tr><td>BISC GAROTO 78G</td><td>Qtd: 1</td><td>Vl. Unit.: 3,99</td><td>Vl. Total: 3,99</td></tr>
  </table>
  <div>Qtd. total de itens: 13</div>
  <div>Valor total R$: 107,81</div>
  <div>Descontos R$: 1,00</div>
  <div>Valor a pagar R$: 106,81</div>
  <div>Informação dos Tributos Totais Incidentes (Lei Federal 12.741/2012) R$ 22,94</div>
</html>

Expected output (JSON):
{
  "merchant": {
    "cnpj": "82956160004241",
    "name": "MUNDIAL MIX COMERCIO DE ALIMENTOS LTDA",
    "tradeName": null,
    "address": "",
    "city": "",
    "state": ""
  },
  "invoice": {
    "number": "4376",
    "series": "196",
    "issueDate": "2025-09-07"
  },
  "items": [
    {
      "description": "ALHO SAO FRANCISCO 1kg",
      "productCode": null,
      "quantity": 1,
      "unitPrice": 11.88,
      "totalPrice": 11.88,
      "discountAmount": 0
    },
    {
      "description": "COOKIES NESTLE 60G",
      "productCode": null,
      "quantity": 2,
      "unitPrice": 2.79,
      "totalPrice": 5.58,
      "discountAmount": 0
    },
    {
      "description": "BISC GAROTO 78G",
      "productCode": null,
      "quantity": 1,
      "unitPrice": 3.99,
      "totalPrice": 3.99,
      "discountAmount": 0
    }
  ],
  "totals": {
    "subtotal": 107.81,
    "discount": 1.00,
    "tax": 22.94,
    "total": 106.81
  }
}

`;
  }

  /**
   * Get variable prompt section (HTML content in TOON format)
   * Requirement 7.2, 7.4
   */
  getVariablePromptSection(html: string): string {
    // Convert HTML to TOON for token efficiency (reduces input tokens)
    const htmlToon = encodeToToon({ html });

    return `Now extract data from this HTML (provided in TOON format for efficiency):

${htmlToon}

CRITICAL: Return ONLY valid JSON in the exact structure shown above. No markdown formatting, no code blocks, no explanations, and no additional text before or after the JSON object. Start directly with the opening brace {.`;
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

      // Check if response was truncated due to max_tokens limit
      if (response.stop_reason === 'max_tokens') {
        loggerService.warn('ai-parser', 'call-anthropic', 'Response truncated at max_tokens limit', {
          maxTokens: this.config.maxTokens,
          outputTokens: usage.output_tokens,
        });
      }

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

        // Use application/json mime type to force JSON response
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
            responseMimeType: 'application/json',
          },
        });

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

        // Check if content was blocked or truncated
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          // Special handling for MAX_TOKENS truncation
          if (candidate.finishReason === 'MAX_TOKENS') {
            loggerService.error('ai-parser', 'call-gemini', 'Response truncated at max tokens', {
              finishReason: candidate.finishReason,
              maxTokens: this.config.maxTokens,
              outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
            });
            throw new AIParseError(
              'Gemini response was truncated due to max token limit. Increase maxTokens or reduce input size.',
              {
                finishReason: candidate.finishReason,
                maxTokens: this.config.maxTokens,
              },
            );
          }

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
   * Parse AI response text as JSON
   * Handles cases where AI might include markdown code blocks or extra text
   */
  private parseAIResponse(responseText: string): any {
    try {
      let cleanedText = responseText.trim();

      // Check if response appears to be truncated
      const responseLength = responseText.length;
      const possiblyTruncated = responseLength > 100 && !cleanedText.endsWith('}');

      if (possiblyTruncated) {
        loggerService.warn('ai-parser', 'parse-response', 'Response may be truncated', {
          responseLength,
          last50Chars: responseText.substring(responseLength - 50),
        });
      }

      // Strategy 1: Try direct JSON parse
      try {
        const parsed = JSON.parse(cleanedText);
        loggerService.info('ai-parser', 'parse-response', 'Successfully parsed JSON response', {
          hasData: !!parsed,
        });
        return parsed;
      } catch (jsonError) {
        loggerService.warn('ai-parser', 'parse-response', 'Direct JSON parse failed, trying cleanup strategies', {
          error: jsonError instanceof Error ? jsonError.message : String(jsonError),
          responsePreview: cleanedText.substring(0, 200),
        });
      }

      // Strategy 2: Remove markdown code blocks
      if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        try {
          const parsed = JSON.parse(cleanedText.trim());
          loggerService.info('ai-parser', 'parse-response', 'Parsed JSON after removing markdown', {});
          return parsed;
        } catch {
          // Continue to other strategies
        }
      }

      // Strategy 3: Extract JSON object from text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          loggerService.info('ai-parser', 'parse-response', 'Extracted and parsed JSON from text', {});
          return parsed;
        } catch {
          // Continue
        }
      }

      // Strategy 4: Try to find JSON after common prefixes
      const prefixes = ['Here is the JSON:', "Here's the JSON:", 'JSON:', 'Result:', 'Output:', 'Response:'];

      for (const prefix of prefixes) {
        const index = cleanedText.indexOf(prefix);
        if (index !== -1) {
          const afterPrefix = cleanedText.substring(index + prefix.length).trim();
          try {
            const parsed = JSON.parse(afterPrefix);
            loggerService.info('ai-parser', 'parse-response', 'Parsed JSON after removing prefix', { prefix });
            return parsed;
          } catch {
            // Try to extract JSON object from the text after prefix
            const jsonMatch = afterPrefix.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                loggerService.info('ai-parser', 'parse-response', 'Extracted JSON after prefix', { prefix });
                return parsed;
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
      // Log full response for debugging truncation issues
      loggerService.error('ai-parser', 'parse-response', 'Failed to parse AI response as JSON', {
        responseLength: responseText.length,
        first200: responseText.substring(0, 200),
        last200: responseText.substring(Math.max(0, responseText.length - 200)),
        parseError: error instanceof Error ? error.message : String(error),
      });

      throw new AIParseError('Failed to parse AI response as JSON', {
        responseText: responseText.substring(0, 500), // First 500 chars for debugging
        responseLength: responseText.length,
        last100: responseText.substring(Math.max(0, responseText.length - 100)),
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
    };
  }

  /**
   * Optimize HTML before sending to AI to reduce tokens and cost
   * Removes unnecessary whitespace, scripts, styles, and comments
   */
  private optimizeHtml(html: string): string {
    let optimized = html;

    // Remove HTML comments
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');

    // Remove script tags and their content
    optimized = optimized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove style tags and their content
    optimized = optimized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove inline styles
    optimized = optimized.replace(/\s+style\s*=\s*["'][^"']*["']/gi, '');

    // Remove class attributes (keep IDs for structure)
    optimized = optimized.replace(/\s+class\s*=\s*["'][^"']*["']/gi, '');

    // Remove empty attributes
    optimized = optimized.replace(/\s+\w+\s*=\s*[""']\s*[""']/gi, '');

    // Collapse multiple spaces into single space
    optimized = optimized.replace(/\s+/g, ' ');

    // Remove spaces around tags
    optimized = optimized.replace(/>\s+</g, '><');

    // Trim
    optimized = optimized.trim();

    return optimized;
  }

  /**
   * Estimate token count for a given text
   * Uses approximation: ~4 characters per token for English/Portuguese text
   * This is a rough estimate; actual tokenization may vary by model
   */
  private estimateTokenCount(text: string): number {
    // Average characters per token for GPT-like models: ~4
    // For safety, we use 3.5 to slightly overestimate
    return Math.ceil(text.length / 3.5);
  }

  /**
   * Estimate input cost based on model and token count
   * Prices as of November 2024 (per million tokens)
   */
  private estimateInputCost(model: string, inputTokens: number): number {
    const pricing: Record<string, { input: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3.0 },
      'claude-3-5-sonnet-20240620': { input: 3.0 },
      'claude-3-opus-20240229': { input: 15.0 },
      'claude-3-sonnet-20240229': { input: 3.0 },
      'claude-3-haiku-20240307': { input: 0.25 },
      'gemini-2.0-flash-exp': { input: 0.0 }, // Free tier
      'gemini-1.5-pro': { input: 1.25 },
      'gemini-1.5-flash': { input: 0.075 },
      'gemini-2.5-flash': { input: 0.0 }, // Assuming similar to 2.0-flash
      'gemini-2.5-pro': { input: 1.25 },
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
    return (inputTokens / 1_000_000) * modelPricing.input;
  }

  /**
   * Estimate output cost based on model and token count
   * Prices as of November 2024 (per million tokens)
   */
  private estimateOutputCost(model: string, outputTokens: number): number {
    const pricing: Record<string, { output: number }> = {
      'claude-3-5-sonnet-20241022': { output: 15.0 },
      'claude-3-5-sonnet-20240620': { output: 15.0 },
      'claude-3-opus-20240229': { output: 75.0 },
      'claude-3-sonnet-20240229': { output: 15.0 },
      'claude-3-haiku-20240307': { output: 1.25 },
      'gemini-2.0-flash-exp': { output: 0.0 }, // Free tier
      'gemini-1.5-pro': { output: 5.0 },
      'gemini-1.5-flash': { output: 0.3 },
      'gemini-2.5-flash': { output: 0.0 }, // Assuming similar to 2.0-flash
      'gemini-2.5-pro': { output: 5.0 },
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
    return (outputTokens / 1_000_000) * modelPricing.output;
  }
}

// Export singleton instance
export const aiParserService = new AIParserService();
