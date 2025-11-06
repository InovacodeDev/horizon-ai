/**
 * NFe Web Crawler with AI Extraction - Core Types
 *
 * Type definitions for the NFe web crawler system that extracts Brazilian
 * fiscal invoice data from government portals using AI parsing.
 */

// ============================================
// Error Types
// ============================================

/**
 * Error codes for invoice parsing operations
 */
export enum InvoiceParserErrorCode {
  INVOICE_KEY_NOT_FOUND = 'INVOICE_KEY_NOT_FOUND',
  HTML_FETCH_ERROR = 'HTML_FETCH_ERROR',
  AI_PARSE_ERROR = 'AI_PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_FORMAT = 'INVALID_FORMAT',
}

/**
 * Parsing step identifiers for error tracking
 */
export type ParsingStep = 'key_extraction' | 'html_fetch' | 'ai_parse' | 'validation';

/**
 * Error details structure
 */
export interface ErrorDetails {
  url?: string;
  step?: ParsingStep;
  validationErrors?: string[];
  [key: string]: any;
}

// ============================================
// Web Crawler Types
// ============================================

/**
 * Configuration for web crawler operations
 */
export interface CrawlerConfig {
  timeout: number;
  maxRedirects: number;
  userAgent: string;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Web Crawler Service interface
 */
export interface IWebCrawlerService {
  /**
   * Extract invoice key from URL by fetching and parsing HTML
   */
  extractInvoiceKey(url: string): Promise<string>;

  /**
   * Fetch full invoice page HTML
   */
  fetchInvoiceHtml(url: string): Promise<string>;

  /**
   * Follow redirects and handle different portal formats
   */
  fetchWithRedirects(url: string, maxRedirects: number): Promise<string>;
}

// ============================================
// AI Parser Types
// ============================================

/**
 * AI provider options
 */
export type AIProvider = 'anthropic' | 'openai' | 'gemini';

/**
 * AI model configuration
 */
export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  cacheControl?: {
    type: 'ephemeral';
  };
}

/**
 * AI response structure for invoice parsing
 */
export interface AIParseResponse {
  merchant: {
    cnpj: string;
    name: string;
    tradeName?: string | null;
    address: string;
    city: string;
    state: string;
  };
  invoice: {
    number: string;
    series: string;
    issueDate: string; // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  };
  items: Array<{
    description: string;
    productCode?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountAmount: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
}

/**
 * AI Parser Service interface
 */
export interface IAIParserService {
  /**
   * Parse HTML content into structured invoice data
   */
  parseInvoiceHtml(html: string, invoiceKey: string): Promise<AIParseResponse>;

  /**
   * Build optimized prompt with caching
   */
  buildPrompt(html: string): string;
}

// ============================================
// Validator Types
// ============================================

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Field validation rule
 */
export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  min?: number;
  max?: number;
}

/**
 * Validation rules configuration
 */
export interface ValidationRules {
  merchant: {
    cnpj: ValidationRule;
    name: ValidationRule;
    state: ValidationRule;
  };
  invoice: {
    number: ValidationRule;
    series: ValidationRule;
    issueDate: ValidationRule;
  };
  items: {
    minItems: number;
    description: ValidationRule;
    quantity: ValidationRule;
    unitPrice: ValidationRule;
    totalPrice: ValidationRule;
  };
  totals: {
    total: ValidationRule;
  };
}

/**
 * Validator Service interface
 */
export interface IValidatorService {
  /**
   * Validate complete parsed invoice
   */
  validate(data: AIParseResponse): ValidationResult;

  /**
   * Normalize currency values
   */
  normalizeCurrency(value: string | number): number;

  /**
   * Validate CNPJ format
   */
  validateCNPJ(cnpj: string): boolean;

  /**
   * Validate date format
   */
  validateDate(date: string): boolean;

  /**
   * Verify totals match item sum
   */
  verifyTotals(
    items: Array<{ totalPrice: number }>,
    totals: { subtotal: number; discount: number; total: number },
  ): boolean;
}

// ============================================
// Cache Types
// ============================================

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache metadata for responses
 */
export interface CacheMetadata {
  fromCache: boolean;
  cachedAt?: Date;
}

/**
 * Cache Manager interface
 */
export interface ICacheManager {
  /**
   * Get cached invoice
   */
  get<T>(key: string): T | null;

  /**
   * Set cached invoice
   */
  set<T>(key: string, data: T, ttl: number): void;

  /**
   * Clear cache for specific invoice
   */
  clear(key: string): void;

  /**
   * Check if invoice is cached
   */
  has(key: string): boolean;
}

// ============================================
// Invoice Data Types
// ============================================

/**
 * Merchant information
 */
export interface MerchantInfo {
  cnpj: string;
  name: string;
  tradeName?: string;
  address: string;
  city: string;
  state: string;
}

/**
 * Invoice line item
 */
export interface ParsedInvoiceItem {
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
}

/**
 * Invoice totals
 */
export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

/**
 * Invoice category
 */
export enum InvoiceCategory {
  PHARMACY = 'pharmacy',
  GROCERIES = 'groceries',
  SUPERMARKET = 'supermarket',
  RESTAURANT = 'restaurant',
  FUEL = 'fuel',
  RETAIL = 'retail',
  SERVICES = 'services',
  OTHER = 'other',
}

/**
 * Parsing method used
 */
export type ParsingMethod = 'ai' | 'xml' | 'html';

/**
 * Invoice metadata
 */
export interface InvoiceMetadata {
  parsedAt: Date;
  fromCache: boolean;
  parsingMethod: ParsingMethod;
}

/**
 * Complete parsed invoice structure
 */
export interface ParsedInvoice {
  invoiceKey: string;
  invoiceNumber: string;
  series: string;
  issueDate: Date;
  merchant: MerchantInfo;
  items: ParsedInvoiceItem[];
  totals: InvoiceTotals;
  xmlData: string; // Store original HTML/XML for reference
  category?: InvoiceCategory;
  metadata?: InvoiceMetadata;
}

// ============================================
// Service Response Types
// ============================================

/**
 * Success response with data
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata?: CacheMetadata;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: InvoiceParserErrorCode;
  details?: ErrorDetails;
}

/**
 * Combined response type
 */
export type ServiceResponse<T> = SuccessResponse<T> | ErrorResponse;
