'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Product {
  id: string;
  name: string;
  statistics: {
    averagePrice: number;
  };
}

interface ShoppingListItem {
  productId: string;
  productName: string;
  quantity: number;
  estimatedPrice?: number;
}

interface MerchantOption {
  merchantName: string;
  merchantCnpj: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    totalCost: number;
  }>;
  totalCost: number;
  averagePricePerItem: number;
  itemsAvailable: number;
  itemsMissing: number;
}

interface OptimizationResult {
  requestedItems: ShoppingListItem[];
  merchantOptions: MerchantOption[];
  bestOption: {
    merchantName: string;
    merchantCnpj: string;
    totalCost: number;
    itemsAvailable: number;
    itemsMissing: number;
  };
  potentialSavings: number;
  recommendation: string;
}

interface ShoppingListBuilderProps {
  availableProducts: Product[];
}

export default function ShoppingListBuilder({ availableProducts }: ShoppingListBuilderProps) {
  const [selectedProducts, setSelectedProducts] = useState<Map<string, ShoppingListItem>>(new Map());
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Toggle product selection
  const toggleProduct = (product: Product) => {
    const newSelected = new Map(selectedProducts);
    
    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      newSelected.set(product.id, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        estimatedPrice: product.statistics.averagePrice,
      });
    }
    
    setSelectedProducts(newSelected);
  };

  // Update quantity
  const updateQuantity = (productId: string, quantity: number) => {
    const newSelected = new Map(selectedProducts);
    const item = newSelected.get(productId);
    
    if (item && quantity > 0) {
      item.quantity = quantity;
      newSelected.set(productId, item);
      setSelectedProducts(newSelected);
    }
  };

  // Calculate estimated total
  const estimatedTotal = Array.from(selectedProducts.values()).reduce(
    (sum, item) => sum + (item.estimatedPrice || 0) * item.quantity,
    0
  );

  // Optimize shopping list
  const handleOptimize = async () => {
    if (selectedProducts.size === 0) {
      setError('Selecione pelo menos um produto');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const items = Array.from(selectedProducts.values()).map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
      }));

      const response = await fetch('/api/products/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize shopping list');
      }

      const result = await response.json();
      setOptimization(result.data);
      setShowResults(true);
    } catch (err: any) {
      console.error('Error optimizing shopping list:', err);
      setError(err.message || 'Failed to optimize shopping list');
    } finally {
      setLoading(false);
    }
  };

  // Clear list
  const handleClear = () => {
    setSelectedProducts(new Map());
    setOptimization(null);
    setShowResults(false);
    setError(null);
  };

  // Share list (copy to clipboard)
  const handleShare = () => {
    const items = Array.from(selectedProducts.values());
    const text = `Lista de Compras:\n\n${items.map((item) => `- ${item.productName} (${item.quantity}x)`).join('\n')}\n\nTotal Estimado: ${formatCurrency(estimatedTotal)}`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Lista copiada para a área de transferência!');
    }).catch(() => {
      alert('Erro ao copiar lista');
    });
  };

  return (
    <div className="space-y-6">
      {/* Product Selection */}
      {!showResults && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium text-on-surface">Monte sua Lista de Compras</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Selecione os produtos e encontre os melhores preços
              </p>
            </div>
            {selectedProducts.size > 0 && (
              <Button variant="ghost" onClick={handleClear}>
                Limpar Lista
              </Button>
            )}
          </div>

          {/* Selected Products Summary */}
          {selectedProducts.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedProducts.size} {selectedProducts.size === 1 ? 'produto selecionado' : 'produtos selecionados'}
                </span>
                <span className="text-sm font-semibold text-blue-900">
                  Total Estimado: {formatCurrency(estimatedTotal)}
                </span>
              </div>
              
              <div className="space-y-2 mt-3">
                {Array.from(selectedProducts.values()).map((item) => (
                  <div key={item.productId} className="flex items-center justify-between bg-white p-2 rounded">
                    <span className="text-sm text-gray-900">{item.productName}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-gray-600 w-24 text-right">
                        {formatCurrency((item.estimatedPrice || 0) * item.quantity)}
                      </span>
                      <button
                        onClick={() => toggleProduct(availableProducts.find((p) => p.id === item.productId)!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleOptimize} disabled={loading} className="flex-1">
                  {loading ? 'Otimizando...' : 'Encontrar Melhores Preços'}
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  Compartilhar
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableProducts.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product)}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Média: {formatCurrency(product.statistics.averagePrice)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Optimization Results */}
      {showResults && optimization && (
        <div className="space-y-4">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => setShowResults(false)}>
            ← Voltar para Lista
          </Button>

          {/* Best Option Card */}
          <Card className="p-6 bg-green-50 border-2 border-green-300">
            <div className="flex items-start gap-3">
              <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-green-900 mb-1">Melhor Opção</h3>
                <p className="text-2xl font-bold text-green-900 mb-2">
                  {optimization.bestOption.merchantName}
                </p>
                <div className="flex items-center gap-4 text-sm text-green-800">
                  <span>Total: {formatCurrency(optimization.bestOption.totalCost)}</span>
                  <span>•</span>
                  <span>{optimization.bestOption.itemsAvailable} itens disponíveis</span>
                  {optimization.bestOption.itemsMissing > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-orange-700">{optimization.bestOption.itemsMissing} itens faltando</span>
                    </>
                  )}
                </div>
                {optimization.potentialSavings > 0 && (
                  <p className="text-sm text-green-800 mt-2">
                    💰 Economia potencial: {formatCurrency(optimization.potentialSavings)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Recommendation */}
          {optimization.recommendation && (
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-900">{optimization.recommendation}</p>
              </div>
            </Card>
          )}

          {/* All Merchant Options */}
          <div>
            <h3 className="text-lg font-medium text-on-surface mb-3">Todas as Opções</h3>
            <div className="space-y-3">
              {optimization.merchantOptions.map((option, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-on-surface">{option.merchantName}</h4>
                      <p className="text-sm text-on-surface-variant">
                        {option.itemsAvailable} de {optimization.requestedItems.length} itens disponíveis
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-on-surface">
                        {formatCurrency(option.totalCost)}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Média: {formatCurrency(option.averagePricePerItem)}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1 border-t border-gray-200 pt-3">
                    {option.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {item.productName} ({item.quantity}x)
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.totalCost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
