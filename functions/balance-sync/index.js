/**
 * Appwrite Function: Balance Sync
 *
 * Esta função atualiza automaticamente o saldo das contas quando transações são modificadas.
 *
 * Triggers:
 * - Eventos de database: transactions.*.create, transactions.*.update, transactions.*.delete
 *
 * Lógica:
 * - CREATE: Soma o amount ao balance da conta
 * - DELETE: Subtrai o amount do balance da conta
 * - UPDATE: Calcula a diferença entre amount antigo e novo, aplica ao balance
 * - Processa apenas transações com status 'pending' ou 'failed'
 * - Marca transação como 'completed' após processar
 * - O amount já vem sinalizado (positivo/negativo), basta somar
 */
import { Client, TablesDB } from 'node-appwrite';

// Configuração
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
};
/**
 * Inicializa o cliente Appwrite
 */
function initializeClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');
  return new TablesDB(client);
}
/**
 * Busca uma conta pelo ID
 */
async function getAccount(databases, accountId) {
  const account = await databases.getRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ACCOUNTS,
    rowId: accountId,
  });
  return account;
}
/**
 * Atualiza o saldo da conta
 */
async function updateAccountBalance(databases, accountId, balanceChange) {
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
async function markTransactionCompleted(databases, transactionId) {
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
async function handleCreate(databases, transaction) {
  console.log(`[BalanceSync] Handling CREATE event for transaction ${transaction.$id}`);
  // Validações
  if (!transaction.account_id) {
    console.log('[BalanceSync] Transaction has no account_id, skipping');
    return;
  }
  if (transaction.credit_card_id) {
    console.log('[BalanceSync] Credit card transaction, skipping');
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
async function handleDelete(databases, transaction) {
  console.log(`[BalanceSync] Handling DELETE event for transaction ${transaction.$id}`);
  // Validações
  if (!transaction.account_id) {
    console.log('[BalanceSync] Transaction has no account_id, skipping');
    return;
  }
  if (transaction.credit_card_id) {
    console.log('[BalanceSync] Credit card transaction, skipping');
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
async function handleUpdate(databases, newTransaction, oldAmount) {
  console.log(`[BalanceSync] Handling UPDATE event for transaction ${newTransaction.$id}`);
  // Validações
  if (!newTransaction.account_id) {
    console.log('[BalanceSync] Transaction has no account_id, skipping');
    return;
  }
  if (newTransaction.credit_card_id) {
    console.log('[BalanceSync] Credit card transaction, skipping');
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
 * Função principal
 */
export default async ({ req, res, log, error }) => {
  try {
    log('Balance Sync Function started');
    log(`Event type: ${req.headers['x-appwrite-event'] || 'unknown'}`);
    const databases = initializeClient();
    // Extrair dados do evento
    const eventType = req.headers['x-appwrite-event'] || '';
    const transaction = req.body;
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
      const oldAmount = req.body.$previousDocument?.amount || transaction.amount;
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
  } catch (err) {
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
//# sourceMappingURL=index.js.map
