'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CategoryChip, type CategoryType } from '@/components/ui/CategoryChip';
import type { Invoice } from '@/lib/appwrite/schema';
import InvoiceDetailsModal from '@/components/modals/InvoiceDetailsModal';

interface InvoiceCardProps {
  invoice: Invoice & { isOwn?: boolean; ownerName?: string; ownerId?: string };
  onDelete: (invoiceId: string) => Promise<void>;
  onCreateTransaction?: (invoice: any) => void;
  currentUserId?: string;
}

export default function InvoiceCard({ invoice, onDelete, onCreateTransaction, currentUserId }: InvoiceCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isShared = 'isOwn' in invoice ? !invoice.isOwn : (currentUserId && invoice.user_id !== currentUserId);
  const canDelete = !isShared;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete) {
      alert('Você não pode excluir notas fiscais compartilhadas');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await onDelete(invoice.$id);
      setShowDeleteConfirm(false);
    } catch (err) {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-grow min-w-0">
            {getMerchantIcon()}
            
            <div className="min-w-0 flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-on-surface truncate" title={invoice.merchant_name}>
                  {invoice.merchant_name}
                </h3>
                <CategoryChip category={invoice.category as CategoryType} className="text-xs scale-90 origin-left" />
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(invoice.issue_date)}
                </span>
                <span className="hidden sm:inline text-outline">•</span>
                <span className="hidden sm:inline">Nº {invoice.invoice_number}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline/50">
            <p className="text-lg font-semibold text-on-surface">
              {formatCurrency(invoice.total_amount)}
            </p>

            <div className="flex items-center gap-2">
              {canDelete ? (
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Excluir"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ) : (
                <div className="p-2 text-on-surface-variant/30 cursor-not-allowed" title="Somente Leitura">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {showDetails && (
        <InvoiceDetailsModal
          invoiceId={invoice.$id}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          onDelete={onDelete}
          onCreateTransaction={onCreateTransaction}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Nota Fiscal"
        message="Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
