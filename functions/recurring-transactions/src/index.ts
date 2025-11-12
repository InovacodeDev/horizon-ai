/**
 * Appwrite Function: Recurring Transactions
 *
 * Esta função processa transações recorrentes mensalmente.
 * Executa todo dia 1º de cada mês às 00:00 (cron: 0 0 1 * *)
 *
 * Funcionalidades:
 * 1. Busca todas as transações marcadas como recorrentes
 * 2. Cria novas transações para o mês atual mantendo o mesmo dia
 * 3. Atualiza os valores e mantém todas as propriedades da transação original
 */
import { Client, Databases, ID, Query } from 'node-appwrite';

// Tipos
interface RecurringTransaction {
  $id: string;
  user_id: string;
  account_id?: string;
  credit_card_id?: string;
  amount: number;
  direction: 'in' | 'out';
  date: string;
  category?: string;
  description?: string;
  status: string;
  is_recurring: boolean;
  recurring_day?: number;
  [key: string]: any;
}

// Configuração
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const TRANSACTIONS_COLLECTION = 'transactions';

/**
 * Inicializa o cliente Appwrite
 */
function initializeClient(): { client: Client; databases: Databases } {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const databases = new Databases(client);

  return { client, databases };
}

/**
 * Busca todas as transações recorrentes
 */
async function getRecurringTransactions(databases: Databases): Promise<RecurringTransaction[]> {
  const allTransactions: RecurringTransaction[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const result = await databases.listDocuments(DATABASE_ID, TRANSACTIONS_COLLECTION, [
      Query.equal('is_recurring', true),
      Query.limit(limit),
      Query.offset(offset),
    ]);

    const transactions = result.documents as unknown as RecurringTransaction[];
    allTransactions.push(...transactions);

    if (transactions.length === 0 || transactions.length < limit) {
      break;
    }

    offset += limit;
  }

  return allTransactions;
}

/**
 * Calcula a próxima data para a transação recorrente
 */
function getNextRecurringDate(originalDate: string): string {
  const original = new Date(originalDate);
  const now = new Date();

  // Pegar o dia da transação original
  const day = original.getDate();

  // Criar data para o mês atual
  const nextDate = new Date(now.getFullYear(), now.getMonth(), day);

  // Se o dia não existe no mês atual (ex: 31 em fevereiro), usar o último dia do mês
  if (nextDate.getDate() !== day) {
    nextDate.setDate(0); // Volta para o último dia do mês anterior
  }

  return nextDate.toISOString();
}

/**
 * Verifica se já existe uma transação recorrente para este mês
 */
async function transactionExistsForMonth(
  databases: Databases,
  originalTransactionId: string,
  targetMonth: number,
  targetYear: number,
): Promise<boolean> {
  // Buscar transações que referenciam a transação original
  const result = await databases.listDocuments(DATABASE_ID, TRANSACTIONS_COLLECTION, [
    Query.equal('recurring_parent_id', originalTransactionId),
    Query.limit(100),
  ]);

  // Verificar se alguma é do mês/ano alvo
  for (const doc of result.documents) {
    const transactionDate = new Date(doc.date as string);
    if (transactionDate.getMonth() === targetMonth && transactionDate.getFullYear() === targetYear) {
      return true;
    }
  }

  return false;
}

/**
 * Cria uma nova transação recorrente
 */
async function createRecurringTransaction(
  databases: Databases,
  original: RecurringTransaction,
  newDate: string,
): Promise<void> {
  const now = new Date();
  const targetMonth = now.getMonth();
  const targetYear = now.getFullYear();

  // Verificar se já existe transação para este mês
  const exists = await transactionExistsForMonth(databases, original.$id, targetMonth, targetYear);

  if (exists) {
    console.log(`Transaction already exists for ${original.$id} in ${targetMonth + 1}/${targetYear}`);
    return;
  }

  // Criar cópia da transação original
  const newTransaction: any = {
    user_id: original.user_id,
    amount: original.amount,
    direction: original.direction,
    date: newDate,
    status: original.status,
    is_recurring: false, // A nova transação não é recorrente, apenas a original
    recurring_parent_id: original.$id, // Referência à transação original
  };

  // Copiar campos opcionais se existirem
  if (original.account_id) newTransaction.account_id = original.account_id;
  if (original.credit_card_id) newTransaction.credit_card_id = original.credit_card_id;
  if (original.category) newTransaction.category = original.category;
  if (original.description) newTransaction.description = original.description;

  // Criar a nova transação
  await databases.createDocument(DATABASE_ID, TRANSACTIONS_COLLECTION, ID.unique(), newTransaction);

  console.log(`Created recurring transaction for ${original.$id} on ${newDate}`);
}

/**
 * Processa todas as transações recorrentes
 */
async function processRecurringTransactions(databases: Databases): Promise<number> {
  console.log('[RecurringTransactions] Starting processing');

  const recurringTransactions = await getRecurringTransactions(databases);
  console.log(`[RecurringTransactions] Found ${recurringTransactions.length} recurring transactions`);

  let created = 0;

  for (const transaction of recurringTransactions) {
    try {
      const nextDate = getNextRecurringDate(transaction.date);
      await createRecurringTransaction(databases, transaction, nextDate);
      created++;
    } catch (error: any) {
      console.error(`[RecurringTransactions] Error processing transaction ${transaction.$id}:`, error.message);
    }
  }

  console.log(`[RecurringTransactions] Created ${created} new transactions`);
  return created;
}

/**
 * Função principal
 */
export default async ({ req, res, log, error }: any) => {
  try {
    log('Recurring Transactions Function started');
    log(`Execution type: ${req.headers['x-appwrite-trigger'] || 'manual'}`);

    const { client, databases } = initializeClient();

    const created = await processRecurringTransactions(databases);

    return res.json({
      success: true,
      message: 'Recurring transactions processed successfully',
      transactionsCreated: created,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    error('Recurring Transactions Function error:', err);
    return res.json(
      {
        success: false,
        error: err.message || 'Unknown error',
      },
      500,
    );
  }
};
