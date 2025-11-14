/**
 * Analytics Service
 *
 * Generates spending insights, predictions, and anomaly detection for invoice data.
 * Provides budget tracking and recommendations based on historical patterns.
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, Invoice, InvoiceItem, Product } from '@/lib/appwrite/schema';
import { cacheManager, getCacheKey } from '@/lib/utils/cache';
import { Query } from 'node-appwrite';

// ============================================
// Types and Interfaces
// ============================================

export interface CategorySpending {
  category: string;
  totalAmount: number;
  invoiceCount: number;
  percentage: number;
  averageAmount: number;
}

export interface MerchantStats {
  merchantName: string;
  merchantCnpj: string;
  visitCount: number;
  totalSpent: number;
  averageSpent: number;
  lastVisit: string;
}

export interface ProductStats {
  productId: string;
  productName: string;
  purchaseCount: number;
  totalSpent: number;
  averagePrice: number;
  lastPurchase: string;
}

export interface MonthlySpending {
  month: string; // YYYY-MM format
  year: number;
  monthNumber: number;
  total: number;
  categoryBreakdown: Record<string, number>;
}

export interface SpendingPrediction {
  category: string;
  predictedAmount: number;
  confidence: number;
  currentSpending: number;
  daysRemaining: number;
  onTrack: boolean;
  baseline: number;
  trend: number;
}

export interface SpendingAnomaly {
  type: 'high_spending' | 'unusual_merchant' | 'category_spike' | 'duplicate_invoice';
  severity: 'low' | 'medium' | 'high';
  description: string;
  invoiceId?: string;
  category?: string;
  amount?: number;
  detectedAt: string;
}

export interface BudgetLimit {
  category: string;
  limit: number;
  currentSpending: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  recommendation?: string;
}

export interface BudgetAlert {
  category: string;
  limit: number;
  currentSpending: number;
  percentage: number;
  threshold: 80 | 100;
  message: string;
}

export interface SpendingInsights {
  totalInvoices: number;
  totalSpent: number;
  averageInvoiceAmount: number;
  categoryBreakdown: CategorySpending[];
  topMerchants: MerchantStats[];
  frequentProducts: ProductStats[];
  monthlyTrend: MonthlySpending[];
  predictions: SpendingPrediction[];
  anomalies: SpendingAnomaly[];
  hasMinimumData: boolean;
}

// ============================================
// Error Classes
// ============================================

export class AnalyticsServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'AnalyticsServiceError';
  }
}

// ============================================
// Analytics Service
// ============================================

export class AnalyticsService {
  private dbAdapter: any;
  private readonly MINIMUM_INVOICES = 3;
  private readonly MINIMUM_MONTHS = 3;
  // In-memory budget storage (in production, this should be in database)
  private budgets: Map<string, Map<string, number>> = new Map(); // userId -> category -> limit

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  // ============================================
  // Main Insights Generation
  // ============================================

  /**
   * Generate comprehensive spending insights for a user
   * Requires minimum 3 invoices to generate insights
   * Cached for 1 hour to improve performance
   */
  async generateInsights(userId: string): Promise<SpendingInsights> {
    try {
      // Check cache first (1 hour TTL)
      const cacheKey = getCacheKey.invoiceInsights(userId);
      const cached = cacheManager.get<SpendingInsights>(cacheKey);

      if (cached) {
        return cached;
      }

      // Get all invoices for the user
      const invoices = await this.getAllInvoices(userId);

      // Check minimum data requirement
      const hasMinimumData = invoices.length >= this.MINIMUM_INVOICES;

      if (!hasMinimumData) {
        return {
          totalInvoices: invoices.length,
          totalSpent: 0,
          averageInvoiceAmount: 0,
          categoryBreakdown: [],
          topMerchants: [],
          frequentProducts: [],
          monthlyTrend: [],
          predictions: [],
          anomalies: [],
          hasMinimumData: false,
        };
      }

      // Calculate basic statistics
      const totalSpent = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const averageInvoiceAmount = totalSpent / invoices.length;

      // Generate insights
      const categoryBreakdown = await this.calculateCategoryBreakdown(invoices, totalSpent);
      const topMerchants = await this.calculateTopMerchants(invoices);
      const frequentProducts = await this.calculateFrequentProducts(userId, invoices);
      const monthlyTrend = await this.calculateMonthlyTrend(invoices);

      // Generate predictions (requires minimum months of data)
      const predictions = await this.generatePredictions(userId, monthlyTrend);

      // Detect anomalies
      const anomalies = await this.detectAnomalies(userId, invoices, categoryBreakdown);

      const insights = {
        totalInvoices: invoices.length,
        totalSpent,
        averageInvoiceAmount,
        categoryBreakdown,
        topMerchants,
        frequentProducts,
        monthlyTrend,
        predictions,
        anomalies,
        hasMinimumData: true,
      };

      // Cache for 1 hour (3600000 ms)
      cacheManager.set(cacheKey, insights, 3600000);

      return insights;
    } catch (error: any) {
      throw new AnalyticsServiceError('Failed to generate insights', 'INSIGHTS_GENERATION_ERROR', {
        userId,
        error: error.message,
      });
    }
  }

  // ============================================
  // Category Analysis
  // ============================================

  /**
   * Calculate spending breakdown by category
   */
  private async calculateCategoryBreakdown(invoices: Invoice[], totalSpent: number): Promise<CategorySpending[]> {
    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const invoice of invoices) {
      const category = invoice.category;
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + invoice.total_amount,
        count: existing.count + 1,
      });
    }

    const breakdown: CategorySpending[] = [];
    for (const [category, data] of categoryMap.entries()) {
      breakdown.push({
        category,
        totalAmount: data.total,
        invoiceCount: data.count,
        percentage: (data.total / totalSpent) * 100,
        averageAmount: data.total / data.count,
      });
    }

    // Sort by total amount descending
    return breakdown.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  // ============================================
  // Merchant Analysis
  // ============================================

  /**
   * Calculate top merchants by visit count and spending
   */
  private async calculateTopMerchants(invoices: Invoice[]): Promise<MerchantStats[]> {
    const merchantMap = new Map<
      string,
      { name: string; cnpj: string; visits: number; total: number; lastVisit: string }
    >();

    for (const invoice of invoices) {
      const key = invoice.merchant_cnpj;
      const existing = merchantMap.get(key);

      if (existing) {
        merchantMap.set(key, {
          ...existing,
          visits: existing.visits + 1,
          total: existing.total + invoice.total_amount,
          lastVisit:
            new Date(invoice.issue_date) > new Date(existing.lastVisit) ? invoice.issue_date : existing.lastVisit,
        });
      } else {
        merchantMap.set(key, {
          name: invoice.merchant_name,
          cnpj: invoice.merchant_cnpj,
          visits: 1,
          total: invoice.total_amount,
          lastVisit: invoice.issue_date,
        });
      }
    }

    const merchants: MerchantStats[] = [];
    for (const data of merchantMap.values()) {
      merchants.push({
        merchantName: data.name,
        merchantCnpj: data.cnpj,
        visitCount: data.visits,
        totalSpent: data.total,
        averageSpent: data.total / data.visits,
        lastVisit: data.lastVisit,
      });
    }

    // Sort by visit count descending, then by total spent
    return merchants
      .sort((a, b) => {
        if (b.visitCount !== a.visitCount) {
          return b.visitCount - a.visitCount;
        }
        return b.totalSpent - a.totalSpent;
      })
      .slice(0, 10); // Top 10 merchants
  }

  // ============================================
  // Product Analysis
  // ============================================

  /**
   * Identify most frequently purchased products
   */
  private async calculateFrequentProducts(userId: string, invoices: Invoice[]): Promise<ProductStats[]> {
    try {
      const priceHistoryEntries = await this.listAllDocuments<any>(COLLECTIONS.PRICE_HISTORY, [
        Query.equal('user_id', userId),
      ]);

      if (priceHistoryEntries.length === 0) {
        return [];
      }

      const statsByProduct = new Map<
        string,
        { count: number; totalSpent: number; totalQuantity: number; lastPurchase?: string }
      >();

      for (const entry of priceHistoryEntries) {
        const stats =
          statsByProduct.get(entry.product_id) ||
          ({ count: 0, totalSpent: 0, totalQuantity: 0 } as {
            count: number;
            totalSpent: number;
            totalQuantity: number;
            lastPurchase?: string;
          });

        stats.count += 1;
        const quantity = typeof entry.quantity === 'number' ? entry.quantity : 1;
        const unitPrice = typeof entry.unit_price === 'number' ? entry.unit_price : 0;
        stats.totalQuantity += quantity;
        stats.totalSpent += unitPrice * quantity;

        if (!stats.lastPurchase || (entry.purchase_date && entry.purchase_date > stats.lastPurchase)) {
          stats.lastPurchase = entry.purchase_date;
        }

        statsByProduct.set(entry.product_id, stats);
      }

      const productIds = Array.from(statsByProduct.keys());
      const productDocs = await this.fetchRowsByIds<Product>(COLLECTIONS.PRODUCTS, productIds);
      const nameById = new Map(productDocs.map((doc: any) => [doc.$id, doc.name]));

      const products: ProductStats[] = Array.from(statsByProduct.entries()).map(([productId, stats]) => {
        const averagePriceRaw =
          stats.totalQuantity > 0 ? stats.totalSpent / stats.totalQuantity : stats.totalSpent / stats.count;

        return {
          productId,
          productName: nameById.get(productId) || 'Produto desconhecido',
          purchaseCount: stats.count,
          totalSpent: Number(stats.totalSpent.toFixed(2)),
          averagePrice: Number(averagePriceRaw.toFixed(2)),
          lastPurchase: stats.lastPurchase || '',
        };
      });

      return products
        .sort((a, b) => {
          if (b.purchaseCount !== a.purchaseCount) {
            return b.purchaseCount - a.purchaseCount;
          }
          return b.totalSpent - a.totalSpent;
        })
        .slice(0, 10);
    } catch (error: any) {
      console.error('Failed to calculate frequent products:', error);
      return [];
    }
  }

  // ============================================
  // Monthly Trend Analysis
  // ============================================

  /**
   * Calculate monthly spending trends
   */
  private async calculateMonthlyTrend(invoices: Invoice[]): Promise<MonthlySpending[]> {
    const monthlyMap = new Map<string, { total: number; categories: Map<string, number> }>();

    for (const invoice of invoices) {
      const date = new Date(invoice.issue_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthlyMap.get(monthKey);
      if (existing) {
        existing.total += invoice.total_amount;
        const categoryTotal = existing.categories.get(invoice.category) || 0;
        existing.categories.set(invoice.category, categoryTotal + invoice.total_amount);
      } else {
        const categories = new Map<string, number>();
        categories.set(invoice.category, invoice.total_amount);
        monthlyMap.set(monthKey, {
          total: invoice.total_amount,
          categories,
        });
      }
    }

    const trend: MonthlySpending[] = [];
    for (const [monthKey, data] of monthlyMap.entries()) {
      const [year, month] = monthKey.split('-').map(Number);
      const categoryBreakdown: Record<string, number> = {};
      for (const [category, amount] of data.categories.entries()) {
        categoryBreakdown[category] = amount;
      }

      trend.push({
        month: monthKey,
        year,
        monthNumber: month,
        total: data.total,
        categoryBreakdown,
      });
    }

    // Sort by date ascending
    return trend.sort((a, b) => a.month.localeCompare(b.month));
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Get all invoices for a user
   * Optimized with pagination support for large datasets
   */
  private async getAllInvoices(userId: string, limit: number = 1000): Promise<Invoice[]> {
    try {
      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, [
        Query.equal('user_id', userId),
        Query.orderDesc('issue_date'),
        Query.limit(limit),
      ]);

      return result.documents.map((doc: any) => this.formatInvoice(doc));
    } catch (error: any) {
      throw new AnalyticsServiceError('Failed to fetch invoices', 'FETCH_INVOICES_ERROR', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Fetch all documents for a table using pagination
   */
  private async listAllDocuments<T>(tableId: string, baseQueries: string[], batchSize: number = 100): Promise<T[]> {
    const rows: T[] = [];
    let offset = 0;

    while (true) {
      const queries = [...baseQueries, Query.limit(batchSize), Query.offset(offset)];
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, tableId, queries);
      const documents = (response.documents || []) as T[];
      rows.push(...documents);

      if (documents.length < batchSize) {
        break;
      }

      offset += batchSize;
    }

    return rows;
  }

  /**
   * Fetch documents by ID chunks to avoid query limits
   */
  private async fetchRowsByIds<T>(tableId: string, ids: string[], chunkSize: number = 100): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows: T[] = [];

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, tableId, [
        Query.equal('$id', chunk),
        Query.limit(chunk.length),
      ]);

      rows.push(...((response.documents || []) as T[]));
    }

    return rows;
  }

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

  // ============================================
  // Spending Predictions
  // ============================================

  /**
   * Generate monthly spending predictions per category
   * Requires minimum 3 months of historical data
   */
  private async generatePredictions(userId: string, monthlyTrend: MonthlySpending[]): Promise<SpendingPrediction[]> {
    // Check if we have minimum months of data
    if (monthlyTrend.length < this.MINIMUM_MONTHS) {
      return [];
    }

    const predictions: SpendingPrediction[] = [];
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const currentDayOfMonth = currentDate.getDate();
    const daysInCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInCurrentMonth - currentDayOfMonth;

    // Get current month's data if it exists
    const currentMonthData = monthlyTrend.find((m) => m.month === currentMonth);

    // Collect all categories from historical data
    const allCategories = new Set<string>();
    for (const month of monthlyTrend) {
      Object.keys(month.categoryBreakdown).forEach((cat) => allCategories.add(cat));
    }

    // Generate prediction for each category
    for (const category of allCategories) {
      const prediction = this.predictCategorySpending(
        category,
        monthlyTrend,
        currentMonth,
        currentMonthData,
        currentDayOfMonth,
        daysInCurrentMonth,
      );

      if (prediction) {
        predictions.push({
          ...prediction,
          daysRemaining,
        });
      }
    }

    return predictions;
  }

  /**
   * Predict spending for a specific category
   */
  private predictCategorySpending(
    category: string,
    monthlyTrend: MonthlySpending[],
    currentMonth: string,
    currentMonthData: MonthlySpending | undefined,
    currentDayOfMonth: number,
    daysInCurrentMonth: number,
  ): SpendingPrediction | null {
    // Get historical data for this category (excluding current month)
    const historicalData: number[] = [];
    for (const month of monthlyTrend) {
      if (month.month !== currentMonth) {
        const amount = month.categoryBreakdown[category] || 0;
        historicalData.push(amount);
      }
    }

    // Need at least 3 months of historical data
    if (historicalData.length < this.MINIMUM_MONTHS) {
      return null;
    }

    // Calculate 3-month moving average for baseline
    const recentMonths = historicalData.slice(-3);
    const baselinePrediction = this.calculateAverage(recentMonths);

    // Apply trend adjustment
    const trend = this.calculateTrend(recentMonths);
    const trendAdjusted = baselinePrediction * (1 + trend);

    // Get current month's spending for this category
    const currentSpending = currentMonthData?.categoryBreakdown[category] || 0;

    // Factor in current month progress
    let finalPrediction = trendAdjusted;
    if (currentDayOfMonth > 0 && currentSpending > 0) {
      const projectedFromCurrent = (currentSpending / currentDayOfMonth) * daysInCurrentMonth;
      // Weighted average: 70% historical, 30% current projection
      finalPrediction = trendAdjusted * 0.7 + projectedFromCurrent * 0.3;
    }

    // Calculate confidence based on variance
    const variance = this.calculateVariance(recentMonths);
    const coefficientOfVariation = baselinePrediction > 0 ? variance / baselinePrediction : 1;
    const confidence = Math.max(0.5, Math.min(0.95, 1 - coefficientOfVariation));

    // Determine if on track
    const expectedSpendingByNow = (finalPrediction / daysInCurrentMonth) * currentDayOfMonth;
    const onTrack = currentSpending <= expectedSpendingByNow * 1.1; // 10% tolerance

    return {
      category,
      predictedAmount: finalPrediction,
      confidence,
      currentSpending,
      daysRemaining: 0, // Will be set by caller
      onTrack,
      baseline: baselinePrediction,
      trend,
    };
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate trend from recent data points
   * Returns a percentage change (e.g., 0.1 for 10% increase)
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear trend: compare last value to first value
    const first = values[0];
    const last = values[values.length - 1];

    if (first === 0) return 0;

    return (last - first) / first;
  }

  /**
   * Calculate variance of an array of numbers
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return this.calculateAverage(squaredDiffs);
  }

  // ============================================
  // Anomaly Detection
  // ============================================

  /**
   * Detect spending anomalies and unusual patterns
   */
  private async detectAnomalies(
    userId: string,
    invoices: Invoice[],
    categoryBreakdown: CategorySpending[],
  ): Promise<SpendingAnomaly[]> {
    const anomalies: SpendingAnomaly[] = [];

    // Detect high spending anomalies (exceeds 2 standard deviations)
    const highSpendingAnomalies = this.detectHighSpending(invoices);
    anomalies.push(...highSpendingAnomalies);

    // Detect unusual merchant visits
    const unusualMerchantAnomalies = this.detectUnusualMerchants(invoices);
    anomalies.push(...unusualMerchantAnomalies);

    // Detect category spending spikes
    const categorySpikes = this.detectCategorySpikes(invoices, categoryBreakdown);
    anomalies.push(...categorySpikes);

    // Detect potential duplicate invoices
    const duplicates = this.detectPotentialDuplicates(invoices);
    anomalies.push(...duplicates);

    // Sort by severity and date
    return anomalies.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });
  }

  /**
   * Detect invoices with amounts exceeding 2 standard deviations from mean
   */
  private detectHighSpending(invoices: Invoice[]): SpendingAnomaly[] {
    const anomalies: SpendingAnomaly[] = [];

    if (invoices.length < 3) return anomalies;

    const amounts = invoices.map((inv) => inv.total_amount);
    const mean = this.calculateAverage(amounts);
    const variance = this.calculateVariance(amounts);
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev;

    for (const invoice of invoices) {
      if (invoice.total_amount > threshold) {
        const severity = invoice.total_amount > mean + 3 * stdDev ? 'high' : 'medium';
        anomalies.push({
          type: 'high_spending',
          severity,
          description: `Unusually high spending of R$ ${invoice.total_amount.toFixed(2)} at ${invoice.merchant_name} (${Math.round(((invoice.total_amount - mean) / mean) * 100)}% above average)`,
          invoiceId: invoice.$id,
          category: invoice.category,
          amount: invoice.total_amount,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect unusual merchant visits (first-time or rare merchants with high spending)
   */
  private detectUnusualMerchants(invoices: Invoice[]): SpendingAnomaly[] {
    const anomalies: SpendingAnomaly[] = [];

    // Count visits per merchant
    const merchantVisits = new Map<string, { count: number; totalSpent: number; invoices: Invoice[] }>();
    for (const invoice of invoices) {
      const key = invoice.merchant_cnpj;
      const existing = merchantVisits.get(key);
      if (existing) {
        existing.count++;
        existing.totalSpent += invoice.total_amount;
        existing.invoices.push(invoice);
      } else {
        merchantVisits.set(key, {
          count: 1,
          totalSpent: invoice.total_amount,
          invoices: [invoice],
        });
      }
    }

    // Calculate average spending
    const allAmounts = invoices.map((inv) => inv.total_amount);
    const avgSpending = this.calculateAverage(allAmounts);

    // Flag merchants with only 1-2 visits and high spending
    for (const [cnpj, data] of merchantVisits.entries()) {
      if (data.count <= 2 && data.totalSpent / data.count > avgSpending * 1.5) {
        const latestInvoice = data.invoices[data.invoices.length - 1];
        anomalies.push({
          type: 'unusual_merchant',
          severity: 'low',
          description: `Unusual purchase at ${latestInvoice.merchant_name} (${data.count} visit${data.count > 1 ? 's' : ''}, R$ ${(data.totalSpent / data.count).toFixed(2)} average)`,
          invoiceId: latestInvoice.$id,
          category: latestInvoice.category,
          amount: data.totalSpent / data.count,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect category spending spikes (month-over-month increases)
   */
  private detectCategorySpikes(invoices: Invoice[], categoryBreakdown: CategorySpending[]): SpendingAnomaly[] {
    const anomalies: SpendingAnomaly[] = [];

    // Group invoices by month and category
    const monthlyByCategory = new Map<string, Map<string, number>>();

    for (const invoice of invoices) {
      const date = new Date(invoice.issue_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyByCategory.has(invoice.category)) {
        monthlyByCategory.set(invoice.category, new Map());
      }

      const categoryMonths = monthlyByCategory.get(invoice.category)!;
      const currentAmount = categoryMonths.get(monthKey) || 0;
      categoryMonths.set(monthKey, currentAmount + invoice.total_amount);
    }

    // Check for spikes (current month > 2x average of previous months)
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    for (const [category, months] of monthlyByCategory.entries()) {
      const monthsArray = Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      if (monthsArray.length < 2) continue;

      const currentMonthData = months.get(currentMonth);
      if (!currentMonthData) continue;

      // Calculate average of previous months
      const previousMonths = monthsArray.filter(([month]) => month !== currentMonth).map(([, amount]) => amount);

      if (previousMonths.length === 0) continue;

      const avgPrevious = this.calculateAverage(previousMonths);

      if (currentMonthData > avgPrevious * 2) {
        anomalies.push({
          type: 'category_spike',
          severity: 'medium',
          description: `Spending spike in ${category} category: R$ ${currentMonthData.toFixed(2)} this month vs R$ ${avgPrevious.toFixed(2)} average (${Math.round(((currentMonthData - avgPrevious) / avgPrevious) * 100)}% increase)`,
          category,
          amount: currentMonthData,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect potential duplicate invoices (same merchant, similar amount, close dates)
   */
  private detectPotentialDuplicates(invoices: Invoice[]): SpendingAnomaly[] {
    const anomalies: SpendingAnomaly[] = [];

    // Sort by date
    const sortedInvoices = [...invoices].sort(
      (a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime(),
    );

    for (let i = 0; i < sortedInvoices.length - 1; i++) {
      const invoice1 = sortedInvoices[i];
      const invoice2 = sortedInvoices[i + 1];

      // Check if same merchant
      if (invoice1.merchant_cnpj !== invoice2.merchant_cnpj) continue;

      // Check if amounts are similar (within 5%)
      const amountDiff = Math.abs(invoice1.total_amount - invoice2.total_amount);
      const amountSimilarity = amountDiff / Math.max(invoice1.total_amount, invoice2.total_amount);
      if (amountSimilarity > 0.05) continue;

      // Check if dates are close (within 7 days)
      const date1 = new Date(invoice1.issue_date);
      const date2 = new Date(invoice2.issue_date);
      const daysDiff = Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) continue;

      // Potential duplicate found
      anomalies.push({
        type: 'duplicate_invoice',
        severity: 'high',
        description: `Potential duplicate invoice at ${invoice1.merchant_name}: R$ ${invoice1.total_amount.toFixed(2)} on ${new Date(invoice1.issue_date).toLocaleDateString()} and R$ ${invoice2.total_amount.toFixed(2)} on ${new Date(invoice2.issue_date).toLocaleDateString()}`,
        invoiceId: invoice2.$id,
        category: invoice2.category,
        amount: invoice2.total_amount,
        detectedAt: new Date().toISOString(),
      });
    }

    return anomalies;
  }

  // ============================================
  // Budget Tracking
  // ============================================

  /**
   * Set spending limit for a category
   */
  async setBudgetLimit(userId: string, category: string, limit: number): Promise<void> {
    if (limit <= 0) {
      throw new AnalyticsServiceError('Budget limit must be positive', 'INVALID_BUDGET_LIMIT', { limit });
    }

    if (!this.budgets.has(userId)) {
      this.budgets.set(userId, new Map());
    }

    this.budgets.get(userId)!.set(category, limit);
  }

  /**
   * Get budget limit for a category
   */
  async getBudgetLimit(userId: string, category: string): Promise<number | null> {
    const userBudgets = this.budgets.get(userId);
    if (!userBudgets) return null;

    return userBudgets.get(category) || null;
  }

  /**
   * Get all budget limits for a user with current spending
   */
  async getAllBudgetLimits(userId: string): Promise<BudgetLimit[]> {
    try {
      const userBudgets = this.budgets.get(userId);
      if (!userBudgets || userBudgets.size === 0) {
        return [];
      }

      // Get current month's spending by category
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const invoices = await this.getInvoicesByDateRange(userId, startOfMonth, endOfMonth);

      // Calculate current spending by category
      const categorySpending = new Map<string, number>();
      for (const invoice of invoices) {
        const current = categorySpending.get(invoice.category) || 0;
        categorySpending.set(invoice.category, current + invoice.total_amount);
      }

      // Build budget limits with current spending
      const budgetLimits: BudgetLimit[] = [];
      for (const [category, limit] of userBudgets.entries()) {
        const currentSpending = categorySpending.get(category) || 0;
        const percentage = (currentSpending / limit) * 100;

        let status: 'ok' | 'warning' | 'exceeded' = 'ok';
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= 80) {
          status = 'warning';
        }

        // Generate recommendation based on historical patterns
        const recommendation = await this.generateBudgetRecommendation(
          userId,
          category,
          limit,
          currentSpending,
          percentage,
        );

        budgetLimits.push({
          category,
          limit,
          currentSpending,
          percentage,
          status,
          recommendation,
        });
      }

      return budgetLimits.sort((a, b) => b.percentage - a.percentage);
    } catch (error: any) {
      throw new AnalyticsServiceError('Failed to get budget limits', 'GET_BUDGET_LIMITS_ERROR', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Delete budget limit for a category
   */
  async deleteBudgetLimit(userId: string, category: string): Promise<void> {
    const userBudgets = this.budgets.get(userId);
    if (userBudgets) {
      userBudgets.delete(category);
    }
  }

  /**
   * Generate budget alerts (at 80% and 100% thresholds)
   */
  async generateBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
    try {
      const budgetLimits = await this.getAllBudgetLimits(userId);
      const alerts: BudgetAlert[] = [];

      for (const budget of budgetLimits) {
        if (budget.percentage >= 100) {
          alerts.push({
            category: budget.category,
            limit: budget.limit,
            currentSpending: budget.currentSpending,
            percentage: budget.percentage,
            threshold: 100,
            message: `Budget exceeded for ${budget.category}: R$ ${budget.currentSpending.toFixed(2)} / R$ ${budget.limit.toFixed(2)} (${Math.round(budget.percentage)}%)`,
          });
        } else if (budget.percentage >= 80) {
          alerts.push({
            category: budget.category,
            limit: budget.limit,
            currentSpending: budget.currentSpending,
            percentage: budget.percentage,
            threshold: 80,
            message: `Approaching budget limit for ${budget.category}: R$ ${budget.currentSpending.toFixed(2)} / R$ ${budget.limit.toFixed(2)} (${Math.round(budget.percentage)}%)`,
          });
        }
      }

      return alerts;
    } catch (error: any) {
      throw new AnalyticsServiceError('Failed to generate budget alerts', 'BUDGET_ALERTS_ERROR', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Generate budget recommendation based on historical patterns
   */
  private async generateBudgetRecommendation(
    userId: string,
    category: string,
    limit: number,
    currentSpending: number,
    percentage: number,
  ): Promise<string | undefined> {
    try {
      // Get last 3 months of spending for this category
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const invoices = await this.getInvoicesByDateRange(
        userId,
        threeMonthsAgo.toISOString(),
        new Date().toISOString(),
      );

      const categoryInvoices = invoices.filter((inv) => inv.category === category);

      if (categoryInvoices.length === 0) {
        return undefined;
      }

      // Calculate monthly averages
      const monthlySpending = new Map<string, number>();
      for (const invoice of categoryInvoices) {
        const date = new Date(invoice.issue_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlySpending.get(monthKey) || 0;
        monthlySpending.set(monthKey, current + invoice.total_amount);
      }

      const monthlyAmounts = Array.from(monthlySpending.values());
      const avgMonthlySpending = this.calculateAverage(monthlyAmounts);

      // Generate recommendations
      if (percentage >= 100) {
        const overspend = currentSpending - limit;
        return `You've exceeded your budget by R$ ${overspend.toFixed(2)}. Consider reducing spending in this category or adjusting your budget to R$ ${Math.ceil(avgMonthlySpending / 100) * 100}.`;
      } else if (percentage >= 80) {
        const remaining = limit - currentSpending;
        return `You have R$ ${remaining.toFixed(2)} remaining. Try to limit spending to stay within budget.`;
      } else if (avgMonthlySpending > limit * 1.2) {
        return `Your average monthly spending (R$ ${avgMonthlySpending.toFixed(2)}) exceeds your budget. Consider increasing your limit to R$ ${Math.ceil(avgMonthlySpending / 100) * 100}.`;
      } else if (avgMonthlySpending < limit * 0.7) {
        return `You're consistently under budget. You could reduce your limit to R$ ${Math.ceil(avgMonthlySpending / 100) * 100} and reallocate funds.`;
      }

      return undefined;
    } catch (error: any) {
      console.error('Failed to generate budget recommendation:', error);
      return undefined;
    }
  }

  /**
   * Get invoices by date range
   */
  private async getInvoicesByDateRange(userId: string, startDate: string, endDate: string): Promise<Invoice[]> {
    try {
      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, [
        Query.equal('user_id', userId),
        Query.greaterThanEqual('issue_date', startDate),
        Query.lessThanEqual('issue_date', endDate),
        Query.limit(1000),
      ]);

      return result.documents.map((doc: any) => this.formatInvoice(doc));
    } catch (error: any) {
      throw new AnalyticsServiceError('Failed to fetch invoices by date range', 'FETCH_INVOICES_ERROR', {
        userId,
        startDate,
        endDate,
        error: error.message,
      });
    }
  }
}

// Export singleton instance
let _analyticsServiceInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!_analyticsServiceInstance) {
    _analyticsServiceInstance = new AnalyticsService();
  }
  return _analyticsServiceInstance;
}

export const analyticsService = {
  get instance() {
    return getAnalyticsService();
  },
};
