/**
 * NFe Web Crawler with AI Extraction - Service Interfaces
 *
 * Interface definitions for all services in the NFe web crawler system.
 * These interfaces define the contracts that each service must implement.
 */
import {
  AIParseResponse,
  IAIParserService,
  ICacheManager,
  IValidatorService,
  IWebCrawlerService,
  ParsedInvoice,
  ServiceResponse,
  ValidationResult,
} from './types';

// Re-export interfaces for convenience
export type { IWebCrawlerService, IAIParserService, IValidatorService, ICacheManager };

/**
 * Main Invoice Parser Service interface
 * Orchestrates the complete invoice extraction flow
 */
export interface IInvoiceParserService {
  /**
   * Parse invoice from URL
   * @param url - Government portal URL or encrypted URL
   * @param forceRefresh - Bypass cache and re-parse
   * @returns Parsed invoice data with metadata
   */
  parseFromUrl(url: string, forceRefresh?: boolean): Promise<ServiceResponse<ParsedInvoice>>;

  /**
   * Parse invoice from QR code data
   * @param qrData - QR code content (URL or invoice key)
   * @param forceRefresh - Bypass cache and re-parse
   * @returns Parsed invoice data with metadata
   */
  parseFromQRCode(qrData: string, forceRefresh?: boolean): Promise<ServiceResponse<ParsedInvoice>>;

  /**
   * Validate invoice URL or QR code format
   * @param data - URL or QR code data to validate
   * @returns True if format is valid
   */
  validateInvoiceFormat(data: string): boolean;

  /**
   * Extract invoice key from any input format
   * @param input - URL, QR code, or raw key
   * @returns 44-digit invoice key
   */
  extractInvoiceKey(input: string): Promise<string>;
}

/**
 * Extended Web Crawler Service interface with utility methods
 */
export interface IWebCrawlerServiceExtended extends IWebCrawlerService {
  /**
   * Validate URL points to known government portal
   */
  isGovernmentPortalUrl(url: string): boolean;

  /**
   * Construct government portal URL from invoice key
   */
  constructUrlFromKey(invoiceKey: string): string;

  /**
   * Extract invoice key from HTML content
   */
  extractKeyFromHtml(html: string): string | null;
}

/**
 * Extended AI Parser Service interface with prompt management
 */
export interface IAIParserServiceExtended extends IAIParserService {
  /**
   * Get static prompt section (for caching)
   */
  getStaticPromptSection(): string;

  /**
   * Get variable prompt section (HTML content)
   */
  getVariablePromptSection(html: string): string;

  /**
   * Validate AI response structure
   */
  validateAIResponse(response: any): response is AIParseResponse;
}

/**
 * Extended Validator Service interface with normalization
 */
export interface IValidatorServiceExtended extends IValidatorService {
  /**
   * Normalize CNPJ (remove formatting)
   */
  normalizeCNPJ(cnpj: string): string;

  /**
   * Normalize date from Brazilian format to ISO 8601
   */
  normalizeDate(date: string): string;

  /**
   * Validate and normalize complete AI response
   */
  validateAndNormalize(data: AIParseResponse): ValidationResult & { normalized?: AIParseResponse };
}

/**
 * Extended Cache Manager interface with statistics
 */
export interface ICacheManagerExtended extends ICacheManager {
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };

  /**
   * Clear all cached invoices
   */
  clearAll(): void;

  /**
   * Get all cache keys
   */
  keys(): string[];

  /**
   * Get cache metadata for a key
   */
  getMetadata(key: string): { cachedAt: Date; expiresAt: Date } | null;

  /**
   * Get data with cache metadata
   */
  getWithMetadata<T>(key: string): {
    data: T | null;
    fromCache: boolean;
    cachedAt?: Date;
  };

  /**
   * Set data and return metadata for response
   */
  setAndGetMetadata<T>(
    key: string,
    data: T,
    ttl?: number,
  ): {
    fromCache: false;
    cachedAt: Date;
  };
}
