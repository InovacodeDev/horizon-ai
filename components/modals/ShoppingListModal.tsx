'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';
import { DATABASE_ID } from '@/lib/appwrite/schema';
import {
  XIcon,
  CheckIcon,
  FileTextIcon,
  ShoppingCartIcon,
  SparklesIcon,
  Trash2Icon,
} from '@/components/assets/Icons';
import { generateShoppingListPDF, downloadPDF } from '@/lib/utils/pdf-generator';

interface ShoppingListItem {
  $id: string;
  product_name: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  actual_price?: number;
  checked: boolean;
  category?: string;
  subcategory?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
}

interface ShoppingList {
  $id: string;
  title: string;
  category: string;
  generated_by_ai: boolean;
  estimated_total: number;
  actual_total?: number;
  completed: boolean;
  created_at: string;
}

interface ShoppingListModalProps {
  listId: string;
  onClose: () => void;
}

export default function ShoppingListModal({ listId, onClose }: ShoppingListModalProps) {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch list and items
  const fetchListData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shopping-list/${listId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar lista');
      }

      const data = await response.json();
      setList(data.list);
      setItems(data.items || []);
    } catch (err: any) {
      console.error('Error fetching list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  // Initial data fetch
  useEffect(() => {
    fetchListData();
  }, [fetchListData]);

  // Realtime subscriptions for auto-updates
  useAppwriteRealtime({
    channels: [
      `databases.${DATABASE_ID}.collections.shopping_list_items.documents`,
    ],
    onUpdate: (payload) => {
      // Atualiza apenas se for um item desta lista
      if (payload.shopping_list_id === listId) {
        console.log('Realtime: Item updated', payload);
        // Atualiza o item específico no estado local
        setItems(prev => prev.map(item => 
          item.$id === payload.$id ? { ...item, ...payload } : item
        ));
      }
    },
    enabled: !!listId,
  });

  // Toggle item checked
  const toggleItemChecked = async (itemId: string) => {
    const item = items.find((i) => i.$id === itemId);
    if (!item) return;

    const newCheckedState = !item.checked;

    // Optimistic update
    setItems((prev) => prev.map((i) => (i.$id === itemId ? { ...i, checked: newCheckedState } : i)));

    try {
      const response = await fetch(`/api/shopping-list/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: newCheckedState }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar item');
      }
    } catch (err) {
      console.error('Error updating item:', err);
      // Revert on error
      setItems((prev) => prev.map((i) => (i.$id === itemId ? { ...i, checked: !newCheckedState } : i)));
    }
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.$id === itemId ? { ...i, quantity } : i)));
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    if (!confirm('Deseja remover este item da lista?')) return;

    // Optimistic delete
    const itemToDelete = items.find((i) => i.$id === itemId);
    if (!itemToDelete) return;

    setItems((prev) => prev.filter((i) => i.$id !== itemId));

    try {
      const response = await fetch(`/api/shopping-list/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('✗ Erro ao remover item');
      // Restore item on error
      setItems((prev) => [...prev, itemToDelete]);
    }
  };

  // Save changes (only quantity and checked state, price is read-only)
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Update all items that have quantity or checked changes
      await Promise.all(
        items.map((item) =>
          fetch(`/api/shopping-list/items/${item.$id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quantity: item.quantity,
              checked: item.checked,
            }),
            credentials: 'include',
          }),
        ),
      );

      alert('✓ Alterações salvas com sucesso!');
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('✗ Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!list) return;

    const pdfBlob = generateShoppingListPDF({
      title: list.title,
      category: list.category,
      items: items.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price,
        category: item.category,
        subcategory: item.subcategory,
      })),
      estimatedTotal: list.estimated_total,
      generatedByAI: list.generated_by_ai,
      generatedDate: new Date(list.created_at).toLocaleDateString('pt-BR'),
    });

    const filename = `lista-compras-${list.category}-${new Date().toISOString().split('T')[0]}.pdf`;
    downloadPDF(pdfBlob, filename);
  };

  // Calculate totals
  const estimatedTotal = items.reduce((sum, item) => sum + item.quantity * item.estimated_price, 0);
  const checkedCount = items.filter((i) => i.checked).length;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-outline flex items-center justify-between">
          <div className="flex items-center gap-3">
            {list?.generated_by_ai ? (
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingCartIcon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-on-surface">{list?.title || 'Carregando...'}</h2>
              <p className="text-xs text-on-surface-variant">
                {checkedCount} de {items.length} itens marcados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center"
          >
            <XIcon className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-12">
              <p className="text-on-surface-variant">Carregando...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-12">
              <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-on-surface-variant opacity-50" />
              <p className="text-on-surface-variant">Nenhum item encontrado</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.$id}
                  className={`p-3 rounded-lg border transition-colors ${
                    item.checked
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-surface border-outline hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleItemChecked(item.$id)}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        item.checked
                          ? 'bg-green-600 border-green-600'
                          : 'border-outline hover:border-primary'
                      }`}
                    >
                      {item.checked && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm ${item.checked ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {item.product_name}
                      </h3>
                      
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-on-surface-variant">Qtd:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.$id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-sm bg-surface border border-outline rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={item.checked}
                          />
                          <span className="text-xs text-on-surface-variant">{item.unit}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-on-surface-variant">Preço Unit:</label>
                          <span className="text-sm font-medium text-on-surface">
                            {formatCurrency(item.estimated_price)}
                          </span>
                        </div>
                      </div>

                      {item.ai_reasoning && (
                        <p className="text-xs text-on-surface-variant mt-2 italic">{item.ai_reasoning}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm font-medium text-on-surface">
                        {formatCurrency(item.quantity * item.estimated_price)}
                      </p>
                      <button
                        onClick={() => deleteItem(item.$id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Remover item"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && items.length > 0 && (
          <div className="p-4 border-t border-outline space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">Total Estimado:</span>
              <span className="font-semibold text-lg text-primary">{formatCurrency(estimatedTotal)}</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="flex-1 border-outline text-on-surface"
              >
                <FileTextIcon className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex-1 bg-primary text-on-primary"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
