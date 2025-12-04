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
