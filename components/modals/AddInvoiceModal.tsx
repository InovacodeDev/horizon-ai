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
  const [processingStep, setProcessingStep] = useState<string>('');
  const [progress, setProgress] = useState(0);

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
    setProcessingStep('');
    setProgress(0);
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
    setProgress(0);
    setProcessingStep('Iniciando processamento...');

    try {
      // Step 1: Extract key
      setProgress(20);
      setProcessingStep('Extraindo chave de acesso...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 2: Fetch HTML
      setProgress(40);
      setProcessingStep('Buscando dados da nota fiscal...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 3: AI Parsing
      setProgress(60);
      setProcessingStep('Processando com IA...');

      const input: CreateInvoiceInput = {
        invoiceUrl: activeTab === 'url' ? invoiceUrl : undefined,
        qrCodeData: activeTab === 'qr' ? qrCodeData : undefined,
        customCategory,
      };

      await onSubmit(input);

      // Step 4: Validation & Storage
      setProgress(90);
      setProcessingStep('Validando e salvando...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      setProgress(100);
      setProcessingStep('Concluído!');

      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar nota fiscal');
      setProgress(0);
      setProcessingStep('');
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in'>
      <div className='bg-surface-new-primary rounded-lg shadow-soft-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-smooth-200 animate-slide-up'>
        <div className='flex justify-between items-center p-6 border-b border-border-primary sticky top-0 bg-surface-new-primary z-10'>
          <h2 className='text-lg font-semibold text-text-primary'>Adicionar Nota Fiscal</h2>
          <button
            onClick={handleClose}
            className='p-2 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus'
            type='button'
            aria-label='Fechar modal'
          >
            <svg
              className='w-5 h-5'
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
          {/* Progress Bar - Show during processing */}
          {loading && (
            <div className='mb-6 p-4 bg-blue-light rounded-lg border border-blue-border'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-blue-primary'>{processingStep}</span>
                <span className='text-sm font-semibold text-blue-primary'>{progress}%</span>
              </div>
              <div className='w-full h-2 bg-surface-new-secondary rounded-full overflow-hidden'>
                <div
                  className='h-full bg-blue-primary transition-all duration-500 ease-out'
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className='text-xs text-text-secondary mt-2'>
                Aguarde enquanto processamos sua nota fiscal...
              </p>
            </div>
          )}

          {/* Input Form */}
          {true && (
            <form
              onSubmit={handleSubmit}
              className='space-y-5'
            >
              {error && (
                <div className='bg-red-bg border border-red-border text-red-text px-4 py-3 rounded-md flex items-start gap-3'>
                  <svg
                    className='w-5 h-5 flex-shrink-0 mt-0.5'
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
                      className='text-sm underline mt-2 hover:opacity-80 transition-opacity'
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
                      <label className='block text-sm font-medium text-text-primary mb-2'>
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
                        className={`w-full h-11 px-4 bg-surface-new-primary border rounded-md text-sm text-text-primary placeholder:text-text-tertiary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10 ${
                          validationError ? 'border-red-border' : 'border-border-primary'
                        }`}
                        placeholder='https://sat.sef.sc.gov.br/...'
                        disabled={loading}
                      />
                      {validationError && <p className='text-sm text-red-text mt-1.5'>{validationError}</p>}
                      <p className='text-xs text-text-tertiary mt-1.5'>
                        Cole a URL completa da nota fiscal do portal da SEFAZ
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='qr'>
                  <div className='space-y-4'>
                    {!showScanner ? (
                      <div>
                        <label className='block text-sm font-medium text-text-primary mb-2'>
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
                          className={`w-full h-11 px-4 bg-surface-new-primary border rounded-md text-sm text-text-primary placeholder:text-text-tertiary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10 ${
                            validationError ? 'border-red-border' : 'border-border-primary'
                          }`}
                          placeholder='Digite ou escaneie a chave de acesso'
                          disabled={loading}
                        />
                        {validationError && <p className='text-sm text-red-text mt-1.5'>{validationError}</p>}
                        <button
                          type='button'
                          onClick={() => setShowScanner(true)}
                          className='mt-3 w-full h-10 px-4 text-sm font-medium text-blue-primary bg-blue-light rounded-md hover:bg-blue-info-bg transition-colors-smooth flex items-center justify-center gap-2'
                        >
                          <svg
                            className='w-5 h-5'
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
                          <label className='block text-sm font-medium text-text-primary'>Escaneie o QR Code</label>
                          <button
                            type='button'
                            onClick={() => setShowScanner(false)}
                            className='text-sm text-text-secondary hover:text-text-primary transition-colors'
                          >
                            Cancelar
                          </button>
                        </div>
                        <div className='border border-border-primary rounded-lg overflow-hidden'>
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
                        <p className='text-xs text-text-tertiary mt-2'>
                          Posicione o QR Code da nota fiscal dentro da área de leitura
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Optional Category Override */}
              <div>
                <label className='block text-sm font-medium text-text-primary mb-2'>
                  Categoria (Opcional)
                </label>
                <select
                  value={customCategory || ''}
                  onChange={(e) => setCustomCategory(e.target.value as InvoiceCategory || undefined)}
                  className='w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10'
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
                <p className='text-xs text-text-tertiary mt-1.5'>
                  Se não especificada, a categoria será detectada automaticamente
                </p>
              </div>

              <div className='flex justify-end gap-3 pt-4 border-t border-border-primary'>
                <button
                  type='button'
                  onClick={handleClose}
                  className='h-10 px-4 rounded-md text-sm font-medium bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed'
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='h-10 px-4 rounded-md text-sm font-medium bg-blue-primary text-white hover:bg-blue-hover shadow-soft-xs hover:shadow-soft-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2'
                  disabled={loading || (activeTab === 'url' && !invoiceUrl) || (activeTab === 'qr' && !qrCodeData)}
                >
                  {loading && (
                    <svg
                      className='animate-spin h-4 w-4 text-white'
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
