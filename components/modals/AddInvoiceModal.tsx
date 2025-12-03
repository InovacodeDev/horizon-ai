'use client';

import React, { useEffect, useState } from 'react';

import { Scanner } from '@yudiel/react-qr-scanner';

import { useMediaQuery } from '@/hooks/use-media-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// ============================================
// Types and Interfaces
// ============================================

import { InvoiceCategory } from '@/lib/services/nfe-crawler/types';

export interface CreateInvoiceInput {
  invoiceUrl?: string;
  qrCodeData?: string;
  xmlContent?: string;
  pdfBuffer?: ArrayBuffer | number[];
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
  [InvoiceCategory.HOME]: 'Casa e Decoração',
  [InvoiceCategory.ELECTRONICS]: 'Eletrônicos',
  [InvoiceCategory.CLOTHING]: 'Vestuário',
  [InvoiceCategory.ENTERTAINMENT]: 'Entretenimento',
  [InvoiceCategory.TRANSPORT]: 'Transporte',
  [InvoiceCategory.HEALTH]: 'Saúde',
  [InvoiceCategory.EDUCATION]: 'Educação',
  [InvoiceCategory.PETS]: 'Pets',
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
  const [activeTab, setActiveTab] = useState<'url' | 'qr' | 'xml' | 'pdf'>('url');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [customCategory, setCustomCategory] = useState<InvoiceCategory | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [progress, setProgress] = useState(0);

  // Check if mobile (md breakpoint is usually 768px)
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Effect to handle tab visibility changes
  useEffect(() => {
    if (isOpen) {
      // If on desktop and QR tab is active, switch to URL
      if (isDesktop && activeTab === 'qr') {
        setActiveTab('url');
      }
    }
  }, [isOpen, isDesktop, activeTab]);

  // Reset form state
  const resetForm = () => {
    setInvoiceUrl('');
    setQrCodeData('');
    setXmlFile(null);
    setPdfFile(null);
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
    } else if (activeTab === 'qr') {
      const validation = validateInvoiceKey(qrCodeData);
      if (!validation.valid) {
        setValidationError(validation.error || 'Chave de acesso inválida');
        return false;
      }
    } else if (activeTab === 'xml') {
      if (!xmlFile) {
        setValidationError('Selecione um arquivo XML');
        return false;
      }
    } else if (activeTab === 'pdf') {
      if (!pdfFile) {
        setValidationError('Selecione um arquivo PDF');
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
      // Step 1: Extract key / Read file
      setProgress(20);
      
      let input: CreateInvoiceInput = {
        customCategory,
      };

      if (activeTab === 'url') {
        setProcessingStep('Extraindo chave de acesso...');
        input.invoiceUrl = invoiceUrl;
      } else if (activeTab === 'qr') {
        setProcessingStep('Processando QR Code...');
        input.qrCodeData = qrCodeData;
      } else if (activeTab === 'xml' && xmlFile) {
        setProcessingStep('Lendo arquivo XML...');
        const text = await xmlFile.text();
        input.xmlContent = text;
      } else if (activeTab === 'pdf' && pdfFile) {
        setProcessingStep('Lendo arquivo PDF...');
        const buffer = await pdfFile.arrayBuffer();
        console.log({
          buffer,
          pdfFile,
          uint8Array: new Uint8Array(buffer),
        })
        input.pdfBuffer = Array.from(new Uint8Array(buffer));
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 2: Processing
      setProgress(40);
      setProcessingStep('Processando dados...');
      
      // Step 3: AI Parsing (if applicable)
      setProgress(60);
      setProcessingStep('Analisando com IA...');

      // Dynamic progress messages to keep user informed
      const aiMessages = [
        'Analisando itens da nota...',
        'Agrupando produtos similares...',
        'Identificando categorias...',
        'Verificando metadados...',
        'Finalizando processamento...'
      ];
      
      let msgIndex = 0;
      const progressInterval = setInterval(() => {
        if (msgIndex < aiMessages.length) {
          setProcessingStep(aiMessages[msgIndex]);
          // Increment progress slightly up to 85% to show activity
          setProgress((prev) => Math.min(prev + 5, 85));
          msgIndex++;
        }
      }, 2500);

      try {
        await onSubmit(input);
      } finally {
        clearInterval(progressInterval);
      }

      // Step 4: Validation & Storage
      setProgress(90);
      setProcessingStep('Validando e salvando...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      setProgress(100);
      setProcessingStep('Concluído!');

      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Erro ao adicionar nota:', err);
      
      let errorMessage = 'Falha ao registrar nota fiscal. Tente novamente.';
      
      // Tratamento de erros específicos
      if (err.message) {
        if (err.message.includes('Invoice already exists')) {
          errorMessage = 'Esta nota fiscal já foi registrada anteriormente.';
        } else if (err.message.includes('Invalid invoice URL')) {
          errorMessage = 'A URL fornecida não é válida ou não pertence a um portal suportado.';
        } else if (err.message.includes('Could not extract invoice key')) {
          errorMessage = 'Não foi possível identificar a chave de acesso na URL ou arquivo fornecido.';
        } else if (err.message.includes('Failed to fetch invoice')) {
          errorMessage = 'Não foi possível acessar os dados da nota fiscal. O portal da SEFAZ pode estar indisponível.';
        } else if (err.message.includes('Empty response')) {
          errorMessage = 'O portal da SEFAZ retornou uma resposta vazia. Tente novamente mais tarde.';
        } else if (err.message.includes('PDF_PARSE_ERROR')) {
          errorMessage = 'Erro ao ler o arquivo PDF. Verifique se o arquivo não está corrompido.';
        } else if (err.message.includes('XML_PARSE_ERROR')) {
          errorMessage = 'Erro ao ler o arquivo XML. O formato pode estar incorreto.';
        } else {
          // Se for uma mensagem genérica em inglês, tenta traduzir ou usa a original se não mapeada
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
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
    setError('Não foi possível acessar a câmera. Verifique se você concedeu permissão de acesso à câmera no seu navegador.');
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
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as any);
                  setValidationError(null);
                }}
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value='url'>
                    URL
                  </TabsTrigger>
                  {!isDesktop && (
                    <TabsTrigger value='qr'>
                      QR Code
                    </TabsTrigger>
                  )}
                  <TabsTrigger value='xml'>
                    XML
                  </TabsTrigger>
                  <TabsTrigger value='pdf'>
                    PDF
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
                        required={activeTab === 'url'}
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
                          required={activeTab === 'qr'}
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

                <TabsContent value='xml'>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-text-primary mb-2'>
                        Arquivo XML *
                      </label>
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        validationError ? 'border-red-border bg-red-bg/10' : 'border-border-primary hover:border-blue-primary/50'
                      }`}>
                        <input
                          type='file'
                          accept='.xml'
                          required={activeTab === 'xml'}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setXmlFile(file);
                            setValidationError(null);
                          }}
                          className='hidden'
                          id='xml-upload'
                          disabled={loading}
                        />
                        <label htmlFor='xml-upload' className='cursor-pointer flex flex-col items-center gap-2'>
                          <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className='text-sm font-medium text-blue-primary'>
                            {xmlFile ? xmlFile.name : 'Clique para selecionar o arquivo XML'}
                          </span>
                          <span className='text-xs text-text-tertiary'>
                            Suporta apenas arquivos .xml de NFe/NFCe
                          </span>
                        </label>
                      </div>
                      {validationError && <p className='text-sm text-red-text mt-1.5'>{validationError}</p>}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='pdf'>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-text-primary mb-2'>
                        Arquivo PDF *
                      </label>
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        validationError ? 'border-red-border bg-red-bg/10' : 'border-border-primary hover:border-blue-primary/50'
                      }`}>
                        <input
                          type='file'
                          accept='.pdf'
                          required={activeTab === 'pdf'}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setPdfFile(file);
                            setValidationError(null);
                          }}
                          className='hidden'
                          id='pdf-upload'
                          disabled={loading}
                        />
                        <label htmlFor='pdf-upload' className='cursor-pointer flex flex-col items-center gap-2'>
                          <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className='text-sm font-medium text-blue-primary'>
                            {pdfFile ? pdfFile.name : 'Clique para selecionar o arquivo PDF'}
                          </span>
                          <span className='text-xs text-text-tertiary'>
                            Suporta apenas arquivos .pdf
                          </span>
                        </label>
                      </div>
                      {validationError && <p className='text-sm text-red-text mt-1.5'>{validationError}</p>}
                    </div>
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
                  disabled={loading || (activeTab === 'url' && !invoiceUrl) || (activeTab === 'qr' && !qrCodeData) || (activeTab === 'xml' && !xmlFile) || (activeTab === 'pdf' && !pdfFile)}
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
