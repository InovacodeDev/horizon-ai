'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShoppingListItem } from '@/lib/appwrite/schema';
import { generateShoppingListPDF, downloadPDF } from '@/lib/utils/pdf-generator';
import { 
  SparklesIcon, 
  ShoppingCartIcon, 
  FileTextIcon, 
  TrendingUpIcon,
  CalendarIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckIcon
} from '@/components/assets/Icons';

interface AIShoppingListBuilderProps {
  userId: string;
}

interface GeneratedListItem {
  product_name: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  category?: string;
  subcategory?: string;
  ai_confidence: number;
  ai_reasoning: string;
  checked?: boolean;
}

interface GeneratedList {
  shoppingList: {
    $id: string;
    title: string;
    category: string;
    estimated_total: number;
  };
  items: GeneratedListItem[];
  summary: {
    totalItems: number;
    estimatedTotal: number;
    category: string;
    historicalMonths: number;
    invoiceCount: number;
  };
}

export default function AIShoppingListBuilder({ userId }: AIShoppingListBuilderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('supermarket');
  const [historicalMonths, setHistoricalMonths] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedList, setGeneratedList] = useState<GeneratedList | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);

  const categories = [
    { value: 'supermarket', label: 'Supermercado' },
    { value: 'pharmacy', label: 'Farmácia' },
    { value: 'groceries', label: 'Mercearia' },
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'retail', label: 'Varejo' },
    { value: 'other', label: 'Outros' },
  ];

  const monthOptions = [
    { value: 3, label: '3 meses' },
    { value: 6, label: '6 meses' },
    { value: 12, label: '1 ano (recomendado)' },
    { value: 24, label: '2 anos' },
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Generate AI shopping list (async request)
  const handleGenerateAI = async () => {
    try {
      setLoading(true);
      setLoadingProgress(30);
      setError(null);

      const response = await fetch('/api/shopping-list/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          historicalMonths,
        }),
        credentials: 'include',
      });

      setLoadingProgress(60);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao criar requisição');
      }

      setLoadingProgress(100);

      // Show success message and redirect to lists page
      setError(null);
      alert('✓ ' + data.data.message + '\n\nVocê será redirecionado para a página de listas.');
      
      // Redirect to lists page after 2 seconds
      setTimeout(() => {
        window.location.href = '/invoices/lists';
      }, 2000);

    } catch (err: any) {
      console.error('Error creating shopping list request:', err);
      setError(err.message || 'Erro ao criar requisição');
      setLoadingProgress(0);
    } finally {
      // Keep loading state until redirect
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!generatedList) return;

    const pdfBlob = generateShoppingListPDF({
      title: generatedList.shoppingList.title,
      category: generatedList.shoppingList.category,
      items: generatedList.items.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price,
        category: item.category,
        subcategory: item.subcategory,
      })),
      estimatedTotal: generatedList.shoppingList.estimated_total,
      generatedByAI: true,
      generatedDate: new Date().toLocaleDateString('pt-BR'),
    });

    const filename = `lista-compras-${generatedList.shoppingList.category}-${new Date().toISOString().split('T')[0]}.pdf`;
    downloadPDF(pdfBlob, filename);
  };

  // Toggle item checked state
  const toggleItemChecked = (index: number) => {
    if (!generatedList) return;
    const newItems = [...generatedList.items];
    newItems[index].checked = !newItems[index].checked;
    setGeneratedList({
      ...generatedList,
      items: newItems,
    });
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (confidence >= 0.6) return 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    return 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Section */}
      {!generatedList && (
        <Card className="p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-surface mb-1">
                  Lista Inteligente com IA
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Analise seu histórico de compras e gere uma lista personalizada baseada no seu padrão de consumo
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileTextIcon className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">Analisa seu histórico</p>
                  <p className="text-xs text-on-surface-variant">
                    A IA examina todas as suas notas fiscais do período selecionado
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUpIcon className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">Calcula padrões de consumo</p>
                  <p className="text-xs text-on-surface-variant">
                    Identifica frequência de compra e quantidade média de cada produto
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCartIcon className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">Gera lista inteligente</p>
                  <p className="text-xs text-on-surface-variant">
                    Sugere produtos e quantidades baseado no que você realmente precisa
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowAIModal(true)}
              className="w-full"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Gerar Lista Inteligente
            </Button>
          </div>
        </Card>
      )}

      {/* AI Configuration Modal */}
      {showAIModal && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-on-surface">Configurar Geração de Lista</h3>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-error/10 border border-error rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-error text-sm mb-1">Erro ao gerar lista</p>
                  <p className="text-sm text-error/90">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-primary text-sm mb-1">Gerando lista inteligente...</p>
                  <p className="text-xs text-on-surface-variant">Analisando seu histórico de compras e calculando padrões de consumo</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-on-surface-variant text-right mt-1">{loadingProgress}%</p>
            </div>
          )}

          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-on-surface mb-2">
              Categoria da Lista
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedCategory === cat.value
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-outline hover:border-primary/50 dark:border-outline-variant'
                  }`}
                >
                  <div className="text-sm font-medium text-on-surface">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Historical Period */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-on-surface mb-2">
              Período de Análise
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {monthOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHistoricalMonths(option.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    historicalMonths === option.value
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-outline hover:border-primary/50 dark:border-outline-variant'
                  }`}
                >
                  <div className="text-sm font-medium text-on-surface text-center">{option.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              Quanto maior o período, mais precisa a análise
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGenerateAI} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Gerando Lista...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Gerar Lista com IA
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowAIModal(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Generated List Display */}
      {generatedList && (
        <div className="space-y-4">
          {/* Header with actions */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">{generatedList.shoppingList.title}</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  {generatedList.summary.totalItems} itens • {generatedList.summary.invoiceCount} notas fiscais • {generatedList.summary.historicalMonths} meses
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExportPDF} variant="outline" size="sm">
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button onClick={() => setGeneratedList(null)} variant="ghost" size="sm">
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Nova Lista
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Total Estimado</p>
                  <p className="text-xl font-semibold text-primary">
                    {formatCurrency(generatedList.shoppingList.estimated_total)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant mb-1">Progresso</p>
                  <p className="text-lg font-semibold text-on-surface">
                    {generatedList.items.filter((i) => i.checked).length} / {generatedList.items.length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Items grouped by category */}
          {Object.entries(
            generatedList.items.reduce(
              (acc, item, index) => {
                const cat = item.category || 'Outros';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push({ ...item, index });
                return acc;
              },
              {} as Record<string, Array<GeneratedListItem & { index: number }>>,
            ),
          ).map(([category, items]) => (
            <Card key={category} className="p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline/50">
                <ShoppingCartIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-on-surface">{category}</h3>
                <span className="text-xs text-on-surface-variant">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.index}
                    className={`p-4 rounded-lg border transition-all ${
                      item.checked
                        ? 'border-green-500/30 bg-green-50/50 dark:bg-green-900/10 opacity-60'
                        : 'border-outline hover:border-primary/50 bg-surface dark:bg-surface-variant/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItemChecked(item.index)}
                        className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          item.checked
                            ? 'border-green-500 bg-green-500'
                            : 'border-outline dark:border-outline-variant hover:border-primary'
                        }`}
                      >
                        {item.checked && (
                          <CheckIcon className="w-3 h-3 text-white" />
                        )}
                      </button>

                      {/* Item details */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-grow">
                            <h4 className="font-medium text-on-surface text-sm">{item.product_name}</h4>
                            {item.subcategory && (
                              <p className="text-xs text-on-surface-variant mt-0.5">{item.subcategory}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-on-surface">
                              {item.quantity} {item.unit}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {formatCurrency(item.estimated_price * item.quantity)}
                            </p>
                          </div>
                        </div>

                        {/* AI reasoning */}
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-outline/30">
                          <SparklesIcon className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-grow min-w-0">
                            <p className="text-xs text-on-surface-variant">{item.ai_reasoning}</p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${getConfidenceColor(item.ai_confidence)}`}
                          >
                            {Math.round(item.ai_confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
