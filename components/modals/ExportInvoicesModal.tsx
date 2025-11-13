'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  startDate?: string;
  endDate?: string;
  categories?: string[];
}

interface ExportInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  currentFilters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  };
}

export function ExportInvoicesModal({ isOpen, onClose, onExport, currentFilters }: ExportInvoicesModalProps) {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [useCurrentFilters, setUseCurrentFilters] = useState(true);
  const [startDate, setStartDate] = useState(currentFilters?.startDate || '');
  const [endDate, setEndDate] = useState(currentFilters?.endDate || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters?.category ? [currentFilters.category] : [],
  );
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'pharmacy', label: 'Farmácia' },
    { value: 'groceries', label: 'Hortifruti' },
    { value: 'supermarket', label: 'Supermercado' },
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'fuel', label: 'Combustível' },
    { value: 'retail', label: 'Varejo' },
    { value: 'services', label: 'Serviços' },
    { value: 'other', label: 'Outro' },
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const options: ExportOptions = {
        format,
        startDate: useCurrentFilters && currentFilters?.startDate ? currentFilters.startDate : startDate || undefined,
        endDate: useCurrentFilters && currentFilters?.endDate ? currentFilters.endDate : endDate || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      };

      await onExport(options);
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Falha ao exportar notas fiscais');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      setError(null);
      onClose();
    }
  };

  const hasCurrentFilters = currentFilters?.startDate || currentFilters?.endDate || currentFilters?.category;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Exportar Notas Fiscais">
      <div className="space-y-5">
        {/* Format Selection */}
        <div className="px-6 pt-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">Formato</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-5 border-2 rounded-xl text-left transition-all ${
                format === 'csv'
                  ? 'border-blue-primary bg-blue-light shadow-soft-sm'
                  : 'border-border-primary hover:border-border-secondary hover:bg-bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${format === 'csv' ? 'bg-green-500/10' : 'bg-bg-secondary'}`}>
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-text-primary">CSV</div>
                  <div className="text-xs text-text-tertiary">Planilha de dados</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-5 border-2 rounded-xl text-left transition-all ${
                format === 'pdf'
                  ? 'border-blue-primary bg-blue-light shadow-soft-sm'
                  : 'border-border-primary hover:border-border-secondary hover:bg-bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${format === 'pdf' ? 'bg-red-500/10' : 'bg-bg-secondary'}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-text-primary">PDF</div>
                  <div className="text-xs text-text-tertiary">Relatório com gráficos</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Use Current Filters Option */}
        {hasCurrentFilters && (
          <div className="mx-6 bg-blue-info-bg border border-blue-info-border rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useCurrentFilters}
                onChange={(e) => setUseCurrentFilters(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-primary border-border-secondary rounded focus:ring-2 focus:ring-blue-primary"
              />
              <div className="flex-grow">
                <div className="font-medium text-sm text-text-primary">Usar filtros atuais</div>
                <div className="text-xs text-text-tertiary mt-1">
                  Exportar apenas as notas fiscais que correspondem aos filtros aplicados na lista
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Date Range */}
        {!useCurrentFilters && (
          <div className="px-6">
            <label className="block text-sm font-medium text-text-secondary mb-3">Período (opcional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-tertiary mb-1.5">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1.5">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div className="px-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Categorias (opcional)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-border-primary rounded-xl bg-bg-secondary">
            {categories.map((cat) => (
              <label key={cat.value} className="flex items-center gap-2.5 cursor-pointer hover:bg-surface-new-primary p-2.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.value)}
                  onChange={() => handleCategoryToggle(cat.value)}
                  className="w-4 h-4 text-blue-primary border-border-secondary rounded focus:ring-2 focus:ring-blue-primary"
                />
                <span className="text-sm text-text-primary">{cat.label}</span>
              </label>
            ))}
          </div>
          {selectedCategories.length > 0 && (
            <div className="mt-2 text-xs text-text-tertiary">
              {selectedCategories.length} categoria{selectedCategories.length > 1 ? 's' : ''} selecionada
              {selectedCategories.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 bg-red-bg border border-red-border text-red-text px-4 py-3 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-border-primary">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="h-11 px-5 rounded-lg text-sm font-medium bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="h-11 px-5 rounded-lg text-sm font-medium bg-blue-primary text-white hover:bg-blue-hover shadow-soft-sm hover:shadow-soft-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-primary disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Exportando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Exportar
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
