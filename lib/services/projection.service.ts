import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, FinancialProjection, RecurringRule, Transaction } from '@/lib/appwrite/schema';
import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarMonths,
  differenceInHours,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  startOfMonth,
} from 'date-fns';
import { ID, Query } from 'node-appwrite';

import AppwriteDBAdapter from '../appwrite/adapter';

export interface ProjectionResult {
  totalIncome: number;
  committedExpenses: number;
  variableExpenses: number;
  safeToSpend: number;
  transactions: (Transaction | VirtualTransaction)[];
}

export interface VirtualTransaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  isVirtual: true;
  recurringRuleId: string;
}

export class ProjectionService {
  private dbAdapter: AppwriteDBAdapter;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  async getMonthlyProjection(userId: string, targetDate: Date): Promise<ProjectionResult> {
    const monthKey = format(targetDate, 'yyyy-MM');
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);

    // 1. Fetch live Actual Transactions (Always fresh for the view)
    const actualTransactions = await this.fetchActualTransactions(userId, start, end);

    // 2. Handle Projection Cache (Virtuals + Snapshot)
    let virtualTransactions: VirtualTransaction[] = [];
    let storedProjection: FinancialProjection | null = null;
    let shouldUpdateDB = false;

    try {
      storedProjection = await this.getStoredProjection(userId, monthKey);

      if (storedProjection) {
        const lastUpdate = new Date(storedProjection.updated_at);
        const hoursDiff = differenceInHours(new Date(), lastUpdate);

        if (hoursDiff < 24) {
          // Cache is valid (< 24h)
          // Use stored virtuals
          if (storedProjection.virtual_transactions) {
            virtualTransactions = JSON.parse(storedProjection.virtual_transactions);
          }
        } else {
          // Cache is old (> 24h)
          shouldUpdateDB = true;
        }
      } else {
        // No cache exists
        shouldUpdateDB = true;
      }

      if (shouldUpdateDB) {
        // Regenerate Virtual Transactions from Rules
        const recurringRules = await this.fetchRecurringRules(userId);
        virtualTransactions = await this.generateVirtualTransactions(recurringRules, actualTransactions, start, end);
      }
    } catch (error) {
      console.error('Error handling projection cache:', error);
      // Fallback: generate mostly fresh if cache fails
      const recurringRules = await this.fetchRecurringRules(userId);
      virtualTransactions = await this.generateVirtualTransactions(recurringRules, actualTransactions, start, end);
    }

    // 3. Calculate Totals (Live Actuals + Selected Virtuals)
    const allTransactions: (Transaction | VirtualTransaction)[] = [...actualTransactions, ...virtualTransactions];

    let totalIncome = 0;
    let committedExpenses = 0;
    let variableExpenses = 0;

    for (const tx of allTransactions) {
      const amount = Math.abs(tx.amount);
      const type = tx.type;

      if (type === 'income' || type === 'salary') {
        totalIncome += amount;
      } else if (type === 'expense' || type === 'transfer') {
        const isVirtual = 'isVirtual' in tx && tx.isVirtual;
        const isRecurring =
          isVirtual || ('is_recurring' in tx && tx.is_recurring) || ('installment' in tx && !!tx.installment);

        if (isRecurring) {
          committedExpenses += amount;
        } else {
          variableExpenses += amount;
        }
      }
    }

    const safeToSpend = totalIncome - committedExpenses;

    // 4. Update DB if needed (Background-ish or inline)
    if (shouldUpdateDB) {
      // We assume this doesn't block the UI significantly, or we could fire-and-forget
      // For safety, we await it to ensure consistency
      await this.saveProjectionSnapshot(
        userId,
        monthKey,
        totalIncome,
        committedExpenses,
        variableExpenses,
        safeToSpend,
        virtualTransactions,
        storedProjection?.$id,
      );
    }

    return {
      totalIncome,
      committedExpenses,
      variableExpenses,
      safeToSpend,
      transactions: allTransactions,
    };
  }

  private async getStoredProjection(userId: string, monthKey: string): Promise<FinancialProjection | null> {
    try {
      const result = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.FINANCIAL_PROJECTIONS, [
        Query.equal('user_id', userId),
        Query.equal('month', monthKey),
        Query.limit(1),
      ]);

      if (result.documents.length > 0) {
        return result.documents[0] as unknown as FinancialProjection;
      }
    } catch (error) {
      // Collection might not exist yet during migration
      console.warn('Failed to fetch stored projection:', error);
    }
    return null;
  }

  private async saveProjectionSnapshot(
    userId: string,
    month: string,
    totalIncome: number,
    committedExpenses: number,
    variableExpenses: number,
    safeToSpend: number,
    virtualTransactions: VirtualTransaction[],
    existingId?: string,
  ): Promise<void> {
    const data = {
      user_id: userId,
      month,
      total_income: totalIncome,
      committed_expenses: committedExpenses,
      variable_expenses: variableExpenses,
      safe_to_spend: safeToSpend,
      virtual_transactions: JSON.stringify(virtualTransactions),
      updated_at: new Date().toISOString(),
    };

    try {
      if (existingId) {
        await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.FINANCIAL_PROJECTIONS, existingId, data);
      } else {
        await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.FINANCIAL_PROJECTIONS, ID.unique(), {
          ...data,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to save projection snapshot:', error);
      // Don't throw, just log. UI got the data anyway.
    }
  }

  private async fetchActualTransactions(userId: string, start: Date, end: Date): Promise<Transaction[]> {
    const queries = [
      Query.equal('user_id', userId),
      Query.greaterThanEqual('date', start.toISOString()),
      Query.lessThanEqual('date', end.toISOString()),
      Query.limit(1000),
    ];

    const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.TRANSACTIONS, queries);

    return response.documents.map((doc: any) => ({
      ...doc,
    })) as Transaction[];
  }

  private async fetchRecurringRules(userId: string): Promise<RecurringRule[]> {
    const queries = [Query.equal('user_id', userId), Query.limit(100)];

    const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.RECURRING_RULES, queries);

    return response.documents as unknown as RecurringRule[];
  }

  private async generateVirtualTransactions(
    rules: RecurringRule[],
    actuals: Transaction[],
    monthStart: Date,
    monthEnd: Date,
  ): Promise<VirtualTransaction[]> {
    const virtuals: VirtualTransaction[] = [];

    for (const rule of rules) {
      // Check if rule is active in this month
      const ruleStart = new Date(rule.start_date);
      const ruleEnd = rule.end_date ? new Date(rule.end_date) : null;

      if (isAfter(ruleStart, monthEnd)) continue;
      if (ruleEnd && isBefore(ruleEnd, monthStart)) continue;

      // Check if a transaction for this rule already exists in actuals
      const exists = actuals.some((tx) => tx.recurring_rule_id === rule.$id);
      if (exists) continue;

      // Check frequency match
      let shouldGenerate = false;
      let currentDate = ruleStart;

      if (rule.frequency === 'MONTHLY') {
        const monthsDiff = differenceInCalendarMonths(monthStart, ruleStart);
        if (monthsDiff >= 0 && monthsDiff % rule.interval === 0) {
          const expectedDate = addMonths(ruleStart, monthsDiff);
          if (isSameMonth(expectedDate, monthStart)) {
            shouldGenerate = true;
            currentDate = expectedDate;
          }
        }
      } else if (rule.frequency === 'WEEKLY') {
        let tempDate = ruleStart;
        while (isBefore(tempDate, monthEnd)) {
          if (!isBefore(tempDate, monthStart)) {
            virtuals.push(this.createVirtual(rule, tempDate));
          }
          tempDate = addWeeks(tempDate, rule.interval);
        }
        continue;
      } else if (rule.frequency === 'YEARLY') {
        let tempDate = ruleStart;
        while (isBefore(tempDate, monthEnd)) {
          if (isSameMonth(tempDate, monthStart)) {
            shouldGenerate = true;
            currentDate = tempDate;
            break;
          }
          tempDate = addYears(tempDate, rule.interval);
        }
      }

      if (shouldGenerate) {
        virtuals.push(this.createVirtual(rule, currentDate));
      }
    }

    return virtuals;
  }

  private createVirtual(rule: RecurringRule, date: Date): VirtualTransaction {
    return {
      id: `virtual-${rule.$id}-${date.toISOString()}`,
      amount: rule.amount,
      date: date.toISOString(),
      description: `(Virtual) ${rule.category}`,
      category: rule.category,
      type: rule.type,
      isVirtual: true,
      recurringRuleId: rule.$id,
    };
  }
}
