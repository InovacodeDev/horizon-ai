'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ShoppingListBuilder from '@/components/invoices/ShoppingListBuilder';
import PriceHistoryModal from '@/components/modals/PriceHistoryModal';
import { CategoryChip, getCategoryLabel, type CategoryType } from '@/components/ui/CategoryChip';
import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';

interface Product {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  name: string;
  product_code?: string;
  ncm_code?: string;
  category: string;
  subcategory?: string;
  total_purchases: number;
  average_price: number;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
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
  const [selectedProduct, setSelectedProduct] = useState<{ $id: string; name: string } | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      // Fetch directly from Appwrite using the browser client
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

      if (!databaseId) {
        throw new Error('Database ID not configured');
      }

      // Build queries - limite de 500 para garantir que todos os produtos sejam retornados
      const queries: string[] = [];
      
      // Aumentar limite para retornar todos os produtos (máximo do Appwrite é 5000)
      queries.push(Query.limit(500));
      
      if (searchQuery) {
        queries.push(Query.search('name', searchQuery));
      }
      
      if (categoryFilter) {
        queries.push(Query.equal('category', categoryFilter));
      }

      // Default ordering by name
      queries.push(Query.orderAsc('name'));

      const result = await databases.listRows({databaseId, tableId: 'products', queries});
      const productsData = result.rows as unknown as Product[];
      
      setProducts(productsData);
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

  // Real-time updates for products
  useAppwriteRealtime({
    channels: [`databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.products.documents`],
    enabled: !loading,
    onCreate: () => {
      console.log('📡 Realtime: product created');
      fetchProducts();
    },
    onUpdate: () => {
      console.log('📡 Realtime: product updated');
      fetchProducts();
    },
    onDelete: () => {
      console.log('📡 Realtime: product deleted');
      fetchProducts();
    },
  });

  // Real-time updates for invoices (they affect product statistics)
  useAppwriteRealtime({
    channels: [`databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.invoices.documents`],
    enabled: !loading,
    onCreate: () => {
      console.log('📡 Realtime: invoice created, refreshing products');
      fetchProducts();
    },
    onUpdate: () => {
      console.log('📡 Realtime: invoice updated, refreshing products');
      fetchProducts();
    },
    onDelete: () => {
      console.log('📡 Realtime: invoice deleted, refreshing products');
      fetchProducts();
    },
  });

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

  // Handle product click - open price history modal
  const handleProductClick = (productId: string, productName: string) => {
    setSelectedProduct({ $id: productId, name: productName });
    setShowPriceHistory(true);
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-normal text-on-surface">Produtos</h1>
          <p className="text-base text-on-surface-variant mt-1">
            Acompanhe preços e histórico de compras dos seus produtos
            {!loading && products.length > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({products.length} {products.length === 1 ? 'produto' : 'produtos'})
              </span>
            )}
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
                className="w-full px-4 py-2 pl-10 border border-outline rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-variant/20 dark:border-outline-variant"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-on-surface-variant"
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
              className="px-4 py-2 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-variant/20 dark:border-outline-variant"
            >
              <option value="">Todas as categorias</option>
              <option value="pharmacy">{getCategoryLabel('pharmacy')}</option>
              <option value="groceries">{getCategoryLabel('groceries')}</option>
              <option value="supermarket">{getCategoryLabel('supermarket')}</option>
              <option value="restaurant">{getCategoryLabel('restaurant')}</option>
              <option value="fuel">{getCategoryLabel('fuel')}</option>
              <option value="retail">{getCategoryLabel('retail')}</option>
              <option value="services">{getCategoryLabel('services')}</option>
              <option value="other">{getCategoryLabel('other')}</option>
            </select>
          </div>
        </div>
      </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 mb-6 bg-error/10 border-error/20">
          <p className="text-error">{error}</p>
          <Button variant="ghost" onClick={fetchProducts} className="mt-2">
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
              key={product.$id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProductClick(product.$id, product.name)}
            >
              {/* Product Header */}
              <div className="mb-3">
                <h3 className="font-medium text-on-surface line-clamp-2 mb-2">{product.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.category && (
                    <CategoryChip category={product.category as CategoryType} />
                  )}
                  {product.product_code && (
                    <span className="text-xs text-on-surface-variant">Cód: {product.product_code}</span>
                  )}
                </div>
              </div>

              {/* Product Statistics */}
              <div className="space-y-2 border-t border-outline pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Preço Médio</span>
                  <span className="text-sm font-medium text-on-surface">
                    {formatCurrency(product.average_price)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Compras</span>
                  <span className="text-sm font-medium text-on-surface">
                    {product.total_purchases}x
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Última Compra</span>
                  <span className="text-sm font-medium text-on-surface">
                    {product.last_purchase_date ? formatDate(product.last_purchase_date) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* View Details Button */}
              <div className="mt-3 pt-3 border-t border-outline">
                <button
                  className="w-full text-sm text-primary hover:text-primary-dark font-medium flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product.$id, product.name);
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

      {/* Price History Modal */}
      {selectedProduct && (
        <PriceHistoryModal
          isOpen={showPriceHistory}
          onClose={() => {
            setShowPriceHistory(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct.$id}
          productName={selectedProduct.name}
        />
      )}
    </div>
  );
}
