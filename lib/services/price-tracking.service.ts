/**
 * Price Tracking Service
 *
 * Handles price history retrieval, price comparison across merchants,
 * and shopping list optimization for invoice products.
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, PriceHistory, Product } from '@/lib/appwrite/schema';
import { cacheManager, getCacheKey } from '@/lib/utils/cache';
import { Query } from 'node-appwrite';

// ============================================
// Types and Interfaces
// ============================================

export interface PricePoint {
  date: string;
  price: number;
  merchantName: string;
  merchantCnpj: string;
  quantity: number;
  invoiceId: string;
}

export interface PriceHistoryResult {
  productId: string;
  productName: string;
  prices: PricePoint[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceRange: number;
}

export interface MerchantPriceStats {
  merchantName: string;
  merchantCnpj: string;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  purchaseCount: number;
  lastPurchaseDate: string;
}

export interface PriceComparison {
  productId: string;
  productName: string;
  merchants: MerchantPriceStats[];
  overallLowestPrice: number;
  overallHighestPrice: number;
  overallAveragePrice: number;
  bestMerchant: string;
  savingsPotential: number;
}

export interface PriceChange {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercent: number;
  merchantName: string;
  changeDate: string;
  isIncrease: boolean;
}

export interface ShoppingListItem {
  productId: string;
  productName: string;
  quantity?: number;
}

export interface MerchantShoppingOption {
  merchantName: string;
  merchantCnpj: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
  totalCost: number;
  averagePricePerItem: number;
}

export interface ShoppingListOptimization {
  requestedItems: ShoppingListItem[];
  merchantOptions: MerchantShoppingOption[];
  bestOption: MerchantShoppingOption;
  potentialSavings: number;
  recommendation: string;
}

// ============================================
// Error Classes
// ============================================

export class PriceTrackingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'PriceTrackingError';
  }
}

// ============================================
// Price Tracking Service
// ============================================

export class PriceTrackingService {
  private dbAdapter: any;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  // ============================================
  // Price History Methods
  // ============================================

  /**
   * Get price history for a product within a date range
   * Cached for 30 minutes to improve performance
   */
  async getPriceHistory(userId: string, productId: string, days: number = 90): Promise<PriceHistoryResult> {
    try {
      // Check cache first (30 minutes TTL)
      const cacheKey = getCacheKey.priceHistory(userId, productId, days);
      const cached = cacheManager.get<PriceHistoryResult>(cacheKey);

      if (cached) {
        return cached;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get product details
      const product = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, productId);

      if (product.user_id !== userId) {
        throw new PriceTrackingError('Product not found', 'PRODUCT_NOT_FOUND', { productId });
      }

      // Query price history
      const queries = [
        Query.equal('user_id', userId),
        Query.equal('product_id', productId),
        Query.greaterThanEqual('purchase_date', startDate.toISOString()),
        Query.lessThanEqual('purchase_date', endDate.toISOString()),
        Query.orderDesc('purchase_date'),
        Query.limit(100),
      ];

      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.PRICE_HISTORY, queries);

      const prices: PricePoint[] = result.documents.map((doc: any) => ({
        date: doc.purchase_date,
        price: doc.unit_price,
        merchantName: doc.merchant_name,
        merchantCnpj: doc.merchant_cnpj,
        quantity: doc.quantity,
        invoiceId: doc.invoice_id,
      }));

      // Calculate statistics
      const priceValues = prices.map((p) => p.price);
      const lowestPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
      const highestPrice = priceValues.length > 0 ? Math.max(...priceValues) : 0;
      const averagePrice = priceValues.length > 0 ? priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length : 0;
      const priceRange = highestPrice - lowestPrice;

      const priceHistory = {
        productId,
        productName: product.name,
        prices,
        lowestPrice,
        highestPrice,
        averagePrice,
        priceRange,
      };

      // Cache for 30 minutes (1800000 ms)
      cacheManager.set(cacheKey, priceHistory, 1800000);

      return priceHistory;
    } catch (error: any) {
      if (error instanceof PriceTrackingError) {
        throw error;
      }
      if (error.code === 404) {
        throw new PriceTrackingError('Product not found', 'PRODUCT_NOT_FOUND', { productId });
      }
      throw new PriceTrackingError('Failed to retrieve price history', 'PRICE_HISTORY_ERROR', {
        productId,
        error: error.message,
      });
    }
  }

  /**
   * Calculate average price per merchant for a product
   */
  async getAveragePriceByMerchant(userId: string, productId: string, days: number = 90): Promise<MerchantPriceStats[]> {
    try {
      const priceHistory = await this.getPriceHistory(userId, productId, days);

      // Group prices by merchant
      const merchantMap = new Map<string, PricePoint[]>();

      for (const price of priceHistory.prices) {
        const key = price.merchantCnpj;
        if (!merchantMap.has(key)) {
          merchantMap.set(key, []);
        }
        merchantMap.get(key)!.push(price);
      }

      // Calculate statistics for each merchant
      const merchantStats: MerchantPriceStats[] = [];

      for (const [merchantCnpj, prices] of merchantMap.entries()) {
        const priceValues = prices.map((p) => p.price);
        const averagePrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
        const lowestPrice = Math.min(...priceValues);
        const highestPrice = Math.max(...priceValues);
        const lastPurchaseDate = prices[0].date; // Already sorted by date desc

        merchantStats.push({
          merchantName: prices[0].merchantName,
          merchantCnpj,
          averagePrice,
          lowestPrice,
          highestPrice,
          purchaseCount: prices.length,
          lastPurchaseDate,
        });
      }

      // Sort by average price (lowest first)
      merchantStats.sort((a, b) => a.averagePrice - b.averagePrice);

      return merchantStats;
    } catch (error: any) {
      if (error instanceof PriceTrackingError) {
        throw error;
      }
      throw new PriceTrackingError('Failed to calculate merchant averages', 'MERCHANT_AVERAGE_ERROR', {
        productId,
        error: error.message,
      });
    }
  }

  /**
   * Detect significant price changes (> threshold percentage)
   */
  async detectPriceChanges(
    userId: string,
    productId: string,
    thresholdPercent: number = 10,
    days: number = 90,
  ): Promise<PriceChange[]> {
    try {
      const priceHistory = await this.getPriceHistory(userId, productId, days);

      if (priceHistory.prices.length < 2) {
        return [];
      }

      const changes: PriceChange[] = [];

      // Group by merchant to detect changes per merchant
      const merchantMap = new Map<string, PricePoint[]>();

      for (const price of priceHistory.prices) {
        const key = price.merchantCnpj;
        if (!merchantMap.has(key)) {
          merchantMap.set(key, []);
        }
        merchantMap.get(key)!.push(price);
      }

      // Detect changes for each merchant
      for (const [merchantCnpj, prices] of merchantMap.entries()) {
        if (prices.length < 2) continue;

        // Sort by date ascending to compare chronologically
        const sortedPrices = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (let i = 1; i < sortedPrices.length; i++) {
          const oldPrice = sortedPrices[i - 1].price;
          const newPrice = sortedPrices[i].price;
          const priceChange = newPrice - oldPrice;
          const priceChangePercent = (priceChange / oldPrice) * 100;

          // Check if change exceeds threshold
          if (Math.abs(priceChangePercent) >= thresholdPercent) {
            changes.push({
              productId,
              productName: priceHistory.productName,
              oldPrice,
              newPrice,
              priceChange,
              priceChangePercent,
              merchantName: sortedPrices[i].merchantName,
              changeDate: sortedPrices[i].date,
              isIncrease: priceChange > 0,
            });
          }
        }
      }

      // Sort by date descending (most recent first)
      changes.sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime());

      return changes;
    } catch (error: any) {
      if (error instanceof PriceTrackingError) {
        throw error;
      }
      throw new PriceTrackingError('Failed to detect price changes', 'PRICE_CHANGE_ERROR', {
        productId,
        error: error.message,
      });
    }
  }

  // ============================================
  // Price Comparison Methods
  // ============================================

  /**
   * Compare prices across merchants for a product
   * Cached for 30 minutes to improve performance
   */
  async comparePrice(userId: string, productId: string, days: number = 90): Promise<PriceComparison> {
    try {
      // Check cache first (30 minutes TTL)
      const cacheKey = getCacheKey.priceComparison(userId, productId, days);
      const cached = cacheManager.get<PriceComparison>(cacheKey);

      if (cached) {
        return cached;
      }

      const priceHistory = await this.getPriceHistory(userId, productId, days);
      const merchantStats = await this.getAveragePriceByMerchant(userId, productId, days);

      if (merchantStats.length === 0) {
        throw new PriceTrackingError('No price data available for comparison', 'NO_PRICE_DATA', {
          productId,
        });
      }

      const bestMerchant = merchantStats[0]; // Already sorted by lowest average price
      const worstMerchant = merchantStats[merchantStats.length - 1];
      const savingsPotential = worstMerchant.averagePrice - bestMerchant.averagePrice;

      const comparison = {
        productId,
        productName: priceHistory.productName,
        merchants: merchantStats,
        overallLowestPrice: priceHistory.lowestPrice,
        overallHighestPrice: priceHistory.highestPrice,
        overallAveragePrice: priceHistory.averagePrice,
        bestMerchant: bestMerchant.merchantName,
        savingsPotential,
      };

      // Cache for 30 minutes (1800000 ms)
      cacheManager.set(cacheKey, comparison, 1800000);

      return comparison;
    } catch (error: any) {
      if (error instanceof PriceTrackingError) {
        throw error;
      }
      throw new PriceTrackingError('Failed to compare prices', 'PRICE_COMPARISON_ERROR', {
        productId,
        error: error.message,
      });
    }
  }

  /**
   * Rank merchants by price for specific products
   */
  async rankMerchantsByPrice(
    userId: string,
    productIds: string[],
    days: number = 90,
  ): Promise<Map<string, PriceComparison>> {
    try {
      const comparisons = new Map<string, PriceComparison>();

      for (const productId of productIds) {
        try {
          const comparison = await this.comparePrice(userId, productId, days);
          comparisons.set(productId, comparison);
        } catch (error) {
          // Skip products with no price data
          console.warn(`Skipping product ${productId}: ${error}`);
        }
      }

      return comparisons;
    } catch (error: any) {
      throw new PriceTrackingError('Failed to rank merchants', 'MERCHANT_RANKING_ERROR', {
        error: error.message,
      });
    }
  }

  // ============================================
  // Shopping List Optimization Methods
  // ============================================

  /**
   * Optimize shopping list by finding best merchant for each product
   */
  async optimizeShoppingList(
    userId: string,
    items: ShoppingListItem[],
    days: number = 90,
  ): Promise<ShoppingListOptimization> {
    try {
      if (items.length === 0) {
        throw new PriceTrackingError('Shopping list is empty', 'EMPTY_SHOPPING_LIST');
      }

      // Get price comparisons for all products
      const productComparisons = new Map<string, PriceComparison>();

      for (const item of items) {
        try {
          const comparison = await this.comparePrice(userId, item.productId, days);
          productComparisons.set(item.productId, comparison);
        } catch (error) {
          console.warn(`Skipping product ${item.productId}: ${error}`);
        }
      }

      if (productComparisons.size === 0) {
        throw new PriceTrackingError('No price data available for any products', 'NO_PRICE_DATA');
      }

      // Build merchant options
      const merchantOptionsMap = new Map<string, MerchantShoppingOption>();

      for (const [productId, comparison] of productComparisons.entries()) {
        const item = items.find((i) => i.productId === productId)!;
        const quantity = item.quantity || 1;

        for (const merchantStats of comparison.merchants) {
          const key = merchantStats.merchantCnpj;

          if (!merchantOptionsMap.has(key)) {
            merchantOptionsMap.set(key, {
              merchantName: merchantStats.merchantName,
              merchantCnpj: merchantStats.merchantCnpj,
              items: [],
              totalCost: 0,
              averagePricePerItem: 0,
            });
          }

          const option = merchantOptionsMap.get(key)!;
          option.items.push({
            productId,
            productName: comparison.productName,
            price: merchantStats.averagePrice,
            quantity,
          });
          option.totalCost += merchantStats.averagePrice * quantity;
        }
      }

      // Calculate average price per item for each merchant
      const merchantOptions = Array.from(merchantOptionsMap.values()).map((option) => ({
        ...option,
        averagePricePerItem: option.totalCost / option.items.reduce((sum, item) => sum + item.quantity, 0),
      }));

      // Sort by total cost (lowest first)
      merchantOptions.sort((a, b) => a.totalCost - b.totalCost);

      // Find best option (lowest total cost with most items available)
      const bestOption = merchantOptions.reduce((best, current) => {
        if (current.items.length > best.items.length) {
          return current;
        }
        if (current.items.length === best.items.length && current.totalCost < best.totalCost) {
          return current;
        }
        return best;
      }, merchantOptions[0]);

      // Calculate potential savings
      const worstOption = merchantOptions[merchantOptions.length - 1];
      const potentialSavings = worstOption.totalCost - bestOption.totalCost;

      // Generate recommendation
      let recommendation = `Shop at ${bestOption.merchantName} for the best overall price.`;

      if (bestOption.items.length < productComparisons.size) {
        const missingCount = productComparisons.size - bestOption.items.length;
        recommendation += ` Note: ${missingCount} item(s) not available at this merchant based on recent purchases.`;
      }

      if (potentialSavings > 0) {
        recommendation += ` You could save R$ ${potentialSavings.toFixed(2)} compared to the most expensive option.`;
      }

      return {
        requestedItems: items,
        merchantOptions,
        bestOption,
        potentialSavings,
        recommendation,
      };
    } catch (error: any) {
      if (error instanceof PriceTrackingError) {
        throw error;
      }
      throw new PriceTrackingError('Failed to optimize shopping list', 'SHOPPING_LIST_ERROR', {
        error: error.message,
      });
    }
  }

  /**
   * Calculate total cost per merchant for a shopping list
   */
  async calculateMerchantCosts(
    userId: string,
    items: ShoppingListItem[],
    days: number = 90,
  ): Promise<Map<string, number>> {
    try {
      const merchantCosts = new Map<string, number>();

      for (const item of items) {
        const comparison = await this.comparePrice(userId, item.productId, days);
        const quantity = item.quantity || 1;

        for (const merchantStats of comparison.merchants) {
          const key = merchantStats.merchantCnpj;
          const cost = merchantStats.averagePrice * quantity;

          if (!merchantCosts.has(key)) {
            merchantCosts.set(key, 0);
          }

          merchantCosts.set(key, merchantCosts.get(key)! + cost);
        }
      }

      return merchantCosts;
    } catch (error: any) {
      if (error instanceof PriceTrackingError) {
        throw error;
      }
      throw new PriceTrackingError('Failed to calculate merchant costs', 'MERCHANT_COST_ERROR', {
        error: error.message,
      });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Get product details
   */
  private async getProduct(userId: string, productId: string): Promise<Product> {
    try {
      const product = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, productId);

      if (product.user_id !== userId) {
        throw new PriceTrackingError('Product not found', 'PRODUCT_NOT_FOUND', { productId });
      }

      return product;
    } catch (error: any) {
      if (error.code === 404) {
        throw new PriceTrackingError('Product not found', 'PRODUCT_NOT_FOUND', { productId });
      }
      throw error;
    }
  }
}

// Export singleton instance
let _priceTrackingServiceInstance: PriceTrackingService | null = null;

export function getPriceTrackingService(): PriceTrackingService {
  if (!_priceTrackingServiceInstance) {
    _priceTrackingServiceInstance = new PriceTrackingService();
  }
  return _priceTrackingServiceInstance;
}

// For backward compatibility
export const priceTrackingService = {
  get instance() {
    return getPriceTrackingService();
  },
};
