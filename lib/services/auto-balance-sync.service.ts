/**
 * Auto Balance Sync Service
 *
 * DEPRECATED: Balance sync is now manual only via the "Reprocessar Saldo" button.
 * This service is kept for backward compatibility but does nothing.
 */

export class AutoBalanceSyncService {
  /**
   * @deprecated Balance sync is now manual only
   */
  start(): void {
    console.log('[AutoBalanceSync] Service is deprecated. Balance sync is now manual only.');
  }

  /**
   * @deprecated Balance sync is now manual only
   */
  stop(): void {
    // No-op
  }

  /**
   * @deprecated Balance sync is now manual only
   */
  isActive(): boolean {
    return false;
  }

  /**
   * @deprecated Balance sync is now manual only
   */
  async syncNow(): Promise<void> {
    console.log('[AutoBalanceSync] Service is deprecated. Use manual reprocess button instead.');
  }
}

// Instância singleton do serviço
let autoBalanceSyncInstance: AutoBalanceSyncService | null = null;

/**
 * @deprecated Balance sync is now manual only
 */
export function getAutoBalanceSyncService(): AutoBalanceSyncService {
  if (!autoBalanceSyncInstance) {
    autoBalanceSyncInstance = new AutoBalanceSyncService();
  }
  return autoBalanceSyncInstance;
}

/**
 * @deprecated Balance sync is now manual only
 */
export function startAutoBalanceSync(): void {
  console.log('[AutoBalanceSync] Service is deprecated. Balance sync is now manual only.');
}

/**
 * @deprecated Balance sync is now manual only
 */
export function stopAutoBalanceSync(): void {
  // No-op
}
