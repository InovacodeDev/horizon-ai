/**
 * Script de Teste para Balance Sync
 *
 * Este script testa se a sincronização automática de saldo está funcionando corretamente.
 *
 * Uso:
 * 1. Configure as variáveis de ambiente no .env
 * 2. Execute: npx tsx test-sync.ts
 */
import { Client, Databases, ID, Query } from 'node-appwrite';

// Configuração
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';

const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, 'green');
}

function error(message: string) {
  log(`❌ ${message}`, 'red');
}

function info(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

// Inicializar cliente
const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// Tipos
interface Account {
  $id: string;
  user_id: string;
  name: string;
  balance: number;
  synced_transaction_ids?: string;
}

interface Transaction {
  $id: string;
  user_id: string;
  account_id?: string;
  credit_card_id?: string;
  amount: number;
  direction: 'in' | 'out';
  date: string;
  status: string;
}

/**
 * Aguarda um tempo em milissegundos
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Busca uma conta de teste
 */
async function getTestAccount(userId: string): Promise<Account | null> {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
      Query.equal('user_id', userId),
      Query.limit(1),
    ]);

    if (result.documents.length === 0) {
      return null;
    }

    return result.documents[0] as unknown as Account;
  } catch (err) {
    error(`Erro ao buscar conta: ${err}`);
    return null;
  }
}

/**
 * Calcula o saldo esperado de uma conta
 */
async function calculateExpectedBalance(accountId: string): Promise<number> {
  const transactions: Transaction[] = [];
  let offset = 0;
  const limit = 100;

  // Buscar todas as transações
  while (true) {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
      Query.equal('account_id', accountId),
      Query.limit(limit),
      Query.offset(offset),
    ]);

    const docs = result.documents as unknown as Transaction[];
    transactions.push(...docs);

    if (docs.length < limit) {
      break;
    }

    offset += limit;
  }

  // Calcular saldo
  let balance = 0;
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  for (const transaction of transactions) {
    // Ignorar transações de cartão de crédito
    if (transaction.credit_card_id) continue;

    // Ignorar transações futuras
    const transactionDate = new Date(transaction.date);
    if (transactionDate > now) continue;

    // Calcular saldo
    if (transaction.direction === 'in') {
      balance += transaction.amount;
    } else {
      balance -= transaction.amount;
    }
  }

  return balance;
}

/**
 * Teste 1: Verificar se a conta existe
 */
async function test1_checkAccount(userId: string): Promise<Account | null> {
  info('Teste 1: Verificando se a conta existe...');

  const account = await getTestAccount(userId);

  if (!account) {
    error('Nenhuma conta encontrada para este usuário');
    return null;
  }

  success(`Conta encontrada: ${account.name} (${account.$id})`);
  info(`Saldo atual: R$ ${account.balance.toFixed(2)}`);

  return account;
}

/**
 * Teste 2: Criar uma transação de teste
 */
async function test2_createTransaction(account: Account): Promise<Transaction | null> {
  info('Teste 2: Criando transação de teste...');

  const amount = 100;
  const transactionId = ID.unique();

  try {
    const transaction = await databases.createDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, transactionId, {
      user_id: account.user_id,
      account_id: account.$id,
      amount: amount,
      direction: 'in',
      type: 'income',
      date: new Date().toISOString(),
      status: 'completed',
      category: 'test',
      description: 'Transação de teste - Balance Sync',
      currency: 'BRL',
      source: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    success(`Transação criada: ${transaction.$id}`);
    info(`Valor: R$ ${amount.toFixed(2)} (entrada)`);

    return transaction as unknown as Transaction;
  } catch (err) {
    error(`Erro ao criar transação: ${err}`);
    return null;
  }
}

/**
 * Teste 3: Aguardar sincronização
 */
async function test3_waitForSync(): Promise<void> {
  info('Teste 3: Aguardando sincronização automática...');

  const waitTime = 5000; // 5 segundos
  info(`Aguardando ${waitTime / 1000} segundos...`);

  await sleep(waitTime);

  success('Tempo de espera concluído');
}

/**
 * Teste 4: Verificar se o saldo foi atualizado
 */
async function test4_checkBalance(account: Account, expectedIncrease: number): Promise<boolean> {
  info('Teste 4: Verificando se o saldo foi atualizado...');

  try {
    // Buscar conta atualizada
    const updatedAccount = (await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.ACCOUNTS,
      account.$id,
    )) as unknown as Account;

    const oldBalance = account.balance;
    const newBalance = updatedAccount.balance;
    const expectedBalance = oldBalance + expectedIncrease;

    info(`Saldo anterior: R$ ${oldBalance.toFixed(2)}`);
    info(`Saldo atual: R$ ${newBalance.toFixed(2)}`);
    info(`Saldo esperado: R$ ${expectedBalance.toFixed(2)}`);

    if (Math.abs(newBalance - expectedBalance) < 0.01) {
      success('Saldo atualizado corretamente! ✨');
      return true;
    } else {
      error('Saldo não foi atualizado corretamente');
      warning(`Diferença: R$ ${(newBalance - expectedBalance).toFixed(2)}`);
      return false;
    }
  } catch (err) {
    error(`Erro ao verificar saldo: ${err}`);
    return false;
  }
}

/**
 * Teste 5: Limpar transação de teste
 */
async function test5_cleanup(transaction: Transaction): Promise<void> {
  info('Teste 5: Limpando transação de teste...');

  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, transaction.$id);
    success('Transação de teste removida');

    // Aguardar sincronização da remoção
    info('Aguardando sincronização da remoção...');
    await sleep(5000);

    success('Limpeza concluída');
  } catch (err) {
    error(`Erro ao limpar transação: ${err}`);
  }
}

/**
 * Teste 6: Validar cálculo de saldo
 */
async function test6_validateBalance(account: Account): Promise<boolean> {
  info('Teste 6: Validando cálculo de saldo...');

  try {
    const expectedBalance = await calculateExpectedBalance(account.$id);
    const actualAccount = (await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.ACCOUNTS,
      account.$id,
    )) as unknown as Account;
    const actualBalance = actualAccount.balance;

    info(`Saldo calculado manualmente: R$ ${expectedBalance.toFixed(2)}`);
    info(`Saldo no database: R$ ${actualBalance.toFixed(2)}`);

    if (Math.abs(actualBalance - expectedBalance) < 0.01) {
      success('Saldo está correto! ✨');
      return true;
    } else {
      error('Saldo está incorreto');
      warning(`Diferença: R$ ${(actualBalance - expectedBalance).toFixed(2)}`);
      return false;
    }
  } catch (err) {
    error(`Erro ao validar saldo: ${err}`);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  log('\n🧪 Teste de Sincronização Automática de Saldo\n', 'cyan');

  // Verificar variáveis de ambiente
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    error('Variáveis de ambiente não configuradas');
    error('Configure APPWRITE_FUNCTION_PROJECT_ID e APPWRITE_API_KEY');
    process.exit(1);
  }

  // Solicitar userId
  const userId = process.argv[2];
  if (!userId) {
    error('Uso: npx tsx test-sync.ts <userId>');
    process.exit(1);
  }

  info(`Testando para usuário: ${userId}\n`);

  try {
    // Teste 1: Verificar conta
    const account = await test1_checkAccount(userId);
    if (!account) {
      process.exit(1);
    }

    console.log('');

    // Teste 2: Criar transação
    const transaction = await test2_createTransaction(account);
    if (!transaction) {
      process.exit(1);
    }

    console.log('');

    // Teste 3: Aguardar sincronização
    await test3_waitForSync();

    console.log('');

    // Teste 4: Verificar saldo
    const balanceUpdated = await test4_checkBalance(account, transaction.amount);

    console.log('');

    // Teste 5: Limpar
    await test5_cleanup(transaction);

    console.log('');

    // Teste 6: Validar saldo final
    const balanceValid = await test6_validateBalance(account);

    console.log('');

    // Resultado final
    if (balanceUpdated && balanceValid) {
      log('\n🎉 Todos os testes passaram! A sincronização está funcionando corretamente.\n', 'green');
      process.exit(0);
    } else {
      log('\n❌ Alguns testes falharam. Verifique os logs acima.\n', 'red');
      process.exit(1);
    }
  } catch (err) {
    error(`Erro durante os testes: ${err}`);
    process.exit(1);
  }
}

// Executar
main();
