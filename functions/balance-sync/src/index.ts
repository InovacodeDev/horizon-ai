/**
 * Appwrite Function: Balance Sync
 *
 * Esta função atualiza automaticamente o saldo das contas quando transações são modificadas.
 *
 * Triggers:
 * - Eventos de database: transactions.*.create, transactions.*.update, transactions.*.delete
 * - Schedule: Diariamente às 05:00 UTC (cron: 0 5 * * *)
 *
 * Lógica:
 * - CREATE: Soma o amount ao balance da conta
 * - DELETE: Subtrai o amount do balance da conta
 * - UPDATE: Calcula a diferença entre amount antigo e novo, aplica ao balance
 * - Processa apenas transações com status 'pending' ou 'failed'
 * - Marca transação como 'completed' após processar
 * - O amount já vem sinalizado (positivo/negativo), basta somar
 * - Schedule: Processa todas as transações pendentes com data passada
 */
import { Client, Query, TablesDB } from 'node-appwrite';

// Tipos
interface Transaction {
  $id: string;
  account_id?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date?: string;
}

interface Account {
  $id: string;
  balance: number;
}

// Configuração
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
};

/**
 * Inicializa o cliente Appwrite
 */
function initializeClient(): TablesDB {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  return new TablesDB(client);
}

/**
 * Busca uma conta pelo ID
 */
async function getAccount(databases: TablesDB, accountId: string): Promise<Account> {
  const account = await databases.getRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ACCOUNTS,
    rowId: accountId,
  });

  return account as unknown as Account;
}

/**
 * Atualiza o saldo da conta
 */
async function updateAccountBalance(databases: TablesDB, accountId: string, balanceChange: number): Promise<void> {
  console.log(`[BalanceSync] Updating account ${accountId} balance by ${balanceChange}`);

  // Buscar conta atual
  const account = await getAccount(databases, accountId);
  const newBalance = account.balance + balanceChange;

  console.log(`[BalanceSync] - Current balance: ${account.balance}`);
  console.log(`[BalanceSync] - Balance change: ${balanceChange}`);
  console.log(`[BalanceSync] - New balance: ${newBalance}`);

  // Atualizar balance da conta
  await databases.updateRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ACCOUNTS,
    rowId: accountId,
    data: {
      balance: newBalance,
    },
  });

  console.log(`[BalanceSync] Account ${accountId} balance updated successfully`);
}

/**
 * Marca transação como completed
 */
async function markTransactionCompleted(databases: TablesDB, transactionId: string): Promise<void> {
  console.log(`[BalanceSync] Marking transaction ${transactionId} as completed`);

  await databases.updateRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.TRANSACTIONS,
    rowId: transactionId,
    data: {
      status: 'completed',
    },
  });

  console.log(`[BalanceSync] Transaction ${transactionId} marked as completed`);
}

/**
 * Processa evento de CREATE
 */
async function handleCreate(databases: TablesDB, transaction: Transaction): Promise<void> {
  console.log(`[BalanceSync] Handling CREATE event for transaction ${transaction.$id}`);

  // Validações
  if (!transaction.account_id) {
    console.log('[BalanceSync] Transaction has no account_id, skipping');
    return;
  }

  if (transaction.status !== 'pending' && transaction.status !== 'failed') {
    console.log(`[BalanceSync] Transaction status is ${transaction.status}, skipping`);
    return;
  }

  // Validar data: apenas processar transações anteriores ao momento atual
  if (transaction.date) {
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    if (transactionDate > now) {
      console.log(`[BalanceSync] Transaction date ${transaction.date} is in the future, skipping`);
      return;
    }
  }

  // Atualizar balance (somar amount)
  await updateAccountBalance(databases, transaction.account_id, transaction.amount);

  // Marcar como completed
  await markTransactionCompleted(databases, transaction.$id);

  console.log('[BalanceSync] CREATE event processed successfully');
}

/**
 * Processa evento de DELETE
 */
async function handleDelete(databases: TablesDB, transaction: Transaction): Promise<void> {
  console.log(`[BalanceSync] Handling DELETE event for transaction ${transaction.$id}`);

  // Validações
  if (!transaction.account_id) {
    console.log('[BalanceSync] Transaction has no account_id, skipping');
    return;
  }

  // Validar data: apenas processar transações anteriores ao momento atual
  if (transaction.date) {
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    if (transactionDate > now) {
      console.log(`[BalanceSync] Transaction date ${transaction.date} is in the future, skipping`);
      return;
    }
  }

  // Atualizar balance (subtrair amount)
  // Invertemos o sinal porque estamos removendo a transação
  await updateAccountBalance(databases, transaction.account_id, -transaction.amount);

  console.log('[BalanceSync] DELETE event processed successfully');
}

/**
 * Processa evento de UPDATE
 */
async function handleUpdate(databases: TablesDB, newTransaction: Transaction, oldAmount: number): Promise<void> {
  console.log(`[BalanceSync] Handling UPDATE event for transaction ${newTransaction.$id}`);

  // Validações
  if (!newTransaction.account_id) {
    console.log('[BalanceSync] Transaction has no account_id, skipping');
    return;
  }

  if (newTransaction.status !== 'pending' && newTransaction.status !== 'failed') {
    console.log(`[BalanceSync] Transaction status is ${newTransaction.status}, skipping`);
    return;
  }

  // Validar data: apenas processar transações anteriores ao momento atual
  if (newTransaction.date) {
    const transactionDate = new Date(newTransaction.date);
    const now = new Date();
    if (transactionDate > now) {
      console.log(`[BalanceSync] Transaction date ${newTransaction.date} is in the future, skipping`);
      return;
    }
  }

  // Calcular diferença entre amount novo e antigo
  const amountDifference = newTransaction.amount - oldAmount;

  console.log(`[BalanceSync] - Old amount: ${oldAmount}`);
  console.log(`[BalanceSync] - New amount: ${newTransaction.amount}`);
  console.log(`[BalanceSync] - Difference: ${amountDifference}`);

  // Atualizar balance com a diferença
  await updateAccountBalance(databases, newTransaction.account_id, amountDifference);

  // Marcar como completed
  await markTransactionCompleted(databases, newTransaction.$id);

  console.log('[BalanceSync] UPDATE event processed successfully');
}

/**
 * Processa transações pendentes (para execução agendada)
 */
async function processPendingTransactions(databases: TablesDB): Promise<number> {
  console.log('[BalanceSync] Processing pending transactions from schedule');

  const now = new Date();
  console.log(`[BalanceSync] Current time: ${now.toISOString()}`);

  // Buscar todas as transações pendentes ou failed com data passada
  const queries = [
    Query.or([Query.equal('status', 'pending'), Query.equal('status', 'failed')]),
    Query.lessThanEqual('date', now.toISOString()),
    Query.limit(100), // Processar em lotes de 100
  ];

  const result = await databases.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.TRANSACTIONS,
    queries,
  });

  const transactions = result.rows as unknown as Transaction[];
  console.log(`[BalanceSync] Found ${transactions.length} pending transactions to process`);

  let processed = 0;

  for (const transaction of transactions) {
    try {
      console.log(`[BalanceSync] Processing transaction ${transaction.$id}`);

      // Validações
      if (!transaction.account_id) {
        console.log('[BalanceSync] Transaction has no account_id, skipping');
        continue;
      }

      // Atualizar balance (somar amount)
      await updateAccountBalance(databases, transaction.account_id, transaction.amount);

      // Marcar como completed
      await markTransactionCompleted(databases, transaction.$id);

      processed++;
      console.log(`[BalanceSync] Transaction ${transaction.$id} processed successfully`);

      // Pequeno delay para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error: any) {
      console.error(`[BalanceSync] Error processing transaction ${transaction.$id}:`, error.message);
      // Continuar com as próximas transações mesmo se uma falhar
    }
  }

  console.log(`[BalanceSync] Processed ${processed} pending transactions`);
  return processed;
}

/**
 * Função principal
 */
/**
 * Função principal
 */
export default async ({ req, res, log, error }: any) => {
  // Detectar se é execução agendada
  const isScheduled = req.headers['x-appwrite-trigger'] === 'schedule';
  const eventType = req.headers['x-appwrite-event'] || '';

  // Para execuções agendadas, retornar resposta imediatamente
  if (isScheduled) {
    res.json({
      success: true,
      message: 'Balance sync processing started asynchronously',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    log('Balance Sync Function started');
    log(`Execution type: ${req.headers['x-appwrite-trigger'] || 'manual'}`);

    const databases = initializeClient();

    // Se for execução agendada, processar transações pendentes
    if (isScheduled) {
      log('Processing pending transactions from schedule');
      const processed = await processPendingTransactions(databases);
      log(`Processed ${processed} pending transactions`);
      return; // Resposta já foi enviada acima
    }

    // Se for evento de database, processar normalmente
    log(`Event type: ${eventType}`);

    const transaction = req.body as Transaction;

    log(`Transaction ID: ${transaction.$id}`);
    log(`Account ID: ${transaction.account_id}`);
    log(`Amount: ${transaction.amount}`);
    log(`Status: ${transaction.status}`);

    // Processar baseado no tipo de evento
    if (eventType.includes('.create')) {
      log('Processing CREATE event');
      await handleCreate(databases, transaction);
    } else if (eventType.includes('.delete')) {
      log('Processing DELETE event');
      await handleDelete(databases, transaction);
    } else if (eventType.includes('.update')) {
      log('Processing UPDATE event');

      // Para UPDATE, precisamos do amount antigo
      // O Appwrite não fornece isso diretamente, então vamos buscar do payload
      // Se não tiver, assumimos que não houve mudança no amount
      const oldAmount = (req.body as any).$previousDocument?.amount || transaction.amount;

      await handleUpdate(databases, transaction, oldAmount);
    } else {
      log(`Unknown event type: ${eventType}`);
    }

    log('Balance Sync Function completed successfully');

    return res.json({
      success: true,
      message: 'Balance sync completed',
      transactionId: transaction.$id,
    });
  } catch (err: any) {
    error('Balance Sync Function error:', err);

    return res.json(
      {
        success: false,
        error: err.message || 'Unknown error',
      },
      500,
    );
  }
};
