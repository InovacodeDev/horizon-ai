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
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { getCurrentUserId } from '@/lib/auth/session';
import { encodeToToon } from '@/lib/utils/toon';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { Query } from 'node-appwrite';

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
  /**
   * Parse HTML content into structured invoice data
   * Requirement 3.2, 3.7, 3.8
   */
  async parseInvoiceHtml(html: string, invoiceKey: string): Promise<AIParseResponse> {
    const startTime = loggerService.startPerformanceTracking('ai-parse-html');

    try {
      loggerService.info('ai-parser', 'parse-html', 'Starting hybrid parsing', {
        invoiceKey,
        htmlSize: html.length,
        model: this.config.model,
      });

      // 1. Extract raw data with Cheerio
      const $ = cheerio.load(html);

      // Extract basic metadata for duplicate check
      // Note: Full metadata extraction happens later with AI, but we need enough to identify/validate
      // Actually, invoiceKey is passed as argument, so we use that.

      // 2. Validate if NF is already imported
      await this.checkDuplicate(invoiceKey);

      // 3. Extract items via Cheerio
      const rawItems = this.extractItemsViaCheerio($);
      loggerService.info('ai-parser', 'extract-items', 'Extracted raw items', {
        count: rawItems.length,
      });

      // 4. Process items with AI in batches
      const processedItems = await this.processItemsInBatches(rawItems);

      // 5. Process metadata with AI (excluding items)
      // Remove items table to save tokens and focus AI on metadata
      $('#tabResult').remove();
      $('table').has('.txtTit').remove(); // Remove other potential item tables
      const htmlWithoutItems = $.html();

      const metadata = await this.processMetadataWithAI(htmlWithoutItems);

      // 6. Merge results
      const result: AIParseResponse = {
        ...metadata,
        items: processedItems,
        // Recalculate totals based on processed items if needed, or trust metadata
        // For now, we trust metadata totals but ensure items match
      };

      // Validate response structure
      if (!this.validateAIResponse(result)) {
        loggerService.error('ai-parser', 'parse-html', 'AI response validation failed', {
          invoiceKey,
          response: result,
        });
        throw new AIParseError('AI response does not match expected schema', {
          response: result,
        });
      }

      loggerService.info('ai-parser', 'parse-html', 'AI parsing completed successfully', {
        invoiceKey,
        itemCount: result.items.length,
      });
      loggerService.endPerformanceTracking(startTime, true);

      return result;
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
   * Check if invoice already exists
   */
  private async checkDuplicate(invoiceKey: string): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        // If no user context (e.g. background job without session), we might skip or throw
        // Assuming this is called from API context where user is present
        loggerService.warn('ai-parser', 'check-duplicate', 'No user ID found, skipping duplicate check');
        return;
      }

      const db = getAppwriteDatabases();
      const result = await db.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, [
        Query.equal('user_id', userId),
        Query.equal('invoice_key', invoiceKey),
        Query.limit(1),
      ]);

      if (result.documents && result.documents.length > 0) {
        const duplicate = result.documents[0];
        const date = new Date(duplicate.created_at).toLocaleDateString();
        throw new AIParseError(`Invoice already exists (registered on ${date})`, {
          code: 'INVOICE_DUPLICATE',
          existingInvoiceId: duplicate.$id,
        });
      }
    } catch (error) {
      if (error instanceof AIParseError) throw error;
      // Log but don't fail if DB check fails? Or fail?
      // User requested: "Se já tiver sido, mande um aviso de erro... e termine"
      // So we should let errors propagate if they are genuine DB errors
      loggerService.error('ai-parser', 'check-duplicate', 'Failed to check duplicate', { error });
      // If it's just a DB error, maybe we shouldn't block parsing?
      // But the requirement is strict.
      throw error;
    }
  }

  /**
   * Extract raw items using Cheerio
   */
  private extractItemsViaCheerio($: cheerio.CheerioAPI): any[] {
    const items: any[] = [];

    // Try standard NFe layout
    const rows = $('table#tabResult tr');

    rows.each((_, row) => {
      const $row = $(row);
      // Skip header or empty rows
      if ($row.find('th').length > 0) return;

      const description = $row.find('.txtTit').text().trim() || $row.find('td').first().text().trim();
      if (!description) return;

      const quantityText = $row.find('.Rqtd').text().trim();
      const unitPriceText = $row.find('.RvlUnit').text().trim();
      const totalPriceText = $row.find('.valor').text().trim();
      const unitText = $row.find('.Runid').text().trim();

      // Extract raw text values to be processed by AI
      items.push({
        rawDescription: description,
        rawQuantity: quantityText,
        rawUnitPrice: unitPriceText,
        rawTotalPrice: totalPriceText,
        rawUnit: unitText,
        fullText: $row.text().replace(/\s+/g, ' ').trim(),
      });
    });

    // Fallback: if no standard table found, try to find any table with item-like structure
    if (items.length === 0) {
      $('tr').each((_, row) => {
        const $row = $(row);
        const text = $row.text().trim();
        // Use parseBRL to check if the row contains a valid price
        // This helps filter out headers, footers, or other non-item rows
        const hasPrice = this.parseBRL(text) !== null;

        if (text && hasPrice) {
          items.push({
            fullText: text.replace(/\s+/g, ' '),
          });
        }
      });
    }

    return items;
  }

  /**
   * Helper to parse Brazilian currency string to float
   */
  private parseBRL(value: string): number | null {
    if (!value) return null;

    // Remove currency symbol and whitespace
    const cleanValue = value.replace('R$', '').trim();

    // Check if it looks like a number (1.234,56 or 1234,56)
    // Must have at least one digit
    if (!/\d/.test(cleanValue)) return null;

    try {
      // Replace dots (thousand separators) with empty string
      // Replace comma (decimal separator) with dot
      const normalized = cleanValue.replace(/\./g, '').replace(',', '.');
      const number = parseFloat(normalized);

      return isNaN(number) ? null : number;
    } catch {
      return null;
    }
  }

  /**
   * Process items in batches using AI
   */
  private async processItemsInBatches(rawItems: any[]): Promise<any[]> {
    const BATCH_SIZE = 30;
    const processedItems: any[] = [];

    for (let i = 0; i < rawItems.length; i += BATCH_SIZE) {
      const batch = rawItems.slice(i, i + BATCH_SIZE);

      loggerService.info(
        'ai-parser',
        'process-batch',
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rawItems.length / BATCH_SIZE)}`,
        {
          batchSize: batch.length,
        },
      );

      const prompt = this.buildItemsBatchPrompt(batch);
      const responseText = await this.callAI(prompt);
      const batchResult = this.parseAIResponse(responseText);

      if (Array.isArray(batchResult)) {
        processedItems.push(...batchResult);
      } else if (batchResult.items && Array.isArray(batchResult.items)) {
        processedItems.push(...batchResult.items);
      }
    }

    return processedItems;
  }

  /**
   * Build prompt for items batch
   */
  public buildItemsBatchPrompt(batch: any[]): string {
    return `You are an expert at extracting structured data from Brazilian fiscal invoices.
Process the following raw item data extracted from an invoice and return a JSON array of structured items.

INPUT DATA (JSON):
${JSON.stringify(batch, null, 2)}

REQUIRED OUTPUT FORMAT (JSON Array):
[
  {
    "description": "<string: cleaned product name>",
    "productCode": "<string or null: EAN/GTIN if found>",
    "quantity": <number>,
    "unitPrice": <number>,
    "totalPrice": <number>,
    "discountAmount": <number: default 0>
  }
]

RULES:
1. Extract numeric values correctly (convert "1.234,56" to 1234.56).
2. If quantity is missing, infer from total/unit price or default to 1.
3. Clean up descriptions (remove unnecessary codes or prefixes if they are not part of the name).
4. GROUP IDENTICAL ITEMS: If multiple items have the exact same description and unit price, combine them into a single item. Sum their quantities and total prices.
5. Return ONLY the JSON array.
`;
  }

  /**
   * Get static prompt section (for caching)
   * Requirement 7.1
   */
  public getStaticPromptSection(): string {
    return `You are an expert at extracting structured data from Brazilian fiscal invoices.
Extract the invoice metadata (Merchant, Invoice Details, Totals) from the following HTML.
The items table has been removed, so focus only on the header and footer information.

REQUIRED OUTPUT FORMAT (JSON):
{
  "merchant": {
    "cnpj": "<string: 14 digits only>",
    "name": "<string>",
    "tradeName": "<string or null>",
    "address": "<string>",
    "city": "<string>",
    "state": "<string: 2 letters>"
  },
  "invoice": {
    "number": "<string>",
    "series": "<string>",
    "issueDate": "<string: ISO 8601 YYYY-MM-DDTHH:mm:ss>"
  },
  "totals": {
    "subtotal": <number>,
    "discount": <number>,
    "tax": <number>,
    "total": <number>
  }
}

RULES:
1. Extract all fields accurately.
2. Convert dates to ISO 8601.
3. Remove formatting from CNPJ.
4. Return ONLY the JSON object.`;
  }

  /**
   * Get variable prompt section (HTML content)
   * Requirement 7.1
   */
  public getVariablePromptSection(html: string): string {
    const htmlToon = encodeToToon({ html });
    return `
HTML CONTENT (TOON format):
${htmlToon}`;
  }

  /**
   * Build optimized prompt with caching
   * Requirement 7.1
   */
  public buildPrompt(html: string): string {
    return `${this.getStaticPromptSection()}

${this.getVariablePromptSection(html)}`;
  }

  /**
   * Process metadata with AI
   */
  private async processMetadataWithAI(html: string): Promise<any> {
    const prompt = this.buildPrompt(html);
    const responseText = await this.callAI(prompt);
    return this.parseAIResponse(responseText);
  }

  /**
   * Build prompt for metadata
   * @deprecated Use buildPrompt instead
   */
  public buildMetadataPrompt(html: string): string {
    return this.buildPrompt(html);
  }

  /**
   * Helper to call the configured AI provider
   */
  private async callAI(prompt: string): Promise<string> {
    if (this.config.provider === 'anthropic' && this.anthropicClient) {
      return this.callAnthropic(prompt);
    } else if (this.config.provider === 'openai' && this.openaiClient) {
      return this.callOpenAI(prompt);
    } else if (this.config.provider === 'gemini' && this.geminiClient) {
      return this.callGemini(prompt);
    } else {
      throw new AIParseError('AI client not initialized');
    }
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
