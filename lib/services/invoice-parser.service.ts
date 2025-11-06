/**
 * Invoice Parser Service
 *
 * Handles parsing of Brazilian fiscal invoices (NFe/NFCe) from URLs and QR codes.
 * Extracts merchant information, line items, and product details from XML data.
 */
import { cacheManager, getCacheKey } from '@/lib/utils/cache';

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
  [InvoiceCategory.RETAIL]: ['loja', 'magazine', 'varejo', 'comercio', 'comércio'],
  [InvoiceCategory.SERVICES]: ['servico', 'serviço', 'manutencao', 'manutenção', 'conserto', 'reparo'],
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
   * Cached for 1 hour to avoid redundant parsing
   */
  async parseFromUrl(url: string): Promise<ParsedInvoice> {
    // Validate URL format
    if (!this.validateInvoiceFormat(url)) {
      throw new InvoiceParserError('Invalid invoice URL format', 'INVOICE_INVALID_FORMAT', { url });
    }

    try {
      // Extract invoice key from URL
      const invoiceKey = await this.extractInvoiceKeyFromUrl(url);

      // Check cache first (1 hour TTL)
      const cacheKey = getCacheKey.parsedInvoice(invoiceKey);
      const cached = cacheManager.get<ParsedInvoice>(cacheKey);

      if (cached) {
        // Reconstruct Date object from cached data
        return {
          ...cached,
          issueDate: new Date(cached.issueDate),
        };
      }

      // Fetch XML from government portal
      const xmlData = await this.fetchInvoiceXml(url, invoiceKey);

      // Parse XML and extract data
      const parsed = this.parseXml(xmlData, invoiceKey);

      // Cache for 1 hour (3600000 ms)
      cacheManager.set(cacheKey, parsed, 3600000);

      return parsed;
    } catch (error) {
      if (error instanceof InvoiceParserError) {
        throw error;
      }
      throw new InvoiceParserError('Failed to parse invoice from URL', 'INVOICE_PARSE_ERROR', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Parse invoice from QR code data
   * Cached for 1 hour to avoid redundant parsing
   */
  async parseFromQRCode(qrData: string): Promise<ParsedInvoice> {
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

      // Check cache first (1 hour TTL)
      const cacheKey = getCacheKey.parsedInvoice(invoiceKey);
      const cached = cacheManager.get<ParsedInvoice>(cacheKey);

      if (cached) {
        // Reconstruct Date object from cached data
        return {
          ...cached,
          issueDate: new Date(cached.issueDate),
        };
      }

      // Construct URL from invoice key
      const url = this.constructUrlFromKey(invoiceKey);

      // Fetch and parse XML
      const xmlData = await this.fetchInvoiceXml(url, invoiceKey);
      const parsed = this.parseXml(xmlData, invoiceKey);

      // Cache for 1 hour (3600000 ms)
      cacheManager.set(cacheKey, parsed, 3600000);

      return parsed;
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
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(htmlData, 'text/html');

    // Extract merchant info from HTML
    const merchantName = htmlDoc.querySelector('.txtTopo')?.textContent?.trim() || '';
    const cnpjMatch = htmlData.match(/CNPJ:\s*([\d./-]+)/);
    const cnpj = cnpjMatch ? cnpjMatch[1].replace(/[.\/-]/g, '') : '';

    // Extract invoice number and date
    const numeroMatch = htmlData.match(/Número:\s*(\d+)/);
    const invoiceNumber = numeroMatch ? numeroMatch[1] : '';
    const serieMatch = htmlData.match(/Série:\s*(\d+)/);
    const series = serieMatch ? serieMatch[1] : '1';
    const emissaoMatch = htmlData.match(/Emissão:\s*(\d{2}\/\d{2}\/\d{4})/);
    const issueDate = emissaoMatch ? this.parseBrazilianDate(emissaoMatch[1]) : new Date();

    // Extract items from table
    const items: ParsedInvoiceItem[] = [];
    const itemRows = htmlDoc.querySelectorAll('table#tabResult tr[id^="Item"]');

    itemRows.forEach((row) => {
      const descElement = row.querySelector('.txtTit');
      const valorElement = row.querySelector('.valor');
      const qtdElement = row.querySelector('.Rqtd');
      const vlUnitElement = row.querySelector('.RvlUnit');

      if (descElement && valorElement) {
        const description = descElement.textContent?.trim() || '';
        const totalPrice = parseFloat(valorElement.textContent?.replace(',', '.') || '0');
        const qtdText = qtdElement?.textContent || '';
        const qtdMatch = qtdText.match(/Qtde\.:([0-9,]+)/);
        const quantity = qtdMatch ? parseFloat(qtdMatch[1].replace(',', '.')) : 1;
        const vlUnitText = vlUnitElement?.textContent || '';
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

      // Parse XML using DOMParser (browser) or xml2js (Node.js)
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new InvoiceParserError('Invalid XML format', 'INVOICE_PARSE_ERROR', { error: parserError.textContent });
      }

      // Extract invoice information
      const invoiceNumber = this.getXmlValue(xmlDoc, 'nNF') || '';
      const series = this.getXmlValue(xmlDoc, 'serie') || '1';
      const issueDateStr = this.getXmlValue(xmlDoc, 'dhEmi') || this.getXmlValue(xmlDoc, 'dEmi') || '';
      const issueDate = issueDateStr ? new Date(issueDateStr) : new Date();

      // Extract merchant information
      const merchant = this.extractMerchantInfo(xmlDoc);

      // Extract line items
      const items = this.extractProducts(xmlDoc);

      // Calculate totals
      const totals = this.calculateTotals(xmlDoc, items);

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

    const cnpj = this.getXmlValue(xmlDoc, 'CNPJ', emitNode) || '';
    const name = this.getXmlValue(xmlDoc, 'xNome', emitNode) || '';
    const tradeName = this.getXmlValue(xmlDoc, 'xFant', emitNode) || undefined;

    const enderNode = emitNode.querySelector('enderEmit');
    const address = enderNode ? this.getXmlValue(xmlDoc, 'xLgr', enderNode) || '' : '';
    const city = enderNode ? this.getXmlValue(xmlDoc, 'xMun', enderNode) || '' : '';
    const state = enderNode ? this.getXmlValue(xmlDoc, 'UF', enderNode) || '' : '';

    return {
      cnpj,
      name,
      tradeName,
      address,
      city,
      state,
    };
  }

  /**
   * Extract products from XML
   */
  extractProducts(xmlDoc: Document | string): ParsedInvoiceItem[] {
    // Handle string input (for testing)
    let doc: Document;
    if (typeof xmlDoc === 'string') {
      const parser = new DOMParser();
      doc = parser.parseFromString(xmlDoc, 'text/xml');
    } else {
      doc = xmlDoc;
    }

    const items: ParsedInvoiceItem[] = [];
    const detNodes = doc.querySelectorAll('det');

    detNodes.forEach((detNode, index) => {
      const prodNode = detNode.querySelector('prod');

      if (!prodNode) return;

      const description = this.getXmlValue(doc, 'xProd', prodNode) || '';
      const productCode =
        this.getXmlValue(doc, 'cEAN', prodNode) || this.getXmlValue(doc, 'cEANTrib', prodNode) || undefined;
      const ncmCode = this.getXmlValue(doc, 'NCM', prodNode) || undefined;
      const quantity = parseFloat(this.getXmlValue(doc, 'qCom', prodNode) || '1');
      const unitPrice = parseFloat(this.getXmlValue(doc, 'vUnCom', prodNode) || '0');
      const totalPrice = parseFloat(this.getXmlValue(doc, 'vProd', prodNode) || '0');
      const discountAmount = parseFloat(this.getXmlValue(doc, 'vDesc', prodNode) || '0');

      items.push({
        description,
        productCode,
        ncmCode,
        quantity,
        unitPrice,
        totalPrice,
        discountAmount,
      });
    });

    return items;
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
}

// Export singleton instance
export const invoiceParserService = new InvoiceParserService();
