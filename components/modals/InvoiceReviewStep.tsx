import React, { useState, useEffect } from 'react';
import { ParsedInvoice, ParsedInvoiceItem, InvoiceCategory } from '@/lib/services/invoice-types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface InvoiceReviewStepProps {
  initialData: ParsedInvoice;
  onSave: (data: ParsedInvoice) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function InvoiceReviewStep({ initialData, onSave, onCancel, loading }: InvoiceReviewStepProps) {
  const [invoice, setInvoice] = useState<ParsedInvoice>(initialData);
  
  // Ensure dates are Date objects
  useEffect(() => {
    if (typeof initialData.issueDate === 'string') {
      setInvoice({
        ...initialData,
        issueDate: new Date(initialData.issueDate)
      });
    }
  }, [initialData]);

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleMerchantChange = (field: string, value: string) => {
    let newValue = value;
    if (field === 'cnpj') {
      newValue = formatCNPJ(value);
    }
    setInvoice(prev => ({
      ...prev,
      merchant: {
        ...prev.merchant,
        [field]: newValue
      }
    }));
  };

  const handleItemChange = (index: number, field: keyof ParsedInvoiceItem, value: any) => {
    setInvoice(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      
      // Recalculate total price for the item if quantity or unit price changes
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
      }

      return {
        ...prev,
        items: newItems
      };
    });
  };

  const handleDeleteItem = (index: number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleAddItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: 'Novo Item',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          discountAmount: 0
        }
      ]
    }));
  };

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    return {
      ...invoice.totals,
      subtotal,
      total: subtotal - invoice.totals.discount + invoice.totals.tax
    };
  };

  const handleTotalChange = (newTotal: number) => {
    if (isNaN(newTotal)) return;
    
    const subtotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
    let discount = 0;
    let tax = 0;

    // Adjust discount or tax to match the new total
    if (newTotal < subtotal) {
      discount = subtotal - newTotal;
    } else {
      tax = newTotal - subtotal;
    }

    setInvoice(prev => ({
      ...prev,
      totals: {
        ...prev.totals,
        discount,
        tax,
        total: newTotal
      }
    }));
  };

  useEffect(() => {
    setInvoice(prev => ({
      ...prev,
      totals: calculateTotals()
    }));
  }, [invoice.items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(invoice);
  };

  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-on-surface">Revisar Nota Fiscal</h3>
        <span className="text-sm text-on-surface-variant">Verifique e edite os dados antes de salvar</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Merchant Info */}
        <Card className="p-4 space-y-4">
          <h4 className="font-medium text-on-surface border-b border-outline pb-2">Estabelecimento</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Nome</label>
              <input
                type="text"
                value={invoice.merchant.name}
                onChange={(e) => handleMerchantChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-outline bg-surface text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">CNPJ</label>
              <input
                type="text"
                value={invoice.merchant.cnpj}
                onChange={(e) => handleMerchantChange('cnpj', e.target.value)}
                maxLength={18}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 border border-outline bg-surface text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Data de Emissão</label>
              <input
                type="datetime-local"
                value={isValidDate(invoice.issueDate) ? invoice.issueDate.toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    setInvoice(prev => ({ ...prev, issueDate: date }));
                  }
                }}
                className="w-full px-3 py-2 border border-outline bg-surface text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card className="p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-outline pb-2">
            <h4 className="font-medium text-on-surface">Itens ({invoice.items.length})</h4>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              + Adicionar Item
            </Button>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {invoice.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-surface-variant/10 rounded-lg border border-outline/50">
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Descrição</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-outline bg-surface text-on-surface rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Qtd</label>
                  <input
                    type="number"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-outline bg-surface text-on-surface rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Unitário</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-outline bg-surface text-on-surface rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Total</label>
                  <div className="px-2 py-1 text-sm font-medium text-on-surface">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1 flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(index)}
                    className="text-error hover:text-error/80 p-1"
                    title="Remover item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Totals */}
        <Card className="p-4 bg-surface-variant/20">
          <div className="flex flex-col gap-2 items-end">
            <div className="flex justify-between w-full md:w-1/3 text-sm">
              <span className="text-on-surface-variant">Subtotal:</span>
              <span className="text-on-surface">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.totals.subtotal)}</span>
            </div>
            <div className="flex justify-between w-full md:w-1/3 text-sm">
              <span className="text-on-surface-variant">Descontos:</span>
              <span className="text-on-surface text-success">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.totals.discount)}</span>
            </div>
            <div className="flex justify-between items-end w-full md:w-1/3 text-lg font-bold border-t border-outline pt-2 mt-1">
              <span className="text-on-surface">Total:</span>
              <div className="flex items-center justify-end">
                <span className="text-primary mr-1">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={invoice.totals.total}
                  onChange={(e) => handleTotalChange(parseFloat(e.target.value))}
                  className="w-24 px-0 py-0 text-lg font-bold text-primary bg-transparent border-b border-primary/30 focus:border-primary outline-none text-right placeholder-primary/50"
                  style={{ MozAppearance: 'textfield' }} // Removes spinner on Firefox
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t border-outline">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Confirmar e Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
