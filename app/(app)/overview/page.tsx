'use client';

import React, { useMemo } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
    ArrowDownCircleIcon,
    ArrowUpCircleIcon,
    LightbulbIcon,
    LineChartIcon,
    TrendingDownIcon,
    TrendingUpIcon,
    SwapIcon,
} from "@/components/assets/Icons";
import Skeleton from "@/components/ui/Skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useFinancialInsights } from "@/hooks/useFinancialInsights";
import { useTotalBalance } from "@/hooks/useTotalBalance";
import { useAccounts } from "@/hooks/useAccounts";
import { AVAILABLE_CATEGORY_ICONS } from "@/lib/constants";
import type { Transaction, FinancialInsight, InsightType } from "@/lib/types";
import { useRouter } from "next/navigation";

// --- Helper Functions for Date Filtering ---
const getMonthKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentMonthKey = (): string => {
    return getMonthKey(new Date());
};

const getPreviousMonthKey = (): string => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return getMonthKey(prevMonth);
};

const getLastSixMonths = (): string[] => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(getMonthKey(date));
    }
    return months;
};

const getMonthName = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
};

// --- BarChart Component Definition ---
interface ChartData {
    month: string;
    income: number;
    expenses: number;
}

const formatCurrencyForChart = (value: number) => {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
};

const BarChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
    const maxValue = React.useMemo(() => {
        const allValues = data.flatMap((d) => [d.income, d.expenses]);
        const max = Math.max(...allValues);
        return Math.ceil(max / 5000) * 5000;
    }, [data]);

    const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
        const value = (maxValue / 4) * i;
        return { value, label: formatCurrencyForChart(value) };
    }).reverse();

    return (
        <div className="w-full">
            <div className="flex justify-end gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-secondary"></div>
                    <span className="text-xs text-on-surface-variant">Income</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-error"></div>
                    <span className="text-xs text-on-surface-variant">Expenses</span>
                </div>
            </div>
            <div className="flex gap-4" style={{ height: "250px" }}>
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between text-right text-xs text-on-surface-variant h-full py-1">
                    {yAxisLabels.map(({ label }) => (
                        <span key={label}>{label}</span>
                    ))}
                </div>

                {/* Chart Bars Area */}
                <div className="flex-grow grid grid-cols-6 gap-3 border-l border-b border-outline/50 relative">
                    {/* Grid lines */}
                    {yAxisLabels.slice(0, -1).map(({ value }) => (
                        <div
                            key={value}
                            className="col-span-6 border-t border-dashed border-outline/50 absolute w-full"
                            style={{ bottom: `${(value / maxValue) * 100}%` }}
                        ></div>
                    ))}

                    {data.map((item) => (
                        <div
                            key={item.month}
                            className="flex flex-col items-center justify-end h-full relative group pt-1"
                        >
                            <div className="flex gap-1 items-end h-full w-full justify-center">
                                <div
                                    className="w-1/2 bg-secondary rounded-t-xs hover:opacity-80 transition-all duration-300 ease-in-out"
                                    style={{ height: `${(item.income / maxValue) * 100}%` }}
                                ></div>
                                <div
                                    className="w-1/2 bg-error rounded-t-xs hover:opacity-80 transition-all duration-300 ease-in-out"
                                    style={{ height: `${(item.expenses / maxValue) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-on-surface-variant mt-1 absolute -bottom-5">
                                {item.month}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 w-40 p-2 bg-on-surface text-surface rounded-m text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <p className="font-bold mb-1 text-center">{item.month} 2024</p>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                        <span className="text-surface/80">Income:</span>
                                    </span>
                                    <span>
                                        {item.income.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-error"></div>
                                        <span className="text-surface/80">Expenses:</span>
                                    </span>
                                    <span>
                                        {item.expenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </span>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-on-surface -mb-1"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
// --- End of BarChart Component ---

const FinancialInsightCard: React.FC<{ insight: FinancialInsight; onNavigateToTransactions: () => void }> = ({ 
    insight, 
    onNavigateToTransactions 
}) => {
    const insightMeta: Record<InsightType, { icon: React.ReactNode; color: string }> = {
        SAVINGS_OPPORTUNITY: {
            icon: <LightbulbIcon className="w-6 h-6 text-tertiary" />,
            color: "border-tertiary",
        },
        UNUSUAL_SPENDING: {
            icon: <TrendingDownIcon className="w-6 h-6 text-error" />,
            color: "border-error",
        },
        CASH_FLOW_FORECAST: {
            icon: <LineChartIcon className="w-6 h-6 text-secondary" />,
            color: "border-secondary",
        },
    };

    const { icon, color } = insightMeta[insight.type];

    return (
        <Card className={`p-4 border-l-4 ${color}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{icon}</div>
                <div className="flex-grow">
                    <h4 className="font-medium text-on-surface">{insight.title}</h4>
                    <p className="text-sm text-on-surface-variant mt-1 mb-3">{insight.description}</p>
                    <Button 
                        variant="text" 
                        className="!h-auto !p-0 text-sm"
                        onClick={onNavigateToTransactions}
                    >
                        {insight.actionText}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

const DashboardOverviewSkeleton: React.FC = () => (
    <>
        <header className="mb-8">
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-6 w-1/2" />
        </header>
        <main className="space-y-8">
            <Card className="p-8 text-center">
                <Skeleton className="h-6 w-1/4 mb-2 mx-auto" />
                <Skeleton className="h-12 w-1/2 mx-auto" />
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4 flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full mr-4" />
                        <div className="flex-grow space-y-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-6 w-1/2" />
                        </div>
                    </Card>
                ))}
            </div>
            <Card className="p-6">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-[250px] w-full" />
            </Card>
            <Card className="p-6">
                <Skeleton className="h-8 w-1/4 mb-4" />
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </Card>
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <div className="divide-y divide-outline">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center py-3">
                            <Skeleton className="h-12 w-12 rounded-full mr-4" />
                            <div className="flex-grow space-y-2">
                                <Skeleton className="h-5 w-1/2" />
                                <Skeleton className="h-4 w-1/3" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                        </div>
                    ))}
                </div>
            </Card>
        </main>
    </>
);

const StatCard: React.FC<{ 
    label: string; 
    value: number; 
    icon: React.ReactNode; 
    isNet?: boolean;
    previousValue?: number;
}> = ({
    label,
    value,
    icon,
    isNet,
    previousValue,
}) => {
    const isPositive = value >= 0;
    let colorClass = "text-on-surface";
    if (isNet) {
        colorClass = isPositive ? "text-secondary" : "text-error";
    } else if (label.toLowerCase().includes("income")) {
        colorClass = "text-secondary";
    } else {
        colorClass = "text-error";
    }

    const formattedValue = `${
        isPositive && (isNet || label.toLowerCase().includes("income")) ? "+" : ""
    }${value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;

    // Calculate percentage change
    let percentageChange: number | null = null;
    let isImprovement = false;
    
    if (previousValue !== undefined && previousValue !== 0) {
        const change = value - previousValue;
        percentageChange = (change / Math.abs(previousValue)) * 100;
        
        // For income and net: increase is improvement
        // For expenses: decrease is improvement
        if (label.toLowerCase().includes("expense")) {
            isImprovement = change < 0;
        } else {
            isImprovement = change > 0;
        }
    }

    return (
        <Card className="p-4 flex items-center">
            <div className={`mr-4 p-2 rounded-full bg-primary-container`}>{icon}</div>
            <div className="flex-grow">
                <p className="text-sm text-on-surface-variant">{label}</p>
                <div className="flex items-center gap-2">
                    <p className={`text-xl font-medium ${colorClass}`}>{formattedValue}</p>
                    {percentageChange !== null && (
                        <div className={`flex items-center text-xs font-medium ${
                            isImprovement ? 'text-secondary' : 'text-error'
                        }`}>
                            {isImprovement ? (
                                <TrendingUpIcon className="w-4 h-4" />
                            ) : (
                                <TrendingDownIcon className="w-4 h-4" />
                            )}
                            <span>{Math.abs(percentageChange).toFixed(1)}%</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
    }).format(date);
};

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const isIncome = transaction.amount > 0;
    const amountColor = isIncome ? "text-secondary" : "text-on-surface";
    const formattedAmount = `${isIncome ? "+" : ""}${transaction.amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    })}`;
    const IconComponent = transaction.icon;

    return (
        <li className="flex items-center py-3">
            <div className="p-3 bg-primary-container rounded-full mr-4">
                {IconComponent ? <IconComponent className="w-5 h-5 text-on-primary-container" /> : null}
            </div>
            <div className="flex-grow">
                <p className="text-base font-medium text-on-surface">{transaction.description}</p>
                <p className="text-sm text-on-surface-variant">
                    {formatDate(transaction.date)} • {transaction.bankName}
                </p>
            </div>
            <p className={`text-base font-medium ${amountColor}`}>{formattedAmount}</p>
        </li>
    );
};

export default function OverviewPage() {
    const router = useRouter();
    
    // Get user ID from session (you'll need to implement this based on your auth setup)
    const userId = "default-user"; // TODO: Get from session
    
    const { transactions: apiTransactions, loading: isLoadingTransactions } = useTransactions({ userId });
    const { totalBalance, loading: loadingBalance } = useTotalBalance();
    const { accounts } = useAccounts();

    // Generate AI insights based on real transaction data
    const aiInsights = useFinancialInsights(apiTransactions);

    const handleNavigateToTransactions = () => {
        router.push('/transactions');
    };

    // Convert API transactions to UI format
    const transactions: Transaction[] = useMemo(() => {
        return apiTransactions.map((apiTx) => {
            const categoryIcon = AVAILABLE_CATEGORY_ICONS.find(
                (cat) => cat.name.toLowerCase() === apiTx.category?.toLowerCase()
            )?.component || SwapIcon;

            // Find account name from accountId
            const account = accounts.find((acc) => acc.$id === apiTx.account_id);
            const accountName = account?.name || (apiTx.account_id ? apiTx.account_id : 'Manual Entry');

            return {
                ...apiTx,
                $id: apiTx.$id,
                $updatedAt: new Date().toISOString(),
                description: apiTx.description || apiTx.merchant || 'Transaction',
                amount: apiTx.type === 'income' ? Math.abs(apiTx.amount) : -Math.abs(apiTx.amount),
                date: apiTx.date,
                bankName: accountName,
                category: apiTx.category || 'Uncategorized',
                type: 'expense',
                icon: categoryIcon,
                notes: apiTx.description || '',
                account_id: apiTx.account_id,
                credit_card_id: apiTx.credit_card_id,
            };
        });
    }, [apiTransactions, accounts]);

    // Calculate monthly metrics from real transactions
    const monthlyMetrics = useMemo(() => {
        const currentMonthKey = getCurrentMonthKey();
        const previousMonthKey = getPreviousMonthKey();
        
        // Group transactions by month
        const transactionsByMonth = apiTransactions.reduce((acc, tx) => {
            const txDate = new Date(tx.date);
            const monthKey = getMonthKey(txDate);
            
            if (!acc[monthKey]) {
                acc[monthKey] = { income: 0, expenses: 0 };
            }
            
            if (tx.type === 'income') {
                acc[monthKey].income += Math.abs(tx.amount);
            } else {
                acc[monthKey].expenses += Math.abs(tx.amount);
            }
            
            return acc;
        }, {} as Record<string, { income: number; expenses: number }>);
        
        // Current month metrics
        const currentMonth = transactionsByMonth[currentMonthKey] || { income: 0, expenses: 0 };
        const currentIncome = currentMonth.income;
        const currentExpenses = -currentMonth.expenses; // Negative for display
        const currentNet = currentIncome + currentExpenses;
        
        // Previous month metrics
        const previousMonth = transactionsByMonth[previousMonthKey] || { income: 0, expenses: 0 };
        const previousIncome = previousMonth.income;
        const previousExpenses = -previousMonth.expenses;
        const previousNet = previousIncome + previousExpenses;
        
        return {
            currentIncome,
            currentExpenses,
            currentNet,
            previousIncome,
            previousExpenses,
            previousNet,
            transactionsByMonth,
        };
    }, [apiTransactions]);

    // Generate chart data for last 6 months
    const chartData = useMemo(() => {
        const lastSixMonths = getLastSixMonths();
        return lastSixMonths.map((monthKey) => {
            const monthData = monthlyMetrics.transactionsByMonth[monthKey] || { income: 0, expenses: 0 };
            return {
                month: getMonthName(monthKey),
                income: monthData.income,
                expenses: monthData.expenses,
            };
        });
    }, [monthlyMetrics]);

    // Check if we have any transactions
    const hasTransactions = apiTransactions.length > 0;

    if (isLoadingTransactions || loadingBalance) {
        return <DashboardOverviewSkeleton />;
    }

    const formattedBalance = totalBalance.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    // TODO: Get user name from session
    const userName = "User";

    return (
        <>
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-light text-on-surface">Hi, {userName}!</h1>
                    <p className="text-base text-on-surface-variant mt-1">Welcome back to your financial dashboard.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Total Balance</p>
                    <h2 className="text-3xl font-normal text-primary">{formattedBalance}</h2>
                </div>
            </header>

            <main className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        label="Income this month"
                        value={monthlyMetrics.currentIncome}
                        previousValue={monthlyMetrics.previousIncome}
                        icon={<ArrowUpCircleIcon className="text-secondary" />}
                    />
                    <StatCard
                        label="Expenses this month"
                        value={monthlyMetrics.currentExpenses}
                        previousValue={monthlyMetrics.previousExpenses}
                        icon={<ArrowDownCircleIcon className="text-error" />}
                    />
                    <StatCard
                        label="Net this month"
                        value={monthlyMetrics.currentNet}
                        previousValue={monthlyMetrics.previousNet}
                        icon={<TrendingUpIcon className={monthlyMetrics.currentNet > 0 ? "text-secondary" : "text-error"} />}
                        isNet
                    />
                </div>

                {hasTransactions && chartData.some(d => d.income > 0 || d.expenses > 0) && (
                    <Card className="p-6">
                        <h3 className="text-xl font-medium text-on-surface mb-6">Cash Flow - Last 6 Months</h3>
                        <BarChart data={chartData} />
                    </Card>
                )}

                {aiInsights.length > 0 && (
                    <div>
                        <h3 className="text-xl font-medium text-on-surface mb-4">AI Insights</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {aiInsights.map((insight) => (
                                <FinancialInsightCard 
                                    key={insight.$id} 
                                    insight={insight} 
                                    onNavigateToTransactions={handleNavigateToTransactions}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-medium text-on-surface">Recent Transactions</h3>
                        <Button onClick={handleNavigateToTransactions} variant="text">
                            View All
                        </Button>
                    </div>
                    <ul className="divide-y divide-outline">
                        {transactions.length > 0 ? (
                            transactions.slice(0, 5).map((tx) => (
                                <TransactionItem key={tx.$id} transaction={tx} />
                            ))
                        ) : (
                            <li className="py-8 text-center text-on-surface-variant">
                                No transactions yet. Add your first transaction to get started!
                            </li>
                        )}
                    </ul>
                </Card>
            </main>
        </>
    );
}
