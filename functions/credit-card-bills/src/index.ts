/**
 * Appwrite Function: Credit Card Bills
 *
 * Esta função gerencia automaticamente transações de pagamento de faturas de cartão de crédito.
 * É acionada quando uma transação de cartão de crédito é criada, atualizada ou deletada.
 *
 * Funcionalidades:
 * 1. Busca todas as transações de cartão de crédito de um cartão específico
 * 2. Agrupa por mês de vencimento (baseado no closing_day e due_day do cartão)
 * 3. Calcula o total de cada fatura considerando parcelamentos
 * 4. Cria ou atualiza uma `transaction` para cada fatura com o valor total
 * 5. A transaction tem a data de vencimento do cartão (due_day)
 * 6. Remove transactions de faturas antigas quando não há mais transações de cartão
 */
import { Client, ID, Query, TablesDB } from 'node-appwrite';

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
  [key: string]: any;
}

interface Transaction {
  $id: string;
  user_id: string;
  account_id?: string;
  credit_card_id?: string;
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
 * Busca todas as transações de cartão de crédito de um cartão específico
 */
async function getCreditCardTransactions(databases: TablesDB, creditCardId: string): Promise<CreditCardTransaction[]> {
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
      console.error(`[CreditCardBills] Error fetching credit card transactions:`, error);
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
        });
      }

      const bill = billsMap.get(billKey)!;
      // Para parcelamentos, dividir o valor total pelo número de parcelas
      bill.totalAmount += transaction.amount / (transaction.installments || 1);
      bill.transactionCount += 1;
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
        });
      }

      const bill = billsMap.get(billKey)!;
      bill.totalAmount += transaction.amount;
      bill.transactionCount += 1;
    }
  }

  return billsMap;
}

/**
 * Busca todas as transactions existentes para um cartão de crédito
 */
async function getExistingBillTransactions(
  databases: TablesDB,
  creditCardId: string,
  userId: string,
): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const result = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: TRANSACTIONS_COLLECTION,
        queries: [
          Query.equal('user_id', userId),
          Query.equal('credit_card_id', creditCardId),
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
    credit_card_id: bill.creditCardId,
    amount: Math.abs(bill.totalAmount),
    type: 'expense',
    date: `${bill.dueDate}T00:00:00.000Z`,
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
): Promise<void> {
  for (const transaction of existingTransactions) {
    const billKey = `${transaction.credit_card_id}_${transaction.date.split('T')[0]}`;

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
 * Sincroniza transactions de faturas para um cartão de crédito
 */
async function syncCreditCardBills(databases: TablesDB, creditCardId: string): Promise<void> {
  console.log(`[CreditCardBills] Starting sync for credit card ${creditCardId}`);

  // 1. Buscar informações do cartão
  const creditCard = await getCreditCard(databases, creditCardId);
  if (!creditCard) {
    console.error(`[CreditCardBills] Credit card ${creditCardId} not found`);
    return;
  }

  console.log(`[CreditCardBills] Processing card: ${creditCard.name}`);

  // 2. Buscar todas as transações de cartão de crédito
  const creditCardTransactions = await getCreditCardTransactions(databases, creditCardId);
  console.log(`[CreditCardBills] Found ${creditCardTransactions.length} credit card transactions`);

  // 3. Agrupar por fatura
  const bills = groupTransactionsByBill(creditCardTransactions, creditCard);
  console.log(`[CreditCardBills] Grouped into ${bills.size} bills`);

  // 4. Buscar transactions existentes
  const existingTransactions = await getExistingBillTransactions(
    databases,
    creditCardId,
    creditCardTransactions[0]?.user_id || '',
  );
  console.log(`[CreditCardBills] Found ${existingTransactions.length} existing bill transactions`);

  // 5. Criar um mapa de transactions existentes por data
  const existingTransactionsMap = new Map<string, Transaction>();
  for (const transaction of existingTransactions) {
    const dateKey = transaction.date.split('T')[0];
    existingTransactionsMap.set(dateKey, transaction);
  }

  // 6. Criar ou atualizar transactions para cada fatura
  for (const [billKey, bill] of bills) {
    const existingTransaction = existingTransactionsMap.get(bill.dueDate);
    await upsertBillTransaction(databases, bill, existingTransaction);
  }

  // 7. Remover transactions de faturas obsoletas
  await removeObsoleteBillTransactions(databases, existingTransactions, bills);

  console.log(`[CreditCardBills] Sync completed for credit card ${creditCardId}`);
}

/**
 * Função principal
 */
export default async ({ req, res, log, error }: any) => {
  log('Credit Card Bills function triggered');

  try {
    const { databases } = initializeClient();

    // Extrair informações do evento
    const payload = JSON.parse(req.bodyRaw || '{}');
    log(`Event payload: ${JSON.stringify(payload)}`);

    // O evento contém informações sobre a transação de cartão de crédito
    const creditCardTransaction = payload as CreditCardTransaction;

    if (!creditCardTransaction.credit_card_id) {
      error('No credit_card_id found in event payload');
      return res.json({ success: false, message: 'No credit card ID provided' }, 400);
    }

    // Sincronizar faturas do cartão de crédito
    await syncCreditCardBills(databases, creditCardTransaction.credit_card_id);

    return res.json({
      success: true,
      message: 'Credit card bills synchronized successfully',
    });
  } catch (err: any) {
    error(`Error processing credit card bills: ${err.message}`);
    error(err.stack);

    return res.json(
      {
        success: false,
        message: 'Failed to process credit card bills',
        error: err.message,
      },
      500,
    );
  }
};
