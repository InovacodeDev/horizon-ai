/**
 * Performance Tests for Invoice Management System
 *
 * Tests performance with large datasets, cache effectiveness,
 * and database query optimization.
 */
import { getAnalyticsService } from '@/lib/services/analytics.service';
import type { ParsedInvoice } from '@/lib/services/invoice-parser.service';
import { getInvoiceService } from '@/lib/services/invoice.service';
import { getPriceTrackingService } from '@/lib/services/price-tracking.service';
import { cacheManager } from '@/lib/utils/cache';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

// Test configuration
const LARGE_DATASET_SIZE = 100;
const PERFORMANCE_THRESHOLD_MS = 5000; // 5 seconds max for large operations
const CACHE_THRESHOLD_MS = 100; // Cached operations should be < 100ms

// Mock user ID for testing
const TEST_USER_ID = 'test-user-performance';

// Helper to generate mock invoice data
function generateMockInvoice(index: number): ParsedInvoice {
  const categories = ['pharmacy', 'groceries', 'supermarket', 'restaurant', 'fuel', 'retail'];
  const merchants = [
    { cnpj: '12345678000190', name: 'Farmácia Popular' },
    { cnpj: '98765432000110', name: 'Supermercado Bom Preço' },
    { cnpj: '11223344000155', name: 'Restaurante Sabor' },
    { cnpj: '55667788000199', name: 'Posto Shell' },
  ];

  const merchant = merchants[index % merchants.length];
  const category = categories[index % categories.length];
  const date = new Date();
  date.setDate(date.getDate() - (index % 90)); // Spread over 90 days

  return {
    invoiceKey: `${String(index).padStart(44, '0')}`,
    invoiceNumber: `${String(index).padStart(9, '0')}`,
    series: '1',
    issueDate: date,
    merchant: {
      cnpj: merchant.cnpj,
      name: merchant.name,
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      state: 'SP',
    },
    items: [
      {
        description: `Produto ${index}`,
        productCode: `${String(index).padStart(13, '0')}`,
        ncmCode: '12345678',
        quantity: 1 + (index % 5),
        unitPrice: 10 + (index % 100),
        totalPrice: (1 + (index % 5)) * (10 + (index % 100)),
        discountAmount: 0,
      },
    ],
    totals: {
      subtotal: (1 + (index % 5)) * (10 + (index % 100)),
      discount: 0,
      tax: 0,
      total: (1 + (index % 5)) * (10 + (index % 100)),
    },
    xmlData: '<xml>mock</xml>',
    category: category as any,
  };
}

describe('Invoice Performance Tests', () => {
  const invoiceService = getInvoiceService();
  const analyticsService = getAnalyticsService();
  const priceTrackingService = getPriceTrackingService();
  const createdInvoiceIds: string[] = [];

  beforeAll(() => {
    // Clear cache before tests
    cacheManager.clear();
  });

  afterAll(async () => {
    // Cleanup: Delete all created invoices
    for (const invoiceId of createdInvoiceIds) {
      try {
        await invoiceService.deleteInvoice(invoiceId, TEST_USER_ID);
      } catch (error) {
        console.error(`Failed to cleanup invoice ${invoiceId}:`, error);
      }
    }
  });

  describe('Large Dataset Performance', () => {
    it(`should handle creating ${LARGE_DATASET_SIZE} invoices within threshold`, async () => {
      const startTime = Date.now();

      // Create invoices in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < LARGE_DATASET_SIZE; i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize && i + j < LARGE_DATASET_SIZE; j++) {
          const mockInvoice = generateMockInvoice(i + j);
          batch.push(
            invoiceService.createInvoice({
              userId: TEST_USER_ID,
              parsedInvoice: mockInvoice,
            }),
          );
        }

        const results = await Promise.all(batch);
        results.forEach((invoice) => createdInvoiceIds.push(invoice.$id));
      }

      const duration = Date.now() - startTime;
      console.log(`Created ${LARGE_DATASET_SIZE} invoices in ${duration}ms`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2); // Allow 2x threshold for creation
    }, 60000); // 60 second timeout

    it('should list invoices with pagination efficiently', async () => {
      const startTime = Date.now();

      const result = await invoiceService.listInvoices({
        userId: TEST_USER_ID,
        limit: 25,
        offset: 0,
      });

      const duration = Date.now() - startTime;
      console.log(`Listed 25 invoices in ${duration}ms`);

      expect(duration).toBeLessThan(1000); // Should be < 1 second
      expect(result.invoices.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(LARGE_DATASET_SIZE);
    });

    it('should filter invoices by date range efficiently', async () => {
      const startTime = Date.now();

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const result = await invoiceService.listInvoices({
        userId: TEST_USER_ID,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 50,
      });

      const duration = Date.now() - startTime;
      console.log(`Filtered invoices by date range in ${duration}ms`);

      expect(duration).toBeLessThan(1500); // Should be < 1.5 seconds
    });

    it('should filter invoices by category efficiently', async () => {
      const startTime = Date.now();

      const result = await invoiceService.listInvoices({
        userId: TEST_USER_ID,
        category: 'supermarket',
        limit: 50,
      });

      const duration = Date.now() - startTime;
      console.log(`Filtered invoices by category in ${duration}ms`);

      expect(duration).toBeLessThan(1000); // Should be < 1 second
    });
  });

  describe('Cache Effectiveness', () => {
    it('should cache insights and return quickly on subsequent calls', async () => {
      // First call (uncached)
      const startTime1 = Date.now();
      const insights1 = await analyticsService.generateInsights(TEST_USER_ID);
      const duration1 = Date.now() - startTime1;
      console.log(`First insights generation (uncached): ${duration1}ms`);

      // Second call (cached)
      const startTime2 = Date.now();
      const insights2 = await analyticsService.generateInsights(TEST_USER_ID);
      const duration2 = Date.now() - startTime2;
      console.log(`Second insights generation (cached): ${duration2}ms`);

      expect(duration2).toBeLessThan(CACHE_THRESHOLD_MS);
      expect(duration2).toBeLessThan(duration1 / 10); // Should be at least 10x faster
      expect(insights1.totalInvoices).toBe(insights2.totalInvoices);
    });

    it('should cache price history and return quickly on subsequent calls', async () => {
      // Get a product ID from the first invoice
      const invoices = await invoiceService.listInvoices({
        userId: TEST_USER_ID,
        limit: 1,
      });

      if (invoices.invoices.length === 0) {
        console.log('Skipping price history cache test - no invoices available');
        return;
      }

      const invoice = await invoiceService.getInvoiceById(invoices.invoices[0].$id, TEST_USER_ID);
      if (invoice.items.length === 0) {
        console.log('Skipping price history cache test - no items available');
        return;
      }

      const productId = invoice.items[0].product_id;

      // First call (uncached)
      const startTime1 = Date.now();
      const history1 = await priceTrackingService.getPriceHistory(TEST_USER_ID, productId, 90);
      const duration1 = Date.now() - startTime1;
      console.log(`First price history (uncached): ${duration1}ms`);

      // Second call (cached)
      const startTime2 = Date.now();
      const history2 = await priceTrackingService.getPriceHistory(TEST_USER_ID, productId, 90);
      const duration2 = Date.now() - startTime2;
      console.log(`Second price history (cached): ${duration2}ms`);

      expect(duration2).toBeLessThan(CACHE_THRESHOLD_MS);
      expect(duration2).toBeLessThan(duration1 / 5); // Should be at least 5x faster
      expect(history1.prices.length).toBe(history2.prices.length);
    });

    it('should cache price comparison and return quickly on subsequent calls', async () => {
      // Get a product ID from the first invoice
      const invoices = await invoiceService.listInvoices({
        userId: TEST_USER_ID,
        limit: 1,
      });

      if (invoices.invoices.length === 0) {
        console.log('Skipping price comparison cache test - no invoices available');
        return;
      }

      const invoice = await invoiceService.getInvoiceById(invoices.invoices[0].$id, TEST_USER_ID);
      if (invoice.items.length === 0) {
        console.log('Skipping price comparison cache test - no items available');
        return;
      }

      const productId = invoice.items[0].product_id;

      // First call (uncached)
      const startTime1 = Date.now();
      const comparison1 = await priceTrackingService.comparePrice(TEST_USER_ID, productId, 90);
      const duration1 = Date.now() - startTime1;
      console.log(`First price comparison (uncached): ${duration1}ms`);

      // Second call (cached)
      const startTime2 = Date.now();
      const comparison2 = await priceTrackingService.comparePrice(TEST_USER_ID, productId, 90);
      const duration2 = Date.now() - startTime2;
      console.log(`Second price comparison (cached): ${duration2}ms`);

      expect(duration2).toBeLessThan(CACHE_THRESHOLD_MS);
      expect(duration2).toBeLessThan(duration1 / 5); // Should be at least 5x faster
      expect(comparison1.merchants.length).toBe(comparison2.merchants.length);
    });
  });

  describe('Query Optimization', () => {
    it('should use compound indexes for user + date queries', async () => {
      const startTime = Date.now();

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const result = await invoiceService.listInvoices({
        userId: TEST_USER_ID,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });

      const duration = Date.now() - startTime;
      console.log(`User + date query with 100 limit: ${duration}ms`);

      // Should be fast due to compound index
      expect(duration).toBeLessThan(1500);
    });

    it('should use compound indexes for user + category queries', async () => {
      const startTime = Date.now();

      const result = await invoiceService.listInvoices({
        userId: TEST_USER_ID,
        category: 'supermarket',
        limit: 100,
      });

      const duration = Date.now() - startTime;
      console.log(`User + category query with 100 limit: ${duration}ms`);

      // Should be fast due to compound index
      expect(duration).toBeLessThan(1000);
    });

    it('should handle complex multi-filter queries efficiently', async () => {
      const startTime = Date.now();

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const result = await invoiceService.listInvoices({
        userId: TEST_USER_ID,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        category: 'supermarket',
        minAmount: 50,
        maxAmount: 500,
        limit: 50,
      });

      const duration = Date.now() - startTime;
      console.log(`Complex multi-filter query: ${duration}ms`);

      // Should still be reasonably fast with multiple filters
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Analytics Performance', () => {
    it('should generate insights for large dataset within threshold', async () => {
      const startTime = Date.now();

      const insights = await analyticsService.generateInsights(TEST_USER_ID);

      const duration = Date.now() - startTime;
      console.log(`Generated insights for ${insights.totalInvoices} invoices in ${duration}ms`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      expect(insights.totalInvoices).toBeGreaterThanOrEqual(LARGE_DATASET_SIZE);
      expect(insights.categoryBreakdown.length).toBeGreaterThan(0);
      expect(insights.topMerchants.length).toBeGreaterThan(0);
    });

    it('should calculate monthly trends efficiently', async () => {
      const startTime = Date.now();

      const insights = await analyticsService.generateInsights(TEST_USER_ID);

      const duration = Date.now() - startTime;
      console.log(`Calculated monthly trends in ${duration}ms`);

      expect(insights.monthlyTrend.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks with repeated operations', async () => {
      const iterations = 10;
      const memorySnapshots: number[] = [];

      for (let i = 0; i < iterations; i++) {
        await invoiceService.listInvoices({
          userId: TEST_USER_ID,
          limit: 25,
        });

        if (global.gc) {
          global.gc();
        }

        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        memorySnapshots.push(memUsage);
      }

      console.log('Memory usage (MB):', memorySnapshots);

      // Memory should not grow significantly
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const growth = lastSnapshot - firstSnapshot;

      console.log(`Memory growth: ${growth.toFixed(2)} MB`);
      expect(growth).toBeLessThan(50); // Should not grow more than 50MB
    });

    it('should handle cache size appropriately', () => {
      const cacheSize = cacheManager.size();
      console.log(`Cache size: ${cacheSize} entries`);

      // Cache should not grow unbounded
      expect(cacheSize).toBeLessThan(1000);
    });
  });
});

console.log('Performance tests configured. Run with: npm test invoice-performance.test.ts');
