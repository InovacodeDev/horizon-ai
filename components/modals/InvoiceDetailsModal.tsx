'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Invoice, InvoiceItem, InvoiceData } from '@/lib/appwrite/schema';

interface InvoiceDetailsModalProps {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (invoiceId: string) => Promise<void>;
  onCreateTransaction?: (invoice: InvoiceWithItems) => void;
}

interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

interface GroupedItem extends InvoiceItem {
  originalQuantity: number;
  groupedQuantity: number;
}

// Função para agrupar itens iguais e somar quantidades
const groupInvoiceItems = (items: InvoiceItem[]): GroupedItem[] => {
  const grouped = new Map<string, GroupedItem>();

  items.forEach((item) => {
    // Criar chave única baseada em descrição e código do produto (case-insensitive)
    const key = `${item.description.toLowerCase().trim()}_${(item.product_code || '').toLowerCase().trim()}`;

    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.groupedQuantity += item.quantity;
      existing.total_price += item.total_price;
    } else {
      grouped.set(key, {
        ...item,
        originalQuantity: item.quantity,
        groupedQuantity: item.quantity,
      });
    }
  });

  return Array.from(grouped.values());
};

export default function InvoiceDetailsModal({ invoiceId, isOpen, onClose, onDelete, onCreateTransaction }: InvoiceDetailsModalProps) {
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice details');
      }

      const result = await response.json();
      setInvoice(result.data);
    } catch (err: any) {
      console.error('Error fetching invoice details:', err);
      setError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoiceDetails();
    }
  }, [isOpen, invoiceId, fetchInvoiceDetails]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await onDelete(invoiceId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: unknown) {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setError(err.message || 'Falha ao excluir nota fiscal');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatCNPJ = (cnpj: string) => {
    // Remove tudo que não é dígito
    const digits = cnpj.replace(/\D/g, '');
    // Aplica a máscara XX.XXX.XXX/XXXX-XX
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const parseInvoiceData = (dataString?: string): InvoiceData => {
    if (!dataString) return {};
    try {
      return JSON.parse(dataString) as InvoiceData;
    } catch {
      return {};
    }
  };

  if (!isOpen) return null;

  const invoiceData = invoice ? parseInvoiceData(invoice.data) : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Detalhes da Nota Fiscal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            type="button"
          >
            <svg
              className="w-6 h-6"
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

        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              <p>{error}</p>
              <Button variant="ghost" onClick={fetchInvoiceDetails} className="mt-2">
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Invoice Details */}
          {!loading && !error && invoice && (
            <div className="space-y-8">
              {/* Merchant Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informações do Estabelecimento</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nome:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 text-right">{invoice.merchant_name}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CNPJ:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">{formatCNPJ(invoice.merchant_cnpj)}</span>
                  </div>
                  {invoiceData.merchant_address && (
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Endereço:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 text-right max-w-md">{invoiceData.merchant_address}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Data de Emissão:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(invoice.issue_date)}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Número da Nota:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">{invoice.invoice_number}</span>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Itens da Nota</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider px-4 py-3">
                          Produto
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider px-4 py-3">
                          Qtd
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider px-4 py-3">
                          Preço Unit.
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider px-4 py-3">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {groupInvoiceItems(invoice.items).map((item, index) => (
                        <tr key={`${item.$id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.description}</p>
                              {item.product_code && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">Cód: {item.product_code}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">{item.groupedQuantity}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Resumo dos Valores</h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 space-y-3">
                  {/* Subtotal - só mostra se houver desconto ou imposto */}
                  {((invoiceData.discount_amount && invoiceData.discount_amount > 0) || 
                    (invoiceData.tax_amount && invoiceData.tax_amount > 0)) && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          invoice.total_amount + (invoiceData.discount_amount || 0) - (invoiceData.tax_amount || 0),
                        )}
                      </span>
                    </div>
                  )}
                  {/* Descontos - só mostra se for maior que 0 */}
                  {invoiceData.discount_amount && invoiceData.discount_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Descontos:</span>
                      <span className="text-sm text-green-600 dark:text-green-400">-{formatCurrency(invoiceData.discount_amount)}</span>
                    </div>
                  )}
                  {/* Impostos - só mostra se for maior que 0 */}
                  {invoiceData.tax_amount && invoiceData.tax_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Impostos:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(invoiceData.tax_amount)}</span>
                    </div>
                  )}
                  {/* Total - sempre mostra */}
                  <div className={`flex justify-between items-center ${((invoiceData.discount_amount && invoiceData.discount_amount > 0) || (invoiceData.tax_amount && invoiceData.tax_amount > 0)) ? 'pt-3 mt-1 border-t border-gray-200 dark:border-gray-700' : ''}`}>
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Original Invoice Link */}
              {invoiceData.xml_data && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Nota Fiscal Original</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Chave de Acesso: <span className="font-mono text-xs text-gray-900 dark:text-gray-100">{invoice.invoice_key}</span>
                  </p>
                  <a
                    href={`https://sat.sef.sc.gov.br/nfce/consulta?p=${invoice.invoice_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors"
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Ver nota fiscal no portal da SEFAZ
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && !error && invoice && (
          <div className="flex justify-between items-center px-6 py-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Excluir Nota Fiscal
              </Button>
              {onCreateTransaction && !invoiceData.transaction_id && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onCreateTransaction(invoice);
                    onClose();
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Criar Transação
                </Button>
              )}
              {invoiceData.transaction_id && (
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/transactions?highlight=${invoiceData.transaction_id}`;
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Ver Transação
                </Button>
              )}
            </div>
            <Button onClick={onClose} disabled={deleting}>Fechar</Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Nota Fiscal"
        message={`Tem certeza que deseja excluir esta nota fiscal? ${invoice?.items.length ? `Todos os ${invoice.items.length} itens serão removidos.` : ''} Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
