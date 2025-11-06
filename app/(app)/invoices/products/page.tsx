'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ShoppingListBuilder from '@/components/invoices/ShoppingListBuilder';

interface Product {
  id: string;
  name: string;
  productCode?: string;
  ncmCode?: string;
  category: string;
  subcategory?: string;
  statistics: {
    purchaseCount: number;
    averagePrice: number;
    lastPurchaseDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  total: number;
  limit: number;
  offset: number;
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      params.set('limit', '50');

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      if (categoryFilter) {
        params.set('category', categoryFilter);
      }

      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const result: ProductsResponse = await response.json();
      setProducts(result.data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Real-time updates for products (refresh when invoices change as they affect products)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { Client } = require('appwrite');
    
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'horizon_ai_db';

    // Subscribe to both products and invoices changes
    const unsubscribeProducts = client.subscribe(
      `databases.${databaseId}.collections.products.documents`,
      (response: any) => {
        fetchProducts();
      }
    );

    const unsubscribeInvoices = client.subscribe(
      `databases.${databaseId}.collections.invoices.documents`,
      (response: any) => {
        fetchProducts();
      }
    );

    return () => {
      if (unsubscribeProducts && typeof unsubscribeProducts === 'function') {
        unsubscribeProducts();
      }
      if (unsubscribeInvoices && typeof unsubscribeInvoices === 'function') {
        unsubscribeInvoices();
      }
    };
  }, [fetchProducts]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Handle product click
  const handleProductClick = (productId: string) => {
    setSelectedProduct(productId);
    // Navigate to product details (will be implemented in next subtasks)
    router.push(`/invoices/products/${productId}`);
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-normal text-on-surface">Produtos</h1>
          <p className="text-base text-on-surface-variant mt-1">
            Acompanhe preços e histórico de compras dos seus produtos
          </p>
        </div>
        <Button onClick={() => setShowShoppingList(!showShoppingList)}>
          {showShoppingList ? 'Ver Produtos' : 'Criar Lista de Compras'}
        </Button>
      </header>

      {/* Shopping List Builder */}
      {showShoppingList && !loading && !error && products.length > 0 && (
        <ShoppingListBuilder availableProducts={products} />
      )}

      {/* Search and Filters */}
      {!showShoppingList && (
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas as categorias</option>
              <option value="pharmacy">Farmácia</option>
              <option value="groceries">Hortifruti</option>
              <option value="supermarket">Supermercado</option>
              <option value="restaurant">Restaurante</option>
              <option value="fuel">Combustível</option>
              <option value="retail">Varejo</option>
              <option value="services">Serviços</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>
      </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 mb-6 bg-error/10 border-error/20">
          <p className="text-error">{error}</p>
          <Button variant="text" onClick={fetchProducts} className="mt-2">
            Tentar Novamente
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <Card className="py-12 text-center flex flex-col items-center border-2 border-dashed border-outline bg-surface shadow-none">
          <svg
            className="w-16 h-16 text-on-surface-variant mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="text-lg font-medium text-on-surface">Nenhum Produto Encontrado</h3>
          <p className="text-on-surface-variant text-sm mt-2 max-w-sm">
            {searchQuery || categoryFilter
              ? 'Tente ajustar os filtros de busca.'
              : 'Adicione notas fiscais para começar a rastrear produtos e preços.'}
          </p>
        </Card>
      )}

      {/* Products Grid */}
      {!showShoppingList && !loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProductClick(product.id)}
            >
              {/* Product Icon */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium text-on-surface line-clamp-2">{product.name}</h3>
                  {product.productCode && (
                    <p className="text-xs text-on-surface-variant mt-1">Código: {product.productCode}</p>
                  )}
                </div>
              </div>

              {/* Product Statistics */}
              <div className="space-y-2 border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Preço Médio</span>
                  <span className="text-sm font-medium text-on-surface">
                    {formatCurrency(product.statistics.averagePrice)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Compras</span>
                  <span className="text-sm font-medium text-on-surface">
                    {product.statistics.purchaseCount}x
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Última Compra</span>
                  <span className="text-sm font-medium text-on-surface">
                    {formatDate(product.statistics.lastPurchaseDate)}
                  </span>
                </div>
              </div>

              {/* View Details Button */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  className="w-full text-sm text-primary hover:text-primary-dark font-medium flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product.id);
                  }}
                >
                  Ver Histórico de Preços
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
