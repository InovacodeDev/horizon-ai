'use client';

import React, { useState } from 'react';

import { Scanner } from '@yudiel/react-qr-scanner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// ============================================
// Types and Interfaces
// ============================================

export enum InvoiceCategory {
  PHARMACY = 'pharmacy',
  GROCERIES = 'groceries',
  SUPERMARKET = 'supermarket',
  RESTAURANT = 'restaurant',
  FUEL = 'fuel',
  RETAIL = 'retail',
  SERVICES = 'services',
  OTHER = 'other',
}

export interface CreateInvoiceInput {
  invoiceUrl?: string;
  qrCodeData?: string;
  customCategory?: InvoiceCategory;
  transactionId?: string;
  accountId?: string;
}

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvoiceInput) => Promise<void>;
}

// ============================================
// Helper Functions
// ============================================

const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
  [InvoiceCategory.PHARMACY]: 'Farmácia',
  [InvoiceCategory.GROCERIES]: 'Hortifruti',
  [InvoiceCategory.SUPERMARKET]: 'Supermercado',
  [InvoiceCategory.RESTAURANT]: 'Restaurante',
  [InvoiceCategory.FUEL]: 'Posto de Combustível',
  [InvoiceCategory.RETAIL]: 'Varejo',
  [InvoiceCategory.SERVICES]: 'Serviços',
  [InvoiceCategory.OTHER]: 'Outro',
};

/**
 * Validates if a string is a valid Brazilian fiscal invoice URL
 */
function validateInvoiceUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'URL não pode estar vazia' };
  }

  // Check if it's a valid URL
  try {
    new URL(url);
  } catch {
    return { valid: false, error: 'URL inválida' };
  }

  // Check if it's from a government portal
  const validDomains = ['sat.sef.sc.gov.br', 'sefaz.rs.gov.br', 'nfe.fazenda.gov.br', 'nfe.fazenda.sp.gov.br'];

  const isValidDomain = validDomains.some((domain) => url.includes(domain));

  if (!isValidDomain) {
    return {
      valid: false,
      error: 'URL deve ser de um portal governamental válido (SEFAZ)',
    };
  }

  return { valid: true };
}

/**
 * Validates if a string is a valid 44-digit invoice access key
 */
function validateInvoiceKey(key: string): { valid: boolean; error?: string } {
  if (!key || key.trim() === '') {
    return { valid: false, error: 'Chave de acesso não pode estar vazia' };
  }

  // Remove any non-digit characters
  const cleanKey = key.replace(/\D/g, '');

  if (cleanKey.length !== 44) {
    return {
      valid: false,
      error: 'Chave de acesso deve ter 44 dígitos',
    };
  }

  return { valid: true };
}

// ============================================
// Main Component
// ============================================

export function AddInvoiceModal({ isOpen, onClose, onSubmit }: AddInvoiceModalProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'qr'>('url');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [customCategory, setCustomCategory] = useState<InvoiceCategory | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Reset form state
  const resetForm = () => {
    setInvoiceUrl('');
    setQrCodeData('');
    setCustomCategory(undefined);
    setLoading(false);
    setError(null);
    setValidationError(null);
    setShowScanner(false);
    setActiveTab('url');
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate input based on active tab
  const validateInput = (): boolean => {
    setValidationError(null);

    if (activeTab === 'url') {
      const validation = validateInvoiceUrl(invoiceUrl);
      if (!validation.valid) {
        setValidationError(validation.error || 'URL inválida');
        return false;
      }
    } else {
      const validation = validateInvoiceKey(qrCodeData);
      if (!validation.valid) {
        setValidationError(validation.error || 'Chave de acesso inválida');
        return false;
      }
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInput()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: CreateInvoiceInput = {
        invoiceUrl: activeTab === 'url' ? invoiceUrl : undefined,
        qrCodeData: activeTab === 'qr' ? qrCodeData : undefined,
        customCategory,
      };

      await onSubmit(input);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar nota fiscal');
    } finally {
      setLoading(false);
    }
  };

  // Handle QR code scan
  const handleQrScan = (result: any) => {
    if (result && result.length > 0) {
      const scannedData = result[0].rawValue;
      setQrCodeData(scannedData);
      setShowScanner(false);
      setValidationError(null);
    }
  };

  // Handle QR code error
  const handleQrError = (error: any) => {
    console.error('QR Scanner error:', error);
    setError('Erro ao acessar a câmera. Verifique as permissões.');
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-center p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>Adicionar Nota Fiscal</h2>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600'
            type='button'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='p-6'>
          {/* Input Form */}
          {true && (
            <form
              onSubmit={handleSubmit}
              className='space-y-4'
            >
              {error && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-start'>
                  <svg
                    className='w-5 h-5 mr-2 mt-0.5 flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <div>
                    <p className='font-medium'>Erro</p>
                    <p className='text-sm mt-1'>{error}</p>
                    <button
                      type='button'
                      onClick={() => setError(null)}
                      className='text-sm underline mt-2 hover:text-red-700'
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}

              <Tabs 
                defaultValue='url'
                onValueChange={(value) => {
                  setActiveTab(value as 'url' | 'qr');
                  setValidationError(null);
                }}
              >
                <TabsList>
                  <TabsTrigger value='url'>
                    URL da Nota
                  </TabsTrigger>
                  <TabsTrigger value='qr'>
                    QR Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='url'>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        URL da Nota Fiscal *
                      </label>
                      <input
                        type='text'
                        required
                        value={invoiceUrl}
                        onChange={(e) => {
                          setInvoiceUrl(e.target.value);
                          setValidationError(null);
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder='https://sat.sef.sc.gov.br/...'
                        disabled={loading}
                      />
                      {validationError && <p className='text-sm text-red-600 mt-1'>{validationError}</p>}
                      <p className='text-xs text-gray-500 mt-1'>
                        Cole a URL completa da nota fiscal do portal da SEFAZ
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='qr'>
                  <div className='space-y-4'>
                    {!showScanner ? (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Chave de Acesso (44 dígitos) *
                        </label>
                        <input
                          type='text'
                          required
                          value={qrCodeData}
                          onChange={(e) => {
                            setQrCodeData(e.target.value);
                            setValidationError(null);
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationError ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder='Digite ou escaneie a chave de acesso'
                          disabled={loading}
                        />
                        {validationError && <p className='text-sm text-red-600 mt-1'>{validationError}</p>}
                        <button
                          type='button'
                          onClick={() => setShowScanner(true)}
                          className='mt-3 w-full px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center justify-center'
                        >
                          <svg
                            className='w-5 h-5 mr-2'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
                            />
                          </svg>
                          Escanear QR Code
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className='mb-3 flex justify-between items-center'>
                          <label className='block text-sm font-medium text-gray-700'>Escaneie o QR Code</label>
                          <button
                            type='button'
                            onClick={() => setShowScanner(false)}
                            className='text-sm text-gray-600 hover:text-gray-800'
                          >
                            Cancelar
                          </button>
                        </div>
                        <div className='border border-gray-300 rounded-lg overflow-hidden'>
                          <Scanner
                            onScan={handleQrScan}
                            onError={handleQrError}
                            constraints={{
                              facingMode: 'environment',
                            }}
                            styles={{
                              container: {
                                width: '100%',
                                paddingTop: '75%',
                                position: 'relative',
                              },
                              video: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              },
                            }}
                          />
                        </div>
                        <p className='text-xs text-gray-500 mt-2'>
                          Posicione o QR Code da nota fiscal dentro da área de leitura
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Optional Category Override */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Categoria (Opcional)
                </label>
                <select
                  value={customCategory || ''}
                  onChange={(e) => setCustomCategory(e.target.value as InvoiceCategory || undefined)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  disabled={loading}
                >
                  <option value=''>Detectar automaticamente</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ))}
                </select>
                <p className='text-xs text-gray-500 mt-1'>
                  Se não especificada, a categoria será detectada automaticamente
                </p>
              </div>

              <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
                <button
                  type='button'
                  onClick={handleClose}
                  className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center'
                  disabled={loading || (activeTab === 'url' && !invoiceUrl) || (activeTab === 'qr' && !qrCodeData)}
                >
                  {loading && (
                    <svg
                      className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                  )}
                  {loading ? 'Processando...' : 'Adicionar Nota Fiscal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
