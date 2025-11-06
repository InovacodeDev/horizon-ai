'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Invoice } from '@/lib/appwrite/schema';
import InvoiceDetailsModal from '@/components/modals/InvoiceDetailsModal';

interface InvoiceCardProps {
  invoice: Invoice;
  onDelete: (invoiceId: string) => Promise<void>;
  onCreateTransaction?: (invoice: any) => void;
}

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

const CATEGORY_COLORS: Record<string, 'primary' | 'secondary' | 'error' | 'warning' | 'default'> = {
  pharmacy: 'error',
  groceries: 'secondary',
  supermarket: 'primary',
  restaurant: 'warning',
  fuel: 'default',
  retail: 'primary',
  services: 'secondary',
  other: 'default',
};

export default function InvoiceCard({ invoice, onDelete, onCreateTransaction }: InvoiceCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'default';
  };

  // Get merchant icon (placeholder - could be enhanced with actual logos)
  const getMerchantIcon = () => {
    return (
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
    );
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDetails(true)}>
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center gap-4">
          {/* Merchant Icon */}
          {getMerchantIcon()}

          {/* Invoice Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-on-surface truncate">{invoice.merchant_name}</h3>
              <Badge variant={getCategoryColor(invoice.category)}>{getCategoryLabel(invoice.category)}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatDate(invoice.issue_date)}
              </span>
              <span className="flex items-center gap-1">
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
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                NF-e {invoice.invoice_number}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-semibold text-on-surface">{formatCurrency(invoice.total_amount)}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
              title="Ver detalhes"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
                  await onDelete(invoice.$id);
                }
              }}
              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-full transition-colors"
              title="Excluir"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {getMerchantIcon()}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-on-surface truncate mb-1">{invoice.merchant_name}</h3>
                <Badge variant={getCategoryColor(invoice.category)} className="text-xs">
                  {getCategoryLabel(invoice.category)}
                </Badge>
              </div>
            </div>
            <p className="text-lg font-semibold text-on-surface flex-shrink-0">{formatCurrency(invoice.total_amount)}</p>
          </div>
          
          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(invoice.issue_date)}
            </span>
            <span className="text-xs">NF-e {invoice.invoice_number}</span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="flex-1 py-2 px-3 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver detalhes
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
                  await onDelete(invoice.$id);
                }
              }}
              className="py-2 px-3 text-sm text-error hover:bg-error/5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </Card>

      {/* Details Modal */}
      {showDetails && (
        <InvoiceDetailsModal
          invoiceId={invoice.$id}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          onDelete={onDelete}
          onCreateTransaction={onCreateTransaction}
        />
      )}
    </>
  );
}
