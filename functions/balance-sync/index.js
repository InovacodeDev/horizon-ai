/**
 * Appwrite Function: Balance Sync
 *
 * Esta função gerencia automaticamente o saldo das contas baseado nas transações.
 *
 * Triggers:
 * - Eventos de database: transactions.*.create, transactions.*.update, transactions.*.delete
 * - Schedule: Diariamente às 20:00 (cron: 0 20 * * *)
 *
 * Funcionalidades:
 * 1. Sincroniza saldo quando transações são criadas/editadas/removidas
 * 2. Processa transações futuras que chegaram na data de hoje (execução diária)
 * 3. Ignora transações futuras no cálculo do saldo
 * 4. Ignora transações de cartão de crédito (gerenciadas separadamente)
 */
import { Client, Databases, Query } from 'node-appwrite';

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
  const databases = new Databases(client);
  return { client, databases };
}
/**
 * Busca todas as transações de uma conta com paginação
 */
async function getAllTransactions(databases, accountId) {
  const allTransactions = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
      Query.equal('account_id', accountId),
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('date'),
    ]);
    const transactions = result.documents;
    allTransactions.push(...transactions);
    if (transactions.length === 0 || transactions.length < limit) {
      break;
    }
    offset += limit;
  }
  return allTransactions;
}
/**
 * Sincroniza o saldo de uma conta
 */
async function syncAccountBalance(databases, accountId) {
  console.log(`[BalanceSync] Syncing account ${accountId}`);
  try {
    // Buscar todas as transações desta conta
    const transactions = await getAllTransactions(databases, accountId);
    // Recalcular balance do zero
    let newBalance = 0;
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Fim do dia atual
    console.log(`[BalanceSync] - Total transactions: ${transactions.length}`);
    console.log(`[BalanceSync] - Current date: ${now.toISOString()}`);
    const processedTransactions = [];
    for (const transaction of transactions) {
      // Ignorar transações de cartão de crédito
      if (transaction.credit_card_id) {
        console.log(`[BalanceSync] - Skipping credit card transaction: ${transaction.$id}`);
        continue;
      }
      // Ignorar transações futuras
      const transactionDate = new Date(transaction.date);
      if (transactionDate > now) {
        console.log(
          `[BalanceSync] - Skipping future transaction: ${transaction.$id} (${transactionDate.toISOString()})`,
        );
        continue;
      }
      // Processar cada tipo de transação
      // Entradas (in) somam, saídas (out) subtraem
      const transactionAmount =
        transaction.direction === 'in' ? Math.abs(transaction.amount) : -Math.abs(transaction.amount);

      newBalance += transactionAmount;
      console.log(
        `[BalanceSync] - Processing transaction ${transaction.$id}: ${transactionAmount} (direction: ${transaction.direction}, original: ${transaction.amount})`,
      );
      processedTransactions.push(transaction.$id);
    }
    console.log(`[BalanceSync] - Final balance: ${newBalance}`);
    console.log(`[BalanceSync] - Processed ${processedTransactions.length} transactions`);
    // Atualizar conta com novo balance
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.ACCOUNTS, accountId, {
      balance: newBalance,
      synced_transaction_ids: JSON.stringify(processedTransactions),
      updated_at: new Date().toISOString(),
    });
    console.log(`[BalanceSync] Account ${accountId} updated successfully with balance: ${newBalance}`);
    return newBalance;
  } catch (error) {
    console.error(`[BalanceSync] Error syncing account ${accountId}:`, error);
    throw error;
  }
}
/**
 * Processa transações futuras que chegaram na data de hoje
 */
async function processDueTransactions(databases, userId) {
  console.log(`[BalanceSync] Processing due transactions for user ${userId}`);
  // Buscar todas as transações do usuário
  const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, [
    Query.equal('user_id', userId),
    Query.limit(10000),
  ]);
  const transactions = result.documents;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Identificar transações que eram futuras mas agora são de hoje ou passado
  const dueTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    const transactionDay = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate(),
    );
    return transactionDay <= today;
  });
  if (dueTransactions.length === 0) {
    console.log('[BalanceSync] No due transactions found');
    return 0;
  }
  // Agrupar por conta
  const accountIds = new Set();
  for (const transaction of dueTransactions) {
    if (transaction.account_id && !transaction.credit_card_id) {
      accountIds.add(transaction.account_id);
    }
  }
  console.log(`[BalanceSync] Found ${accountIds.size} accounts to update`);
  // Recalcular saldo de cada conta afetada
  for (const accountId of accountIds) {
    await syncAccountBalance(databases, accountId);
  }
  return accountIds.size;
}
/**
 * Processa todos os usuários (para execução agendada)
 */
async function processAllUsers(databases) {
  console.log('[BalanceSync] Processing all users (scheduled execution)');
  // Buscar todas as contas
  let offset = 0;
  const limit = 100;
  const processedUsers = new Set();
  while (true) {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
      Query.limit(limit),
      Query.offset(offset),
    ]);
    const accounts = result.documents;
    if (accounts.length === 0) {
      break;
    }
    // Processar cada usuário único
    for (const account of accounts) {
      if (!processedUsers.has(account.user_id)) {
        processedUsers.add(account.user_id);
        try {
          await processDueTransactions(databases, account.user_id);
        } catch (error) {
          console.error(`[BalanceSync] Error processing user ${account.user_id}:`, error);
        }
      }
    }
    if (accounts.length < limit) {
      break;
    }
    offset += limit;
  }
  console.log(`[BalanceSync] Processed ${processedUsers.size} users`);
}
/**
 * Função principal
 */
export default async ({ req, res, log, error }) => {
  try {
    log('Balance Sync Function started');
    log(`Request method: ${req.method}`);
    log(`Request headers: ${JSON.stringify(req.headers)}`);
    log(`Request body (raw): ${req.bodyRaw}`);
    log(`Request body (parsed): ${JSON.stringify(req.body)}`);
    const { databases } = initializeClient();
    // Verificar o tipo de execução
    const executionType = req.headers['x-appwrite-trigger'] || 'manual';
    log(`Execution type: ${executionType}`);
    // Execução agendada (cron)
    if (executionType === 'schedule') {
      log('Running scheduled balance sync (processing due transactions)');
      await processAllUsers(databases);
      return res.json({
        success: true,
        message: 'Scheduled balance sync completed',
        timestamp: new Date().toISOString(),
      });
    }
    // Execução por evento de database
    if (executionType === 'event') {
      const eventData = req.body;
      log(`Processing database event: ${JSON.stringify(eventData)}`);
      // Extrair dados da transação do evento
      const transaction = eventData;
      // Log detalhado para debug
      log(`Transaction ID: ${transaction.$id}`);
      log(`Account ID: ${transaction.account_id}`);
      log(`Credit Card ID: ${transaction.credit_card_id}`);
      log(`Amount: ${transaction.amount}`);
      log(`Direction: ${transaction.direction}`);
      log(`Date: ${transaction.date}`);
      if (!transaction.account_id) {
        log('Transaction has no account_id, skipping');
        return res.json({
          success: true,
          message: 'Transaction has no account, skipped',
        });
      }
      if (transaction.credit_card_id) {
        log('Transaction is for credit card, skipping');
        return res.json({
          success: true,
          message: 'Credit card transaction, skipped',
        });
      }
      // Sincronizar saldo da conta
      log(`Starting balance sync for account: ${transaction.account_id}`);
      const newBalance = await syncAccountBalance(databases, transaction.account_id);
      log(`Balance sync completed. New balance: ${newBalance}`);
      return res.json({
        success: true,
        message: 'Account balance synced',
        accountId: transaction.account_id,
        transactionId: transaction.$id,
        newBalance,
        timestamp: new Date().toISOString(),
      });
    }
    // Execução manual
    log('Running manual balance sync');
    log(`Request body: ${JSON.stringify(req.body)}`);
    log(`Request body type: ${typeof req.body}`);
    // Parse do body se vier como string
    let bodyData = req.body;
    if (typeof req.body === 'string') {
      try {
        bodyData = JSON.parse(req.body);
        log(`Body parsed successfully: ${JSON.stringify(bodyData)}`);
      } catch (e) {
        log(`Failed to parse body: ${e}`);
      }
    }
    const userId = bodyData?.userId;
    log(`Extracted userId: ${userId}`);
    log(`userId type: ${typeof userId}`);
    if (!userId) {
      log('ERROR: userId is missing or undefined');
      return res.json(
        {
          success: false,
          error: 'userId is required for manual execution',
          debug: {
            body: req.body,
            bodyData: bodyData,
            bodyType: typeof req.body,
          },
        },
        400,
      );
    }
    const accountsProcessed = await processDueTransactions(databases, userId);
    return res.json({
      success: true,
      message: 'Manual balance sync completed',
      accountsProcessed,
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
