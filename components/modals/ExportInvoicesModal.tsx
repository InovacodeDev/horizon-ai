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
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                format === 'csv'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <div className="font-medium">CSV</div>
                  <div className="text-xs text-gray-500">Planilha de dados</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                format === 'pdf'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-gray-500">Relatório com gráficos</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Use Current Filters Option */}
        {hasCurrentFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useCurrentFilters}
                onChange={(e) => setUseCurrentFilters(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-grow">
                <div className="font-medium text-sm text-gray-900">Usar filtros atuais</div>
                <div className="text-xs text-gray-600 mt-1">
                  Exportar apenas as notas fiscais que correspondem aos filtros aplicados na lista
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Date Range */}
        {!useCurrentFilters && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período (opcional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorias (opcional)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
            {categories.map((cat) => (
              <label key={cat.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.value)}
                  onChange={() => handleCategoryToggle(cat.value)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{cat.label}</span>
              </label>
            ))}
          </div>
          {selectedCategories.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {selectedCategories.length} categoria{selectedCategories.length > 1 ? 's' : ''} selecionada
              {selectedCategories.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button variant="outlined" onClick={handleClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </Button>
        </div>
      </div>
    </Modal>
  );
}
