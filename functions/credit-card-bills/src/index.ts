/**
 * Appwrite Function: Credit Card Bills
 *
 * Esta função gerencia automaticamente transações de pagamento de faturas de cartão de crédito.
 * É executada a cada 5 minutos via schedule, processando apenas transações com sync_status='pending'.
 *
 * Funcionalidades:
 * 1. Busca TODAS as transações de cartão de crédito com sync_status='pending'
 * 2. Agrupa por cartão e mês de vencimento (baseado no closing_day e due_day do cartão)
 * 3. Calcula o total de cada fatura considerando TODAS as transações (parcelamentos e avistas)
 * 4. Cria ou atualiza uma `transaction` para cada fatura com o valor total correto
 * 5. A transaction tem a data de vencimento do cartão (due_day)
 * 6. Atualiza sync_status das transações processadas para 'synced'
 * 7. Remove transactions de faturas obsoletas quando não há mais transações de cartão
 */
import { Client, ID, Query, TablesDB } from 'node-appwrite';

// Helpers
/**
 * Arredonda um valor para exatamente 2 casas decimais
 * Garante que todos os amounts na base de dados tenham precisão consistente
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

// Tipos
interface CreditCard {
  $id: string;
  account_id: string;
  name: string;
  closing_day: number;
  due_day: number;
  credit_limit: number;
  used_limit: number;
  [key: string]: any;
}

interface CreditCardTransaction {
  $id: string;
  user_id: string;
  credit_card_id: string;
  amount: number;
  date: string; // Bill due date for this installment
  purchase_date: string; // Original purchase date
  category?: string;
  description?: string;
  merchant?: string;
  installment?: number; // Current installment (1, 2, 3...)
  installments?: number; // Total installments (12 for 12x)
  is_recurring?: boolean;
  status: 'pending' | 'completed' | 'cancelled';
  sync_status: 'pending' | 'synced';
  [key: string]: any;
}

interface Transaction {
  $id: string;
  user_id: string;
  account_id?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'salary';
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  direction: 'in' | 'out';
  category?: string;
  description?: string;
  merchant?: string;
  [key: string]: any;
}

interface BillSummary {
  creditCardId: string;
  creditCardName: string;
  accountId: string;
  userId: string;
  dueDate: string; // YYYY-MM-DD format
  totalAmount: number;
  transactionCount: number;
  closingDate: string;
  transactionIds: string[]; // IDs das transações que compõem esta fatura
}

// Configuração
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const CREDIT_CARDS_COLLECTION = 'credit_cards';
const CREDIT_CARD_TRANSACTIONS_COLLECTION = 'credit_card_transactions';
const TRANSACTIONS_COLLECTION = 'transactions';

/**
 * Inicializa o cliente Appwrite
 */
function initializeClient(): { client: Client; databases: TablesDB } {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const databases = new TablesDB(client);

  return { client, databases };
}

/**
 * Busca informações de um cartão de crédito
 */
async function getCreditCard(databases: TablesDB, creditCardId: string): Promise<CreditCard | null> {
  try {
    const result = await databases.getRow({
      databaseId: DATABASE_ID,
      tableId: CREDIT_CARDS_COLLECTION,
      rowId: creditCardId,
    });

    return result as unknown as CreditCard;
  } catch (error) {
    console.error(`[CreditCardBills] Error fetching credit card ${creditCardId}:`, error);
    return null;
  }
}

/**
 * Busca todas as transações de cartão de crédito com sync_status='pending'
 */
async function getPendingCreditCardTransactions(databases: TablesDB): Promise<CreditCardTransaction[]> {
  const allTransactions: CreditCardTransaction[] = [];
  let offset = 0;
  const limit = 10000;

  while (true) {
    try {
      const result = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: CREDIT_CARD_TRANSACTIONS_COLLECTION,
        queries: [
          Query.equal('sync_status', 'pending'),
          Query.notEqual('status', 'cancelled'),
          Query.limit(limit),
          Query.offset(offset),
        ],
      });

      const transactions = result.rows as unknown as CreditCardTransaction[];
      allTransactions.push(...transactions);

      if (transactions.length === 0 || transactions.length < limit) {
        break;
      }

      offset += limit;
    } catch (error) {
      console.error(`[CreditCardBills] Error fetching pending credit card transactions:`, error);
      throw error;
    }
  }

  return allTransactions;
}

/**
 * Calcula a data de fechamento e vencimento de uma fatura baseado na data de compra
 * @param purchaseDate Data da compra
 * @param closingDay Dia de fechamento do cartão (ex: 10)
 * @param dueDay Dia de vencimento do cartão (ex: 15)
 * @returns { closingDate, dueDate } ambas em formato YYYY-MM-DD
 */
function calculateBillingDates(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
): { closingDate: string; dueDate: string } {
  const purchase = new Date(purchaseDate);
  const purchaseDay = purchase.getDate();
  const purchaseMonth = purchase.getMonth();
  const purchaseYear = purchase.getFullYear();

  let closingMonth = purchaseMonth;
  let closingYear = purchaseYear;

  // Se a compra foi depois do dia de fechamento, vai para a fatura do próximo mês
  if (purchaseDay > closingDay) {
    closingMonth += 1;
    if (closingMonth > 11) {
      closingMonth = 0;
      closingYear += 1;
    }
  }

  // Data de fechamento
  const closingDate = new Date(closingYear, closingMonth, closingDay);

  // Data de vencimento é sempre após o fechamento
  let dueMonth = closingMonth;
  let dueYear = closingYear;

  // Se o dia de vencimento for menor que o dia de fechamento, o vencimento é no próximo mês
  if (dueDay < closingDay) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  const dueDate = new Date(dueYear, dueMonth, dueDay);

  return {
    closingDate: closingDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
  };
}

/**
 * Agrupa transações de cartão de crédito por fatura (mês de vencimento)
 */
function groupTransactionsByBill(
  transactions: CreditCardTransaction[],
  creditCard: CreditCard,
): Map<string, BillSummary> {
  const billsMap = new Map<string, BillSummary>();

  for (const transaction of transactions) {
    // Para cada transação, calcular a data de vencimento
    const { dueDate, closingDate } = calculateBillingDates(
      transaction.purchase_date,
      creditCard.closing_day,
      creditCard.due_day,
    );

    // Se for parcelado, cada parcela pertence a uma fatura diferente
    if (transaction.installments && transaction.installments > 1 && transaction.installment) {
      // Calcular a data de vencimento desta parcela específica
      const installmentDate = new Date(dueDate);
      installmentDate.setMonth(installmentDate.getMonth() + (transaction.installment - 1));

      const installmentDueDate = installmentDate.toISOString().split('T')[0];
      const billKey = `${creditCard.$id}_${installmentDueDate}`;

      if (!billsMap.has(billKey)) {
        // Calcular closing date desta parcela também
        const installmentClosingDate = new Date(closingDate);
        installmentClosingDate.setMonth(installmentClosingDate.getMonth() + (transaction.installment - 1));

        billsMap.set(billKey, {
          creditCardId: creditCard.$id,
          creditCardName: creditCard.name,
          accountId: creditCard.account_id,
          userId: transaction.user_id,
          dueDate: installmentDueDate,
          totalAmount: 0,
          transactionCount: 0,
          closingDate: installmentClosingDate.toISOString().split('T')[0],
          transactionIds: [],
        });
      }

      const bill = billsMap.get(billKey)!;
      // O amount já representa o valor da parcela individual, usar diretamente
      bill.totalAmount += roundToTwoDecimals(transaction.amount);
      bill.transactionCount += 1;
      bill.transactionIds.push(transaction.$id);
    } else {
      // Transação à vista ou única
      const billKey = `${creditCard.$id}_${dueDate}`;

      if (!billsMap.has(billKey)) {
        billsMap.set(billKey, {
          creditCardId: creditCard.$id,
          creditCardName: creditCard.name,
          accountId: creditCard.account_id,
          userId: transaction.user_id,
          dueDate,
          totalAmount: 0,
          transactionCount: 0,
          closingDate,
          transactionIds: [],
        });
      }

      const bill = billsMap.get(billKey)!;
      bill.totalAmount += roundToTwoDecimals(transaction.amount);
      bill.transactionCount += 1;
      bill.transactionIds.push(transaction.$id);
    }
  }

  return billsMap;
}

/**
 * Busca todas as transactions existentes para um cartão de crédito
 * Identifica as transações de fatura pela categoria "Cartão de Crédito" e merchant
 */
async function getExistingBillTransactions(
  databases: TablesDB,
  creditCardName: string,
  userId: string,
): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];
  let offset = 0;
  const limit = 10000;

  while (true) {
    try {
      const result = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: TRANSACTIONS_COLLECTION,
        queries: [
          Query.equal('user_id', userId),
          Query.equal('category', 'Cartão de Crédito'),
          Query.equal('merchant', creditCardName),
          Query.equal('type', 'expense'),
          Query.limit(limit),
          Query.offset(offset),
        ],
      });

      const transactions = result.rows as unknown as Transaction[];
      allTransactions.push(...transactions);

      if (transactions.length === 0 || transactions.length < limit) {
        break;
      }

      offset += limit;
    } catch (error) {
      console.error(`[CreditCardBills] Error fetching existing bill transactions:`, error);
      throw error;
    }
  }

  return allTransactions;
}

/**
 * Cria ou atualiza uma transaction para uma fatura
 */
async function upsertBillTransaction(
  databases: TablesDB,
  bill: BillSummary,
  existingTransaction?: Transaction,
): Promise<void> {
  const now = new Date().toISOString();
  const description = `Fatura ${bill.creditCardName} - ${new Date(bill.dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;

  const payload: any = {
    user_id: bill.userId,
    account_id: bill.accountId,
    amount: roundToTwoDecimals(Math.abs(bill.totalAmount)),
    type: 'expense',
    date: `${bill.dueDate}T12:00:00.000Z`,
    status: 'pending',
    direction: 'out',
    category: 'Cartão de Crédito',
    description,
    merchant: bill.creditCardName,
    updated_at: now,
  };

  try {
    if (existingTransaction) {
      // Atualizar transaction existente
      console.log(`[CreditCardBills] Updating bill transaction ${existingTransaction.$id}`);
      await databases.updateRow({
        databaseId: DATABASE_ID,
        tableId: TRANSACTIONS_COLLECTION,
        rowId: existingTransaction.$id,
        data: payload,
      });
    } else {
      // Criar nova transaction
      console.log(`[CreditCardBills] Creating new bill transaction for ${bill.dueDate}`);
      await databases.createRow({
        databaseId: DATABASE_ID,
        tableId: TRANSACTIONS_COLLECTION,
        rowId: ID.unique(),
        data: {
          ...payload,
          created_at: now,
        },
      });
    }
  } catch (error) {
    console.error(`[CreditCardBills] Error upserting bill transaction:`, error);
    throw error;
  }
}

/**
 * Remove transactions de faturas que não existem mais
 */
async function removeObsoleteBillTransactions(
  databases: TablesDB,
  existingTransactions: Transaction[],
  currentBills: Map<string, BillSummary>,
  creditCardId: string,
): Promise<void> {
  for (const transaction of existingTransactions) {
    const dateKey = transaction.date.split('T')[0];
    const billKey = `${creditCardId}_${dateKey}`;

    if (!currentBills.has(billKey)) {
      console.log(`[CreditCardBills] Removing obsolete bill transaction ${transaction.$id}`);
      try {
        await databases.deleteRow({
          databaseId: DATABASE_ID,
          tableId: TRANSACTIONS_COLLECTION,
          rowId: transaction.$id,
        });
      } catch (error) {
        console.error(`[CreditCardBills] Error removing transaction ${transaction.$id}:`, error);
      }
    }
  }
}

/**
 * Atualiza o sync_status das transações processadas para 'synced'
 * Usa updateRows em lote para evitar rate limit
 */
async function markTransactionsAsSynced(databases: TablesDB, transactionIds: string[]): Promise<void> {
  console.log(`[CreditCardBills] Marking ${transactionIds.length} transactions as synced`);

  if (transactionIds.length === 0) {
    return;
  }

  try {
    // Usar updateRows em lote para evitar rate limit
    // Dividir em chunks de 50 transações por vez para não exceder limites de query
    const CHUNK_SIZE = 50;
    for (let i = 0; i < transactionIds.length; i += CHUNK_SIZE) {
      const chunk = transactionIds.slice(i, i + CHUNK_SIZE);

      // Criar query para atualizar múltiplas transações de uma vez
      const queries = [Query.equal('$id', chunk)];

      await databases.updateRows({
        databaseId: DATABASE_ID,
        tableId: CREDIT_CARD_TRANSACTIONS_COLLECTION,
        queries,
        data: {
          sync_status: 'synced',
          updated_at: new Date().toISOString(),
        },
      });

      console.log(
        `[CreditCardBills] Updated ${chunk.length} transactions to synced (${i + chunk.length}/${transactionIds.length})`,
      );

      // Pequeno delay entre chunks para não sobrecarregar a API
      if (i + CHUNK_SIZE < transactionIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error(`[CreditCardBills] Error marking transactions as synced:`, error);
    throw error;
  }
}

/**
 * Busca todas as transações de cartão de crédito de um cartão específico (incluindo synced)
 * Para calcular o valor total correto da fatura
 */
async function getAllCreditCardTransactions(
  databases: TablesDB,
  creditCardId: string,
): Promise<CreditCardTransaction[]> {
  const allTransactions: CreditCardTransaction[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const result = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: CREDIT_CARD_TRANSACTIONS_COLLECTION,
        queries: [
          Query.equal('credit_card_id', creditCardId),
          Query.notEqual('status', 'cancelled'),
          Query.limit(limit),
          Query.offset(offset),
        ],
      });

      const transactions = result.rows as unknown as CreditCardTransaction[];
      allTransactions.push(...transactions);

      if (transactions.length === 0 || transactions.length < limit) {
        break;
      }

      offset += limit;
    } catch (error) {
      console.error(`[CreditCardBills] Error fetching all credit card transactions:`, error);
      throw error;
    }
  }

  return allTransactions;
}

/**
 * Sincroniza faturas de cartão de crédito
 * Processa transações pending por cartão
 */
async function syncCreditCardBills(databases: TablesDB): Promise<void> {
  console.log(`[CreditCardBills] Starting bills synchronization`);

  // 1. Buscar todas as transações pendentes
  const pendingTransactions = await getPendingCreditCardTransactions(databases);
  console.log(`[CreditCardBills] Found ${pendingTransactions.length} pending transactions`);

  if (pendingTransactions.length === 0) {
    console.log(`[CreditCardBills] No pending transactions to process`);
    return;
  }

  // 2. Agrupar transações por cartão de crédito
  const transactionsByCard = new Map<string, CreditCardTransaction[]>();
  for (const transaction of pendingTransactions) {
    if (!transactionsByCard.has(transaction.credit_card_id)) {
      transactionsByCard.set(transaction.credit_card_id, []);
    }
    transactionsByCard.get(transaction.credit_card_id)!.push(transaction);
  }

  console.log(`[CreditCardBills] Processing ${transactionsByCard.size} credit cards`);

  // 3. Processar cada cartão
  for (const [creditCardId, transactions] of transactionsByCard) {
    try {
      console.log(
        `[CreditCardBills] Processing credit card ${creditCardId} with ${transactions.length} pending transactions`,
      );

      // Buscar informações do cartão
      const creditCard = await getCreditCard(databases, creditCardId);
      if (!creditCard) {
        console.error(`[CreditCardBills] Credit card ${creditCardId} not found`);
        continue;
      }

      // Buscar TODAS as transações do cartão (não apenas as pending) para calcular o valor correto
      const allCardTransactions = await getAllCreditCardTransactions(databases, creditCardId);
      console.log(`[CreditCardBills] Card ${creditCard.name} has ${allCardTransactions.length} total transactions`);

      if (allCardTransactions.length === 0) {
        console.log(`[CreditCardBills] No transactions found for card ${creditCardId}, skipping...`);
        continue;
      }

      // Agrupar TODAS as transações por fatura para calcular o valor correto
      const bills = groupTransactionsByBill(allCardTransactions, creditCard);
      console.log(`[CreditCardBills] Grouped into ${bills.size} bills`);

      if (bills.size === 0) {
        console.log(`[CreditCardBills] No bills to process for card ${creditCardId}`);
        continue;
      }

      // Buscar transactions de fatura existentes
      const userId = allCardTransactions[0].user_id;
      const existingTransactions = await getExistingBillTransactions(databases, creditCard.name, userId);
      console.log(`[CreditCardBills] Found ${existingTransactions.length} existing bill transactions`);

      // Criar mapa de transactions existentes por data
      const existingTransactionsMap = new Map<string, Transaction>();
      for (const transaction of existingTransactions) {
        const dateKey = transaction.date.split('T')[0];
        existingTransactionsMap.set(dateKey, transaction);
      }

      // Criar ou atualizar transactions para cada fatura
      for (const [billKey, bill] of bills) {
        const existingTransaction = existingTransactionsMap.get(bill.dueDate);
        await upsertBillTransaction(databases, bill, existingTransaction);
      }

      // Remover transactions de faturas obsoletas
      await removeObsoleteBillTransactions(databases, existingTransactions, bills, creditCardId);

      // Marcar as transações pending como synced
      const pendingIds = transactions.map((t) => t.$id);
      await markTransactionsAsSynced(databases, pendingIds);

      console.log(`[CreditCardBills] Completed sync for credit card ${creditCardId}`);
    } catch (error) {
      console.error(`[CreditCardBills] Error processing credit card ${creditCardId}:`, error);
    }
  }

  console.log(`[CreditCardBills] Bills synchronization completed`);
}

/**
 * Função principal
 * Executada a cada 5 minutos via schedule
 */
export default async ({ req, res, log, error }: any) => {
  const startTime = Date.now();
  log('Credit Card Bills function triggered (scheduled execution)');

  try {
    // Validar variáveis de ambiente
    if (!process.env.APPWRITE_FUNCTION_PROJECT_ID) {
      error('APPWRITE_FUNCTION_PROJECT_ID not set');
      return res.json({ success: false, message: 'Missing project ID configuration' }, 500);
    }

    if (!process.env.APPWRITE_API_KEY) {
      error('APPWRITE_API_KEY not set');
      return res.json({ success: false, message: 'Missing API key configuration' }, 500);
    }

    log(`Database ID: ${DATABASE_ID}`);
    log(`Endpoint: ${process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'}`);

    const { databases } = initializeClient();

    // Sincronizar faturas de todos os cartões com transações pendentes
    await syncCreditCardBills(databases);

    const duration = Date.now() - startTime;
    log(`Function completed successfully in ${duration}ms`);

    return res.json({
      success: true,
      message: 'Credit card bills synchronized successfully',
      duration,
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    error(`Error processing credit card bills after ${duration}ms: ${err.message}`);

    if (err.stack) {
      error(`Stack trace: ${err.stack}`);
    }

    return res.json(
      {
        success: false,
        message: 'Failed to process credit card bills',
        error: err.message,
        duration,
      },
      500,
    );
  }
};
