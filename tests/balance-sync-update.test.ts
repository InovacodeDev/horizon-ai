#!/usr/bin/env tsx
/**
 * Balance Sync Update Test
 *
 * Teste de atualização de transações: muda status de completed para pending
 * e verifica se a função balance-sync reprocessa corretamente
 *
 * Uso: pnpm tsx tests/balance-sync-update.test.ts
 */
import 'dotenv/config';
import { ID, Query } from 'node-appwrite';

import { getAppwriteDatabases } from '../lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '../lib/appwrite/schema';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

// IDs de teste
let testUserId: string;
let testAccountIds: string[] = [];
let testTransactionIds: string[] = [];
let initialBalances: number[] = [];

// Helper para log de resultados
function logResult(result: TestResult) {
  results.push(result);
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.data) {
    console.log('   Dados:', JSON.stringify(result.data, null, 2));
  }
}

// Helper para aguardar processamento
async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Setup: Criar usuário e 3 contas de teste
 */
async function setupTestData() {
  console.log('🔧 Configurando dados de teste...\n');

  const databases = getAppwriteDatabases();

  try {
    testUserId = `test_user_${Date.now()}`;

    const accountNames = ['Conta Corrente', 'Conta Poupança', 'Conta Investimento'];

    for (const name of accountNames) {
      const account = await databases.createDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, ID.unique(), {
        user_id: testUserId,
        name,
        balance: 0,
        is_manual: true,
        synced_transaction_ids: '[]',
        bank_id: null,
        last_digits: null,
        status: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      testAccountIds.push(account.$id);
      console.log(`✅ Conta criada: ${name} (ID: ${account.$id})`);
    }

    console.log(`\n✅ Setup concluído: ${testAccountIds.length} contas criadas\n`);
  } catch (error: any) {
    console.error('❌ Erro no setup:', error.message);
    process.exit(1);
  }
}

/**
 * Teste 1: Criar 20 transações iniciais
 */
async function testCreateInitialTransactions() {
  console.log('📝 Teste 1: Criar 20 Transações Iniciais\n');

  const databases = getAppwriteDatabases();

  const transactions = [
    // Conta 1 - 7 transações (3 out, 4 in)
    { accountIndex: 0, amount: 100, direction: 'in', description: 'Salário' },
    { accountIndex: 0, amount: 50, direction: 'out', description: 'Supermercado' },
    { accountIndex: 0, amount: 200, direction: 'in', description: 'Freelance' },
    { accountIndex: 0, amount: 30, direction: 'out', description: 'Transporte' },
    { accountIndex: 0, amount: 150, direction: 'in', description: 'Bônus' },
    { accountIndex: 0, amount: 75, direction: 'out', description: 'Restaurante' },
    { accountIndex: 0, amount: 300, direction: 'in', description: 'Venda' },

    // Conta 2 - 7 transações (3 out, 4 in)
    { accountIndex: 1, amount: 500, direction: 'in', description: 'Transferência' },
    { accountIndex: 1, amount: 120, direction: 'out', description: 'Conta de luz' },
    { accountIndex: 1, amount: 80, direction: 'in', description: 'Reembolso' },
    { accountIndex: 1, amount: 90, direction: 'out', description: 'Internet' },
    { accountIndex: 1, amount: 250, direction: 'in', description: 'Investimento retorno' },
    { accountIndex: 1, amount: 60, direction: 'out', description: 'Farmácia' },
    { accountIndex: 1, amount: 180, direction: 'in', description: 'Cashback' },

    // Conta 3 - 6 transações (3 out, 3 in)
    { accountIndex: 2, amount: 1000, direction: 'in', description: 'Depósito inicial' },
    { accountIndex: 2, amount: 200, direction: 'out', description: 'Investimento' },
    { accountIndex: 2, amount: 450, direction: 'in', description: 'Rendimento' },
    { accountIndex: 2, amount: 150, direction: 'out', description: 'Taxa' },
    { accountIndex: 2, amount: 600, direction: 'in', description: 'Aporte' },
    { accountIndex: 2, amount: 100, direction: 'out', description: 'Saque' },
  ];

  let created = 0;
  const expectedBalances = [0, 0, 0];

  for (const tx of transactions) {
    try {
      const accountId = testAccountIds[tx.accountIndex];
      const signedAmount = tx.direction === 'in' ? tx.amount : -tx.amount;
      expectedBalances[tx.accountIndex] += signedAmount;

      const transaction = await databases.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
        user_id: testUserId,
        account_id: accountId,
        amount: signedAmount,
        type: tx.direction === 'in' ? 'income' : 'expense',
        direction: tx.direction,
        date: new Date().toISOString(),
        status: 'pending',
        category: 'Teste',
        description: tx.description,
        currency: 'BRL',
        source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      testTransactionIds.push(transaction.$id);
      created++;

      console.log(
        `   ${created}/20 - ${tx.description}: R$ ${tx.amount.toFixed(2)} (${tx.direction}) - Conta ${tx.accountIndex + 1}`,
      );

      await wait(100);
    } catch (error: any) {
      console.error(`   ❌ Erro ao criar transação ${created + 1}:`, error.message);
    }
  }

  logResult({
    name: 'Criar Transações Iniciais',
    passed: created === 20,
    message: `${created}/20 transações criadas`,
    data: {
      created,
      expectedBalances: {
        conta1: expectedBalances[0],
        conta2: expectedBalances[1],
        conta3: expectedBalances[2],
      },
    },
  });

  console.log('\n⏳ Aguardando 10 segundos para processamento inicial...\n');
  await wait(10000);

  return expectedBalances;
}

/**
 * Teste 2: Verificar saldos iniciais após criação
 */
async function testVerifyInitialBalances(expectedBalances: number[]) {
  console.log('🔍 Teste 2: Verificar Saldos Iniciais\n');

  const databases = getAppwriteDatabases();

  for (let i = 0; i < testAccountIds.length; i++) {
    try {
      const account = await databases.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, testAccountIds[i]);
      initialBalances.push(account.balance);

      console.log(`   Conta ${i + 1} (${account.name}): R$ ${account.balance.toFixed(2)}`);
    } catch (error: any) {
      console.error(`❌ Erro ao verificar conta ${i + 1}:`, error.message);
      initialBalances.push(0);
    }
  }

  const allCorrect = initialBalances.every((balance, i) => Math.abs(balance - expectedBalances[i]) < 0.01);

  logResult({
    name: 'Verificar Saldos Iniciais',
    passed: allCorrect,
    message: allCorrect ? 'Saldos iniciais corretos' : 'Saldos iniciais incorretos',
    data: {
      esperados: expectedBalances,
      atuais: initialBalances,
    },
  });

  console.log();
}

/**
 * Teste 3: Atualizar todas as transações de completed para pending
 */
async function testUpdateTransactionsToPending() {
  console.log('✏️ Teste 3: Atualizar Transações de Completed para Pending\n');

  const databases = getAppwriteDatabases();

  let updated = 0;

  for (const txId of testTransactionIds) {
    try {
      // Buscar transação atual
      const transaction = await databases.getDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, txId);

      if (transaction.status === 'completed') {
        // Atualizar para pending
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, txId, {
          status: 'pending',
          updated_at: new Date().toISOString(),
        });

        updated++;
        console.log(`   ${updated}/${testTransactionIds.length} - Transação ${txId} atualizada para pending`);
      } else {
        console.log(`   ⚠️ Transação ${txId} já está em status: ${transaction.status}`);
      }

      await wait(100);
    } catch (error: any) {
      console.error(`   ❌ Erro ao atualizar transação ${txId}:`, error.message);
    }
  }

  logResult({
    name: 'Atualizar para Pending',
    passed: updated > 0,
    message: `${updated}/${testTransactionIds.length} transações atualizadas para pending`,
    data: { updated },
  });

  console.log('\n⏳ Aguardando 10 segundos para a função balance-sync reprocessar...\n');
  await wait(10000);
}

/**
 * Teste 4: Verificar se os saldos permanecem corretos após atualização
 */
async function testVerifyBalancesAfterUpdate() {
  console.log('🔍 Teste 4: Verificar Saldos Após Atualização\n');

  const databases = getAppwriteDatabases();

  let allCorrect = true;
  const results: any[] = [];

  for (let i = 0; i < testAccountIds.length; i++) {
    try {
      const account = await databases.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, testAccountIds[i]);

      const expected = initialBalances[i];
      const actual = account.balance;
      const isCorrect = Math.abs(actual - expected) < 0.01;

      results.push({
        conta: i + 1,
        nome: account.name,
        saldoInicial: initialBalances[i],
        saldoAtual: actual,
        correto: isCorrect,
      });

      const icon = isCorrect ? '✅' : '❌';
      console.log(`${icon} Conta ${i + 1} (${account.name}):`);
      console.log(`   Saldo inicial: R$ ${initialBalances[i].toFixed(2)}`);
      console.log(`   Saldo atual: R$ ${actual.toFixed(2)}`);
      console.log(`   Status: ${isCorrect ? 'MANTIDO CORRETAMENTE' : 'ALTERADO INCORRETAMENTE'}\n`);

      if (!isCorrect) {
        allCorrect = false;
      }
    } catch (error: any) {
      console.error(`❌ Erro ao verificar conta ${i + 1}:`, error.message);
      allCorrect = false;
    }
  }

  logResult({
    name: 'Verificar Saldos Após Update',
    passed: allCorrect,
    message: allCorrect
      ? 'Saldos mantidos corretamente (função não reprocessou completed→pending)'
      : 'Saldos alterados incorretamente',
    data: results,
  });
}

/**
 * Teste 5: Verificar status final das transações
 */
async function testVerifyFinalStatus() {
  console.log('🔍 Teste 5: Verificar Status Final das Transações\n');

  const databases = getAppwriteDatabases();

  let completedCount = 0;
  let pendingCount = 0;

  for (const txId of testTransactionIds) {
    try {
      const transaction = await databases.getDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, txId);

      if (transaction.status === 'completed') {
        completedCount++;
      } else if (transaction.status === 'pending') {
        pendingCount++;
      }
    } catch (error: any) {
      console.error(`❌ Erro ao verificar transação ${txId}:`, error.message);
    }
  }

  console.log(`   Transações completed: ${completedCount}/20`);
  console.log(`   Transações pending: ${pendingCount}/20\n`);

  logResult({
    name: 'Verificar Status Final',
    passed: completedCount === 20,
    message: `${completedCount}/20 transações reprocessadas para completed`,
    data: {
      completed: completedCount,
      pending: pendingCount,
    },
  });
}

/**
 * Cleanup: Remover dados de teste
 */
async function cleanup() {
  console.log('\n🧹 Limpando dados de teste...\n');

  const databases = getAppwriteDatabases();

  for (const txId of testTransactionIds) {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, txId);
    } catch (error: any) {
      console.error(`   ⚠️ Erro ao deletar transação ${txId}:`, error.message);
    }
  }

  for (const accountId of testAccountIds) {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId);
    } catch (error: any) {
      console.error(`   ⚠️ Erro ao deletar conta ${accountId}:`, error.message);
    }
  }

  console.log('✅ Cleanup concluído\n');
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('🧪 Iniciando Teste de Atualização Balance Sync');
  console.log('='.repeat(60));
  console.log('Objetivo: Testar atualização de transações completed → pending\n');

  try {
    await setupTestData();
    const expectedBalances = await testCreateInitialTransactions();

    if (expectedBalances) {
      await testVerifyInitialBalances(expectedBalances);
      await testUpdateTransactionsToPending();
      await testVerifyBalancesAfterUpdate();
      await testVerifyFinalStatus();
    }

    await cleanup();

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 Resumo dos Testes');
    console.log('='.repeat(60));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log(`Total de Testes: ${results.length}`);
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`Taxa de Sucesso: ${((passed / results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Testes que Falharam:');
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`   - ${r.name}: ${r.message}`);
        });
    }

    console.log('\n💡 Comportamento Esperado:');
    console.log('   A função balance-sync deve processar apenas transações pending/failed.');
    console.log('   Ao mudar de completed → pending, a função deve reprocessar e marcar como completed.');
    console.log('   Os saldos devem permanecer os mesmos (não duplicar valores).');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar testes
runAllTests().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
