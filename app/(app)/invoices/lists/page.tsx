'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useUser } from '@/lib/contexts/UserContext';
import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';
import ShoppingListModal from '@/components/modals/ShoppingListModal';
import ManualShoppingListBuilder from '@/components/invoices/ManualShoppingListBuilder';
import {
  ShoppingCartIcon,
  SparklesIcon,
  ClockIcon,
  PlusIcon,
  CheckIcon,
  AlertCircleIcon,
  LoaderIcon,
  FileTextIcon,
} from '@/components/assets/Icons';
import { DATABASE_ID } from '@/lib/appwrite/schema';

interface ShoppingList {
  $id: string;
  title: string;
  category: string;
  generated_by_ai: boolean;
  estimated_total: number;
  actual_total?: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  $createdAt: string;
}

interface ShoppingListRequest {
  $id: string;
  category: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  historical_months: number;
  shopping_list_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

type TabType = 'history' | 'ai' | 'manual';

export default function ListsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [requests, setRequests] = useState<ShoppingListRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Selected category for AI generation
  const [selectedCategory, setSelectedCategory] = useState<string>('supermarket');
  const [historicalMonths, setHistoricalMonths] = useState<number>(12);
  const [generating, setGenerating] = useState(false);

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
    { value: 12, label: '1 ano' },
    { value: 24, label: '2 anos' },
  ];

  // Fetch shopping lists and requests
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Separate effect for polling to avoid infinite loop
  useEffect(() => {
    if (!user) return;
    
    // Only poll if there are pending/generating requests
    const hasPendingRequests = requests.some((r) => r.status === 'pending' || r.status === 'generating');
    
    if (hasPendingRequests) {
      const interval = setInterval(() => {
        fetchData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user, requests.map(r => r.$id + r.status).join(',')]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch shopping lists
      const listsResponse = await fetch('/api/shopping-list', {
        credentials: 'include',
      });
      if (listsResponse.ok) {
        const listsData = await listsResponse.json();
        setLists(listsData.lists || []);
      }

      // Fetch shopping list requests
      const requestsResponse = await fetch('/api/shopping-list/requests', {
        credentials: 'include',
      });
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRequests(requestsData.requests || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao carregar listas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime subscriptions for auto-updates
  useAppwriteRealtime({
    channels: [
      `databases.${DATABASE_ID}.collections.shopping_lists.documents`,
      `databases.${DATABASE_ID}.collections.shopping_list_requests.documents`,
    ],
    onCreate: (payload) => {
      console.log('Realtime: Document created', payload);
      fetchData();
    },
    onUpdate: (payload) => {
      console.log('Realtime: Document updated', payload);
      // Atualiza apenas se for um request ou lista do usuário atual
      if (user && (payload.user_id === user.$id)) {
        fetchData();
      }
    },
    onDelete: (payload) => {
      console.log('Realtime: Document deleted', payload);
      fetchData();
    },
    enabled: !!user,
  });

  // Generate AI shopping list
  const handleGenerateAI = async () => {
    try {
      setGenerating(true);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao criar requisição');
      }

      alert('✓ Sua lista está sendo gerada!\n\nVocê receberá uma notificação quando estiver pronta.');
      fetchData(); // Refresh to show new request
      setActiveTab('history'); // Switch to history tab
    } catch (err: any) {
      console.error('Error creating request:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.label || category;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <ClockIcon className="w-3 h-3" />
          Aguardando
        </span>
      ),
      generating: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          <LoaderIcon className="w-3 h-3 animate-spin" />
          Gerando
        </span>
      ),
      completed: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckIcon className="w-3 h-3" />
          Concluída
        </span>
      ),
      error: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircleIcon className="w-3 h-3" />
          Erro
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface mb-2">Listas de Compras</h1>
        <p className="text-sm text-on-surface-variant">Gerencie suas listas de compras manuais e inteligentes</p>
      </div>

      {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-outline">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'ai'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Lista com IA
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'manual'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Lista Manual
          </button>
        </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* AI Tab */}
        {activeTab === 'ai' && (
          <Card className="p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-on-surface mb-1">Lista Inteligente com IA</h2>
                  <p className="text-sm text-on-surface-variant">
                    Analise seu histórico de compras e gere uma lista personalizada baseada no seu padrão de consumo
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Categoria</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={generating}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Período de Análise</label>
                  <select
                    value={historicalMonths}
                    onChange={(e) => setHistoricalMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={generating}
                  >
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleGenerateAI}
                  disabled={generating || !user}
                  className="w-full bg-primary text-on-primary hover:bg-primary/90"
                >
                  {generating ? (
                    <>
                      <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                      Criando Requisição...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Gerar Lista Inteligente
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <ManualShoppingListBuilder onListCreated={() => {
            setActiveTab('history');
            fetchData();
          }} />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading && (
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <LoaderIcon className="w-8 h-8 animate-spin text-primary" />
                </div>
              </Card>
            )}

            {!loading && requests.length === 0 && lists.length === 0 && (
              <Card className="p-8">
                <div className="text-center">
                  <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-on-surface-variant opacity-50" />
                  <h3 className="text-lg font-semibold text-on-surface mb-2">Nenhuma lista encontrada</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Comece criando sua primeira lista inteligente com IA
                  </p>
                  <Button onClick={() => setActiveTab('ai')} className="bg-primary text-on-primary">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Criar Lista com IA
                  </Button>
                </div>
              </Card>
            )}

            {/* Pending/Generating Requests */}
            {!loading &&
              requests
                .filter((r) => r.status === 'pending' || r.status === 'generating')
                .map((request) => (
                  <Card key={request.$id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <SparklesIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-on-surface">{getCategoryLabel(request.category)}</h3>
                          <p className="text-xs text-on-surface-variant">
                            Criada em {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      <div>{getStatusBadge(request.status)}</div>
                    </div>
                  </Card>
                ))}

            {/* Completed Lists */}
            {!loading &&
              lists.map((list) => (
                <Card 
                  key={list.$id} 
                  className="p-4 hover:bg-surface-container cursor-pointer transition-colors"
                  onClick={() => setSelectedListId(list.$id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {list.generated_by_ai ? (
                          <SparklesIcon className="w-5 h-5 text-primary" />
                        ) : (
                          <ShoppingCartIcon className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-on-surface">{list.title}</h3>
                        <p className="text-xs text-on-surface-variant">
                          {formatCurrency(list.estimated_total)} • {formatDate(list.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {list.completed && <CheckIcon className="w-5 h-5 text-green-600" />}
                      <span className="text-xs text-on-surface-variant">{list.generated_by_ai ? 'IA' : 'Manual'}</span>
                    </div>
                  </div>
                </Card>
              ))}

            {/* Error Requests */}
            {!loading &&
              requests
                .filter((r) => r.status === 'error')
                .map((request) => (
                  <Card key={request.$id} className="p-4 border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-on-surface">{getCategoryLabel(request.category)}</h3>
                          <p className="text-xs text-on-surface-variant">
                            Falha em {formatDate(request.updated_at)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.error_message && (
                      <p className="text-sm text-red-600 dark:text-red-400 ml-13">{request.error_message}</p>
                    )}
                  </Card>
                ))}
          </div>
        )}
      </div>

      {/* Shopping List Modal */}
      {selectedListId && (
        <ShoppingListModal listId={selectedListId} onClose={() => setSelectedListId(null)} />
      )}
    </div>
  );
}
