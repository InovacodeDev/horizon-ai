'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';

interface PriceHistoryEntry {
  id: string;
  purchaseDate: string;
  unitPrice: number;
  quantity: number;
  merchantName: string;
  merchantCnpj: string;
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

  // Prepare chart data - group by unique purchase days (same merchant + same price on same day = 1 purchase)
  const uniquePurchaseDays = new Set<string>();
  const purchasesByDay = new Map<string, { date: string; price: number; merchant: string; count: number }>();
  
  priceHistory.forEach((entry) => {
    const dayKey = entry.purchaseDate.split('T')[0]; // Get just the date part
    const purchaseKey = `${dayKey}-${entry.merchantCnpj}-${entry.unitPrice}`;
    
    if (!purchasesByDay.has(dayKey)) {
      purchasesByDay.set(dayKey, {
        date: dayKey,
        price: entry.unitPrice,
        merchant: entry.merchantName,
        count: 1,
      });
      uniquePurchaseDays.add(dayKey);
    }
  });

  const chartData = Array.from(purchasesByDay.values()).map((entry) => ({
    date: formatChartDate(entry.date),
    fullDate: formatDate(entry.date),
    price: entry.price,
    merchant: entry.merchant,
  }));

  // Determine if we should show the chart (only if more than 1 unique purchase day)
  const shouldShowChart = uniquePurchaseDays.size > 1;

  // Calculate statistics
  const stats = priceHistory.length > 0 ? {
    minPrice: Math.min(...priceHistory.map(e => e.unitPrice)),
    maxPrice: Math.max(...priceHistory.map(e => e.unitPrice)),
    avgPrice: priceHistory.reduce((sum, e) => sum + e.unitPrice, 0) / priceHistory.length,
    totalPurchases: priceHistory.length,
  } : null;

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
          <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
            {error}
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
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-variant/20 rounded-lg p-4 dark:bg-surface-variant/30">
                  <p className="text-sm text-on-surface-variant mb-1">Preço Mínimo</p>
                  <p className="text-xl font-semibold text-success">{formatCurrency(stats.minPrice)}</p>
                </div>
                <div className="bg-surface-variant/20 rounded-lg p-4 dark:bg-surface-variant/30">
                  <p className="text-sm text-on-surface-variant mb-1">Preço Máximo</p>
                  <p className="text-xl font-semibold text-error">{formatCurrency(stats.maxPrice)}</p>
                </div>
                <div className="bg-surface-variant/20 rounded-lg p-4 dark:bg-surface-variant/30">
                  <p className="text-sm text-on-surface-variant mb-1">Preço Médio</p>
                  <p className="text-xl font-semibold text-on-surface">{formatCurrency(stats.avgPrice)}</p>
                </div>
                <div className="bg-surface-variant/20 rounded-lg p-4 dark:bg-surface-variant/30">
                  <p className="text-sm text-on-surface-variant mb-1">Total de Compras</p>
                  <p className="text-xl font-semibold text-on-surface">{stats.totalPurchases}</p>
                </div>
              </div>
            )}

            {/* Chart - Only show if more than 1 unique purchase day */}
            {shouldShowChart && (
              <div className="bg-surface-variant/10 rounded-lg p-4 dark:bg-surface-variant/20">
                <h3 className="text-lg font-medium text-on-surface mb-4">Evolução de Preços</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-outline opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      stroke="currentColor"
                      className="text-on-surface-variant"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="currentColor"
                      className="text-on-surface-variant"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
                    />
                    <Tooltip 
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
                        padding: '8px',
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Preço"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Purchase History Table */}
            <div>
              <h3 className="text-lg font-medium text-on-surface mb-4">
                Histórico Detalhado {!shouldShowChart && <span className="text-sm font-normal text-on-surface-variant">(Todas as compras)</span>}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline">
                      <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Estabelecimento</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-on-surface-variant">Quantidade</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-on-surface-variant">Preço Unitário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((entry) => (
                      <tr key={entry.id} className="border-b border-outline/50 hover:bg-surface-variant/10 dark:hover:bg-surface-variant/20">
                        <td className="py-3 px-4 text-sm text-on-surface">{formatDate(entry.purchaseDate)}</td>
                        <td className="py-3 px-4 text-sm text-on-surface">{entry.merchantName}</td>
                        <td className="py-3 px-4 text-sm text-on-surface text-right">{entry.quantity}</td>
                        <td className="py-3 px-4 text-sm text-on-surface text-right font-medium">
                          {formatCurrency(entry.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
