'use client';

import { useEffect, useState } from 'react';
import { processDueTransactionsAction } from '@/actions/transaction.actions';

const STORAGE_KEY = 'last_balance_sync_date';

/**
 * Verifica se já foi feita a sincronização hoje
 */
function hasProcessedToday(): boolean {
  if (typeof window === 'undefined') return true;
  
  try {
    const lastSyncDate = localStorage.getItem(STORAGE_KEY);
    if (!lastSyncDate) return false;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return lastSyncDate === today;
  } catch (error) {
    console.error('Error checking last sync date:', error);
    return false;
  }
}

/**
 * Marca que a sincronização foi feita hoje
 */
function markProcessedToday(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    localStorage.setItem(STORAGE_KEY, today);
  } catch (error) {
    console.error('Error saving sync date:', error);
  }
}

/**
 * Componente que processa transações vencidas ao montar
 * Executa apenas uma vez por dia (primeiro acesso do dia)
 * Mostra um modal de loading enquanto processa
 */
export function ProcessDueTransactions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Evitar processar múltiplas vezes
    if (hasChecked) return;
    
    // Verificar se já processou hoje
    if (hasProcessedToday()) {
      console.log('[ProcessDueTransactions] Already processed today, skipping');
      setHasChecked(true);
      return;
    }

    const processTransactions = async () => {
      try {
        console.log('[ProcessDueTransactions] Processing due transactions...');
        setIsProcessing(true);
        const result = await processDueTransactionsAction();
        
        if (result.processed > 0) {
          console.log(`[ProcessDueTransactions] Processed ${result.processed} accounts with due transactions`);
        } else {
          console.log('[ProcessDueTransactions] No due transactions to process');
        }
        
        // Marcar como processado hoje
        markProcessedToday();
      } catch (error) {
        console.error('[ProcessDueTransactions] Error processing due transactions:', error);
      } finally {
        setIsProcessing(false);
        setHasChecked(true);
      }
    };

    processTransactions();
  }, [hasChecked]);

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-on-surface text-center font-medium">
            Atualizando saldo das contas...
          </p>
          <p className="text-on-surface-variant text-center text-sm">
            Processando transações e transferências
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Função auxiliar para forçar reprocessamento (útil para testes ou botão manual)
 */
export function clearProcessedToday(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ProcessDueTransactions] Cleared today\'s sync flag');
  } catch (error) {
    console.error('Error clearing sync date:', error);
  }
}
