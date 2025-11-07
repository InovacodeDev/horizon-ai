/**
 * Script para recalcular todos os saldos das contas
 *
 * Este script força o recálculo de todos os saldos das contas,
 * garantindo que transações de salário sejam tratadas como receita.
 *
 * Uso: npx tsx scripts/recalculate-all-balances.ts
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { BalanceSyncService } from '@/lib/services/balance-sync.service';
import { Query } from 'node-appwrite';

async function recalculateAllBalances() {
  console.log('🔄 Iniciando recálculo de todos os saldos...\n');

  const databases = getAppwriteDatabases();
  const balanceSyncService = new BalanceSyncService();

  try {
    // Buscar todas as contas
    console.log('📊 Buscando todas as contas...');
    const accountsResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [Query.limit(1000)]);

    const accounts = accountsResult.documents || [];
    console.log(`   Encontradas ${accounts.length} contas\n`);

    // Recalcular cada conta
    let successCount = 0;
    let errorCount = 0;

    for (const account of accounts) {
      try {
        console.log(`🔄 Recalculando conta: ${account.name} (${account.$id})`);
        console.log(`   Saldo anterior: R$ ${account.balance.toFixed(2)}`);

        const newBalance = await balanceSyncService.syncAccountBalance(account.$id);

        console.log(`   Saldo novo: R$ ${newBalance.toFixed(2)}`);

        const difference = newBalance - account.balance;
        if (Math.abs(difference) > 0.01) {
          console.log(`   ⚠️  Diferença: R$ ${difference.toFixed(2)}`);
        } else {
          console.log(`   ✅ Saldo correto`);
        }

        console.log('');
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Erro ao recalcular conta ${account.name}:`, error.message);
        console.log('');
        errorCount++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   ✅ Contas recalculadas com sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log('\n✅ Recálculo concluído!');

    if (errorCount > 0) {
      console.log('\n⚠️  Algumas contas tiveram erros. Verifique os logs acima.');
    }
  } catch (error: any) {
    console.error('❌ Erro durante o recálculo:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar script
recalculateAllBalances()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
