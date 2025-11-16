'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/lib/contexts/UserContext';
import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';
import { DATABASE_ID } from '@/lib/appwrite/schema';
import {
  ShoppingCartIcon,
  PlusIcon,
  CheckIcon,
  SearchIcon,
  Trash2Icon,
  LoaderIcon,
} from '@/components/assets/Icons';
import { getCategoryLabel } from '@/components/ui/CategoryChip';

interface Product {
  $id: string;
  name: string;
  category: string;
  subcategory?: string;
  average_price: number;
  last_purchase_date?: string;
  total_purchases: number;
  last_quantity?: number;
}

interface SelectedItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  category: string;
  subcategory?: string;
}

interface ManualShoppingListBuilderProps {
  onListCreated?: () => void;
}

export default function ManualShoppingListBuilder({ onListCreated }: ManualShoppingListBuilderProps) {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listTitle, setListTitle] = useState('');

  const categories = [
    { value: '', label: 'Todas as categorias' },
    { value: 'supermarket', label: 'Supermercado' },
    { value: 'pharmacy', label: 'Farmácia' },
    { value: 'groceries', label: 'Mercearia' },
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'retail', label: 'Varejo' },
    { value: 'other', label: 'Outros' },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter]);

  // Realtime subscriptions para atualizar produtos quando houver mudanças
  useAppwriteRealtime({
    channels: [
      `databases.${DATABASE_ID}.collections.products.documents`,
    ],
    onCreate: () => fetchProducts(),
    onUpdate: () => fetchProducts(),
    onDelete: () => fetchProducts(),
    enabled: !!user,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // A API retorna data.data, não data.products
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const addItem = (product: Product) => {
    const newItem: SelectedItem = {
      product_id: product.$id,
      product_name: product.name,
      quantity: 1,
      unit: 'un',
      estimated_price: product.average_price,
      category: product.category,
      subcategory: product.subcategory,
    };

    setSelectedItems(new Map(selectedItems.set(product.$id, newItem)));
  };

  const removeItem = (productId: string) => {
    const newItems = new Map(selectedItems);
    newItems.delete(productId);
    setSelectedItems(newItems);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = selectedItems.get(productId);
    if (item && quantity > 0) {
      item.quantity = quantity;
      setSelectedItems(new Map(selectedItems.set(productId, item)));
    }
  };

  const calculateTotal = () => {
    let total = 0;
    selectedItems.forEach((item) => {
      total += item.quantity * item.estimated_price;
    });
    return total;
  };

  const handleCreateList = async () => {
    if (!user || selectedItems.size === 0) return;

    if (!listTitle.trim()) {
      alert('Por favor, informe um título para a lista');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const items = Array.from(selectedItems.values());
      const totalEstimated = calculateTotal();

      const response = await fetch('/api/shopping-list/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: listTitle,
          category: categoryFilter || 'other',
          estimated_total: totalEstimated,
          items,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao criar lista');
      }

      alert('✓ Lista criada com sucesso!');
      setSelectedItems(new Map());
      setListTitle('');
      
      if (onListCreated) {
        onListCreated();
      }
    } catch (err: any) {
      console.error('Error creating list:', err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title Input */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Nome da Lista *
            </label>
            <input
              type="text"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              placeholder="Ex: Compras do Mês, Lista de Natal..."
              className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="w-5 h-5 text-primary" />
            <span className="font-medium text-on-surface">
              {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'itens'} selecionado(s)
            </span>
            <span className="ml-auto text-lg font-semibold text-primary">
              {formatCurrency(calculateTotal())}
            </span>
          </div>

          {selectedItems.size > 0 && (
            <Button
              onClick={handleCreateList}
              disabled={creating || !listTitle.trim()}
              className="w-full bg-primary text-on-primary"
            >
              {creating ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Criando Lista...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Criar Lista
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Selected Items */}
      {selectedItems.size > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-on-surface mb-3">Itens Selecionados</h3>
          <div className="space-y-2">
            {Array.from(selectedItems.values()).map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-3 p-3 bg-surface-container rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-on-surface truncate">{item.product_name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {formatCurrency(item.estimated_price)} / {item.unit}
                  </p>
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-sm bg-surface border border-outline rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium text-on-surface w-20 text-right">
                  {formatCurrency(item.quantity * item.estimated_price)}
                </span>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-grow relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-10 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Products List */}
      {loading && (
        <Card className="p-8">
          <div className="text-center text-on-surface-variant">Carregando produtos...</div>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </Card>
      )}

      {!loading && filteredProducts.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <ShoppingCartIcon className="w-16 h-16 mx-auto mb-4 text-on-surface-variant opacity-50" />
            <h3 className="text-lg font-semibold text-on-surface mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-on-surface-variant">
              {searchQuery || categoryFilter
                ? 'Tente ajustar os filtros de busca'
                : 'Adicione notas fiscais para começar a rastrear produtos'}
            </p>
          </div>
        </Card>
      )}

      {!loading && filteredProducts.length > 0 && (
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const isSelected = selectedItems.has(product.$id);
            return (
              <Card
                key={product.$id}
                className={`p-4 transition-colors ${
                  isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-surface-container'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-on-surface mb-1">{product.name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
                      <span className="px-2 py-1 bg-surface-container rounded">
                        {getCategoryLabel(product.category as any)}
                      </span>
                      <span>
                        Última compra: <strong>{formatDate(product.last_purchase_date)}</strong>
                      </span>
                      {product.last_quantity && (
                        <span>
                          Última qtd: <strong>{product.last_quantity} un</strong>
                        </span>
                      )}
                      <span>
                        Compras: <strong>{product.total_purchases}x</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(product.average_price)}
                    </span>
                    <Button
                      onClick={() => isSelected ? removeItem(product.$id) : addItem(product)}
                      variant={isSelected ? 'outline' : 'primary'}
                      size="sm"
                      className={isSelected ? 'border-red-600 text-red-600' : ''}
                    >
                      {isSelected ? (
                        <>
                          <Trash2Icon className="w-4 h-4 mr-1" />
                          Remover
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
