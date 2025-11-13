'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Account, ParsedTransaction, ImportPreviewResponse } from '@/lib/types';
import { ImportErrorCode, getErrorMessage } from '@/lib/types/import.types';
import ImportPreview from './ImportPreview';

interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
  accounts: Account[];
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

interface ImportState {
  step: ImportStep;
  file: File | null;
  selectedAccount: string | null;
  parsedTransactions: ParsedTransaction[];
  selectedTransactions: Set<string>;
  duplicates: Set<string>;
  error: string | null;
  progress: number;
  progressMessage: string;
  summary: {
    total: number;
    income: number;
    expense: number;
    duplicateCount: number;
    totalAmount: number;
  } | null;
  matchedAccountId?: string;
  accountInfo?: any;
  accountConfirmed: boolean;
  importResult?: {
    imported: number;
    failed: number;
  };
}

export function ImportTransactionsModal({
  isOpen,
  onClose,
  onImportComplete,
  accounts,
}: ImportTransactionsModalProps) {
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    selectedAccount: null,
    parsedTransactions: [],
    selectedTransactions: new Set(),
    duplicates: new Set(),
    error: null,
    progress: 0,
    progressMessage: '',
    summary: null,
    matchedAccountId: undefined,
    accountInfo: undefined,
    accountConfirmed: false,
    importResult: undefined,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      selectedAccount: null,
      parsedTransactions: [],
      selectedTransactions: new Set(),
      duplicates: new Set(),
      error: null,
      progress: 0,
      progressMessage: '',
      summary: null,
      matchedAccountId: undefined,
      accountInfo: undefined,
      accountConfirmed: false,
      importResult: undefined,
    });
    onClose();
  }, [onClose]);

  // Validate file
  const validateFile = (file: File): string | null => {
    const validExtensions = ['.ofx', '.csv'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(extension)) {
      return getErrorMessage(ImportErrorCode.INVALID_FILE_FORMAT, true);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return getErrorMessage(ImportErrorCode.FILE_TOO_LARGE, true);
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setState((prev) => ({ ...prev, error, file: null }));
      return;
    }

    setState((prev) => ({
      ...prev,
      file,
      error: null,
    }));
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  // Handle upload and preview
  const handleUpload = async () => {
    if (!state.file || !state.selectedAccount) {
      setState((prev) => ({
        ...prev,
        error: 'Selecione um arquivo e uma conta',
      }));
      return;
    }

    setState((prev) => ({ ...prev, progress: 10, progressMessage: 'Enviando arquivo...', error: null }));

    try {
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('accountId', state.selectedAccount);

      setState((prev) => ({ ...prev, progress: 30, progressMessage: 'Processando arquivo...' }));

      const response = await fetch('/api/transactions/import/preview', {
        method: 'POST',
        body: formData,
      });

      setState((prev) => ({ ...prev, progress: 70, progressMessage: 'Analisando transações...' }));

      const result: ImportPreviewResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao processar arquivo');
      }

      setState((prev) => ({ ...prev, progress: 100, progressMessage: 'Concluído!' }));

      // Select all transactions by default
      const allIds = new Set(result.data.transactions.map((t) => t.id));

      // If we have a matched account, update the selected account and mark as confirmed
      const matchedAccountId = result.data.matchedAccountId;
      const shouldUpdateAccount = matchedAccountId && matchedAccountId !== state.selectedAccount;

      // Small delay to show completion message
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          step: 'preview',
          parsedTransactions: result.data!.transactions,
          selectedTransactions: allIds,
          duplicates: new Set(result.data!.duplicates),
          summary: result.data!.summary,
          matchedAccountId: result.data!.matchedAccountId,
          accountInfo: result.data!.accountInfo,
          selectedAccount: shouldUpdateAccount ? matchedAccountId : prev.selectedAccount,
          accountConfirmed: false, // User must confirm account selection
          progress: 0,
          progressMessage: '',
        }));
      }, 500);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Erro ao processar arquivo',
        progress: 0,
        progressMessage: '',
      }));
    }
  };

  // Handle import confirmation
  const handleConfirmImport = async () => {
    if (!state.selectedAccount || state.selectedTransactions.size === 0) {
      setState((prev) => ({
        ...prev,
        error: 'Selecione pelo menos uma transação',
      }));
      return;
    }

    setState((prev) => ({ ...prev, step: 'importing', progress: 0, progressMessage: 'Iniciando importação...', error: null }));

    try {
      const selectedTxns = state.parsedTransactions.filter((t) => state.selectedTransactions.has(t.id));
      const totalTransactions = selectedTxns.length;

      // Simulate progress updates during import
      const progressInterval = setInterval(() => {
        setState((prev) => {
          if (prev.progress < 90) {
            const newProgress = Math.min(prev.progress + 10, 90);
            const processedCount = Math.floor((newProgress / 100) * totalTransactions);
            return {
              ...prev,
              progress: newProgress,
              progressMessage: `Importando transações... (${processedCount}/${totalTransactions})`,
            };
          }
          return prev;
        });
      }, 300);

      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: state.selectedAccount,
          transactions: selectedTxns,
          fileName: state.file?.name || 'unknown',
        }),
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao importar transações');
      }

      setState((prev) => ({
        ...prev,
        step: 'complete',
        progress: 100,
        progressMessage: 'Importação concluída!',
        importResult: {
          imported: result.data.imported,
          failed: result.data.failed,
        },
      }));

      // Notify parent component
      onImportComplete(result.data.imported);

      // Close modal after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Erro ao importar transações',
        step: 'preview',
        progress: 0,
        progressMessage: '',
      }));
    }
  };

  // Handle transaction selection toggle
  const handleToggleTransaction = useCallback((id: string) => {
    setState((prev) => {
      const newSelected = new Set(prev.selectedTransactions);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { ...prev, selectedTransactions: newSelected };
    });
  }, []);

  // Handle select/deselect all
  const handleToggleAll = useCallback(() => {
    setState((prev) => {
      const allIds = prev.parsedTransactions.map((t) => t.id);
      const allSelected = allIds.every((id) => prev.selectedTransactions.has(id));

      if (allSelected) {
        return { ...prev, selectedTransactions: new Set() };
      } else {
        return { ...prev, selectedTransactions: new Set(allIds) };
      }
    });
  }, []);

  // Handle cancel from preview
  const handleCancelPreview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'upload',
      parsedTransactions: [],
      selectedTransactions: new Set(),
      duplicates: new Set(),
      summary: null,
      matchedAccountId: undefined,
      accountInfo: undefined,
      accountConfirmed: false,
      error: null,
      progress: 0,
      progressMessage: '',
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      aria-labelledby="import-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface-new-primary w-full max-w-4xl rounded-lg shadow-soft-xl max-h-[90vh] overflow-y-auto transform transition-smooth-200 animate-slide-up mx-4 sm:mx-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border-primary sticky top-0 bg-surface-new-primary z-10">
          <h2 id="import-modal-title" className="text-lg font-semibold text-text-primary">
            Importar Transações
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus"
            type="button"
            aria-label="Fechar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Step */}
          {state.step === 'upload' && (
            <div className="space-y-5">
              {/* Help Section */}
              <div className="bg-blue-light border border-blue-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-primary mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-text-primary mb-2">Como importar transações</h3>
                    <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                      <li>Selecione a conta bancária de destino</li>
                      <li>Faça upload do arquivo de extrato (OFX ou CSV)</li>
                      <li>Revise as transações encontradas</li>
                      <li>Confirme a importação</li>
                    </ol>
                    <details className="mt-3">
                      <summary className="text-sm font-medium text-blue-primary cursor-pointer hover:text-blue-hover">
                        Ver formatos suportados
                      </summary>
                      <div className="mt-2 pl-4 space-y-2 text-xs text-text-secondary">
                        <div>
                          <strong className="text-text-primary">OFX (.ofx)</strong>
                          <p>Formato padrão dos bancos. Detecta automaticamente a conta correta.</p>
                        </div>
                        <div>
                          <strong className="text-text-primary">CSV (.csv)</strong>
                          <p>Planilha simples. Deve conter colunas: Data, Descrição e Valor.</p>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Conta de Destino *
                </label>
                <select
                  required
                  value={state.selectedAccount || ''}
                  onChange={(e) => setState((prev) => ({ ...prev, selectedAccount: e.target.value }))}
                  className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
                  aria-label="Selecione a conta de destino"
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map((account) => (
                    <option key={account.$id} value={account.$id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-text-tertiary">
                  As transações importadas serão associadas a esta conta. Para arquivos OFX, tentaremos detectar
                  automaticamente a conta correta.
                </p>
              </div>



              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Arquivo de Extrato *
                </label>
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors-smooth
                    ${isDragging ? 'border-blue-primary bg-blue-light' : 'border-border-primary hover:border-border-focus'}
                    ${state.file ? 'bg-blue-light border-blue-primary' : ''}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Área de upload de arquivo"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ofx,.csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                    aria-label="Selecionar arquivo"
                  />

                  {!state.file ? (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-text-tertiary mb-4"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-sm text-text-primary mb-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-medium text-blue-primary hover:text-blue-hover focus:outline-none focus:underline"
                        >
                          Clique para selecionar
                        </button>{' '}
                        ou arraste o arquivo aqui
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Formatos suportados: OFX, CSV (máx. 10MB)
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <svg
                        className="h-8 w-8 text-blue-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">{state.file.name}</p>
                        <p className="text-xs text-text-tertiary">
                          {(state.file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setState((prev) => ({ ...prev, file: null, error: null }));
                        }}
                        className="ml-auto p-1 rounded-md text-text-secondary hover:text-red-text hover:bg-red-bg transition-colors-smooth"
                        aria-label="Remover arquivo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {state.error && (
                <div
                  className="bg-red-bg border border-red-border rounded-lg p-4 animate-fade-in"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-text mt-0.5 flex-shrink-0 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-text mb-1">Erro na Importação</p>
                      <p className="text-sm text-text-secondary">{state.error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setState((prev) => ({ ...prev, error: null }))}
                      className="p-1 rounded-md text-text-secondary hover:text-red-text hover:bg-red-bg transition-colors-smooth"
                      aria-label="Fechar mensagem de erro"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {state.progress > 0 && state.progress < 100 && (
                <div>
                  <div className="flex justify-between text-sm text-text-secondary mb-2">
                    <span>{state.progressMessage || 'Processando arquivo...'}</span>
                    <span>{state.progress}%</span>
                  </div>
                  <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-primary h-full transition-all duration-300 ease-out"
                      style={{ width: `${state.progress}%` }}
                      role="progressbar"
                      aria-valuenow={state.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={state.progressMessage || 'Processando arquivo'}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border-primary">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-10 px-4 rounded-md text-sm font-medium bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus w-full sm:w-auto"
                  disabled={state.progress > 0 && state.progress < 100}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  className="h-10 px-4 rounded-md text-sm font-medium bg-blue-primary text-white hover:bg-blue-hover shadow-soft-xs hover:shadow-soft-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                  disabled={!state.file || !state.selectedAccount || (state.progress > 0 && state.progress < 100)}
                >
                  Processar Arquivo
                </button>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {state.step === 'preview' && (
            <div className="space-y-5">
              {/* Account Confirmation Section */}
              {!state.accountConfirmed && (
                <div className="bg-blue-light border border-blue-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-primary mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-text-primary mb-2">Confirme a conta de destino</h3>
                      {state.matchedAccountId && (
                        <p className="text-sm text-text-secondary mb-3">
                          Detectamos que este arquivo pertence à conta{' '}
                          <span className="font-medium text-text-primary">
                            {accounts.find((a) => a.$id === state.matchedAccountId)?.name || 'selecionada'}
                          </span>
                          {state.accountInfo?.ACCTID && (
                            <span className="text-text-tertiary">
                              {' '}
                              (conta {state.accountInfo.ACCTID.slice(-4)})
                            </span>
                          )}
                          .
                        </p>
                      )}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Conta de Destino *
                        </label>
                        <select
                          required
                          value={state.selectedAccount || ''}
                          onChange={(e) =>
                            setState((prev) => ({ ...prev, selectedAccount: e.target.value, accountConfirmed: false }))
                          }
                          className="w-full h-11 px-4 bg-surface-new-primary border border-border-primary rounded-md text-sm text-text-primary transition-colors-smooth focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus focus:ring-opacity-10"
                          aria-label="Selecione a conta de destino"
                        >
                          <option value="">Selecione uma conta</option>
                          {accounts.map((account) => (
                            <option key={account.$id} value={account.$id}>
                              {account.$id === state.matchedAccountId ? '✓ ' : ''}
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!state.selectedAccount) {
                            setState((prev) => ({ ...prev, error: 'Selecione uma conta' }));
                            return;
                          }
                          setState((prev) => ({ ...prev, accountConfirmed: true, error: null }));
                        }}
                        className="h-9 px-4 rounded-md text-sm font-medium bg-blue-primary text-white hover:bg-blue-hover shadow-soft-xs hover:shadow-soft-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-border-focus"
                        disabled={!state.selectedAccount}
                      >
                        Confirmar Conta
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show preview only after account is confirmed */}
              {state.accountConfirmed && (
                <ImportPreview
                  transactions={state.parsedTransactions}
                  duplicates={state.duplicates}
                  selectedTransactions={state.selectedTransactions}
                  summary={state.summary}
                  onToggleTransaction={handleToggleTransaction}
                  onToggleAll={handleToggleAll}
                  onConfirm={handleConfirmImport}
                  onCancel={handleCancelPreview}
                  error={state.error}
                />
              )}

              {/* Cancel button when account not confirmed */}
              {!state.accountConfirmed && (
                <div className="flex justify-end pt-4 border-t border-border-primary">
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    className="h-10 px-4 rounded-md text-sm font-medium bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-border-focus w-full sm:w-auto"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Importing Step */}
          {state.step === 'importing' && (
            <div className="text-center py-12 animate-fade-in">
              <div className="relative inline-block mb-4">
                <svg
                  className="animate-spin h-12 w-12 text-blue-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-blue-light animate-progress-pulse" />
                </div>
              </div>
              <p className="text-lg font-semibold text-text-primary mb-2">Importando transações...</p>
              <p className="text-sm text-text-secondary mb-4">{state.progressMessage}</p>
              
              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-text-secondary mb-2">
                  <span>Progresso</span>
                  <span>{state.progress}%</span>
                </div>
                <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-primary h-full transition-all duration-300 ease-out"
                    style={{ width: `${state.progress}%` }}
                    role="progressbar"
                    aria-valuenow={state.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Importação ${state.progress}% concluída`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {state.step === 'complete' && (
            <div className="text-center py-12 animate-fade-in">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-bg mb-4 animate-scale-in">
                <svg
                  className="h-8 w-8 text-green-text animate-check-mark"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-text-primary mb-2">Importação concluída!</p>
              
              {/* Success Summary */}
              {state.importResult && (
                <div className="max-w-md mx-auto mt-4">
                  {state.importResult.failed === 0 ? (
                    <p className="text-sm text-text-secondary">
                      {state.importResult.imported} {state.importResult.imported === 1 ? 'transação foi importada' : 'transações foram importadas'} com sucesso
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-text-secondary">
                        Importação parcial concluída
                      </p>
                      <div className="bg-bg-secondary rounded-lg p-4 text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-text-secondary">Importadas com sucesso:</span>
                          <span className="text-sm font-medium text-green-text">{state.importResult.imported}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">Falharam:</span>
                          <span className="text-sm font-medium text-red-text">{state.importResult.failed}</span>
                        </div>
                      </div>
                      <p className="text-xs text-text-tertiary mt-2">
                        Algumas transações não puderam ser importadas. Verifique os dados e tente novamente.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
