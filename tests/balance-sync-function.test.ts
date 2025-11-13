#!/usr/bin/env tsx
/**
 * Balance Sync Function Test
 *
 * Teste completo da função balance-sync com 20 transações para 3 contas
 * - 9 transações com direction: 'out' (saídas)
 * - 11 transações com direction: 'in' (entradas)
 *
 * Uso: pnpm tsx tests/balance-sync-function.test.ts
 */
import 'dotenv/config';
import { ID } from 'node-appwrite';

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
    // Criar usuário de teste
    testUserId = `test_user_${Date.now()}`;

    // Criar 3 contas com saldo inicial zero
    const accountNames = ['Conta Corrente', 'Conta Poupança', 'Conta Investimento'];

    for (const name of accountNames) {
      const account = await databases.createDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, ID.unique(), {
        user_id: testUserId,
        name,
        balance: 0, // Saldo inicial zero
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
 * Teste 1: Criar 20 transações (9 out, 11 in)
 */
async function testCreateTransactions() {
  console.log('📝 Teste 1: Criar 20 Transações\n');

  const databases = getAppwriteDatabases();

  // Definir as 20 transações
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

  // Verificar contagem
  const outCount = transactions.filter((t) => t.direction === 'out').length;
  const inCount = transactions.filter((t) => t.direction === 'in').length;

  console.log(`📊 Distribuição: ${outCount} saídas (out), ${inCount} entradas (in)\n`);

  if (outCount !== 9 || inCount !== 11) {
    logResult({
      name: 'Validar Distribuição',
      passed: false,
      message: `Distribuição incorreta: ${outCount} out, ${inCount} in (esperado: 9 out, 11 in)`,
    });
    return;
  }

  // Criar transações
  let created = 0;
  const expectedBalances = [0, 0, 0]; // Saldos esperados para cada conta

  for (const tx of transactions) {
    try {
      const accountId = testAccountIds[tx.accountIndex];

      // Calcular amount com sinal correto
      const signedAmount = tx.direction === 'in' ? tx.amount : -tx.amount;

      // Atualizar saldo esperado
      expectedBalances[tx.accountIndex] += signedAmount;

      const transaction = await databases.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, ID.unique(), {
        user_id: testUserId,
        account_id: accountId,
        amount: signedAmount,
        type: tx.direction === 'in' ? 'income' : 'expense',
        direction: tx.direction,
        date: new Date().toISOString(),
        status: 'pending', // A função balance-sync processa apenas pending
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

      // Aguardar um pouco para não sobrecarregar
      await wait(100);
    } catch (error: any) {
      console.error(`   ❌ Erro ao criar transação ${created + 1}:`, error.message);
    }
  }

  logResult({
    name: 'Criar Transações',
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

  // Aguardar processamento da função balance-sync
  console.log('\n⏳ Aguardando 10 segundos para a função balance-sync processar...\n');
  await wait(10000);

  return expectedBalances;
}

/**
 * Teste 2: Verificar se os saldos foram atualizados corretamente
 */
async function testVerifyBalances(expectedBalances: number[]) {
  console.log('🔍 Teste 2: Verificar Saldos das Contas\n');

  const databases = getAppwriteDatabases();

  let allCorrect = true;
  const results: any[] = [];

  for (let i = 0; i < testAccountIds.length; i++) {
    try {
      const account = await databases.getDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, testAccountIds[i]);

      const expected = expectedBalances[i];
      const actual = account.balance;
      const isCorrect = Math.abs(actual - expected) < 0.01; // Tolerância para float

      results.push({
        conta: i + 1,
        nome: account.name,
        esperado: expected,
        atual: actual,
        correto: isCorrect,
      });

      const icon = isCorrect ? '✅' : '❌';
      console.log(`${icon} Conta ${i + 1} (${account.name}):`);
      console.log(`   Saldo esperado: R$ ${expected.toFixed(2)}`);
      console.log(`   Saldo atual: R$ ${actual.toFixed(2)}`);
      console.log(`   Status: ${isCorrect ? 'CORRETO' : 'INCORRETO'}\n`);

      if (!isCorrect) {
        allCorrect = false;
      }
    } catch (error: any) {
      console.error(`❌ Erro ao verificar conta ${i + 1}:`, error.message);
      allCorrect = false;
    }
  }

  logResult({
    name: 'Verificar Saldos',
    passed: allCorrect,
    message: allCorrect ? 'Todos os saldos estão corretos' : 'Alguns saldos estão incorretos',
    data: results,
  });
}

/**
 * Teste 3: Verificar se as transações foram marcadas como completed
 */
async function testVerifyTransactionStatus() {
  console.log('🔍 Teste 3: Verificar Status das Transações\n');

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
    name: 'Verificar Status',
    passed: completedCount === 20,
    message: `${completedCount}/20 transações marcadas como completed`,
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

  // Deletar transações
  for (const txId of testTransactionIds) {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, txId);
    } catch (error: any) {
      console.error(`   ⚠️ Erro ao deletar transação ${txId}:`, error.message);
    }
  }

  // Deletar contas
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
  console.log('🧪 Iniciando Teste da Função Balance Sync');
  console.log('='.repeat(60));
  console.log('Objetivo: Testar 20 transações (9 out, 11 in) em 3 contas\n');

  try {
    await setupTestData();
    const expectedBalances = await testCreateTransactions();

    if (expectedBalances) {
      await testVerifyBalances(expectedBalances);
      await testVerifyTransactionStatus();
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
