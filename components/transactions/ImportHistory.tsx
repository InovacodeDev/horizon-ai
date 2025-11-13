'use client';

import React from 'react';
import { ImportRecord } from '@/lib/types';

interface ImportHistoryProps {
  imports: ImportRecord[];
  onViewDetails: (importId: string) => void;
}

export default function ImportHistory({ imports, onViewDetails }: ImportHistoryProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: 'completed' | 'failed' | 'partial') => {
    const statusConfig = {
      completed: {
        label: 'Concluído',
        className: 'bg-green-bg text-green-text border-green-border',
      },
      failed: {
        label: 'Falhou',
        className: 'bg-red-bg text-red-text border-red-border',
      },
      partial: {
        label: 'Parcial',
        className: 'bg-yellow-bg text-yellow-text border-yellow-border',
      },
    };

    const config = statusConfig[status];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getFormatLabel = (format: 'ofx' | 'csv' | 'pdf') => {
    const formatMap = {
      ofx: 'OFX',
      csv: 'CSV',
      pdf: 'PDF',
    };
    return formatMap[format];
  };

  const getFormatIcon = (format: 'ofx' | 'csv' | 'pdf') => {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  if (imports.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-text-tertiary mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-text-primary mb-2">Nenhuma importação encontrada</h3>
        <p className="text-sm text-text-secondary">
          Você ainda não importou nenhum arquivo de extrato bancário.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Histórico de Importações</h3>
        <span className="text-sm text-text-secondary">{imports.length} importação(ões)</span>
      </div>

      <div className="space-y-3">
        {imports.map((importRecord) => (
          <div
            key={importRecord.$id}
            className="bg-surface-new-primary border border-border-primary rounded-lg p-4 hover:border-border-focus transition-colors-smooth"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Section - File Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 text-text-tertiary mt-1">
                  {getFormatIcon(importRecord.file_format)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-text-primary truncate">{importRecord.file_name}</h4>
                    <span className="text-xs text-text-tertiary whitespace-nowrap">
                      {getFormatLabel(importRecord.file_format)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(importRecord.import_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      {importRecord.transaction_count} transação(ões)
                    </span>
                  </div>
                  {importRecord.error_message && (
                    <p className="text-xs text-red-text mt-2 line-clamp-2">{importRecord.error_message}</p>
                  )}
                </div>
              </div>

              {/* Right Section - Status and Actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {getStatusBadge(importRecord.status)}
                <button
                  type="button"
                  onClick={() => onViewDetails(importRecord.$id)}
                  className="text-xs text-blue-primary hover:text-blue-hover font-medium focus:outline-none focus:underline"
                  aria-label={`Ver detalhes da importação ${importRecord.file_name}`}
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
