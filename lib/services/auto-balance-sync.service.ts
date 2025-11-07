/**
 * Auto Balance Sync Service
 *
 * Serviço que sincroniza automaticamente o saldo de todas as contas a cada 5 minutos.
 * Utiliza setInterval para executar a sincronização em background.
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { Query } from 'node-appwrite';

import { BalanceSyncService } from './balance-sync.service';

export class AutoBalanceSyncService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private syncIntervalMs: number = 5 * 60 * 1000; // 5 minutos em milissegundos

  /**
   * Inicia a sincronização automática
   */
  start(): void {
    if (this.isRunning) {
      console.log('[AutoBalanceSync] Serviço já está em execução');
      return;
    }

    console.log('[AutoBalanceSync] Iniciando sincronização automática a cada 5 minutos');
    this.isRunning = true;

    // Executa imediatamente na primeira vez
    this.syncAllAccounts().catch((error) => {
      console.error('[AutoBalanceSync] Erro na sincronização inicial:', error);
    });

    // Configura o intervalo de 5 minutos
    this.intervalId = setInterval(() => {
      this.syncAllAccounts().catch((error) => {
        console.error('[AutoBalanceSync] Erro na sincronização automática:', error);
      });
    }, this.syncIntervalMs);
  }

  /**
   * Para a sincronização automática
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[AutoBalanceSync] Serviço não está em execução');
      return;
    }

    console.log('[AutoBalanceSync] Parando sincronização automática');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Verifica se o serviço está em execução
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Sincroniza todas as contas do sistema
   */
  private async syncAllAccounts(): Promise<void> {
    const startTime = Date.now();
    console.log('[AutoBalanceSync] Iniciando sincronização de todas as contas...');

    try {
      const dbAdapter = getAppwriteDatabases();
      const balanceSyncService = new BalanceSyncService();

      // Buscar todas as contas do sistema
      const accountsResult = await dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
        Query.limit(10000), // Limite alto para pegar todas as contas
      ]);

      const accounts = accountsResult.documents || [];
      console.log(`[AutoBalanceSync] Encontradas ${accounts.length} contas para sincronizar`);

      let successCount = 0;
      let errorCount = 0;

      // Sincronizar cada conta
      for (const account of accounts) {
        try {
          await balanceSyncService.syncAccountBalance(account.$id);
          successCount++;
        } catch (error: any) {
          errorCount++;
          console.error(`[AutoBalanceSync] Erro ao sincronizar conta ${account.$id}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `[AutoBalanceSync] Sincronização concluída em ${duration}ms - ` +
          `Sucesso: ${successCount}, Erros: ${errorCount}`,
      );
    } catch (error: any) {
      console.error('[AutoBalanceSync] Erro ao buscar contas:', error);
      throw error;
    }
  }

  /**
   * Força uma sincronização imediata (útil para testes ou triggers manuais)
   */
  async syncNow(): Promise<void> {
    console.log('[AutoBalanceSync] Executando sincronização manual...');
    await this.syncAllAccounts();
  }
}

// Instância singleton do serviço
let autoBalanceSyncInstance: AutoBalanceSyncService | null = null;

/**
 * Obtém a instância singleton do serviço de sincronização automática
 */
export function getAutoBalanceSyncService(): AutoBalanceSyncService {
  if (!autoBalanceSyncInstance) {
    autoBalanceSyncInstance = new AutoBalanceSyncService();
  }
  return autoBalanceSyncInstance;
}

/**
 * Inicia o serviço de sincronização automática (deve ser chamado na inicialização da aplicação)
 */
export function startAutoBalanceSync(): void {
  const service = getAutoBalanceSyncService();
  service.start();
}

/**
 * Para o serviço de sincronização automática
 */
export function stopAutoBalanceSync(): void {
  const service = getAutoBalanceSyncService();
  service.stop();
}
