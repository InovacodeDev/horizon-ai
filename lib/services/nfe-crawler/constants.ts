/**
 * NFe Web Crawler with AI Extraction - Constants
 *
 * Configuration constants for the NFe web crawler system including
 * government portal URLs, timeouts, and validation rules.
 */
import { AIConfig, CrawlerConfig, InvoiceCategory, ValidationRules } from './types';

// ============================================
// Government Portal URLs
// ============================================

/**
 * Known Brazilian government portal URLs for NFe/NFCe
 */
export const GOVERNMENT_PORTAL_URLS = [
  'https://sat.sef.sc.gov.br',
  'https://www.sefaz.rs.gov.br',
  'https://www.nfe.fazenda.gov.br',
  'https://nfe.fazenda.sp.gov.br',
  'https://www.fazenda.pr.gov.br',
  'https://www.sefaz.ba.gov.br',
  'https://www.sefaz.pe.gov.br',
  'https://www.sefaz.ce.gov.br',
] as const;

// ============================================
// Invoice Key Configuration
// ============================================

/**
 * Standard length for Brazilian invoice keys
 */
export const INVOICE_KEY_LENGTH = 44;

/**
 * Regex patterns for extracting invoice keys
 */
export const INVOICE_KEY_PATTERNS = {
  // 44 consecutive digits
  CONSECUTIVE: /\d{44}/,
  // 44 digits with spaces (e.g., "4225 1109 4776 5200...")
  WITH_SPACES: /(\d{4}\s){10}\d{4}/,
  // In span.chave element
  IN_CHAVE_ELEMENT: /class="chave">([0-9\s]+)/,
} as const;

// ============================================
// Web Crawler Configuration
// ============================================

/**
 * Default configuration for web crawler operations
 * Can be overridden via environment variables
 */
export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  timeout: parseInt(process.env.CRAWLER_TIMEOUT || '15000', 10), // Reduced to 15 seconds for faster failures
  maxRedirects: parseInt(process.env.CRAWLER_MAX_REDIRECTS || '3', 10), // Reduced redirects
  userAgent: 'Mozilla/5.0 (compatible; InvoiceParser/1.0)',
  retryAttempts: parseInt(process.env.CRAWLER_RETRY_ATTEMPTS || '1', 10), // Reduced to 1 retry
  retryDelay: parseInt(process.env.CRAWLER_RETRY_DELAY || '500', 10), // Reduced delay to 500ms
};

/**
 * Maximum HTML content size to prevent memory issues
 * Can be overridden via MAX_HTML_SIZE environment variable
 */
export const MAX_HTML_SIZE = parseInt(process.env.MAX_HTML_SIZE || '5242880', 10); // 5MB default

// ============================================
// AI Configuration
// ============================================

/**
 * Default AI configuration for invoice parsing
 * Can be overridden via environment variables
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: (process.env.AI_PROVIDER as 'anthropic' | 'openai' | 'gemini') || 'gemini',
  model: process.env.AI_MODEL || 'gemini-2.5-flash',
  temperature: 0, // Deterministic output
  maxTokens: 1000000,
  cacheControl: {
    type: 'ephemeral',
  },
};

/**
 * Minimum tokens for prompt caching to be effective
 */
export const MIN_CACHE_TOKENS = 1024;

// ============================================
// Cache Configuration
// ============================================

/**
 * Default cache TTL (24 hours in milliseconds)
 * Can be overridden via CACHE_TTL environment variable
 */
export const DEFAULT_CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400000', 10);

/**
 * Maximum number of invoices to cache
 * Can be overridden via MAX_CACHE_SIZE environment variable
 */
export const MAX_CACHE_SIZE = parseInt(process.env.MAX_CACHE_SIZE || '1000', 10);

/**
 * Cache key prefix for parsed invoices
 */
export const CACHE_KEY_PREFIX = 'parsed_invoice:';

// ============================================
// Validation Rules
// ============================================

/**
 * Validation rules for invoice data
 */
export const VALIDATION_RULES: ValidationRules = {
  merchant: {
    cnpj: {
      required: true,
      pattern: /^\d{14}$/,
    },
    name: {
      required: true,
      minLength: 3,
    },
    state: {
      pattern: /^[A-Z]{2}$/,
    },
  },
  invoice: {
    number: {
      required: true,
    },
    series: {
      required: true,
    },
    issueDate: {
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/,
    },
  },
  items: {
    minItems: 1,
    description: {
      required: true,
    },
    quantity: {
      required: true,
      min: 0,
    },
    unitPrice: {
      required: true,
      min: 0,
    },
    totalPrice: {
      required: true,
      min: 0,
    },
  },
  totals: {
    total: {
      required: true,
      min: 0,
    },
  },
};

/**
 * Tolerance for rounding differences in total verification
 */
export const TOTAL_VERIFICATION_TOLERANCE = 0.01;

// ============================================
// Category Detection
// ============================================

/**
 * Keywords for detecting merchant categories
 */
export const CATEGORY_KEYWORDS: Record<InvoiceCategory, string[]> = {
  [InvoiceCategory.PHARMACY]: ['farmacia', 'farmácia', 'drogaria', 'farma', 'droga', 'medicamento'],
  [InvoiceCategory.GROCERIES]: ['hortifruti', 'hortifrutti', 'sacolao', 'sacolão', 'feira', 'verdura', 'fruta'],
  [InvoiceCategory.SUPERMARKET]: [
    'supermercado',
    'mercado',
    'super',
    'hipermercado',
    'atacadao',
    'atacadão',
    'atacado',
  ],
  [InvoiceCategory.RESTAURANT]: [
    'restaurante',
    'lanchonete',
    'bar',
    'cafe',
    'café',
    'pizzaria',
    'hamburgueria',
    'padaria',
    'confeitaria',
    'sorveteria',
  ],
  [InvoiceCategory.FUEL]: ['posto', 'combustivel', 'combustível', 'gasolina', 'etanol', 'diesel', 'gnv'],
  [InvoiceCategory.RETAIL]: ['loja', 'magazine', 'varejo', 'comercio', 'comércio'],
  [InvoiceCategory.SERVICES]: ['servico', 'serviço', 'manutencao', 'manutenção', 'conserto', 'reparo'],
  [InvoiceCategory.OTHER]: [],
};

/**
 * NCM code prefixes mapped to categories
 */
export const NCM_CATEGORY_MAP: Record<string, InvoiceCategory> = {
  // Medicines and pharmaceutical products (30xx)
  '30': InvoiceCategory.PHARMACY,
  // Food products (01-24)
  '01': InvoiceCategory.GROCERIES,
  '02': InvoiceCategory.GROCERIES,
  '03': InvoiceCategory.GROCERIES,
  '04': InvoiceCategory.GROCERIES,
  '07': InvoiceCategory.GROCERIES,
  '08': InvoiceCategory.GROCERIES,
  '09': InvoiceCategory.GROCERIES,
  '10': InvoiceCategory.GROCERIES,
  '11': InvoiceCategory.GROCERIES,
  '12': InvoiceCategory.GROCERIES,
  '15': InvoiceCategory.GROCERIES,
  '16': InvoiceCategory.GROCERIES,
  '17': InvoiceCategory.GROCERIES,
  '18': InvoiceCategory.GROCERIES,
  '19': InvoiceCategory.GROCERIES,
  '20': InvoiceCategory.GROCERIES,
  '21': InvoiceCategory.GROCERIES,
  '22': InvoiceCategory.GROCERIES,
  // Fuel products (27)
  '27': InvoiceCategory.FUEL,
};
