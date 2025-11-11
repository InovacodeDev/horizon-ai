'use server';

/**
 * Balance Sync Server Actions
 * Permite controle manual da sincronização de saldo
 */
import { requireAuth } from '@/lib/auth/session';
import { getAutoBalanceSyncService } from '@/lib/services/auto-balance-sync.service';
import { BalanceSyncService } from '@/lib/services/balance-sync.service';
import { revalidatePath } from 'next/cache';

export interface BalanceSyncActionState {
  success: boolean;
  error?: string;
  message?: string;
  balance?: number;
}

/**
 * Sincroniza o saldo de uma conta específica
 */
export async function syncAccountBalanceAction(accountId: string): Promise<BalanceSyncActionState> {
  try {
    // Require authentication
    await requireAuth();

    const balanceSyncService = new BalanceSyncService();
    const balance = await balanceSyncService.syncAccountBalance(accountId);

    // Revalidate paths that display accounts
    revalidatePath('/accounts');
    revalidatePath('/overview');

    return {
      success: true,
      message: 'Saldo sincronizado com sucesso',
      balance,
    };
  } catch (error) {
    console.error('Sync account balance action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao sincronizar saldo',
    };
  }
}

/**
 * Reprocessa o saldo de uma conta específica
 * Recalcula do zero baseado em todas as transações e transferências
 */
export async function reprocessAccountBalanceAction(accountId: string): Promise<BalanceSyncActionState> {
  try {
    // Require authentication
    await requireAuth();

    const balanceSyncService = new BalanceSyncService();
    const balance = await balanceSyncService.syncAccountBalance(accountId);

    // Não fazer revalidatePath aqui para evitar refresh desnecessário
    // O cliente vai buscar a conta atualizada manualmente

    return {
      success: true,
      message: 'Saldo reprocessado com sucesso',
      balance,
    };
  } catch (error) {
    console.error('Reprocess account balance action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao reprocessar saldo',
    };
  }
}

/**
 * Recalcula o saldo de todas as contas do usuário
 */
export async function recalculateAllBalancesAction(): Promise<BalanceSyncActionState> {
  try {
    // Require authentication
    const user = await requireAuth();

    const balanceSyncService = new BalanceSyncService();
    await balanceSyncService.recalculateAllBalances(user.sub);

    // Revalidate paths that display accounts
    revalidatePath('/accounts');
    revalidatePath('/overview');

    return {
      success: true,
      message: 'Todos os saldos foram recalculados com sucesso',
    };
  } catch (error) {
    console.error('Recalculate all balances action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao recalcular saldos',
    };
  }
}

/**
 * Força uma sincronização imediata de todas as contas do sistema
 * (Apenas para administradores ou debugging)
 */
export async function forceGlobalSyncAction(): Promise<BalanceSyncActionState> {
  try {
    // Require authentication
    await requireAuth();

    const autoSyncService = getAutoBalanceSyncService();
    await autoSyncService.syncNow();

    // Revalidate paths that display accounts
    revalidatePath('/accounts');
    revalidatePath('/overview');

    return {
      success: true,
      message: 'Sincronização global executada com sucesso',
    };
  } catch (error) {
    console.error('Force global sync action error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao executar sincronização global',
    };
  }
}

/**
 * Verifica o status do serviço de sincronização automática
 */
export async function getAutoSyncStatusAction(): Promise<{
  success: boolean;
  isActive: boolean;
  error?: string;
}> {
  try {
    // Require authentication
    await requireAuth();

    const autoSyncService = getAutoBalanceSyncService();
    const isActive = autoSyncService.isActive();

    return {
      success: true,
      isActive,
    };
  } catch (error) {
    console.error('Get auto sync status action error:', error);

    return {
      success: false,
      isActive: false,
      error: error instanceof Error ? error.message : 'Falha ao verificar status',
    };
  }
}
