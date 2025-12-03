/**
 * Invoice Parser Service
 *
 * Handles parsing of Brazilian fiscal invoices (NFe/NFCe) from URLs and QR codes.
 * Extracts merchant information, line items, and product details from XML data.
 *
 * Updated to use NFE Web Crawler with AI Extraction services for improved parsing.
 */
import { cacheManager, getCacheKey } from '@/lib/utils/cache';
import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';

import {
  AIParseError,
  HTMLFetchError,
  InvoiceKeyNotFoundError,
  InvoiceParserError as NFEInvoiceParserError,
  NetworkError,
  TimeoutError,
  ValidationError,
  aiParserService,
  isInvoiceParserError,
  loggerService,
  validatorService,
  webCrawlerService,
} from './nfe-crawler';
import { productNormalizationService } from './product-normalization.service';

// ============================================
// Types and Interfaces
// ============================================

export enum InvoiceCategory {
  PHARMACY = 'pharmacy',
  GROCERIES = 'groceries',
  SUPERMARKET = 'supermarket',
  RESTAURANT = 'restaurant',
  FUEL = 'fuel',
  RETAIL = 'retail',
  SERVICES = 'services',
  HOME = 'home',
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  ENTERTAINMENT = 'entertainment',
  TRANSPORT = 'transport',
  HEALTH = 'health',
  EDUCATION = 'education',
  PETS = 'pets',
  OTHER = 'other',
}

export interface MerchantInfo {
  cnpj: string;
  name: string;
  tradeName?: string;
  address: string;
  city: string;
  state: string;
}

export interface ParsedInvoiceItem {
  description: string;
  productCode?: string;
  ncmCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface ParsedInvoice {
  invoiceKey: string;
  invoiceNumber: string;
  series: string;
  issueDate: Date;
  merchant: MerchantInfo;
  items: ParsedInvoiceItem[];
  totals: InvoiceTotals;
  xmlData: string;
  category?: InvoiceCategory;
  metadata?: {
    parsedAt: Date;
    fromCache: boolean;
    parsingMethod: 'ai' | 'xml' | 'html';
  };
}

// ============================================
// Constants
// ============================================

const GOVERNMENT_PORTAL_URLS = [
  'https://sat.sef.sc.gov.br',
  'https://www.sefaz.rs.gov.br',
  'https://www.nfe.fazenda.gov.br',
  'https://nfe.fazenda.sp.gov.br',
];

const INVOICE_KEY_LENGTH = 44;
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Category detection keywords
const CATEGORY_KEYWORDS: Record<InvoiceCategory, string[]> = {
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
  [InvoiceCategory.RETAIL]: ['loja', 'magazine', 'varejo', 'comercio', 'comércio', 'shopping'],
  [InvoiceCategory.SERVICES]: ['servico', 'serviço', 'manutencao', 'manutenção', 'conserto', 'reparo'],
  [InvoiceCategory.HOME]: [
    'casa',
    'decoracao',
    'decoração',
    'moveis',
    'móveis',
    'cama',
    'mesa',
    'banho',
    'construcao',
    'construção',
  ],
  [InvoiceCategory.ELECTRONICS]: [
    'eletronico',
    'eletrônico',
    'celular',
    'smartphone',
    'computador',
    'notebook',
    'informatica',
    'informática',
    'tech',
  ],
  [InvoiceCategory.CLOTHING]: [
    'roupa',
    'vestuario',
    'vestuário',
    'moda',
    'confeccao',
    'confecção',
    'calcado',
    'calçado',
    'tenis',
    'tênis',
    'sapato',
  ],
  [InvoiceCategory.ENTERTAINMENT]: ['cinema', 'teatro', 'show', 'ingresso', 'lazer', 'parque', 'jogo', 'game'],
  [InvoiceCategory.TRANSPORT]: [
    'uber',
    '99',
    'taxi',
    'táxi',
    'transporte',
    'passagem',
    'onibus',
    'ônibus',
    'metro',
    'metrô',
  ],
  [InvoiceCategory.HEALTH]: [
    'saude',
    'saúde',
    'medico',
    'médico',
    'clinica',
    'clínica',
    'hospital',
    'exame',
    'laboratorio',
    'laboratório',
  ],
  [InvoiceCategory.EDUCATION]: [
    'escola',
    'colegio',
    'colégio',
    'faculdade',
    'universidade',
    'curso',
    'ensino',
    'educacao',
    'educação',
    'livraria',
    'papelaria',
  ],
  [InvoiceCategory.PETS]: ['pet', 'veterinario', 'veterinário', 'racao', 'ração', 'banho e tosa'],
  [InvoiceCategory.OTHER]: [],
};

// NCM codes for category detection
const NCM_CATEGORY_MAP: Record<string, InvoiceCategory> = {
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

// ============================================
// Error Classes
// ============================================

export class InvoiceParserError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'InvoiceParserError';
  }
}

// ============================================
// Invoice Parser Service
// ============================================

export class InvoiceParserService {
  /**
   * Parse invoice from URL
   * Uses NFE Web Crawler with AI Extraction for improved parsing
   * Cached for 24 hours to avoid redundant parsing
   *
   * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1
   */
  async parseFromUrl(url: string, forceRefresh: boolean = false): Promise<ParsedInvoice> {
    const startTime = loggerService.startPerformanceTracking('parse-invoice-from-url');

    // Validate URL format
    if (!this.validateInvoiceFormat(url)) {
      loggerService.error('invoice-parser', 'parse-from-url', 'Invalid invoice URL format', { url });
      throw new InvoiceParserError('Invalid invoice URL format', 'INVOICE_INVALID_FORMAT', { url });
    }

    let invoiceKey: string | null = null;
    let step: 'key_extraction' | 'html_fetch' | 'ai_parse' | 'validation' = 'key_extraction';

    try {
      loggerService.info('invoice-parser', 'parse-from-url', 'Starting invoice parsing', { url, forceRefresh });

      // Step 1: Extract invoice key from URL
      step = 'key_extraction';
      invoiceKey = await webCrawlerService.extractInvoiceKey(url);

      // Step 2: Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cacheKey = getCacheKey.parsedInvoice(invoiceKey);
        const cached = cacheManager.get<ParsedInvoice>(cacheKey);

        if (cached) {
          loggerService.info('invoice-parser', 'parse-from-url', 'Returning cached invoice', { invoiceKey });
          loggerService.endPerformanceTracking(startTime, true);

          // Reconstruct Date object from cached data and add metadata
          return {
            ...cached,
            issueDate: new Date(cached.issueDate),
            metadata: {
              parsedAt: cached.metadata?.parsedAt || new Date(),
              fromCache: true,
              parsingMethod: cached.metadata?.parsingMethod || 'ai',
            },
          };
        }
      }

      // Step 3: Fetch HTML from government portal
      step = 'html_fetch';
      const html = await webCrawlerService.fetchInvoiceHtml(url);

      // Step 4: Parse HTML with AI
      step = 'ai_parse';
      const aiResponse = await aiParserService.parseInvoiceHtml(html, invoiceKey);

      // Step 5: Validate parsed data
      step = 'validation';
      const validationResult = validatorService.validate(aiResponse);

      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.errors, {
          invoiceKey,
          url,
        });
      }

      // Step 6: Map AI response to ParsedInvoice format
      const parsed = this.mapAIResponseToParsedInvoice(aiResponse, invoiceKey, html);

      // Step 7: Cache successful result (24 hours = 86400000 ms)
      const cacheKey = getCacheKey.parsedInvoice(invoiceKey);
      cacheManager.set(cacheKey, parsed, 86400000);

      loggerService.info('invoice-parser', 'parse-from-url', 'Invoice parsed successfully', {
        invoiceKey,
        itemCount: parsed.items.length,
        category: parsed.category,
      });
      loggerService.endPerformanceTracking(startTime, true);

      return parsed;
    } catch (error) {
      loggerService.endPerformanceTracking(startTime, false, error instanceof Error ? error.message : String(error));

      // Handle NFE crawler errors
      if (isInvoiceParserError(error)) {
        throw this.wrapNFEError(error, url, invoiceKey, step);
      }

      // Handle legacy errors
      if (error instanceof InvoiceParserError) {
        throw error;
      }

      // Wrap unknown errors
      throw new InvoiceParserError('Failed to parse invoice from URL', 'INVOICE_PARSE_ERROR', {
        url,
        invoiceKey,
        step,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Parse invoice from XML file content
   */
  async parseFromXmlFile(xmlContent: string): Promise<ParsedInvoice> {
    const startTime = loggerService.startPerformanceTracking('parse-invoice-from-xml');

    try {
      // 1. Parse XML to get basic structure
      // We reuse the existing parseXml logic but we need to enhance it with AI processing
      // to match the "URL da Nota" output format exactly
      const basicParsed = this.parseXml(xmlContent, 'XML_UPLOAD_' + Date.now());

      // 2. Process items through AI to ensure consistency (normalization, categorization)
      // The AI service expects raw items, so we pass the items extracted from XML
      const processedItems = await aiParserService.processItemsInBatches(basicParsed.items);

      // 3. Update the parsed invoice with AI-processed items
      const finalInvoice: ParsedInvoice = {
        ...basicParsed,
        items: processedItems.map((item) => ({
          description: item.description,
          productCode: item.productCode,
          ncmCode: item.ncmCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          discountAmount: item.discountAmount || 0,
        })),
        metadata: {
          parsedAt: new Date(),
          fromCache: false,
          parsingMethod: 'xml',
        },
      };

      // 4. Re-calculate category based on refined items
      finalInvoice.category = this.identifyMerchantCategory(finalInvoice.merchant, finalInvoice.items);

      loggerService.endPerformanceTracking(startTime, true);
      return finalInvoice;
    } catch (error) {
      loggerService.endPerformanceTracking(startTime, false, error instanceof Error ? error.message : String(error));
      throw new InvoiceParserError('Failed to parse XML file', 'XML_PARSE_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Parse invoice from PDF file buffer
   */
  async parseFromPdfFile(pdfBuffer: ArrayBuffer | Buffer | any): Promise<ParsedInvoice> {
    const startTime = loggerService.startPerformanceTracking('parse-invoice-from-pdf');

    try {
      const { PDFParser } = await import('./parsers/pdf.parser');
      const parser = new PDFParser();

      // 1. Extract text from PDF
      let buffer: Buffer;
      if (Buffer.isBuffer(pdfBuffer)) {
        buffer = pdfBuffer;
      } else if (typeof pdfBuffer === 'string') {
        // Assume base64 if string
        buffer = Buffer.from(pdfBuffer, 'base64');
      } else if (Array.isArray(pdfBuffer)) {
        buffer = Buffer.from(pdfBuffer);
      } else if (
        typeof pdfBuffer === 'object' &&
        pdfBuffer !== null &&
        'data' in pdfBuffer &&
        Array.isArray(pdfBuffer.data)
      ) {
        // Handle serialized Buffer object { type: 'Buffer', data: [...] }
        buffer = Buffer.from(pdfBuffer.data);
      } else {
        // Try standard conversion, might throw if invalid
        buffer = Buffer.from(pdfBuffer);
      }
      const text = await parser.parseText(buffer);

      // 2. Extract raw items using heuristics
      const rawItems = parser.extractItemsFromText(text);

      if (rawItems.length === 0) {
        // Fallback: use AI to parse the full text
        // We wrap text in <pre> to preserve formatting
        const aiResult = await aiParserService.parseInvoiceHtml(`<pre>${text}</pre>`, '');

        // Map AI result to ParsedInvoice
        return {
          invoiceKey: '', // No key in PDF usually
          invoiceNumber: String(aiResult.invoice.number),
          series: String(aiResult.invoice.series),
          issueDate: new Date(aiResult.invoice.issueDate),
          merchant: {
            cnpj: String(aiResult.merchant.cnpj || '').slice(0, 20),
            name: String(aiResult.merchant.name || ''),
            tradeName: aiResult.merchant.tradeName ? String(aiResult.merchant.tradeName) : undefined,
            address: String(aiResult.merchant.address || ''),
            city: String(aiResult.merchant.city || ''),
            state: String(aiResult.merchant.state || ''),
          },
          items: aiResult.items.map((item: any) => ({
            description: String(item.description || ''),
            productCode: item.productCode ? String(item.productCode) : undefined,
            ncmCode: item.ncmCode ? String(item.ncmCode) : undefined,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            totalPrice: Number(item.totalPrice || 0),
            discountAmount: Number(item.discountAmount || 0),
          })),
          totals: {
            subtotal: Number(aiResult.totals.subtotal || 0),
            discount: Number(aiResult.totals.discount || 0),
            tax: Number(aiResult.totals.tax || 0),
            total: Number(aiResult.totals.total || 0),
          },
          xmlData: text, // Store original text
          category: (aiResult as any).category || 'other',
          metadata: {
            parsingMethod: 'ai', // Use 'ai' as it matches the type
            parsedAt: new Date(),
            fromCache: false,
          },
        };
      }

      // 3. Process items through AI
      const processedItems = await aiParserService.processItemsInBatches(rawItems);

      // 4. Extract metadata (Merchant, Date, Totals)
      const metadata = parser.extractMetadata(text);

      // Calculate total from items as requested by user
      // "Pegar apenas o valor dos itens da NF e somar para ter o valor total"
      const itemsTotal = processedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

      // Use extracted total if available and close to items total (within 10% margin), otherwise use items total
      // This handles cases where items might be missing or parsed incorrectly
      let finalTotal = itemsTotal;
      if (metadata.totalAmount && Math.abs(metadata.totalAmount - itemsTotal) < itemsTotal * 0.1) {
        finalTotal = metadata.totalAmount;
      }

      // Construct Invoice Key
      // Priority: 1. Extracted Access Key, 2. Synthetic Key (CNPJ + Number + Series), 3. Random fallback
      let invoiceKey = metadata.accessKey;
      if (!invoiceKey) {
        if (metadata.merchantCNPJ && metadata.invoiceNumber) {
          // Create a deterministic key for duplicate detection
          invoiceKey = `SYNTH-${metadata.merchantCNPJ}-${metadata.invoiceNumber}-${metadata.series || '0'}`;
        } else {
          invoiceKey = 'PDF_UPLOAD_' + Date.now();
        }
      }

      const finalInvoice: ParsedInvoice = {
        invoiceKey,
        invoiceNumber: metadata.invoiceNumber || '000',
        series: metadata.series || '0',
        issueDate: metadata.issueDate || new Date(),
        merchant: {
          cnpj: metadata.merchantCNPJ || '',
          name: metadata.merchantName || 'Unknown Merchant',
          address: '',
          city: '',
          state: '',
        },
        items: processedItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          discountAmount: 0,
        })),
        totals: {
          subtotal: finalTotal,
          discount: 0,
          tax: 0,
          total: finalTotal,
        },
        xmlData: '', // No XML data
        metadata: {
          parsedAt: new Date(),
          fromCache: false,
          parsingMethod: 'ai', // Treated as AI since we used AI for items
        },
        category: InvoiceCategory.OTHER, // Will be updated
      };

      finalInvoice.category = this.identifyMerchantCategory(finalInvoice.merchant, finalInvoice.items);

      loggerService.endPerformanceTracking(startTime, true);
      return finalInvoice;
    } catch (error) {
      loggerService.endPerformanceTracking(startTime, false, error instanceof Error ? error.message : String(error));
      throw new InvoiceParserError('Failed to parse PDF file', 'PDF_PARSE_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Parse invoice from QR code data
   * Uses NFE Web Crawler with AI Extraction for improved parsing
   * Cached for 24 hours to avoid redundant parsing
   *
   * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1
   */
  async parseFromQRCode(qrData: string, forceRefresh: boolean = false): Promise<ParsedInvoice> {
    try {
      // QR code typically contains the invoice access key or URL
      const invoiceKey = await this.extractInvoiceKeyFromQR(qrData);

      if (!invoiceKey || invoiceKey.length !== INVOICE_KEY_LENGTH) {
        throw new InvoiceParserError(
          'Invalid QR code format - could not extract invoice key',
          'INVOICE_INVALID_FORMAT',
          { qrData },
        );
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cacheKey = getCacheKey.parsedInvoice(invoiceKey);
        const cached = cacheManager.get<ParsedInvoice>(cacheKey);

        if (cached) {
          // Reconstruct Date object from cached data and add metadata
          return {
            ...cached,
            issueDate: new Date(cached.issueDate),
            metadata: {
              parsedAt: cached.metadata?.parsedAt || new Date(),
              fromCache: true,
              parsingMethod: cached.metadata?.parsingMethod || 'ai',
            },
          };
        }
      }

      // Construct URL from invoice key
      const url = webCrawlerService.constructUrlFromKey(invoiceKey);

      // Use parseFromUrl to handle the rest
      return await this.parseFromUrl(url, forceRefresh);
    } catch (error) {
      if (error instanceof InvoiceParserError) {
        throw error;
      }
      throw new InvoiceParserError('Failed to parse invoice from QR code', 'INVOICE_PARSE_ERROR', {
        qrData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate invoice URL or QR code format
   */
  validateInvoiceFormat(data: string): boolean {
    // Check if it's a valid URL
    if (data.startsWith('http')) {
      try {
        const url = new URL(data);
        return GOVERNMENT_PORTAL_URLS.some((portal) => url.hostname.includes(portal.replace('https://', '')));
      } catch {
        return false;
      }
    }

    // Check if it's a valid invoice key (44 digits)
    const keyMatch = data.match(/\d{44}/);
    return keyMatch !== null;
  }

  /**
   * Extract invoice key from URL
   */
  private async extractInvoiceKeyFromUrl(url: string): Promise<string> {
    // Invoice key is typically in the URL as a query parameter or path
    const keyMatch = url.match(/\d{44}/);

    if (keyMatch) {
      return keyMatch[0];
    }

    // If no direct key found, try fetching the page to extract it from HTML
    // This handles encrypted URLs like Santa Catarina's format
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InvoiceParser/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new InvoiceParserError('Could not extract invoice key from URL', 'INVOICE_INVALID_FORMAT', { url });
      }

      const html = await response.text();

      // Try to find the 44-digit key in the HTML content
      // Look for patterns like: <span class="chave">4225 1109 4776 5200 4850 6511 4000 1754 2318 0622 8292</span>
      const chaveMatch = html.match(/class="chave">([0-9\s]+)</);
      if (chaveMatch) {
        // Remove spaces from the key
        const key = chaveMatch[1].replace(/\s/g, '');
        if (key.length === 44) {
          return key;
        }
      }

      // Fallback: try to find any 44-digit sequence
      const htmlKeyMatch = html.match(/\d{44}/);
      if (htmlKeyMatch) {
        return htmlKeyMatch[0];
      }

      throw new InvoiceParserError('Could not extract invoice key from URL', 'INVOICE_INVALID_FORMAT', { url });
    } catch (error) {
      if (error instanceof InvoiceParserError) {
        throw error;
      }
      throw new InvoiceParserError('Could not extract invoice key from URL', 'INVOICE_INVALID_FORMAT', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Extract invoice key from QR code data
   */
  private async extractInvoiceKeyFromQR(qrData: string): Promise<string> {
    // QR code might contain just the key or a URL with the key
    if (qrData.startsWith('http')) {
      return await this.extractInvoiceKeyFromUrl(qrData);
    }

    // Extract 44-digit key from QR data
    const keyMatch = qrData.match(/\d{44}/);
    return keyMatch ? keyMatch[0] : qrData;
  }

  /**
   * Construct government portal URL from invoice key
   */
  private constructUrlFromKey(invoiceKey: string): string {
    // Use Santa Catarina portal as default
    // Format: https://sat.sef.sc.gov.br/nfce/consulta?p=<key>
    return `${GOVERNMENT_PORTAL_URLS[0]}/nfce/consulta?p=${invoiceKey}`;
  }

  /**
   * Fetch XML data from government portal
   */
  private async fetchInvoiceXml(url: string, invoiceKey: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InvoiceParser/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new InvoiceParserError(`Failed to fetch invoice: ${response.statusText}`, 'INVOICE_FETCH_ERROR', {
          status: response.status,
          url,
        });
      }

      const responseData = await response.text();

      if (!responseData || responseData.length === 0) {
        throw new InvoiceParserError('Empty response from government portal', 'INVOICE_FETCH_ERROR', { url });
      }

      // Check if response is XML or HTML
      if (
        responseData.trim().startsWith('<?xml') ||
        responseData.includes('<nfeProc') ||
        responseData.includes('<NFe')
      ) {
        return responseData;
      }

      // If HTML, try to extract XML from it or construct XML URL
      // Some portals embed XML in the page or have a separate XML endpoint
      const xmlUrlMatch = responseData.match(/href=["']([^"']*\.xml[^"']*)["']/i);
      if (xmlUrlMatch) {
        const xmlUrl = new URL(xmlUrlMatch[1], url).href;
        return await this.fetchInvoiceXml(xmlUrl, invoiceKey);
      }

      // Try constructing direct XML URL using the invoice key
      const parsedUrl = new URL(url);
      const xmlUrl = `${parsedUrl.origin}/nfce/xml/${invoiceKey}`;

      // Try common XML endpoint patterns
      const xmlUrls = [
        `${parsedUrl.origin}/nfce/xml/${invoiceKey}`,
        `${parsedUrl.origin}/tax.NET/Sat.DFe.NFCe.Web/Consultas/NFCe_XML.aspx?chNFe=${invoiceKey}`,
        `https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?chNFe=${invoiceKey}&nVersao=100&tpAmb=1`,
      ];

      for (const xmlUrl of xmlUrls) {
        try {
          const xmlResponse = await fetch(xmlUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; InvoiceParser/1.0)',
            },
          });

          if (xmlResponse.ok) {
            const xmlData = await xmlResponse.text();
            if (xmlData.trim().startsWith('<?xml') || xmlData.includes('<nfeProc') || xmlData.includes('<NFe')) {
              return xmlData;
            }
          }
        } catch {
          // Continue to next URL
        }
      }

      // If no XML found, return the HTML - we'll parse it as HTML instead
      return responseData;
    } catch (error) {
      if (error instanceof InvoiceParserError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new InvoiceParserError('Request timeout - government portal did not respond', 'INVOICE_TIMEOUT', { url });
      }

      throw new InvoiceParserError('Network error while fetching invoice', 'INVOICE_NETWORK_ERROR', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Parse HTML and extract invoice data (for portals that don't provide XML)
   */
  private parseHtml(htmlData: string, invoiceKey: string): ParsedInvoice {
    const $ = cheerio.load(htmlData);

    // Extract merchant info from HTML
    const merchantName = $('.txtTopo').first().text().trim() || '';
    const cnpjMatch = htmlData.match(/CNPJ:\s*([\d./-]+)/);
    const cnpj = cnpjMatch ? cnpjMatch[1].replace(/[.\/-]/g, '').slice(0, 20) : '';

    // Extract invoice number and date
    const numeroMatch = htmlData.match(/Número:\s*(\d+)/);
    const invoiceNumber = numeroMatch ? numeroMatch[1] : '';
    const serieMatch = htmlData.match(/Série:\s*(\d+)/);
    const series = serieMatch ? serieMatch[1] : '1';
    const emissaoMatch = htmlData.match(/Emissão:\s*(\d{2}\/\d{2}\/\d{4})/);
    const issueDate = emissaoMatch ? this.parseBrazilianDate(emissaoMatch[1]) : new Date();

    // Extract items from table
    const items: ParsedInvoiceItem[] = [];
    const itemRows = $('table#tabResult tr[id^="Item"]');

    itemRows.each((_: number, row: any) => {
      const descElement = $(row).find('.txtTit');
      const valorElement = $(row).find('.valor');
      const qtdElement = $(row).find('.Rqtd');
      const vlUnitElement = $(row).find('.RvlUnit');

      if (descElement.length && valorElement.length) {
        const description = descElement.text().trim();
        const totalPrice = parseFloat(valorElement.text().replace(',', '.') || '0');
        const qtdText = qtdElement.text() || '';
        const qtdMatch = qtdText.match(/Qtde\.:([0-9,]+)/);
        const quantity = qtdMatch ? parseFloat(qtdMatch[1].replace(',', '.')) : 1;
        const vlUnitText = vlUnitElement.text() || '';
        const vlUnitMatch = vlUnitText.match(/Vl\. Unit\.:.*?([0-9,]+)/);
        const unitPrice = vlUnitMatch ? parseFloat(vlUnitMatch[1].replace(',', '.')) : totalPrice / quantity;

        items.push({
          description,
          quantity,
          unitPrice,
          totalPrice,
          discountAmount: 0,
        });
      }
    });

    // Extract totals
    const totalMatch = htmlData.match(/Valor a pagar R\$:\s*<\/label><span[^>]*>([0-9.,]+)</);
    const total = totalMatch ? parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
    const descontoMatch = htmlData.match(/Descontos R\$:\s*<\/label><span[^>]*>([0-9.,]+)</);
    const discount = descontoMatch ? parseFloat(descontoMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
    const subtotal = total + discount;

    return {
      invoiceKey,
      invoiceNumber,
      series,
      issueDate,
      merchant: {
        cnpj,
        name: merchantName,
        address: '',
        city: '',
        state: '',
      },
      items,
      totals: {
        subtotal,
        discount,
        tax: 0,
        total,
      },
      xmlData: htmlData,
      category: this.identifyMerchantCategory({ cnpj, name: merchantName, address: '', city: '', state: '' }, items),
    };
  }

  /**
   * Helper to parse Brazilian date format (DD/MM/YYYY)
   */
  private parseBrazilianDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Parse XML and extract invoice data
   */
  private parseXml(xmlData: string, invoiceKey: string): ParsedInvoice {
    try {
      // Check if data is HTML instead of XML
      if (xmlData.includes('<!DOCTYPE html') || xmlData.includes('<html')) {
        return this.parseHtml(xmlData, invoiceKey);
      }

      // Parse XML using fast-xml-parser
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      });
      const xmlDoc = parser.parse(xmlData);

      // Extract invoice information
      // Adjust path based on XML structure (nfeProc > NFe > infNFe or just NFe > infNFe)
      const nfeProc = xmlDoc.nfeProc;
      const NFe = nfeProc ? nfeProc.NFe : xmlDoc.NFe;
      const infNFe = NFe ? NFe.infNFe : null;

      if (!infNFe) {
        throw new InvoiceParserError('Invalid XML structure', 'INVOICE_PARSE_ERROR');
      }

      const ide = infNFe.ide;
      const invoiceNumber = String(ide?.nNF || '');
      const series = String(ide?.serie || '1');
      const issueDateStr = ide?.dhEmi || ide?.dEmi || '';
      const issueDate = issueDateStr ? new Date(issueDateStr) : new Date();

      // Extract merchant information
      const emit = infNFe.emit;
      const merchant: MerchantInfo = {
        cnpj: String(emit?.CNPJ || '').slice(0, 20),
        name: String(emit?.xNome || ''),
        tradeName: emit?.xFant ? String(emit?.xFant) : undefined,
        address: String(emit?.enderEmit?.xLgr || ''),
        city: String(emit?.enderEmit?.xMun || ''),
        state: String(emit?.enderEmit?.UF || ''),
      };

      // Extract line items
      const items: ParsedInvoiceItem[] = [];
      const dets = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

      dets.forEach((det: any) => {
        if (!det) return;
        const prod = det.prod;

        items.push({
          description: prod.xProd || '',
          productCode: prod.cEAN || prod.cEANTrib ? String(prod.cEAN || prod.cEANTrib) : undefined,
          ncmCode: prod.NCM ? String(prod.NCM) : undefined,
          quantity: parseFloat(prod.qCom || '1'),
          unitPrice: parseFloat(prod.vUnCom || '0'),
          totalPrice: parseFloat(prod.vProd || '0'),
          discountAmount: parseFloat(prod.vDesc || '0'),
        });
      });

      // Calculate totals
      const totalNode = infNFe.total;
      const icmsTot = totalNode?.ICMSTot;

      const totals: InvoiceTotals = {
        subtotal: parseFloat(icmsTot?.vProd || '0'),
        discount: parseFloat(icmsTot?.vDesc || '0'),
        tax: parseFloat(icmsTot?.vTotTrib || '0'),
        total: parseFloat(icmsTot?.vNF || '0'),
      };

      // Fallback: calculate from items if not in XML
      if (totals.total === 0 && items.length > 0) {
        totals.subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        totals.discount = items.reduce((sum, item) => sum + item.discountAmount, 0);
        totals.total = totals.subtotal - totals.discount;
      }

      // Detect category
      const category = this.identifyMerchantCategory(merchant, items);

      return {
        invoiceKey,
        invoiceNumber,
        series,
        issueDate,
        merchant,
        items,
        totals,
        xmlData,
        category,
      };
    } catch (error) {
      if (error instanceof InvoiceParserError) {
        throw error;
      }
      throw new InvoiceParserError('Failed to parse XML data', 'INVOICE_PARSE_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Extract merchant information from XML
   */
  private extractMerchantInfo(xmlDoc: Document): MerchantInfo {
    const emitNode = xmlDoc.querySelector('emit');

    if (!emitNode) {
      throw new InvoiceParserError('Merchant information not found in XML', 'INVOICE_PARSE_ERROR');
    }

    const cnpj = String(this.getXmlValue(xmlDoc, 'CNPJ', emitNode) || '').slice(0, 20);
    const name = String(this.getXmlValue(xmlDoc, 'xNome', emitNode) || '');
    const tradeName = this.getXmlValue(xmlDoc, 'xFant', emitNode);
    const tradeNameStr = tradeName ? String(tradeName) : undefined;

    const enderNode = emitNode.querySelector('enderEmit');
    const address = enderNode ? String(this.getXmlValue(xmlDoc, 'xLgr', enderNode) || '') : '';
    const city = enderNode ? String(this.getXmlValue(xmlDoc, 'xMun', enderNode) || '') : '';
    const state = enderNode ? String(this.getXmlValue(xmlDoc, 'UF', enderNode) || '') : '';

    return {
      cnpj,
      name,
      tradeName: tradeNameStr,
      address,
      city,
      state,
    };
  }

  /**
   * Extract products from XML
   */
  extractProducts(xmlDoc: any): ParsedInvoiceItem[] {
    // This method was designed for DOMParser.
    // If we switch to fast-xml-parser, we should update this to accept the parsed object or string.
    // For now, I'll implement it to parse string using fast-xml-parser if passed string.
    if (typeof xmlDoc === 'string') {
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
      const doc = parser.parse(xmlDoc);
      const infNFe = doc.nfeProc?.NFe?.infNFe || doc.NFe?.infNFe;
      if (!infNFe) return [];

      const items: ParsedInvoiceItem[] = [];
      const dets = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

      dets.forEach((det: any) => {
        if (!det) return;
        const prod = det.prod;
        items.push({
          description: prod.xProd || '',
          productCode: prod.cEAN || prod.cEANTrib ? String(prod.cEAN || prod.cEANTrib) : undefined,
          ncmCode: prod.NCM ? String(prod.NCM) : undefined,
          quantity: parseFloat(prod.qCom || '1'),
          unitPrice: parseFloat(prod.vUnCom || '0'),
          totalPrice: parseFloat(prod.vProd || '0'),
          discountAmount: parseFloat(prod.vDesc || '0'),
        });
      });
      return items;
    }
    return [];
  }

  /**
   * Calculate invoice totals
   */
  private calculateTotals(xmlDoc: Document, items: ParsedInvoiceItem[]): InvoiceTotals {
    const totalNode = xmlDoc.querySelector('total');

    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let total = 0;

    if (totalNode) {
      const icmsTotNode = totalNode.querySelector('ICMSTot');

      if (icmsTotNode) {
        subtotal = parseFloat(this.getXmlValue(xmlDoc, 'vProd', icmsTotNode) || '0');
        discount = parseFloat(this.getXmlValue(xmlDoc, 'vDesc', icmsTotNode) || '0');
        tax = parseFloat(this.getXmlValue(xmlDoc, 'vTotTrib', icmsTotNode) || '0');
        total = parseFloat(this.getXmlValue(xmlDoc, 'vNF', icmsTotNode) || '0');
      }
    }

    // Fallback: calculate from items if not in XML
    if (total === 0 && items.length > 0) {
      subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      discount = items.reduce((sum, item) => sum + item.discountAmount, 0);
      total = subtotal - discount;
    }

    return {
      subtotal,
      discount,
      tax,
      total,
    };
  }

  /**
   * Identify merchant category based on name and products
   */
  identifyMerchantCategory(merchantData: MerchantInfo, items?: ParsedInvoiceItem[]): InvoiceCategory {
    const merchantName = (merchantData.name || '').toLowerCase();
    const tradeName = (merchantData.tradeName || '').toLowerCase();
    const fullName = `${merchantName} ${tradeName}`;

    // Check merchant name keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (category === InvoiceCategory.OTHER) continue;

      for (const keyword of keywords) {
        if (fullName.includes(keyword)) {
          return category as InvoiceCategory;
        }
      }
    }

    // Check NCM codes from products
    if (items && items.length > 0) {
      const ncmCodes = items.map((item) => item.ncmCode).filter((code): code is string => !!code);

      for (const ncmCode of ncmCodes) {
        const prefix = ncmCode.substring(0, 2);
        if (NCM_CATEGORY_MAP[prefix]) {
          return NCM_CATEGORY_MAP[prefix];
        }
      }
    }

    // Default to OTHER if no match
    return InvoiceCategory.OTHER;
  }

  /**
   * Helper to get XML value
   */
  private getXmlValue(xmlDoc: Document, tagName: string, parentNode?: Element | null): string | null {
    const node = parentNode ? parentNode.querySelector(tagName) : xmlDoc.querySelector(tagName);

    return node?.textContent || null;
  }
  /**
   * Map AI response to ParsedInvoice format
   * Requirement 3.3, 3.4, 3.5, 3.6
   */
  private mapAIResponseToParsedInvoice(aiResponse: any, invoiceKey: string, html: string): ParsedInvoice {
    // Convert ISO date string to Date object
    const issueDate = new Date(aiResponse.invoice.issueDate);

    // Map to ParsedInvoice format
    const parsed: ParsedInvoice = {
      invoiceKey,
      invoiceNumber: String(aiResponse.invoice.number),
      series: String(aiResponse.invoice.series),
      issueDate,
      merchant: {
        cnpj: String(aiResponse.merchant.cnpj || '').slice(0, 20),
        name: String(aiResponse.merchant.name || ''),
        tradeName: aiResponse.merchant.tradeName ? String(aiResponse.merchant.tradeName) : undefined,
        address: String(aiResponse.merchant.address || ''),
        city: String(aiResponse.merchant.city || ''),
        state: String(aiResponse.merchant.state || ''),
      },
      items: aiResponse.items.map((item: any) => ({
        description: item.description,
        productCode: item.productCode ? String(item.productCode) : undefined,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        totalPrice: Number(item.totalPrice || 0),
        discountAmount: Number(item.discountAmount || 0),
      })),
      totals: {
        subtotal: Number(aiResponse.totals.subtotal || 0),
        discount: Number(aiResponse.totals.discount || 0),
        tax: Number(aiResponse.totals.tax || 0),
        total: Number(aiResponse.totals.total || 0),
      },
      xmlData: html, // Store original HTML for reference
      metadata: {
        parsedAt: new Date(),
        fromCache: false,
        parsingMethod: 'ai',
      },
    };

    // Detect category
    parsed.category = this.identifyMerchantCategory(parsed.merchant, parsed.items);

    return parsed;
  }

  /**
   * Wrap NFE crawler errors into legacy InvoiceParserError format
   * Includes comprehensive error details and logging
   * Requirement 6.1, 6.2, 6.3, 6.4, 6.5
   */
  private wrapNFEError(
    error: NFEInvoiceParserError,
    url: string,
    invoiceKey: string | null,
    step: 'key_extraction' | 'html_fetch' | 'ai_parse' | 'validation',
  ): InvoiceParserError {
    // Map NFE error codes to legacy codes
    let legacyCode: string;

    if (error instanceof InvoiceKeyNotFoundError) {
      legacyCode = 'INVOICE_KEY_NOT_FOUND';
    } else if (error instanceof HTMLFetchError) {
      legacyCode = 'INVOICE_FETCH_ERROR';
    } else if (error instanceof AIParseError) {
      legacyCode = 'INVOICE_PARSE_ERROR';
    } else if (error instanceof ValidationError) {
      legacyCode = 'VALIDATION_ERROR';
    } else if (error instanceof NetworkError) {
      legacyCode = 'INVOICE_NETWORK_ERROR';
    } else if (error instanceof TimeoutError) {
      legacyCode = 'INVOICE_TIMEOUT';
    } else {
      legacyCode = 'INVOICE_PARSE_ERROR';
    }

    // Build comprehensive error details
    const errorDetails = {
      url,
      invoiceKey,
      step,
      errorType: error.name,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
      ...error.details,
    };

    // Log error with full context (without exposing sensitive data)
    this.logError(error, errorDetails);

    // Return wrapped error (sanitized for client)
    return new InvoiceParserError(error.message, legacyCode, {
      url,
      invoiceKey,
      step,
      // Only include safe details in client response
      validationErrors: error.details?.validationErrors,
      statusCode: error.details?.statusCode,
      reason: error.details?.reason,
    });
  }

  /**
   * Log error with full context for debugging
   * Does not expose sensitive information (API keys, internal paths)
   * Requirement 6.4, 6.5
   */
  private logError(error: NFEInvoiceParserError, details: Record<string, any>): void {
    // In production, this would use a proper logging service
    // For now, use console.error with structured logging
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'invoice-parser',
      errorType: error.name,
      errorCode: error.code,
      message: error.message,
      details: {
        ...details,
        // Sanitize sensitive data
        url: details.url ? this.sanitizeUrl(details.url) : undefined,
      },
      stack: error.stack,
    };

    console.error('[InvoiceParser]', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Sanitize URL to remove sensitive query parameters
   * Requirement 6.5
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Keep only the origin and pathname, remove query params that might contain sensitive data
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      // If URL parsing fails, return a generic placeholder
      return '[URL]';
    }
  }
}

// Export singleton instance
export const invoiceParserService = new InvoiceParserService();
