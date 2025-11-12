'use server';

/**
 * Balance Sync Server Actions
 *
 * @deprecated These actions are deprecated as of the serverless architecture refactor.
 * Balance synchronization is now handled automatically by Appwrite Functions:
 *
 * - Balance Sync Function: Automatically recalculates account balances when transactions
 *   are created, updated, or deleted via database event triggers.
 * - Schedule Trigger: Runs daily at 20:00 to process any due transactions.
 *
 * For emergency manual recalculation, use syncAccountBalanceAction() which is kept
 * functional but should only be used in exceptional circumstances.
 *
 * For more information, see:
 * - docs/SERVERLESS_ARCHITECTURE.md
 * - docs/MIGRATION_TO_SERVERLESS.md
 * - functions/balance-sync/README.md
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
 *
 * @deprecated This action is deprecated and should only be used for emergency manual recalculation.
 *
 * Balance synchronization is now handled automatically by the Appwrite Balance Sync Function:
 * - Automatic: Triggers on transaction create/update/delete events
 * - Scheduled: Runs daily at 20:00 to process due transactions
 * - Real-time: UI updates automatically via Appwrite Realtime subscriptions
 *
 * This function is kept functional for emergency use only. In normal operation, balances
 * are updated automatically within seconds of any transaction change.
 *
 * If you need to manually trigger the Appwrite Function, use the Appwrite Console:
 * Functions > balance-sync > Execute
 *
 * @param accountId - The account ID to sync
 * @returns Promise with sync result
 */
export async function syncAccountBalanceAction(accountId: string): Promise<BalanceSyncActionState> {
  try {
    // Require authentication
    await requireAuth();

    console.warn(
      '[DEPRECATED] syncAccountBalanceAction called. Balance sync is now automatic via Appwrite Functions. ' +
        'This manual sync should only be used in emergencies.',
    );

    const balanceSyncService = new BalanceSyncService();
    const balance = await balanceSyncService.syncAccountBalance(accountId);

    // Revalidate paths that display accounts
    revalidatePath('/accounts');
    revalidatePath('/overview');

    return {
      success: true,
      message:
        'Saldo sincronizado com sucesso (manual). Nota: A sincronização automática via Appwrite Functions é a forma recomendada.',
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
 *
 * @deprecated This action is deprecated and should only be used for emergency manual recalculation.
 *
 * Balance synchronization is now handled automatically by the Appwrite Balance Sync Function:
 * - Automatic: Triggers on transaction create/update/delete events
 * - Scheduled: Runs daily at 20:00 to process due transactions
 * - Real-time: UI updates automatically via Appwrite Realtime subscriptions
 *
 * This function is kept functional for emergency use only. In normal operation, balances
 * are updated automatically within seconds of any transaction change.
 *
 * @param accountId - The account ID to reprocess
 * @returns Promise with reprocess result
 */
export async function reprocessAccountBalanceAction(accountId: string): Promise<BalanceSyncActionState> {
  try {
    // Require authentication
    await requireAuth();

    console.warn(
      '[DEPRECATED] reprocessAccountBalanceAction called. Balance sync is now automatic via Appwrite Functions. ' +
        'This manual reprocess should only be used in emergencies.',
    );

    const balanceSyncService = new BalanceSyncService();
    const balance = await balanceSyncService.syncAccountBalance(accountId);

    // Não fazer revalidatePath aqui para evitar refresh desnecessário
    // O cliente vai buscar a conta atualizada manualmente

    return {
      success: true,
      message:
        'Saldo reprocessado com sucesso (manual). Nota: A sincronização automática via Appwrite Functions é a forma recomendada.',
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
 *
 * @deprecated This action is deprecated. Balance recalculation is now handled automatically
 * by the Appwrite Balance Sync Function.
 *
 * The Balance Sync Function:
 * - Automatically recalculates balances when transactions change (via event triggers)
 * - Runs daily at 20:00 to process due transactions (via schedule trigger)
 * - Updates are reflected in the UI automatically via Appwrite Realtime
 *
 * For manual recalculation of all accounts (emergency use only):
 * 1. Go to Appwrite Console
 * 2. Navigate to Functions > balance-sync
 * 3. Click "Execute" to manually trigger the function
 * 4. The function will process all accounts and update balances
 *
 * For individual account recalculation, use syncAccountBalanceAction() instead.
 *
 * @returns Promise with deprecation message
 */
export async function recalculateAllBalancesAction(): Promise<BalanceSyncActionState> {
  try {
    // Require authentication
    await requireAuth();

    console.warn(
      '[DEPRECATED] recalculateAllBalancesAction called. This action is deprecated. ' +
        'Balance sync is now automatic via Appwrite Functions.',
    );

    return {
      success: false,
      error:
        'Esta ação foi descontinuada. A sincronização de saldo agora é automática via Appwrite Functions. ' +
        'Para recalcular manualmente todos os saldos em caso de emergência, use o Appwrite Console: ' +
        'Functions > balance-sync > Execute. ' +
        'Para recalcular uma conta específica, use o botão "Reprocessar Saldo" na interface da conta.',
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
