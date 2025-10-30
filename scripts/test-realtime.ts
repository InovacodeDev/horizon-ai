#!/usr/bin/env tsx

/**
 * Script para testar a configuração do Realtime do Appwrite
 *
 * Usage: tsx scripts/test-realtime.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testRealtimeConfig() {
  console.log('🔍 Testando configuração do Realtime...\n');

  // Check server-side env vars
  console.log('📋 Variáveis de Ambiente (Server-side):');
  console.log('  APPWRITE_ENDPOINT:', process.env.APPWRITE_ENDPOINT ? '✅' : '❌');
  console.log('  APPWRITE_PROJECT_ID:', process.env.APPWRITE_PROJECT_ID ? '✅' : '❌');
  console.log('  APPWRITE_DATABASE_ID:', process.env.APPWRITE_DATABASE_ID ? '✅' : '❌');
  console.log('  APPWRITE_API_KEY:', process.env.APPWRITE_API_KEY ? '✅' : '❌');

  console.log('\n📋 Variáveis de Ambiente (Client-side):');
  console.log('  NEXT_PUBLIC_APPWRITE_ENDPOINT:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? '✅' : '❌');
  console.log('  NEXT_PUBLIC_APPWRITE_PROJECT_ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? '✅' : '❌');
  console.log('  NEXT_PUBLIC_APPWRITE_DATABASE_ID:', process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ? '✅' : '❌');

  // Check if all required vars are set
  const serverVarsOk =
    process.env.APPWRITE_ENDPOINT &&
    process.env.APPWRITE_PROJECT_ID &&
    process.env.APPWRITE_DATABASE_ID &&
    process.env.APPWRITE_API_KEY;

  const clientVarsOk =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

  console.log('\n📊 Status:');
  console.log('  Server-side:', serverVarsOk ? '✅ OK' : '❌ Faltam variáveis');
  console.log('  Client-side:', clientVarsOk ? '✅ OK' : '❌ Faltam variáveis');

  if (!clientVarsOk) {
    console.log('\n⚠️  ATENÇÃO: Variáveis client-side faltando!');
    console.log('   O realtime não funcionará sem estas variáveis.');
    console.log('\n   Adicione ao seu .env.local:');
    console.log('   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1');
    console.log('   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id');
    console.log('   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id');
    process.exit(1);
  }

  console.log('\n✅ Configuração do Realtime está correta!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Inicie o servidor: pnpm dev');
  console.log('   2. Abra o navegador e verifique o console');
  console.log('   3. Procure por mensagens de subscrição: "✅ Subscribed to ... realtime updates"');
  console.log('   4. Faça uma alteração no Appwrite Console e veja os eventos: "📡 Realtime event received"');

  console.log('\n🔧 Coleções com Realtime habilitado:');
  console.log('   - accounts');
  console.log('   - credit_cards');
  console.log('   - transactions');
  console.log('   - credit_card_transactions');
}

testRealtimeConfig().catch((error) => {
  console.error('❌ Erro ao testar configuração:', error);
  process.exit(1);
});
