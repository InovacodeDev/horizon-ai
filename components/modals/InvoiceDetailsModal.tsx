'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
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

export default function InvoiceDetailsModal({ invoiceId, isOpen, onClose, onDelete, onCreateTransaction }: InvoiceDetailsModalProps) {
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoiceDetails();
    }
  }, [isOpen, invoiceId]);

  const fetchInvoiceDetails = async () => {
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
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeleting(true);
      await onDelete(invoiceId);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Detalhes da Nota Fiscal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              <p>{error}</p>
              <Button variant="text" onClick={fetchInvoiceDetails} className="mt-2">
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Invoice Details */}
          {!loading && !error && invoice && (
            <div className="space-y-6">
              {/* Merchant Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações do Estabelecimento</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Nome:</span>
                    <span className="text-sm text-gray-900">{invoice.merchant_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">CNPJ:</span>
                    <span className="text-sm text-gray-900 font-mono">{invoice.merchant_cnpj}</span>
                  </div>
                  {invoiceData.merchant_address && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Endereço:</span>
                      <span className="text-sm text-gray-900 text-right max-w-md">{invoiceData.merchant_address}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Data de Emissão:</span>
                    <span className="text-sm text-gray-900">{formatDate(invoice.issue_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Número da Nota:</span>
                    <span className="text-sm text-gray-900">{invoice.invoice_number}</span>
                  </div>
                  {invoiceData.series && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Série:</span>
                      <span className="text-sm text-gray-900">{invoiceData.series}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Itens da Nota</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left text-xs font-medium text-gray-700 uppercase tracking-wider p-3">
                          Produto
                        </th>
                        <th className="text-right text-xs font-medium text-gray-700 uppercase tracking-wider p-3">
                          Qtd
                        </th>
                        <th className="text-right text-xs font-medium text-gray-700 uppercase tracking-wider p-3">
                          Preço Unit.
                        </th>
                        <th className="text-right text-xs font-medium text-gray-700 uppercase tracking-wider p-3">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.items.map((item) => (
                        <tr key={item.$id} className="hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.description}</p>
                              {item.product_code && (
                                <p className="text-xs text-gray-500 font-mono mt-1">Cód: {item.product_code}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right text-sm text-gray-900">{item.quantity}</td>
                          <td className="p-3 text-right text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="p-3 text-right text-sm font-medium text-gray-900">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo dos Valores</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Subtotal:</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(
                        invoice.total_amount + (invoiceData.discount_amount || 0) - (invoiceData.tax_amount || 0),
                      )}
                    </span>
                  </div>
                  {invoiceData.discount_amount && invoiceData.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Descontos:</span>
                      <span className="text-sm text-green-600">-{formatCurrency(invoiceData.discount_amount)}</span>
                    </div>
                  )}
                  {invoiceData.tax_amount && invoiceData.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Impostos:</span>
                      <span className="text-sm text-gray-900">{formatCurrency(invoiceData.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-base font-semibold text-gray-900">Total:</span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Original Invoice Link */}
              {invoiceData.xml_data && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Nota Fiscal Original</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Chave de Acesso: <span className="font-mono text-xs">{invoice.invoice_key}</span>
                  </p>
                  <a
                    href={`https://sat.sef.sc.gov.br/nfce/consulta?p=${invoice.invoice_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
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
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <Button
                variant="outlined"
                onClick={handleDelete}
                disabled={deleting}
                className="text-error border-error hover:bg-error/5"
              >
                {deleting ? 'Excluindo...' : 'Excluir Nota Fiscal'}
              </Button>
              {onCreateTransaction && !invoiceData.transaction_id && (
                <Button
                  variant="outlined"
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
                  variant="outlined"
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
            <Button onClick={onClose}>Fechar</Button>
          </div>
        )}
      </div>
    </div>
  );
}
