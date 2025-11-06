/**
 * Shopping List Security and Functionality Tests
 *
 * This test suite verifies:
 * 1. Shopping list generation works correctly
 * 2. NFe parsing works correctly
 * 3. Insights generation works correctly
 * 4. API key is not exposed in client-side code
 * 5. Error scenarios return appropriate messages
 */
import { beforeAll, describe, expect, it } from '@jest/globals';

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Shopping List Security and Functionality', () => {
  // ============================================
  // 1. Shopping List Generation Tests
  // ============================================

  describe('Shopping List Generation', () => {
    it('should generate a shopping list from a valid prompt', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Compras da semana',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('title');
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
      expect(typeof data.title).toBe('string');

      // Verify items are strings
      data.items.forEach((item: any) => {
        expect(typeof item).toBe('string');
        expect(item.length).toBeGreaterThan(0);
      });
    });

    it('should return 400 for empty prompt', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: '',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for missing prompt', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });
  });

  // ============================================
  // 2. NFe Parsing Tests
  // ============================================

  describe('NFe Parsing', () => {
    it('should parse a valid NFe URL', async () => {
      // Using a mock URL since we can't test with real NFe URLs
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/parse-nfe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nfeUrl: 'https://sat.sef.sc.gov.br/nfce/consulta?p=12345678901234567890123456789012345678901234',
        }),
      });

      // Note: This will likely fail with the AI since it's a mock URL
      // But we're testing the API structure and error handling
      const data = await response.json();

      if (response.status === 200) {
        expect(data).toHaveProperty('storeName');
        expect(data).toHaveProperty('purchaseDate');
        expect(data).toHaveProperty('totalAmount');
        expect(data).toHaveProperty('items');
        expect(Array.isArray(data.items)).toBe(true);

        // Verify item structure
        if (data.items.length > 0) {
          const item = data.items[0];
          expect(item).toHaveProperty('name');
          expect(item).toHaveProperty('quantity');
          expect(item).toHaveProperty('unitPrice');
          expect(item).toHaveProperty('totalPrice');
        }
      } else {
        // Should return proper error structure
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
        expect(typeof data.message).toBe('string');
      }
    });

    it('should return 400 for invalid URL format', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/parse-nfe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nfeUrl: 'not-a-valid-url',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Invalid');
    });

    it('should return 400 for empty URL', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/parse-nfe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nfeUrl: '',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });

    it('should return 400 for missing nfeUrl', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/parse-nfe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });
  });

  // ============================================
  // 3. Insights Generation Tests
  // ============================================

  describe('Insights Generation', () => {
    const mockPurchaseHistory = [
      {
        $id: 'pr-1',
        storeName: 'Supermercado ABC',
        purchaseDate: '2024-01-15',
        totalAmount: 150.5,
        items: [
          {
            name: 'Café em Pó 3 Corações',
            brand: '3 Corações',
            quantity: 2,
            unitPrice: 18.5,
            totalPrice: 37.0,
          },
          {
            name: 'Leite Integral',
            quantity: 3,
            unitPrice: 5.5,
            totalPrice: 16.5,
          },
        ],
      },
      {
        $id: 'pr-2',
        storeName: 'Supermercado XYZ',
        purchaseDate: '2024-01-20',
        totalAmount: 200.0,
        items: [
          {
            name: 'Café em Pó 3 Corações',
            brand: '3 Corações',
            quantity: 1,
            unitPrice: 18.5,
            totalPrice: 18.5,
          },
        ],
      },
    ];

    it('should generate insights from valid purchase history', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseHistory: mockPurchaseHistory,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('insights');
      expect(typeof data.insights).toBe('string');
      expect(data.insights.length).toBeGreaterThan(0);
    });

    it('should return 400 for empty purchase history', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseHistory: [],
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('empty');
    });

    it('should return 400 for missing purchase history', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });

    it('should return 400 for non-array purchase history', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseHistory: 'not-an-array',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('array');
    });
  });

  // ============================================
  // 4. Security Tests
  // ============================================

  describe('Security - API Key Protection', () => {
    it('should not expose API key in response headers', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
        }),
      });

      const headers = response.headers;
      const headerKeys = Array.from(headers.keys());

      // Check that no header contains API key information
      headerKeys.forEach((key) => {
        const value = headers.get(key) || '';
        expect(value.toLowerCase()).not.toContain('api');
        expect(value.toLowerCase()).not.toContain('key');
        expect(value.toLowerCase()).not.toContain('gemini');
      });
    });

    it('should not expose API key in error responses', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: '',
        }),
      });

      const data = await response.json();
      const responseString = JSON.stringify(data).toLowerCase();

      // Verify no sensitive information in error response
      expect(responseString).not.toContain('gemini_api_key');
      expect(responseString).not.toContain('google_ai_api_key');
      expect(responseString).not.toContain('next_public');
    });
  });

  // ============================================
  // 5. Error Handling Tests
  // ============================================

  describe('Error Handling', () => {
    it('should return user-friendly error messages', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: '',
        }),
      });

      const data = await response.json();

      // Error message should be user-friendly (not technical)
      expect(data.message).toBeDefined();
      expect(typeof data.message).toBe('string');
      expect(data.message.length).toBeGreaterThan(0);
      expect(data.message).not.toContain('undefined');
      expect(data.message).not.toContain('null');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/shopping-list/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      });

      // Should return 400 or 500 with proper error structure
      expect([400, 500]).toContain(response.status);
    });
  });
});
