'use server';

/**
 * Balance Sync Server Actions
 * Permite controle manual da sincronização de saldo
 */
import { requireAuth } from '@/lib/auth/session';
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
 * @deprecated Balance sync is now manual only via the "Reprocessar Saldo" button
 */
export async function forceGlobalSyncAction(): Promise<BalanceSyncActionState> {
  return {
    success: false,
    error: 'Sincronização automática foi removida. Use o botão "Reprocessar Saldo" em cada conta.',
  };
}

/**
 * @deprecated Balance sync is now manual only
 */
export async function getAutoSyncStatusAction(): Promise<{
  success: boolean;
  isActive: boolean;
  error?: string;
}> {
  return {
    success: true,
    isActive: false,
  };
}
