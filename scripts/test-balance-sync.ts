/**
 * Script de teste para verificar a sincronização de saldo
 *
 * Este script testa se o saldo está sendo calculado corretamente
 * após editar uma transação.
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { BalanceSyncService } from '@/lib/services/balance-sync.service';
import { TransactionService } from '@/lib/services/transaction.service';

async function testBalanceSync() {
  console.log('🧪 Iniciando teste de sincronização de saldo...\n');

  const databases = getAppwriteDatabases();

  // Substitua com um ID de conta real do seu banco
  const TEST_ACCOUNT_ID = 'YOUR_ACCOUNT_ID_HERE';

  try {
    // 1. Buscar conta atual
    console.log('1️⃣ Buscando conta...');
    const account = await databases.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, TEST_ACCOUNT_ID);
    console.log(`   Saldo atual: R$ ${account.balance.toFixed(2)}\n`);

    // 2. Buscar todas as transações da conta
    console.log('2️⃣ Buscando transações da conta...');
    const { Query } = await import('node-appwrite');
    const transactionsResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
      Query.equal('account_id', TEST_ACCOUNT_ID),
      Query.limit(1000),
    ]);

    console.log(`   Total de transações: ${transactionsResult.documents.length}\n`);

    // 3. Calcular saldo manualmente
    console.log('3️⃣ Calculando saldo manualmente...');
    let calculatedBalance = 0;

    for (const tx of transactionsResult.documents) {
      // Ignorar transações de cartão de crédito
      if (tx.credit_card_id) continue;

      let data: any = {};
      if (tx.data) {
        try {
          data = typeof tx.data === 'string' ? JSON.parse(tx.data) : tx.data;
        } catch {
          data = {};
        }
      }

      if (data.credit_card_id) continue;

      if (tx.type === 'income' || tx.type === 'salary') {
        calculatedBalance += tx.amount;
        console.log(`   ✅ Receita: +R$ ${tx.amount.toFixed(2)} (${tx.description || 'Sem descrição'})`);
      } else if (tx.type === 'expense') {
        calculatedBalance -= tx.amount;
        console.log(`   ❌ Despesa: -R$ ${tx.amount.toFixed(2)} (${tx.description || 'Sem descrição'})`);
      }
    }

    console.log(`\n   Saldo calculado manualmente: R$ ${calculatedBalance.toFixed(2)}`);
    console.log(`   Saldo no banco de dados: R$ ${account.balance.toFixed(2)}`);

    const difference = Math.abs(calculatedBalance - account.balance);
    if (difference > 0.01) {
      console.log(`   ⚠️  DIFERENÇA ENCONTRADA: R$ ${difference.toFixed(2)}\n`);
    } else {
      console.log(`   ✅ Saldos estão corretos!\n`);
    }

    // 4. Forçar recálculo usando o serviço
    console.log('4️⃣ Forçando recálculo do saldo...');
    const balanceSyncService = new BalanceSyncService();
    const newBalance = await balanceSyncService.syncAccountBalance(TEST_ACCOUNT_ID);
    console.log(`   Novo saldo após recálculo: R$ ${newBalance.toFixed(2)}\n`);

    // 5. Verificar se o recálculo corrigiu o problema
    if (Math.abs(newBalance - calculatedBalance) < 0.01) {
      console.log('✅ Teste concluído: Saldo está correto após recálculo!');
    } else {
      console.log('❌ Teste falhou: Saldo ainda está incorreto após recálculo!');
      console.log(`   Esperado: R$ ${calculatedBalance.toFixed(2)}`);
      console.log(`   Obtido: R$ ${newBalance.toFixed(2)}`);
    }
  } catch (error: any) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error);
  }
}

// Executar teste
testBalanceSync().catch(console.error);
