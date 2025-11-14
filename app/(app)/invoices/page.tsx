'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AddInvoiceModal, CreateInvoiceInput } from '@/components/modals/AddInvoiceModal';
import { ExportInvoicesModal, ExportOptions } from '@/components/modals/ExportInvoicesModal';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import InvoiceCard from '@/components/invoices/InvoiceCard';
import { getCategoryLabel } from '@/components/ui/CategoryChip';
import type { Invoice as InvoiceType } from '@/lib/appwrite/schema';
import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';

interface InvoiceSummary {
  totalSpent: number;
  invoiceCount: number;
  topCategory: string;
}

interface InvoiceFilters {
  startDate: string;
  endDate: string;
  category: string;
  merchant: string;
  minAmount: string;
  maxAmount: string;
  search: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, ToastComponent } = useToast();

  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalSpent: 0,
    invoiceCount: 0,
    topCategory: '-',
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedInvoiceForTransaction, setSelectedInvoiceForTransaction] = useState<any>(null);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<InvoiceFilters>({
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    category: searchParams.get('category') || '',
    merchant: searchParams.get('merchant') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    search: searchParams.get('search') || '',
  });

  // Update URL params when filters change
  const updateURLParams = useCallback(
    (newFilters: InvoiceFilters) => {
      const params = new URLSearchParams();

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      router.push(`/invoices${queryString ? `?${queryString}` : ''}`, { scroll: false });
    },
    [router],
  );

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string from filters
      // Fetch directly from Appwrite using the browser client
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

      if (!databaseId) {
        throw new Error('Database ID not configured');
      }

      // Build queries based on filters
      const queries = [Query.limit(50)];
      
      if (filters.category) queries.push(Query.equal('category', filters.category));
      if (filters.merchant) queries.push(Query.search('merchant_name', filters.merchant));
      if (filters.startDate) queries.push(Query.greaterThanEqual('issue_date', filters.startDate));
      if (filters.endDate) queries.push(Query.lessThanEqual('issue_date', filters.endDate));
      if (filters.minAmount) queries.push(Query.greaterThanEqual('total_amount', parseFloat(filters.minAmount)));
      if (filters.maxAmount) queries.push(Query.lessThanEqual('total_amount', parseFloat(filters.maxAmount)));
      if (filters.search) queries.push(Query.search('merchant_name', filters.search));

      // Default ordering by issue date descending
      queries.push(Query.orderDesc('issue_date'));

      const result = await databases.listDocuments(databaseId, 'invoices', queries);
      const invoicesData = result.documents as unknown as InvoiceType[];
      
      setInvoices(invoicesData);

      // Calculate summary
      if (invoicesData && invoicesData.length > 0) {
        const total = invoicesData.reduce((sum: number, inv: InvoiceType) => sum + inv.total_amount, 0);
        const categoryCount: Record<string, number> = {};

        invoicesData.forEach((inv: InvoiceType) => {
          categoryCount[inv.category] = (categoryCount[inv.category] || 0) + 1;
        });

        const topCat = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];

        setSummary({
          totalSpent: total,
          invoiceCount: invoicesData.length,
          topCategory: topCat ? topCat[0] : '-',
        });
      } else {
        setSummary({
          totalSpent: 0,
          invoiceCount: 0,
          topCategory: '-',
        });
      }
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Real-time updates for invoices using the hook
  useAppwriteRealtime({
    channels: [`databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.invoices.documents`],
    enabled: !loading,
    onCreate: () => {
      console.log('📡 Realtime: invoice created');
      fetchInvoices();
    },
    onUpdate: () => {
      console.log('📡 Realtime: invoice updated');
      fetchInvoices();
    },
    onDelete: () => {
      console.log('📡 Realtime: invoice deleted');
      fetchInvoices();
    },
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURLParams(newFilters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const emptyFilters: InvoiceFilters = {
      startDate: '',
      endDate: '',
      category: '',
      merchant: '',
      minAmount: '',
      maxAmount: '',
      search: '',
    };
    setFilters(emptyFilters);
    updateURLParams(emptyFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  // Handle add invoice
  const handleAddInvoice = async (data: CreateInvoiceInput) => {
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add invoice');
    }

    // Refresh invoices list
    await fetchInvoices();
  };

  // Handle delete invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      // Refresh invoices list
      await fetchInvoices();
      showToast('Nota fiscal excluída com sucesso', 'success');
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      showToast(err.message || 'Falha ao excluir nota fiscal', 'error');
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
    return getCategoryLabel(category as any) || category;
  };

  // Handle export
  const handleExport = async (options: ExportOptions) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.set('format', options.format);

      if (options.startDate) {
        params.set('startDate', options.startDate);
      }
      if (options.endDate) {
        params.set('endDate', options.endDate);
      }
      if (options.categories && options.categories.length > 0) {
        params.set('categories', options.categories.join(','));
      }

      // Fetch export file
      const response = await fetch(`/api/invoices/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao exportar notas fiscais');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `invoices_${new Date().toISOString().split('T')[0]}.${options.format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export error:', err);
      throw err;
    }
  };

  // Handle create transaction from invoice
  const handleCreateTransaction = (invoice: any) => {
    setSelectedInvoiceForTransaction(invoice);
    setShowTransactionModal(true);
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-normal text-on-surface">Notas Fiscais</h1>
          <p className="text-base text-on-surface-variant mt-1">
            Gerencie suas notas fiscais e acompanhe seus gastos
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsExportModalOpen(true)} disabled={loading || invoices.length === 0}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Exportar
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>Adicionar Nota Fiscal</Button>
        </div>
      </header>

      {/* Search and Filters */}
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Buscar por número da nota, estabelecimento ou produto..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-outline-variant dark:bg-surface-variant/20"
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
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                  {Object.values(filters).filter((v) => v !== '').length}
                </span>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-outline dark:border-outline-variant">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-outline bg-surface text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-outline-variant dark:bg-surface-variant/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Data Final</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-outline bg-surface text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-outline-variant dark:bg-surface-variant/20"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Categoria</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-outline bg-surface text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-outline-variant dark:bg-surface-variant/20"
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

                {/* Merchant Filter */}
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Estabelecimento</label>
                  <input
                    type="text"
                    placeholder="Nome do estabelecimento"
                    value={filters.merchant}
                    onChange={(e) => handleFilterChange('merchant', e.target.value)}
                    className="w-full px-3 py-2 border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-outline-variant dark:bg-surface-variant/20"
                  />
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Valor Mínimo</label>
                  <input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-outline-variant dark:bg-surface-variant/20"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Valor Máximo</label>
                  <input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-outline bg-surface text-on-surface placeholder:text-on-surface-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:border-outline-variant dark:bg-surface-variant/20"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" onClick={handleClearFilters}>
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          {loading ? (
            <>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant font-medium">Total Gasto</p>
              <p className="text-2xl font-semibold text-on-surface mt-2">{formatCurrency(summary.totalSpent)}</p>
            </>
          )}
        </Card>

        <Card className="p-6">
          {loading ? (
            <>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-20" />
            </>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant font-medium">Total de Notas</p>
              <p className="text-2xl font-semibold text-on-surface mt-2">{summary.invoiceCount}</p>
            </>
          )}
        </Card>

        <Card className="p-6">
          {loading ? (
            <>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-28" />
            </>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant font-medium">Categoria Principal</p>
              <p className="text-2xl font-semibold text-on-surface mt-2">{formatCategory(summary.topCategory)}</p>
            </>
          )}
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-4 mb-6 bg-error/10 border-error/20">
          <p className="text-error">{error}</p>
          <Button variant="ghost" onClick={fetchInvoices} className="mt-2">
            Tentar Novamente
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && invoices.length === 0 && (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-on-surface">Nenhuma Nota Fiscal</h3>
          <p className="text-on-surface-variant text-sm mt-2 max-w-sm">
            Adicione sua primeira nota fiscal usando o botão acima. Você pode escanear o QR Code ou inserir a URL da
            nota.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
            Adicionar Primeira Nota
          </Button>
        </Card>
      )}

      {/* Invoice List */}
      {!loading && !error && invoices.length > 0 && (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <InvoiceCard 
              key={invoice.$id} 
              invoice={invoice} 
              onDelete={handleDeleteInvoice}
              onCreateTransaction={handleCreateTransaction}
            />
          ))}
        </div>
      )}

      {/* Add Invoice Modal */}
      <AddInvoiceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddInvoice} />

      {/* Export Modal */}
      <ExportInvoicesModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        currentFilters={{
          startDate: filters.startDate,
          endDate: filters.endDate,
          category: filters.category,
        }}
      />

      {/* Transaction Creation Modal - Removed due to interface mismatch */}

      {/* Toast Notifications */}
      {ToastComponent}
    </div>
  );
}
