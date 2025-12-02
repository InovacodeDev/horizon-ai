import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, RecurringRule, Transaction } from '@/lib/appwrite/schema';
import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarMonths,
  endOfMonth,
  isAfter,
  isBefore,
  isSameMonth,
  startOfMonth,
} from 'date-fns';
import { Query } from 'node-appwrite';

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
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);

    // 1. Fetch Actual Transactions
    const actualTransactions = await this.fetchActualTransactions(userId, start, end);

    // 2. Fetch Recurring Rules
    const recurringRules = await this.fetchRecurringRules(userId);

    // 3. Generate Virtual Transactions
    const virtualTransactions = await this.generateVirtualTransactions(recurringRules, actualTransactions, start, end);

    // 4. Calculate Metrics
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
        // Expense
        // Check if committed (recurring or installment)
        // Virtual transactions are always recurring (generated from rules)
        // Actual transactions: check is_recurring or installment
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

    // Safe-to-Spend: Total Income - Committed Expenses
    const safeToSpend = totalIncome - committedExpenses;

    return {
      totalIncome,
      committedExpenses,
      variableExpenses,
      safeToSpend,
      transactions: allTransactions,
    };
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
