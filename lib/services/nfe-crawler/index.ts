/**
 * NFe Web Crawler with AI Extraction - Main Export
 *
 * Central export point for all NFe web crawler types, interfaces,
 * errors, and constants.
 */

// Types
export type {
  // Error types
  ParsingStep,
  ErrorDetails,

  // Web Crawler types
  CrawlerConfig,
  IWebCrawlerService,

  // AI Parser types
  AIProvider,
  AIConfig,
  AIParseResponse,
  IAIParserService,

  // Validator types
  ValidationResult,
  ValidationRule,
  ValidationRules,
  IValidatorService,

  // Cache types
  CacheEntry,
  CacheMetadata,
  ICacheManager,

  // Invoice data types
  MerchantInfo,
  ParsedInvoiceItem,
  InvoiceTotals,
  ParsingMethod,
  InvoiceMetadata,
  ParsedInvoice,

  // Response types
  SuccessResponse,
  ErrorResponse,
  ServiceResponse,
} from './types';

// Enums (exported as values, not types)
export { InvoiceParserErrorCode, InvoiceCategory } from './types';

// Interfaces
export type {
  IInvoiceParserService,
  IWebCrawlerServiceExtended,
  IAIParserServiceExtended,
  IValidatorServiceExtended,
  ICacheManagerExtended,
} from './interfaces';

// Error classes
export {
  InvoiceParserError,
  InvoiceKeyNotFoundError,
  HTMLFetchError,
  AIParseError,
  ValidationError,
  NetworkError,
  TimeoutError,
  InvalidFormatError,
  isInvoiceParserError,
  toInvoiceParserError,
} from './errors';

// Constants
export {
  GOVERNMENT_PORTAL_URLS,
  INVOICE_KEY_LENGTH,
  INVOICE_KEY_PATTERNS,
  DEFAULT_CRAWLER_CONFIG,
  MAX_HTML_SIZE,
  DEFAULT_AI_CONFIG,
  MIN_CACHE_TOKENS,
  DEFAULT_CACHE_TTL,
  MAX_CACHE_SIZE,
  CACHE_KEY_PREFIX,
  VALIDATION_RULES,
  TOTAL_VERIFICATION_TOLERANCE,
  CATEGORY_KEYWORDS,
  NCM_CATEGORY_MAP,
} from './constants';

// Services
export { WebCrawlerService, webCrawlerService } from './web-crawler.service';
export { AIParserService, aiParserService } from './ai-parser.service';
export { ValidatorService, validatorService } from './validator.service';
export { CacheManager, cacheManager } from './cache-manager';
export { LoggerService, loggerService, LogLevel } from './logger.service';
export type { LogEntry, PerformanceMetrics, AITokenMetrics, CacheMetrics, ValidationMetrics } from './logger.service';
