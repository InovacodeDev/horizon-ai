/**
 * Server Initialization
 *
 * Este arquivo é executado quando o servidor Next.js inicia.
 * Inicializa todos os serviços em background necessários.
 */
import { initializeServices } from './services/init-services';

// Executar inicialização apenas no servidor
if (typeof window === 'undefined') {
  console.log('[Server] Inicializando servidor Next.js...');

  try {
    // Inicializar serviços em background
    initializeServices();

    console.log('[Server] Servidor inicializado com sucesso');
  } catch (error) {
    console.error('[Server] Erro ao inicializar servidor:', error);
  }
}

export {};
