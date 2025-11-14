/**
 * Invoice Service
 *
 * Handles invoice CRUD operations, duplicate detection, and storage of parsed invoice data.
 * Manages invoice items, product catalog, and price history.
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import {
  COLLECTIONS,
  DATABASE_ID,
  Invoice,
  InvoiceData,
  InvoiceItem,
  PriceHistory,
  Product,
} from '@/lib/appwrite/schema';
import { invalidateCache } from '@/lib/utils/cache';
import { ID, Query } from 'node-appwrite';

import { InvoiceParserError, ParsedInvoice } from './invoice-parser.service';
import { ProductToCategorize, getProductCategorizationService } from './product-categorization.service';
import { NormalizedProduct, productNormalizationService } from './product-normalization.service';

// ============================================
// Types and Interfaces
// ============================================

export interface CreateInvoiceData {
  userId: string;
  parsedInvoice: ParsedInvoice;
  customCategory?: string;
  transactionId?: string;
  accountId?: string;
}

export interface InvoiceFilter {
  userId: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  merchant?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

// ============================================
// Error Classes
// ============================================

export class InvoiceServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'InvoiceServiceError';
  }
}

// ============================================
// Invoice Service
// ============================================

export class InvoiceService {
  private dbAdapter: any;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  // ============================================
  // Invoice CRUD Operations
  // ============================================

  /**
   * Get all invoices with sharing information
   * Returns invoices with ownership metadata (ownerId, ownerName, isOwn)
   * This method uses DataAccessService to fetch both own and shared invoices
   */
  async getInvoicesWithSharing(userId: string, filters?: InvoiceFilter) {
    try {
      const { DataAccessService } = await import('./data-access.service');
      const dataAccessService = new DataAccessService();

      // Build filters for DataAccessService
      const dataAccessFilters = filters
        ? {
            category: filters.category as any,
            merchant: filters.merchant,
            startDate: filters.startDate,
            endDate: filters.endDate,
            minAmount: filters.minAmount,
            maxAmount: filters.maxAmount,
            search: filters.search,
          }
        : undefined;

      return await dataAccessService.getAccessibleInvoices(userId, dataAccessFilters);
    } catch (error: any) {
      throw new InvoiceServiceError('Failed to fetch invoices with sharing', 'INVOICE_FETCH_ERROR', {
        error: error.message,
      });
    }
  }

  /**
   * Create a new invoice from parsed data
   * Includes duplicate detection and batch creation of invoice items
   * Always assigns invoice to the current user (data.userId)
   */
  async createInvoice(data: CreateInvoiceData): Promise<InvoiceWithItems> {
    try {
      const { userId, parsedInvoice, customCategory, transactionId, accountId } = data;

      // Ensure invoice is always assigned to the current user
      // This prevents creating invoices for other users, even in shared relationships

      // Check for duplicate invoice using invoice key
      const duplicate = await this.checkDuplicate(userId, parsedInvoice.invoiceKey);
      if (duplicate) {
        throw new InvoiceServiceError(
          `Invoice already exists (registered on ${new Date(duplicate.created_at).toLocaleDateString()})`,
          'INVOICE_DUPLICATE',
          { existingInvoiceId: duplicate.$id, invoiceKey: parsedInvoice.invoiceKey },
        );
      }

      const now = new Date().toISOString();
      const invoiceId = ID.unique();

      // Create invoice document with individual columns
      const invoicePayload = {
        user_id: userId,
        invoice_key: parsedInvoice.invoiceKey,
        invoice_number: parsedInvoice.invoiceNumber,
        issue_date: parsedInvoice.issueDate.toISOString(),
        merchant_cnpj: parsedInvoice.merchant.cnpj,
        merchant_name: parsedInvoice.merchant.name,
        total_amount: parsedInvoice.totals.total,
        category: customCategory || parsedInvoice.category || 'other',
        series: parsedInvoice.series,
        merchant_address: `${parsedInvoice.merchant.address}, ${parsedInvoice.merchant.city} - ${parsedInvoice.merchant.state}`,
        discount_amount: parsedInvoice.totals.discount,
        tax_amount: parsedInvoice.totals.tax,
        custom_category: customCategory,
        transaction_id: transactionId,
        account_id: accountId,
        created_at: now,
        updated_at: now,
      };

      const invoiceDoc = await this.dbAdapter.createDocument(
        DATABASE_ID,
        COLLECTIONS.INVOICES,
        invoiceId,
        invoicePayload,
      );

      // Process invoice items in batch
      const items = await this.createInvoiceItems(userId, invoiceId, parsedInvoice);

      // Update product catalog and price history for each item
      await this.updateProductCatalog(userId, invoiceId, parsedInvoice, items);

      // Invalidate related caches
      invalidateCache.invoices(userId);

      return {
        ...this.formatInvoice(invoiceDoc),
        items,
      };
    } catch (error) {
      if (error instanceof InvoiceServiceError || error instanceof InvoiceParserError) {
        throw error;
      }
      throw new InvoiceServiceError('Failed to create invoice', 'INVOICE_CREATE_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get invoice by ID with all line items
   */
  async getInvoiceById(invoiceId: string, userId: string): Promise<InvoiceWithItems> {
    try {
      const invoiceDoc = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.INVOICES, invoiceId);

      // Verify ownership
      if (invoiceDoc.user_id !== userId) {
        throw new InvoiceServiceError('Invoice not found', 'INVOICE_NOT_FOUND', { invoiceId });
      }

      // Get invoice items (sem limite para pegar todos os itens)
      const itemsResult = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.INVOICE_ITEMS, [
        Query.equal('invoice_id', invoiceId),
        Query.orderAsc('line_number'),
        Query.limit(1000), // Limite alto para garantir que todos os itens sejam retornados
      ]);

      const items = itemsResult.documents.map((doc: any) => this.formatInvoiceItem(doc));

      return {
        ...this.formatInvoice(invoiceDoc),
        items,
      };
    } catch (error: any) {
      if (error instanceof InvoiceServiceError) {
        throw error;
      }
      if (error.code === 404) {
        throw new InvoiceServiceError('Invoice not found', 'INVOICE_NOT_FOUND', { invoiceId });
      }
      throw new InvoiceServiceError('Failed to fetch invoice', 'INVOICE_FETCH_ERROR', {
        invoiceId,
        error: error.message,
      });
    }
  }

  /**
   * List invoices with filtering and pagination
   * Optimized with compound indexes for common query patterns
   */
  async listInvoices(filters: InvoiceFilter): Promise<{
    invoices: Invoice[];
    total: number;
  }> {
    try {
      const queries: any[] = [];

      // User filter (required) - uses compound indexes for better performance
      queries.push(Query.equal('user_id', filters.userId));

      // Date range filters
      if (filters.startDate) {
        queries.push(Query.greaterThanEqual('issue_date', filters.startDate));
      }
      if (filters.endDate) {
        queries.push(Query.lessThanEqual('issue_date', filters.endDate));
      }

      // Category filter
      if (filters.category) {
        queries.push(Query.equal('category', filters.category));
      }

      // Merchant filter
      if (filters.merchant) {
        queries.push(Query.search('merchant_name', filters.merchant));
      }

      // Amount range filters
      if (filters.minAmount !== undefined) {
        queries.push(Query.greaterThanEqual('total_amount', filters.minAmount));
      }
      if (filters.maxAmount !== undefined) {
        queries.push(Query.lessThanEqual('total_amount', filters.maxAmount));
      }

      // Search filter (searches invoice number and merchant name)
      if (filters.search) {
        // Note: Appwrite search is limited, may need to search multiple fields separately
        queries.push(Query.search('merchant_name', filters.search));
      }

      // Pagination
      const limit = filters.limit || 25;
      const offset = filters.offset || 0;
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));

      // Sort by issue date descending
      queries.push(Query.orderDesc('issue_date'));

      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, queries);

      const invoices = response.documents.map((doc: any) => this.formatInvoice(doc));

      return {
        invoices,
        total: response.total || 0,
      };
    } catch (error: any) {
      throw new InvoiceServiceError('Failed to list invoices', 'INVOICE_LIST_ERROR', {
        error: error.message,
      });
    }
  }

  /**
   * Update invoice (limited fields)
   */
  async updateInvoice(
    invoiceId: string,
    userId: string,
    updates: {
      category?: string;
      customCategory?: string;
      transactionId?: string;
      accountId?: string;
    },
  ): Promise<Invoice> {
    try {
      // Verify ownership
      const existing = await this.getInvoiceById(invoiceId, userId);

      const now = new Date().toISOString();
      const updatePayload: any = {
        updated_at: now,
      };

      // Update category if provided
      if (updates.category) {
        updatePayload.category = updates.category;
      }

      // Update individual columns if needed
      if (updates.customCategory !== undefined) {
        updatePayload.custom_category = updates.customCategory;
      }
      if (updates.transactionId !== undefined) {
        updatePayload.transaction_id = updates.transactionId;
      }
      if (updates.accountId !== undefined) {
        updatePayload.account_id = updates.accountId;
      }

      const invoiceDoc = await this.dbAdapter.updateDocument(
        DATABASE_ID,
        COLLECTIONS.INVOICES,
        invoiceId,
        updatePayload,
      );

      // Invalidate related caches
      invalidateCache.invoice(invoiceId, userId);

      return this.formatInvoice(invoiceDoc);
    } catch (error: any) {
      if (error instanceof InvoiceServiceError) {
        throw error;
      }
      throw new InvoiceServiceError('Failed to update invoice', 'INVOICE_UPDATE_ERROR', {
        invoiceId,
        error: error.message,
      });
    }
  }

  /**
   * Delete invoice and cascade to invoice items
   * Validates that the invoice belongs to the user before allowing deletion
   * Prevents deletion of shared invoices
   */
  async deleteInvoice(invoiceId: string, userId: string): Promise<void> {
    try {
      // Verify ownership and get invoice with items
      const invoice = await this.getInvoiceById(invoiceId, userId);

      // Additional validation: ensure the invoice belongs to the user
      if (invoice.user_id !== userId) {
        throw new InvoiceServiceError(
          'You cannot delete invoices that belong to another user',
          'INVOICE_PERMISSION_DENIED',
          { invoiceId },
        );
      }

      // Delete all invoice items
      for (const item of invoice.items) {
        await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.INVOICE_ITEMS, item.$id);
      }

      // Delete invoice
      await this.dbAdapter.deleteDocument(DATABASE_ID, COLLECTIONS.INVOICES, invoiceId);

      // Update product statistics (decrement purchase counts, recalculate averages)
      await this.updateProductStatsAfterDeletion(userId, invoice.items);

      // Invalidate related caches
      invalidateCache.invoices(userId);
    } catch (error: any) {
      if (error instanceof InvoiceServiceError) {
        throw error;
      }
      throw new InvoiceServiceError('Failed to delete invoice', 'INVOICE_DELETE_ERROR', {
        invoiceId,
        error: error.message,
      });
    }
  }

  // ============================================
  // Duplicate Detection
  // ============================================

  /**
   * Check if invoice already exists using invoice access key
   */
  async checkDuplicate(userId: string, invoiceKey: string): Promise<Invoice | null> {
    try {
      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, [
        Query.equal('user_id', userId),
        Query.equal('invoice_key', invoiceKey),
        Query.limit(1),
      ]);

      if (result.documents && result.documents.length > 0) {
        return this.formatInvoice(result.documents[0]);
      }

      return null;
    } catch (error: any) {
      // If error is not found, return null
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  // ============================================
  // Invoice Items Management
  // ============================================

  /**
   * Create invoice items in batch
   */
  private async createInvoiceItems(
    userId: string,
    invoiceId: string,
    parsedInvoice: ParsedInvoice,
  ): Promise<InvoiceItem[]> {
    const items: InvoiceItem[] = [];
    const now = new Date().toISOString();

    // Normalize products first to find or create product IDs
    const normalizedProducts = parsedInvoice.items.map((item) =>
      productNormalizationService.normalizeProduct(item.description, item.productCode, item.ncmCode),
    );

    // Categorizar produtos com IA antes de criar
    const categorizationService = getProductCategorizationService();
    const productsToCategor: ProductToCategorize[] = parsedInvoice.items.map((item) => ({
      description: item.description,
      product_code: item.productCode,
      ncm_code: item.ncmCode,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    let categorizedProducts;
    try {
      categorizedProducts = await categorizationService.categorizeProducts(productsToCategor);
    } catch (error) {
      console.error('Erro ao categorizar produtos, usando fallback:', error);
      // Fallback: usar categoria da nota fiscal
      categorizedProducts = productsToCategor.map((p) => ({
        description: p.description,
        category: parsedInvoice.category || 'outros',
        unit_type: 'un',
        unit_quantity: undefined,
        price_per_kg: undefined,
      }));
    }

    // Find or create products and get their IDs
    const productIds = await this.findOrCreateProducts(
      userId,
      normalizedProducts,
      categorizedProducts,
      parsedInvoice.category || 'other',
    );

    // Create invoice items
    for (let i = 0; i < parsedInvoice.items.length; i++) {
      const item = parsedInvoice.items[i];
      const productId = productIds[i];

      const itemPayload = {
        invoice_id: invoiceId,
        user_id: userId,
        product_id: productId,
        product_code: item.productCode,
        ncm_code: item.ncmCode,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        discount_amount: item.discountAmount || 0,
        line_number: i + 1,
        created_at: now,
      };

      const itemDoc = await this.dbAdapter.createDocument(
        DATABASE_ID,
        COLLECTIONS.INVOICE_ITEMS,
        ID.unique(),
        itemPayload,
      );

      items.push(this.formatInvoiceItem(itemDoc));
    }

    return items;
  }

  /**
   * Find or create products for invoice items
   */
  private async findOrCreateProducts(
    userId: string,
    normalizedProducts: NormalizedProduct[],
    categorizedProducts: any[],
    fallbackCategory: string,
  ): Promise<string[]> {
    const productIds: string[] = [];

    for (let i = 0; i < normalizedProducts.length; i++) {
      const normalizedProduct = normalizedProducts[i];
      const categorized = categorizedProducts[i];

      // Try to find existing product
      const existingProduct = await this.findExistingProduct(userId, normalizedProduct);

      if (existingProduct) {
        // Atualizar categoria se o produto já existe mas não tem categoria definida
        if (existingProduct.category === 'other' || existingProduct.category === 'outros') {
          try {
            await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, existingProduct.$id, {
              category: categorized.category,
              subcategory: categorized.subcategory || null,
              updated_at: new Date().toISOString(),
            });
          } catch (error) {
            console.error(`Erro ao atualizar categoria do produto ${existingProduct.$id}:`, error);
          }
        }
        productIds.push(existingProduct.$id);
      } else {
        // Create new product with categorization
        const newProduct = await this.createProduct(
          userId,
          normalizedProduct,
          categorized.category || fallbackCategory,
          categorized.subcategory,
        );
        productIds.push(newProduct.$id);
      }
    }

    return productIds;
  }

  /**
   * Find existing product by code or name
   */
  private async findExistingProduct(userId: string, normalizedProduct: NormalizedProduct): Promise<Product | null> {
    try {
      const queries: any[] = [Query.equal('user_id', userId)];

      // Try to find by product code first (most reliable)
      if (normalizedProduct.productCode) {
        queries.push(Query.equal('product_code', normalizedProduct.productCode));

        const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, queries);

        if (result.documents && result.documents.length > 0) {
          return this.formatProduct(result.documents[0]);
        }
      }

      // Try to find by normalized name
      const nameQueries = [
        Query.equal('user_id', userId),
        Query.equal('name', normalizedProduct.normalizedName),
        Query.limit(10),
      ];

      const nameResult = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, nameQueries);

      if (nameResult.documents && nameResult.documents.length > 0) {
        // Use product normalization service to find best match
        const existingProducts = nameResult.documents.map((doc: any) => ({
          id: doc.$id,
          normalizedName: doc.name,
          originalName: doc.name,
          productCode: doc.product_code,
          ncmCode: doc.ncm_code,
        }));

        const matchResult = productNormalizationService.findMatchingProduct(normalizedProduct, existingProducts);

        if (matchResult.isMatch && matchResult.matchedProductId) {
          return this.formatProduct(nameResult.documents.find((doc: any) => doc.$id === matchResult.matchedProductId));
        }
      }

      return null;
    } catch (error: any) {
      // If error, assume product doesn't exist
      return null;
    }
  }

  /**
   * Create new product
   */
  private async createProduct(
    userId: string,
    normalizedProduct: NormalizedProduct,
    category: string,
    subcategory?: string,
  ): Promise<Product> {
    const now = new Date().toISOString();

    const productPayload = {
      user_id: userId,
      name: normalizedProduct.normalizedName,
      product_code: normalizedProduct.productCode,
      ncm_code: normalizedProduct.ncmCode,
      category: category,
      subcategory: subcategory || null,
      total_purchases: 0,
      average_price: 0,
      created_at: now,
      updated_at: now,
    };

    const productDoc = await this.dbAdapter.createDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      ID.unique(),
      productPayload,
    );

    return this.formatProduct(productDoc);
  }

  // ============================================
  // Product Catalog Management
  // ============================================

  /**
   * Update product catalog after invoice creation
   */
  private async updateProductCatalog(
    userId: string,
    invoiceId: string,
    parsedInvoice: ParsedInvoice,
    items: InvoiceItem[],
  ): Promise<void> {
    for (const item of items) {
      // Update product statistics
      await this.updateProductStats(item.product_id, item.unit_price, parsedInvoice.issueDate.toISOString());

      // Record price history
      await this.recordPriceHistory(userId, item, invoiceId, parsedInvoice);
    }
  }

  /**
   * Update product statistics (total purchases, average price, last purchase date)
   */
  private async updateProductStats(productId: string, unitPrice: number, purchaseDate: string): Promise<void> {
    try {
      const product = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, productId);

      const totalPurchases = product.total_purchases + 1;
      const currentAverage = product.average_price || 0;
      const newAverage = (currentAverage * product.total_purchases + unitPrice) / totalPurchases;

      await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, productId, {
        total_purchases: totalPurchases,
        average_price: newAverage,
        last_purchase_date: purchaseDate,
        updated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(`Failed to update product stats for ${productId}:`, error);
      // Don't fail the invoice creation if stats update fails
    }
  }

  /**
   * Update product statistics after invoice deletion
   */
  private async updateProductStatsAfterDeletion(userId: string, items: InvoiceItem[]): Promise<void> {
    for (const item of items) {
      try {
        const product = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.product_id);

        const totalPurchases = Math.max(0, product.total_purchases - 1);

        // Recalculate average price from remaining price history
        if (totalPurchases > 0) {
          const priceHistoryResult = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.PRICE_HISTORY, [
            Query.equal('product_id', item.product_id),
            Query.notEqual('invoice_id', item.invoice_id),
          ]);

          const prices = priceHistoryResult.documents.map((doc: any) => doc.unit_price);
          const newAverage =
            prices.length > 0 ? prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length : 0;

          await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.product_id, {
            total_purchases: totalPurchases,
            average_price: newAverage,
            updated_at: new Date().toISOString(),
          });
        } else {
          // No more purchases, reset stats
          await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.product_id, {
            total_purchases: 0,
            average_price: 0,
            last_purchase_date: null,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error: any) {
        console.error(`Failed to update product stats after deletion for ${item.product_id}:`, error);
        // Continue with other items
      }
    }
  }

  // ============================================
  // Price History Management
  // ============================================

  /**
   * Record price history entry for invoice item
   */
  private async recordPriceHistory(
    userId: string,
    item: InvoiceItem,
    invoiceId: string,
    parsedInvoice: ParsedInvoice,
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      const priceHistoryPayload = {
        user_id: userId,
        product_id: item.product_id,
        invoice_id: invoiceId,
        merchant_cnpj: parsedInvoice.merchant.cnpj,
        merchant_name: parsedInvoice.merchant.name,
        purchase_date: parsedInvoice.issueDate.toISOString(),
        unit_price: item.unit_price,
        quantity: item.quantity,
        created_at: now,
      };

      await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.PRICE_HISTORY, ID.unique(), priceHistoryPayload);
    } catch (error: any) {
      console.error(`Failed to record price history for product ${item.product_id}:`, error);
      // Don't fail the invoice creation if price history fails
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Format invoice document
   */
  private formatInvoice(document: any): Invoice {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      user_id: document.user_id,
      invoice_key: document.invoice_key,
      invoice_number: document.invoice_number,
      issue_date: document.issue_date,
      merchant_cnpj: document.merchant_cnpj,
      merchant_name: document.merchant_name,
      total_amount: document.total_amount,
      category: document.category,
      data: document.data,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }

  /**
   * Format invoice item document
   */
  private formatInvoiceItem(document: any): InvoiceItem {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      invoice_id: document.invoice_id,
      user_id: document.user_id,
      product_id: document.product_id,
      product_code: document.product_code,
      ncm_code: document.ncm_code,
      description: document.description,
      quantity: document.quantity,
      unit_price: document.unit_price,
      total_price: document.total_price,
      discount_amount: document.discount_amount,
      line_number: document.line_number,
      created_at: document.created_at,
    };
  }

  /**
   * Format product document
   */
  private formatProduct(document: any): Product {
    return {
      $id: document.$id,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt,
      user_id: document.user_id,
      name: document.name,
      product_code: document.product_code,
      ncm_code: document.ncm_code,
      category: document.category,
      subcategory: document.subcategory,
      total_purchases: document.total_purchases,
      average_price: document.average_price,
      last_purchase_date: document.last_purchase_date,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}

// Export singleton instance (lazy initialization to avoid issues in tests)
let _invoiceServiceInstance: InvoiceService | null = null;

export function getInvoiceService(): InvoiceService {
  if (!_invoiceServiceInstance) {
    _invoiceServiceInstance = new InvoiceService();
  }
  return _invoiceServiceInstance;
}

// For backward compatibility
export const invoiceService = {
  get instance() {
    return getInvoiceService();
  },
};
