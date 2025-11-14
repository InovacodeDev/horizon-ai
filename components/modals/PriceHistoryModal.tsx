'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import Tooltip from '@/components/ui/Tooltip';

interface PriceHistoryEntry {
  id: string;
  purchaseDate: string;
  unitPrice: number;
  quantity: number;
  merchantName: string;
  merchantCnpj: string;
}

interface GroupedPriceEntry {
  id: string;
  purchaseDate: string;
  unitPrice: number;
  pricePerKg: number;
  totalQuantity: number;
  purchaseCount: number;
  merchantName: string;
  merchantCnpj: string;
  dateRange?: string;
}

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export default function PriceHistoryModal({ isOpen, onClose, productId, productName }: PriceHistoryModalProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'history'>('insights');

  useEffect(() => {
    if (!isOpen || !productId) return;

    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${productId}/price-history`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch price history');
        }

        const result = await response.json();
        setPriceHistory(result.data || []);
      } catch (err: any) {
        console.error('Error fetching price history:', err);
        setError(err.message || 'Failed to load price history');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [isOpen, productId]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Format date for chart (shorter)
  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  };

  // Group purchases within 1 day with same price
  const groupedHistory = useMemo(() => {
    if (priceHistory.length === 0) return [];

    // Sort by date descending
    const sorted = [...priceHistory].sort((a, b) => 
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );

    const groups: GroupedPriceEntry[] = [];
    const processed = new Set<string>();

    sorted.forEach((entry) => {
      if (processed.has(entry.id)) return;

      const entryDate = new Date(entry.purchaseDate);
      const oneDayBefore = new Date(entryDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      const oneDayAfter = new Date(entryDate);
      oneDayAfter.setDate(oneDayAfter.getDate() + 1);

      // Find similar purchases (same price, within 1 day)
      const similar = sorted.filter((e) => {
        if (processed.has(e.id)) return false;
        const eDate = new Date(e.purchaseDate);
        return (
          Math.abs(e.unitPrice - entry.unitPrice) < 0.01 && // Same price (tolerance for floating point)
          eDate >= oneDayBefore &&
          eDate <= oneDayAfter
        );
      });

      // Mark as processed
      similar.forEach((e) => processed.add(e.id));

      // Calculate totals
      const totalQuantity = similar.reduce((sum, e) => sum + e.quantity, 0);
      // Preço por kg = preço unitário dividido pela quantidade de cada item
      // Ex: Se comprou 0,7kg por R$ 7,00, o preço/kg é R$ 7,00 / 0,7 = R$ 10,00/kg
      // Usa a primeira entrada como referência (todas têm o mesmo preço unitário)
      const pricePerKg = entry.quantity > 0 ? entry.unitPrice / entry.quantity : entry.unitPrice;

      // Date range if multiple purchases
      let dateRange: string | undefined;
      if (similar.length > 1) {
        const dates = similar.map((e) => new Date(e.purchaseDate)).sort((a, b) => a.getTime() - b.getTime());
        const firstDate = formatDate(dates[0].toISOString());
        const lastDate = formatDate(dates[dates.length - 1].toISOString());
        if (firstDate !== lastDate) {
          dateRange = `${firstDate} - ${lastDate}`;
        }
      }

      groups.push({
        id: entry.id,
        purchaseDate: entry.purchaseDate,
        unitPrice: entry.unitPrice,
        pricePerKg,
        totalQuantity,
        purchaseCount: similar.length,
        merchantName: entry.merchantName,
        merchantCnpj: entry.merchantCnpj,
        dateRange,
      });
    });

    return groups;
  }, [priceHistory]);

  // Calculate statistics with useMemo
  const stats = useMemo(() => {
    if (groupedHistory.length === 0) return null;

    const prices = groupedHistory.map(e => e.unitPrice);
    const pricesPerKg = groupedHistory.map(e => e.pricePerKg);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const minPricePerKg = Math.min(...pricesPerKg);
    const maxPricePerKg = Math.max(...pricesPerKg);
    const avgPricePerKg = pricesPerKg.reduce((sum, p) => sum + p, 0) / pricesPerKg.length;

    // Find cheapest and most expensive entries
    const cheapest = groupedHistory.find(e => e.unitPrice === minPrice)!;
    const mostExpensive = groupedHistory.find(e => e.unitPrice === maxPrice)!;
    const cheapestPerKg = groupedHistory.find(e => e.pricePerKg === minPricePerKg)!;

    return {
      totalPurchases: priceHistory.length,
      groupedPurchases: groupedHistory.length,
      minPrice,
      maxPrice,
      avgPrice,
      minPricePerKg,
      maxPricePerKg,
      avgPricePerKg,
      cheapest: {
        price: minPrice,
        merchant: cheapest.merchantName,
        date: formatDate(cheapest.purchaseDate),
      },
      mostExpensive: {
        price: maxPrice,
        merchant: mostExpensive.merchantName,
        date: formatDate(mostExpensive.purchaseDate),
      },
      cheapestPerKg: {
        price: minPricePerKg,
        merchant: cheapestPerKg.merchantName,
        date: formatDate(cheapestPerKg.purchaseDate),
      },
    };
  }, [groupedHistory, priceHistory]);

  // Prepare chart data - últimos 12 preços únicos
  const chartData = useMemo(() => {
    if (groupedHistory.length === 0) return [];

    // Pegar últimos 12 e ordenar por data
    const sortedGroups = [...groupedHistory]
      .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())
      .slice(-12);

    return sortedGroups.map((entry) => ({
      date: formatChartDate(entry.purchaseDate),
      fullDate: entry.dateRange || formatDate(entry.purchaseDate),
      price: entry.unitPrice,
      pricePerKg: entry.pricePerKg,
      merchant: entry.merchantName,
    }));
  }, [groupedHistory]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico de Preços - ${productName}`} size="large">
      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-bg border border-red-border text-red-text px-4 py-3.5 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && priceHistory.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-on-surface-variant mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-on-surface mb-2">Nenhum Histórico Disponível</h3>
            <p className="text-on-surface-variant">
              Ainda não há dados de preços para este produto.
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && priceHistory.length > 0 && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-outline">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'insights'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Insights
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Histórico Completo
                </button>
              </div>
            </div>

            {/* Insights Tab */}
            {activeTab === 'insights' && chartData.length > 0 && (
              <div className="space-y-6">
                {/* Gráfico - Últimos 12 preços */}
                <div className="bg-surface-variant/10 rounded-lg p-4 dark:bg-surface-variant/20">
                  <h3 className="text-lg font-medium text-on-surface mb-4">Evolução de Preços (Últimos 12)</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-outline opacity-20" />
                      <XAxis 
                        dataKey="date" 
                        stroke="currentColor"
                        className="text-on-surface-variant"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: 'hsl(var(--on-surface-variant))' }}
                      />
                      <YAxis 
                        stroke="currentColor"
                        className="text-on-surface-variant"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: 'hsl(var(--on-surface-variant))' }}
                        tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
                      />
                      <ChartTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return payload[0].payload.fullDate;
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--surface))',
                          color: 'hsl(var(--on-surface))',
                          border: '1px solid hsl(var(--outline))',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ 
                          fill: 'hsl(var(--primary))', 
                          stroke: 'hsl(var(--surface))',
                          strokeWidth: 2,
                          r: 5 
                        }}
                        activeDot={{ 
                          r: 7,
                          fill: 'hsl(var(--primary))',
                          stroke: 'hsl(var(--surface))',
                          strokeWidth: 2,
                        }}
                        name="Preço"
                        animationDuration={800}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-on-surface">Histórico Completo</h3>
                  <div className="text-xs text-on-surface-variant bg-surface-variant/20 px-3 py-1.5 rounded-full">
                    {groupedHistory.length} {groupedHistory.length === 1 ? 'compra agrupada' : 'compras agrupadas'} de {priceHistory.length} {priceHistory.length === 1 ? 'registro' : 'registros'}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-outline">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline bg-surface-variant/20">
                        <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Data</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Estabelecimento</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-on-surface-variant">Qtd Total</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-on-surface-variant">Preço Unit.</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-on-surface-variant">Preço/Kg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedHistory.map((entry) => (
                        <tr key={entry.id} className="border-b border-outline/50 hover:bg-surface-variant/10 dark:hover:bg-surface-variant/20">
                          <td className="py-3 px-4 text-sm text-on-surface">
                            <div>
                              {entry.dateRange || formatDate(entry.purchaseDate)}
                            </div>
                            {entry.purchaseCount > 1 && (
                              <div className="text-xs text-on-surface-variant mt-0.5">
                                {entry.purchaseCount} compras
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-on-surface">{entry.merchantName}</td>
                          <td className="py-3 px-4 text-sm text-on-surface text-right">
                            {entry.totalQuantity.toFixed(3)}
                          </td>
                          <td className="py-3 px-4 text-sm text-on-surface text-right font-medium">
                            {formatCurrency(entry.unitPrice)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-primary">
                            {formatCurrency(entry.pricePerKg)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Rodapé com Estatísticas - Só mostra se houver mais de uma compra */}
                {stats && groupedHistory.length > 1 && (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-variant/10 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-on-surface-variant mb-1">Total de Compras</p>
                        <p className="text-lg font-semibold text-on-surface">{stats.totalPurchases}x</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-on-surface-variant mb-1">Preço Médio</p>
                        <p className="text-lg font-semibold text-on-surface">{formatCurrency(stats.avgPrice)}</p>
                      </div>
                      <Tooltip content={`${stats.cheapest.merchant} - ${stats.cheapest.date}`}>
                        <div className="text-center cursor-help">
                          <p className="text-xs text-on-surface-variant mb-1">Mais Barato</p>
                          <p className="text-lg font-semibold text-success">{formatCurrency(stats.minPrice)}</p>
                        </div>
                      </Tooltip>
                      <Tooltip content={`${stats.mostExpensive.merchant} - ${stats.mostExpensive.date}`}>
                        <div className="text-center cursor-help">
                          <p className="text-xs text-on-surface-variant mb-1">Mais Caro</p>
                          <p className="text-lg font-semibold text-error">{formatCurrency(stats.maxPrice)}</p>
                        </div>
                      </Tooltip>
                    </div>
                    
                    {/* Estatísticas por Kg */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-center">
                        <p className="text-xs text-on-surface-variant mb-1">Preço Médio/Kg</p>
                        <p className="text-lg font-semibold text-primary">{formatCurrency(stats.avgPricePerKg)}</p>
                      </div>
                      <Tooltip content={`${stats.cheapestPerKg.merchant} - ${stats.cheapestPerKg.date}`}>
                        <div className="text-center cursor-help">
                          <p className="text-xs text-on-surface-variant mb-1">Melhor Preço/Kg</p>
                          <p className="text-lg font-semibold text-success">{formatCurrency(stats.minPricePerKg)}</p>
                        </div>
                      </Tooltip>
                      <div className="text-center">
                        <p className="text-xs text-on-surface-variant mb-1">Pior Preço/Kg</p>
                        <p className="text-lg font-semibold text-error">{formatCurrency(stats.maxPricePerKg)}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mensagem quando há apenas uma compra */}
                {groupedHistory.length === 1 && (
                  <div className="mt-6 p-4 bg-surface-variant/10 rounded-lg text-center">
                    <p className="text-sm text-on-surface-variant">
                      Adicione mais compras deste produto para ver estatísticas de comparação de preços
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-outline">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface hover:bg-on-surface/5 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
