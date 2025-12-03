'use server';

/**
 * Projection Server Actions
 * Handles cash flow projections for the next month
 */
/**
 * Get category projections based on historical data
 * Returns current month spend and projections for next 2 months
 */
import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import { requireAuth } from '@/lib/auth/session';
import { CreditCardTransactionService } from '@/lib/services/credit-card-transaction.service';
import { getGoogleAIService } from '@/lib/services/google-ai.service';
import { SpendingPredictionService } from '@/lib/services/spending-prediction.service';
import { TransactionService } from '@/lib/services/transaction.service';
import { ID, Query } from 'appwrite';

interface CategoryProjection {
  category: string;
  currentMonth: number;
  projectionNextMonth: number;
  projectionMonthAfter: number;
}

interface ProjectedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  isRecurring: boolean;
}

/**
 * Get projected transactions for the next month
 * Based on recurring transactions and scheduled payments
 */
export async function getNextMonthProjections(): Promise<{
  projectedTransactions: ProjectedTransaction[];
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    const transactionService = new TransactionService();

    // Get date range for next month
    const now = new Date();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    // Get recurring transactions from current and previous months
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const { transactions: recurring } = await transactionService.listTransactions({
      userId: user.sub,
      startDate: currentMonthStart.toISOString().split('T')[0],
      limit: 50,
      isRecurring: true,
    });

    // Filter only recurring transactions - already filtered by query
    // const recurring = recurringTransactions.filter((tx) => tx.is_recurring);

    // Project recurring transactions to next month
    const projectedTransactions: ProjectedTransaction[] = [];

    for (const tx of recurring) {
      // Parse transaction data
      let txData: any = {};
      if (tx.data) {
        try {
          txData = typeof tx.data === 'string' ? JSON.parse(tx.data) : tx.data;
        } catch {
          txData = {};
        }
      }

      const recurringPattern = txData.recurring_pattern;

      if (!recurringPattern) continue;

      // Calculate next occurrence based on frequency
      const originalDate = new Date(tx.date);
      let projectedDate = new Date(originalDate);

      switch (recurringPattern.frequency) {
        case 'monthly':
          // Project to same day next month
          projectedDate = new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), originalDate.getDate());
          break;

        case 'weekly':
          // Project weekly occurrences in next month
          const dayOfWeek = originalDate.getDay();
          let currentDate = new Date(nextMonthStart);

          while (currentDate <= nextMonthEnd) {
            if (currentDate.getDay() === dayOfWeek && currentDate >= nextMonthStart) {
              projectedTransactions.push({
                description: tx.description || txData.description || 'Transação Recorrente',
                amount: tx.amount,
                type: tx.type as 'income' | 'expense',
                date: currentDate.toISOString(),
                category: tx.category || txData.category || 'Outros',
                isRecurring: true,
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
          continue;

        case 'yearly':
          // Only project if anniversary falls in next month
          if (
            originalDate.getMonth() === nextMonthStart.getMonth() &&
            originalDate.getDate() <= nextMonthEnd.getDate()
          ) {
            projectedDate = new Date(nextMonthStart.getFullYear(), originalDate.getMonth(), originalDate.getDate());
          } else {
            continue;
          }
          break;

        case 'daily':
          // Project daily occurrences (limit to avoid too many)
          const daysInNextMonth = nextMonthEnd.getDate();
          for (let day = 1; day <= daysInNextMonth; day++) {
            projectedTransactions.push({
              description: tx.description || txData.description || 'Transação Recorrente',
              amount: tx.amount,
              type: tx.type as 'income' | 'expense',
              date: new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), day).toISOString(),
              category: tx.category || txData.category || 'Outros',
              isRecurring: true,
            });
          }
          continue;
      }

      // Check if end date has passed
      if (recurringPattern.endDate) {
        const endDate = new Date(recurringPattern.endDate);
        if (projectedDate > endDate) {
          continue;
        }
      }

      // Add projected transaction (for monthly and yearly)
      if (recurringPattern.frequency === 'monthly' || recurringPattern.frequency === 'yearly') {
        projectedTransactions.push({
          description: tx.description || txData.description || 'Transação Recorrente',
          amount: tx.amount,
          type: tx.type as 'income' | 'expense',
          date: projectedDate.toISOString(),
          category: tx.category || txData.category || 'Outros',
          isRecurring: true,
        });
      }
    }

    // Get scheduled transactions (status: pending) for next month
    const { transactions: scheduledTransactions } = await transactionService.listTransactions({
      userId: user.sub,
      status: 'pending',
      startDate: nextMonthStart.toISOString().split('T')[0],
      endDate: nextMonthEnd.toISOString().split('T')[0],
      limit: 50,
    });

    // Add scheduled transactions to projections
    for (const tx of scheduledTransactions) {
      let txData: any = {};
      if (tx.data) {
        try {
          txData = typeof tx.data === 'string' ? JSON.parse(tx.data) : tx.data;
        } catch {
          txData = {};
        }
      }

      projectedTransactions.push({
        description: tx.description || txData.description || 'Transação Agendada',
        amount: tx.amount,
        type: tx.type as 'income' | 'expense',
        date: tx.date,
        category: tx.category || txData.category || 'Outros',
        isRecurring: false,
      });
    }

    // Sort by date
    projectedTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      projectedTransactions,
      success: true,
    };
  } catch (error) {
    console.error('Get projections error:', error);
    return {
      projectedTransactions: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projections',
    };
  }
}

/**
 * Get projection summary for quick display
 */
export async function getProjectionSummary(): Promise<{
  totalIncome: number;
  totalExpenses: number;
  netProjection: number;
  transactionCount: number;
  success: boolean;
  error?: string;
}> {
  try {
    const { projectedTransactions, success, error } = await getNextMonthProjections();

    if (!success) {
      throw new Error(error || 'Failed to get projections');
    }

    const totalIncome = projectedTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = projectedTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netProjection: totalIncome - totalExpenses,
      transactionCount: projectedTransactions.length,
      success: true,
    };
  } catch (error) {
    console.error('Get projection summary error:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netProjection: 0,
      transactionCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projection summary',
    };
  }
}

interface CategoryProjection {
  category: string;
  type: 'income' | 'expense';
  currentMonth: number;
  projectionNextMonth: number;
  projectionMonthAfter: number;
  reasoningNextMonth?: string;
  reasoningMonthAfter?: string;
  detectedPatterns?: string[];
  history: { month: string; amount: number }[];
}

const CATEGORY_MAP: Record<string, string> = {
  health: 'Saúde',
  pharmacy: 'Saúde',
  food: 'Alimentação',
  restaurant: 'Alimentação',
  groceries: 'Mercado',
  supermarket: 'Mercado',
  transport: 'Transporte',
  fuel: 'Transporte',
  uber: 'Transporte',
  shopping: 'Compras',
  retail: 'Compras',
  services: 'Serviços',
  home: 'Casa',
  housing: 'Casa',
  utilities: 'Casa',
  bills: 'Contas',
  education: 'Educação',
  entertainment: 'Lazer',
  travel: 'Viagem',
  other: 'Outros',
  uncategorized: 'Outros',
  credit_card_bill: 'Faturas Cartão',
  credit_card_bills: 'Faturas Cartão',
  'credit card': 'Faturas Cartão',
  invoice: 'Faturas Cartão',
  subscription: 'Assinaturas',
  subscriptions: 'Assinaturas',
  clothing: 'Roupas',
  apparel: 'Roupas',
  electronics: 'Eletrônicos',
  tech: 'Eletrônicos',
  phone: 'Telefone',
  mobile: 'Telefone',
  taxes: 'Impostos',
  tax: 'Impostos',
  salary: 'Salário',
  paycheck: 'Salário',
  income: 'Renda',
  freelance: 'Freelance',
  dividend: 'Dividendos',
  dividends: 'Dividendos',
  investment: 'Investimentos',
  sale: 'Vendas',
  refund: 'Reembolso',
  bonus: 'Bônus',
  balance: 'Ajuste Saldo',
  transfer: 'Transferência',
  gift: 'Presentes',
  gifts: 'Presentes',
};

const normalizeCategory = (cat: string): string => {
  if (!cat) return 'Outros';
  const lower = cat.toLowerCase().trim();
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

/**
 * Get category projections based on historical data and AI analysis
 */
export async function getCategoryProjectionsAction(): Promise<{
  projections: CategoryProjection[];
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    const googleAI = getGoogleAIService();
    const transactionService = new TransactionService();
    const creditCardService = new CreditCardTransactionService();
    const predictionService = new SpendingPredictionService();

    const now = new Date();
    // Analyze last 6 months for better patterns
    const historyStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDateStr = historyStart.toISOString().split('T')[0];
    const endDateStr = currentMonthEnd.toISOString().split('T')[0];

    // 1. Fetch Transactions
    const [regularTx, ccTx] = await Promise.all([
      transactionService.listTransactions({
        userId: user.sub,
        startDate: startDateStr,
        endDate: endDateStr,
        // Removed type: 'expense' to include income
        limit: 10000,
      }),
      creditCardService.listTransactions({
        userId: user.sub,
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 10000,
      }),
    ]);

    const allTransactions = [...regularTx.transactions, ...ccTx.transactions];

    // 2. Group by Normalized Category for Display (Cash Flow)
    const categoryData: Record<
      string,
      {
        transactions: any[];
        monthlyTotals: Record<string, number>;
        type: 'income' | 'expense';
      }
    > = {};

    // 2b. Group by Normalized Category for AI Analysis (Spending Decisions)
    const aiCategoryData: Record<string, any[]> = {};

    const getMonthKey = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };
    const currentMonthKey = getMonthKey(now.toISOString());

    // Process Regular Transactions
    regularTx.transactions.forEach((tx) => {
      let rawCat = tx.category;
      if (!rawCat && (tx as any).data) {
        try {
          const data = typeof (tx as any).data === 'string' ? JSON.parse((tx as any).data) : (tx as any).data;
          rawCat = data.category;
        } catch {}
      }
      const category = normalizeCategory(rawCat || 'Outros');

      // Skip Credit Card Bill payments for both display and AI
      if (category === 'Faturas Cartão') return;

      // Skip Transfers
      if (category === 'Transferência' || (tx as any).type === 'transfer') return;

      const month = getMonthKey(tx.date);

      // Determine type: if amount > 0 it's income, else expense.
      // Note: TransactionService might return signed amounts.
      const isIncome = tx.amount > 0;
      const type = isIncome ? 'income' : 'expense';

      // Display Data
      if (!categoryData[category]) {
        categoryData[category] = { transactions: [], monthlyTotals: {}, type };
      }

      // If we encounter a category that was previously expense but now has income,
      // we might want to keep it as mixed or prioritize one.
      // For now, let's assume if it has ANY income, treat as income? Or just stick to the first one?
      // Better: if the majority is income. But simpler: just use the type of the current tx if not set.
      // Actually, let's just trust the first one for now, or maybe update it if we find income.
      if (categoryData[category].type === 'expense' && isIncome) {
        // If we found income in an expense category, it might be a refund or it might be a mixed category.
        // Let's leave it as is for now, or maybe 'income' if it's 'Salary'.
      }

      categoryData[category].transactions.push({
        date: tx.date,
        amount: Math.abs(tx.amount),
        description: (tx as any).description || (tx as any).merchant || 'Despesa',
      });
      if (!categoryData[category].monthlyTotals[month]) {
        categoryData[category].monthlyTotals[month] = 0;
      }
      categoryData[category].monthlyTotals[month] += Math.abs(tx.amount);

      // AI Data
      if (!aiCategoryData[category]) aiCategoryData[category] = [];
      aiCategoryData[category].push({
        date: tx.date,
        amount: Math.abs(tx.amount),
        description: (tx as any).description || (tx as any).merchant || 'Despesa',
      });
    });

    // Process Credit Card Transactions (Always Expense)
    ccTx.transactions.forEach((tx) => {
      const category = normalizeCategory(tx.category || 'Outros');

      // Skip Credit Card Bill category if it somehow appears here
      if (category === 'Faturas Cartão') return;

      const month = getMonthKey(tx.date);

      // Display Data (Cash Flow - use installment amount and due date)
      if (!categoryData[category]) {
        categoryData[category] = { transactions: [], monthlyTotals: {}, type: 'expense' };
      }
      categoryData[category].transactions.push({
        date: tx.date,
        amount: tx.amount,
        description: tx.description || tx.merchant || 'Despesa Cartão',
      });
      if (!categoryData[category].monthlyTotals[month]) {
        categoryData[category].monthlyTotals[month] = 0;
      }
      categoryData[category].monthlyTotals[month] += tx.amount;

      // AI Data (Spending Decisions - use total amount and purchase date)
      if (!aiCategoryData[category]) aiCategoryData[category] = [];

      // Logic:
      // - If not recurring/installment: use amount and purchase_date
      // - If installment:
      //   - If installment == 1: use amount * total_installments and purchase_date
      //   - If installment > 1: IGNORE (already captured by installment 1)

      const isInstallment = (tx.installments || 0) > 1;
      const currentInstallment = tx.installment || 1;

      if (isInstallment) {
        if (currentInstallment === 1) {
          // This is the purchase event
          const totalAmount = tx.amount * (tx.installments || 1);
          aiCategoryData[category].push({
            date: tx.purchase_date || tx.date, // Use purchase date
            amount: totalAmount,
            description: tx.description || tx.merchant || 'Compra Parcelada',
            items: `Compra parcelada em ${tx.installments}x (Valor total: ${totalAmount})`,
          });
        }
        // If installment > 1, we skip it for AI analysis to avoid "recurring small spend" pattern
      } else {
        // Regular one-time purchase
        aiCategoryData[category].push({
          date: tx.purchase_date || tx.date,
          amount: tx.amount,
          description: tx.description || tx.merchant || 'Despesa Cartão',
        });
      }
    });

    // 3. Process Projections (Check Cache or Generate)
    const projections: CategoryProjection[] = [];
    const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM

    for (const category of Object.keys(categoryData)) {
      // Skip if category is explicitly 'Faturas Cartão' (double check)
      if (category === 'Faturas Cartão') continue;

      const data = categoryData[category];
      const currentMonthSpend = data.monthlyTotals[currentMonthKey] || 0;

      // Check for cached prediction
      let prediction: any = null;
      try {
        const cached = await predictionService.getPrediction(user.sub, category, currentMonthStr);
        if (cached) {
          // Check if cache is fresh (e.g., < 24 hours)
          const created = new Date(cached.created_at);
          const diff = now.getTime() - created.getTime();
          if (diff < 24 * 60 * 60 * 1000) {
            prediction = cached;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch cached prediction', e);
      }

      let nextMonthAmount = 0;
      let monthAfterAmount = 0;
      let reasoningNext = '';
      let reasoningAfter = '';
      let patterns: string[] = [];

      if (prediction) {
        // Use cached data
        nextMonthAmount = prediction.predicted_amount;
        monthAfterAmount = prediction.predicted_amount;
        if (prediction.metadata) {
          try {
            const meta = JSON.parse(prediction.metadata);
            if (meta.nextMonth) nextMonthAmount = meta.nextMonth.amount;
            if (meta.monthAfter) monthAfterAmount = meta.monthAfter.amount;
            if (meta.nextMonth) reasoningNext = meta.nextMonth.reasoning;
            if (meta.monthAfter) reasoningAfter = meta.monthAfter.reasoning;
            if (meta.detectedPatterns) patterns = meta.detectedPatterns;
          } catch {}
        }
        if (!reasoningNext) reasoningNext = prediction.reasoning || 'Baseado em análise anterior.';
      } else {
        // Generate new prediction with AI using AI-optimized data
        // We use aiCategoryData for the analysis, but fallback to regular data if empty (unlikely)
        const aiTransactions = aiCategoryData[category] || data.transactions;

        const aiResult = await googleAI.generateCategorySpendingProjection(category, aiTransactions);

        nextMonthAmount = aiResult.nextMonth.amount;
        monthAfterAmount = aiResult.monthAfter.amount;
        reasoningNext = aiResult.nextMonth.reasoning;
        reasoningAfter = aiResult.monthAfter.reasoning;
        patterns = aiResult.detectedPatterns;

        // Save to DB
        try {
          await predictionService.savePrediction({
            userId: user.sub,
            category,
            predictedAmount: nextMonthAmount,
            confidence: aiResult.confidence,
            month: currentMonthStr,
            reasoning: reasoningNext,
            metadata: JSON.stringify(aiResult),
          });
        } catch (e) {
          console.error('Failed to save prediction', e);
        }
      }

      // Build history array (using Display Data / Cash Flow)
      const history = Object.entries(data.monthlyTotals)
        .map(([m, amount]) => ({ month: m, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      projections.push({
        category,
        type: data.type,
        currentMonth: currentMonthSpend,
        projectionNextMonth: nextMonthAmount,
        projectionMonthAfter: monthAfterAmount,
        reasoningNextMonth: reasoningNext,
        reasoningMonthAfter: reasoningAfter,
        detectedPatterns: patterns,
        history,
      });
    }

    // Sort by current month spend desc
    projections.sort((a, b) => b.currentMonth - a.currentMonth);

    return {
      projections,
      success: true,
    };
  } catch (error) {
    console.error('Get category projections error:', error);
    return {
      projections: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get category projections',
    };
  }
}
