'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

// ============================================
// Types
// ============================================

interface CategorySpending {
  category: string;
  totalAmount: number;
  invoiceCount: number;
  percentage: number;
  averageAmount: number;
}

interface MerchantStats {
  merchantName: string;
  merchantCnpj: string;
  visitCount: number;
  totalSpent: number;
  averageSpent: number;
  lastVisit: string;
}

interface MonthlySpending {
  month: string;
  year: number;
  monthNumber: number;
  total: number;
  categoryBreakdown: Record<string, number>;
}

interface SpendingPrediction {
  category: string;
  predictedAmount: number;
  confidence: number;
  currentSpending: number;
  daysRemaining: number;
  onTrack: boolean;
  baseline: number;
  trend: number;
}

interface SpendingAnomaly {
  type: 'high_spending' | 'unusual_merchant' | 'category_spike' | 'duplicate_invoice';
  severity: 'low' | 'medium' | 'high';
  description: string;
  invoiceId?: string;
  category?: string;
  amount?: number;
  detectedAt: string;
}

interface BudgetLimit {
  category: string;
  limit: number;
  currentSpending: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  recommendation?: string;
  remaining: number;
}

interface BudgetAlert {
  category: string;
  limit: number;
  currentSpending: number;
  percentage: number;
  threshold: 80 | 100;
  message: string;
}

interface SpendingInsights {
  totalInvoices: number;
  totalSpent: number;
  averageInvoiceAmount: number;
  categoryBreakdown: CategorySpending[];
  topMerchants: MerchantStats[];
  frequentProducts: unknown[];
  monthlyTrend: MonthlySpending[];
  predictions: SpendingPrediction[];
  anomalies: SpendingAnomaly[];
}

interface InsightsResponse {
  insights?: SpendingInsights;
  hasMinimumData: boolean;
  message?: string;
  totalInvoices?: number;
  minimumRequired?: number;
}

// ============================================
// Constants
// ============================================

const CATEGORY_LABELS: Record<string, string> = {
  pharmacy: 'Farmácia',
  groceries: 'Hortifruti',
  supermarket: 'Supermercado',
  restaurant: 'Restaurante',
  fuel: 'Combustível',
  retail: 'Varejo',
  services: 'Serviços',
  other: 'Outro',
};



const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Cores para cada mês (12 cores distintas)
const MONTH_COLORS: Record<number, string> = {
  1: '#3b82f6',  // Janeiro - Azul
  2: '#ec4899',  // Fevereiro - Rosa
  3: '#10b981',  // Março - Verde
  4: '#f59e0b',  // Abril - Laranja
  5: '#8b5cf6',  // Maio - Roxo
  6: '#06b6d4',  // Junho - Ciano
  7: '#ef4444',  // Julho - Vermelho
  8: '#84cc16',  // Agosto - Lima
  9: '#f97316',  // Setembro - Laranja escuro
  10: '#14b8a6', // Outubro - Teal
  11: '#a855f7', // Novembro - Roxo claro
  12: '#0ea5e9', // Dezembro - Azul claro
};

// ============================================
// Main Component
// ============================================

export default function InsightsPage() {
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMinimumData, setHasMinimumData] = useState(false);
  const [insufficientDataMessage, setInsufficientDataMessage] = useState<string>('');
  const [dismissedAnomalies, setDismissedAnomalies] = useState<Set<string>>(new Set());
  
  // Budget management state
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  // Fetch insights and budgets
  useEffect(() => {
    fetchInsights();
    fetchBudgets();
  }, []);

  // Real-time updates for invoices (refresh insights when invoices change)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | undefined;

    const setupRealtime = async () => {
      const { Client } = await import('appwrite');
      
      const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
        .setProject(process.env.APPWRITE_PROJECT_ID || '');

      const databaseId = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
      const collectionId = 'invoices';

      // Subscribe to invoice changes
      unsubscribe = client.subscribe(
        `databases.${databaseId}.collections.${collectionId}.documents`,
        (response: { events: string[] }) => {
          const eventType = response.events[0];
          
          if (eventType.includes('create') || eventType.includes('update') || eventType.includes('delete')) {
            // Refresh insights when invoices change
            fetchInsights();
            fetchBudgets();
          }
        }
      );
    };

    setupRealtime();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/invoices/insights', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data: InsightsResponse = await response.json();

      if (!data.hasMinimumData) {
        setHasMinimumData(false);
        setInsufficientDataMessage(
          data.message || `Você precisa registrar pelo menos ${data.minimumRequired || 3} notas fiscais para ver insights. Atualmente você tem ${data.totalInvoices || 0}.`
        );
      } else {
        setHasMinimumData(true);
        setInsights(data.insights || null);
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  // Fetch budgets
  const fetchBudgets = async () => {
    try {
      setLoadingBudgets(true);

      const response = await fetch('/api/invoices/budgets', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }

      const data = await response.json();
      setBudgets(data.budgets || []);
      setBudgetAlerts(data.alerts || []);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoadingBudgets(false);
    }
  };

  // Add budget
  const handleAddBudget = async () => {
    if (!newBudgetCategory || !newBudgetLimit) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const limit = parseFloat(newBudgetLimit);
    if (isNaN(limit) || limit <= 0) {
      alert('O limite deve ser um número positivo');
      return;
    }

    try {
      const response = await fetch('/api/invoices/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newBudgetCategory,
          limit,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to add budget');
      }

      // Reset form
      setNewBudgetCategory('');
      setNewBudgetLimit('');
      setShowAddBudget(false);

      // Refresh budgets
      await fetchBudgets();
    } catch (err) {
      console.error('Error adding budget:', err);
      alert(err instanceof Error ? err.message : 'Failed to add budget');
    }
  };

  // Delete budget (by setting limit to a very high value to effectively remove it)
  const handleDeleteBudget = async (category: string) => {
    if (!confirm(`Tem certeza que deseja remover o orçamento para ${formatCategory(category)}?`)) {
      return;
    }

    try {
      // We'll set a very high limit to effectively disable the budget
      // In a real implementation, you'd want a DELETE endpoint
      const response = await fetch('/api/invoices/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          limit: 999999999, // Very high limit to effectively disable
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      // Refresh budgets
      await fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete budget');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Format category label
  const formatCategory = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  // Format month label
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Handle dismiss anomaly
  const handleDismissAnomaly = (anomaly: SpendingAnomaly) => {
    const anomalyKey = `${anomaly.type}-${anomaly.detectedAt}-${anomaly.invoiceId || ''}`;
    setDismissedAnomalies(prev => new Set(prev).add(anomalyKey));
  };

  // Get severity icon and color
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-200 dark:border-red-800/50',
        };
      case 'medium':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-950/30',
          borderColor: 'border-orange-200 dark:border-orange-800/50',
        };
      default:
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800/50',
        };
    }
  };

  // Get anomaly type label
  const getAnomalyTypeLabel = (type: string) => {
    switch (type) {
      case 'high_spending':
        return 'Gasto Alto';
      case 'unusual_merchant':
        return 'Estabelecimento Incomum';
      case 'category_spike':
        return 'Pico de Categoria';
      case 'duplicate_invoice':
        return 'Possível Duplicata';
      default:
        return type;
    }
  };

  // Filter out dismissed anomalies
  const visibleAnomalies = insights?.anomalies.filter(anomaly => {
    const anomalyKey = `${anomaly.type}-${anomaly.detectedAt}-${anomaly.invoiceId || ''}`;
    return !dismissedAnomalies.has(anomalyKey);
  }) || [];

  // ============================================
  // Render Loading State
  // ============================================

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <header className="mb-6">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-64 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // Render Error State
  // ============================================

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-normal text-on-surface">Insights de Gastos</h1>
          <p className="text-base text-on-surface-variant mt-1">
            Análise detalhada dos seus padrões de consumo
          </p>
        </header>

        <Card className="p-6 bg-error/10 border-error/20">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-error flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-grow">
              <h3 className="font-medium text-error mb-1">Erro ao Carregar Insights</h3>
              <p className="text-sm text-error/80">{error}</p>
              <Button variant="ghost" onClick={fetchInsights} className="mt-3">
                Tentar Novamente
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================
  // Render Insufficient Data State
  // ============================================

  if (!hasMinimumData) {
    return (
      <div className="p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-normal text-on-surface">Insights de Gastos</h1>
          <p className="text-base text-on-surface-variant mt-1">
            Análise detalhada dos seus padrões de consumo
          </p>
        </header>

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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-on-surface">Dados Insuficientes</h3>
          <p className="text-on-surface-variant text-sm mt-2 max-w-md">
            {insufficientDataMessage}
          </p>
          <Button onClick={() => window.location.href = '/invoices'} className="mt-4">
            Adicionar Notas Fiscais
          </Button>
        </Card>
      </div>
    );
  }

  // ============================================
  // Prepare Chart Data
  // ============================================

  // Pie chart data for category breakdown
  const pieChartData = insights?.categoryBreakdown.map((cat) => ({
    name: formatCategory(cat.category),
    value: cat.totalAmount,
    percentage: cat.percentage,
  })) || [];

  // Line chart data for monthly trend
  const lineChartData = insights?.monthlyTrend.map((month) => ({
    month: formatMonth(month.month),
    total: month.total,
    monthNumber: month.monthNumber,
    color: MONTH_COLORS[month.monthNumber] || '#3b82f6',
  })) || [];

  // Bar chart data for top merchants
  const barChartData = insights?.topMerchants.slice(0, 5).map((merchant, index) => ({
    name: merchant.merchantName.length > 20 ? merchant.merchantName.substring(0, 20) + '...' : merchant.merchantName,
    totalSpent: merchant.totalSpent,
    visitCount: merchant.visitCount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  // ============================================
  // Render Main Content
  // ============================================

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-normal text-on-surface">Insights de Gastos</h1>
          <p className="text-base text-on-surface-variant mt-1">
            Análise detalhada dos seus padrões de consumo
          </p>
        </div>
        <Button variant="outline" onClick={fetchInsights}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Atualizar
        </Button>
      </header>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-on-surface-variant">Total Gasto</p>
          <p className="text-2xl font-semibold text-on-surface mt-1">
            {formatCurrency(insights?.totalSpent || 0)}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {insights?.totalInvoices || 0} notas fiscais
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-on-surface-variant">Ticket Médio</p>
          <p className="text-2xl font-semibold text-on-surface mt-1">
            {formatCurrency(insights?.averageInvoiceAmount || 0)}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            por compra
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-on-surface-variant">Categoria Principal</p>
          <p className="text-2xl font-semibold text-on-surface mt-1">
            {insights?.categoryBreakdown[0] ? formatCategory(insights.categoryBreakdown[0].category) : '-'}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {insights?.categoryBreakdown[0] ? `${insights.categoryBreakdown[0].percentage.toFixed(1)}% dos gastos` : ''}
          </p>
        </Card>
      </div>

      {/* Anomaly Alerts Section */}
      {visibleAnomalies.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-on-surface">Alertas e Anomalias</h2>
            <span className="text-sm text-on-surface-variant">
              {visibleAnomalies.length} {visibleAnomalies.length === 1 ? 'alerta' : 'alertas'}
            </span>
          </div>
          <div className="space-y-3">
            {visibleAnomalies.map((anomaly, index) => {
              const config = getSeverityConfig(anomaly.severity);
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                >
                  <div className={`flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.color} ${config.bgColor}`}>
                        {getAnomalyTypeLabel(anomaly.type)}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {new Date(anomaly.detectedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface">{anomaly.description}</p>
                    {anomaly.category && (
                      <p className="text-xs text-on-surface-variant mt-1">
                        Categoria: {formatCategory(anomaly.category)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDismissAnomaly(anomaly)}
                    className="flex-shrink-0 p-1 text-on-surface-variant hover:text-on-surface hover:bg-white/50 rounded transition-colors"
                    title="Dispensar alerta"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Predictions Section */}
      {insights && insights.predictions && insights.predictions.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-medium text-on-surface mb-4">Previsões de Gastos</h2>
          <p className="text-sm text-on-surface-variant mb-4">
            Previsões baseadas nos seus padrões de consumo dos últimos meses
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.predictions.map((prediction, index) => {
              const progressPercentage = prediction.predictedAmount > 0
                ? (prediction.currentSpending / prediction.predictedAmount) * 100
                : 0;
              
              const statusColor = prediction.onTrack ? 'text-green-600' : 'text-orange-600';
              const progressBarColor = prediction.onTrack ? 'bg-green-500' : 'bg-orange-500';
              const confidenceColor = prediction.confidence >= 0.8 ? 'text-green-600' : prediction.confidence >= 0.6 ? 'text-yellow-600' : 'text-gray-600';

              return (
                <div key={index} className="border border-outline rounded-lg p-4 dark:border-outline-variant dark:bg-surface-variant/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-on-surface">
                      {formatCategory(prediction.category)}
                    </h3>
                    <span className={`text-xs font-medium ${statusColor}`}>
                      {prediction.onTrack ? '✓ No prazo' : '⚠ Acima'}
                    </span>
                  </div>

                  {/* Predicted vs Current */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-on-surface-variant">Atual</span>
                      <span className="font-medium text-on-surface">
                        {formatCurrency(prediction.currentSpending)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Previsto</span>
                      <span className="font-medium text-on-surface">
                        {formatCurrency(prediction.predictedAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                      <span>Progresso</span>
                      <span>{Math.min(progressPercentage, 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-surface-variant/30 rounded-full h-2 dark:bg-surface-variant/50">
                      <div
                        className={`${progressBarColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Confidence and Days Remaining */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1">
                      <svg
                        className={`w-4 h-4 ${confidenceColor}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className={confidenceColor}>
                        {(prediction.confidence * 100).toFixed(0)}% confiança
                      </span>
                    </div>
                    <span className="text-on-surface-variant">
                      {prediction.daysRemaining} dias restantes
                    </span>
                  </div>

                  {/* Trend Indicator */}
                  {prediction.trend !== 0 && (
                    <div className="mt-2 pt-2 border-t border-outline/50 dark:border-outline-variant/50">
                      <div className="flex items-center gap-1 text-xs">
                        {prediction.trend > 0 ? (
                          <>
                            <svg
                              className="w-3 h-3 text-red-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                            <span className="text-red-600">
                              Tendência de alta ({(prediction.trend * 100).toFixed(1)}%)
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-3 h-3 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                              />
                            </svg>
                            <span className="text-green-600">
                              Tendência de queda ({Math.abs(prediction.trend * 100).toFixed(1)}%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Spending by Category - Pie Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-medium text-on-surface mb-4">Gastos por Categoria</h2>
          {pieChartData.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={300} height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--surface))',
                        color: 'hsl(var(--on-surface))',
                        border: '1px solid hsl(var(--outline))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{
                        color: 'hsl(var(--on-surface))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-grow">
                <div className="space-y-2">
                  {pieChartData.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3 py-3 px-3 rounded border-2 border-transparent hover:border-primary/30 transition-colors cursor-pointer">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <div className="flex-grow min-w-0">
                        <div className="text-sm font-medium text-on-surface mb-1">
                          {entry.name}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-sm font-semibold text-on-surface">
                            {formatCurrency(entry.value)}
                          </div>
                          <div className="text-xs text-on-surface-variant">
                            {entry.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant">
              Sem dados disponíveis
            </div>
          )}
        </Card>

        {/* Monthly Spending Trend - Line Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-medium text-on-surface mb-4">Tendência Mensal</h2>
          {lineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline))" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'hsl(var(--on-surface))' }}
                  stroke="hsl(var(--outline))"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--on-surface))' }}
                  stroke="hsl(var(--outline))"
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--surface))',
                    color: 'hsl(var(--on-surface))',
                    border: '1px solid hsl(var(--outline))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{
                    color: 'hsl(var(--on-surface))',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={payload.color || 'hsl(var(--primary))'}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    return (
                      <circle
                        key={`active-dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={payload.color || 'hsl(var(--primary))'}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant">
              Sem dados disponíveis
            </div>
          )}
        </Card>

        {/* Top Merchants - Bar Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-medium text-on-surface mb-4">Top 5 Estabelecimentos</h2>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--on-surface))" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'hsl(var(--on-surface))' }}
                  stroke="hsl(var(--on-surface))"
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--on-surface))' }}
                  stroke="hsl(var(--on-surface))"
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'totalSpent') return [formatCurrency(value), 'Total Gasto'];
                    if (name === 'visitCount') return [value, 'Visitas'];
                    return [value, name];
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--surface))',
                    color: 'hsl(var(--on-surface))',
                    border: '1px solid hsl(var(--outline))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{
                    color: 'hsl(var(--on-surface))',
                  }}
                />
                <Bar 
                  dataKey="totalSpent" 
                  radius={[8, 8, 0, 0]}
                  fill="hsl(var(--primary))"
                >
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant">
              Sem dados disponíveis
            </div>
          )}
        </Card>

        {/* Category Details Table */}
        <Card className="p-6">
          <h2 className="text-xl font-medium text-on-surface mb-4">Detalhes por Categoria</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline">
                  <th className="text-left py-2 text-on-surface-variant font-medium">Categoria</th>
                  <th className="text-right py-2 text-on-surface-variant font-medium">Total</th>
                  <th className="text-right py-2 text-on-surface-variant font-medium">Média</th>
                  <th className="text-right py-2 text-on-surface-variant font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {insights?.categoryBreakdown.map((cat, index) => (
                  <tr key={index} className="border-b border-outline/50 dark:border-outline-variant/50">
                    <td className="py-2 text-on-surface">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        {formatCategory(cat.category)}
                      </div>
                    </td>
                    <td className="text-right py-2 text-on-surface font-medium">
                      {formatCurrency(cat.totalAmount)}
                    </td>
                    <td className="text-right py-2 text-on-surface-variant">
                      {formatCurrency(cat.averageAmount)}
                    </td>
                    <td className="text-right py-2 text-on-surface-variant">
                      {cat.invoiceCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Budget Management Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-medium text-on-surface">Orçamentos por Categoria</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Defina limites de gastos mensais para cada categoria
            </p>
          </div>
          <Button onClick={() => setShowAddBudget(!showAddBudget)}>
            {showAddBudget ? 'Cancelar' : 'Adicionar Orçamento'}
          </Button>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {budgetAlerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.threshold === 100
                    ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50'
                    : 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50'
                }`}
              >
                <svg
                  className={`w-5 h-5 flex-shrink-0 ${
                    alert.threshold === 100 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className={`text-sm ${alert.threshold === 100 ? 'text-red-800 dark:text-red-300' : 'text-orange-800 dark:text-orange-300'}`}>
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add Budget Form */}
        {showAddBudget && (
          <div className="mb-4 p-4 bg-surface-variant/20 rounded-lg border border-outline dark:bg-surface-variant/30 dark:border-outline-variant">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Categoria
                </label>
                <select
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-variant/20 dark:border-outline-variant"
                >
                  <option value="">Selecione uma categoria</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Limite Mensal (R$)
                </label>
                <input
                  type="number"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary dark:bg-surface-variant/20 dark:border-outline-variant"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAddBudget(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddBudget}>
                Salvar Orçamento
              </Button>
            </div>
          </div>
        )}

        {/* Budget List */}
        {loadingBudgets ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-on-surface-variant"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Nenhum orçamento definido</p>
            <p className="text-xs mt-1">Clique em "Adicionar Orçamento" para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget, index) => {
              const statusConfig = {
                ok: { color: 'text-green-600', bgColor: 'bg-green-500' },
                warning: { color: 'text-orange-600', bgColor: 'bg-orange-500' },
                exceeded: { color: 'text-red-600', bgColor: 'bg-red-500' },
              };
              const config = statusConfig[budget.status];

              return (
                <div key={index} className="p-4 border border-outline rounded-lg dark:border-outline-variant dark:bg-surface-variant/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-on-surface">
                      {formatCategory(budget.category)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${config.color}`}>
                        {budget.percentage.toFixed(0)}%
                      </span>
                      <button
                        onClick={() => handleDeleteBudget(budget.category)}
                        className="p-1 text-on-surface-variant hover:text-error hover:bg-error/5 rounded transition-colors"
                        title="Remover orçamento"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="w-full bg-surface-variant/30 rounded-full h-2 dark:bg-surface-variant/50">
                      <div
                        className={`${config.bgColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Details */}
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-on-surface-variant">Gasto atual</span>
                    <span className="font-medium text-on-surface">
                      {formatCurrency(budget.currentSpending)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-on-surface-variant">Limite</span>
                    <span className="font-medium text-on-surface">
                      {formatCurrency(budget.limit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Restante</span>
                    <span className={`font-medium ${budget.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budget.remaining)}
                    </span>
                  </div>

                  {/* Recommendation */}
                  {budget.recommendation && (
                    <div className="mt-3 pt-3 border-t border-outline/50 dark:border-outline-variant/50">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-xs text-on-surface-variant">{budget.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
