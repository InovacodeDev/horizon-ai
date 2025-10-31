/**
 * Script para recalcular todos os saldos das contas
 *
 * Use este script se você suspeitar que os saldos estão incorretos.
 * Ele irá recalcular o saldo de todas as contas baseado nas transações.
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
    console.log('1️⃣ Buscando todas as contas...');
    const accountsResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [Query.limit(1000)]);

    console.log(`   Total de contas encontradas: ${accountsResult.documents.length}\n`);

    // Recalcular saldo de cada conta
    let successCount = 0;
    let errorCount = 0;

    for (const account of accountsResult.documents) {
      try {
        console.log(`📊 Processando conta: ${account.name} (${account.$id})`);
        console.log(`   Saldo anterior: R$ ${account.balance.toFixed(2)}`);

        const newBalance = await balanceSyncService.syncAccountBalance(account.$id);

        console.log(`   Saldo recalculado: R$ ${newBalance.toFixed(2)}`);

        const difference = newBalance - account.balance;
        if (Math.abs(difference) > 0.01) {
          console.log(`   ⚠️  Diferença: R$ ${difference.toFixed(2)}`);
        } else {
          console.log(`   ✅ Saldo estava correto`);
        }

        console.log('');
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Erro ao processar conta ${account.name}:`, error.message);
        console.log('');
        errorCount++;
      }
    }

    console.log('\n📈 Resumo:');
    console.log(`   ✅ Contas processadas com sucesso: ${successCount}`);
    console.log(`   ❌ Contas com erro: ${errorCount}`);
    console.log(`   📊 Total: ${accountsResult.documents.length}`);

    if (errorCount === 0) {
      console.log('\n✅ Todos os saldos foram recalculados com sucesso!');
    } else {
      console.log('\n⚠️  Alguns saldos não puderam ser recalculados. Verifique os erros acima.');
    }
  } catch (error: any) {
    console.error('❌ Erro fatal durante o recálculo:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar recálculo
recalculateAllBalances()
  .then(() => {
    console.log('\n✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
