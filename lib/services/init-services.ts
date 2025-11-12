/**
 * Service Initialization
 *
 * Este arquivo inicializa todos os serviços em background da aplicação.
 * Deve ser importado e executado na inicialização da aplicação (ex: layout.tsx ou middleware.ts)
 *
 * NOTA: Balance sync automático foi removido. Use o botão "Reprocessar Saldo" manualmente.
 */

let servicesInitialized = false;

/**
 * Inicializa todos os serviços em background
 */
export function initializeServices(): void {
  if (servicesInitialized) {
    console.log('[Services] Serviços já foram inicializados');
    return;
  }

  console.log('[Services] Inicializando serviços em background...');

  try {
    // Balance sync automático foi removido
    // Use o botão "Reprocessar Saldo" em cada conta para sincronização manual

    servicesInitialized = true;
    console.log('[Services] Todos os serviços foram inicializados com sucesso');
  } catch (error) {
    console.error('[Services] Erro ao inicializar serviços:', error);
    throw error;
  }
}

/**
 * Verifica se os serviços foram inicializados
 */
export function areServicesInitialized(): boolean {
  return servicesInitialized;
}
