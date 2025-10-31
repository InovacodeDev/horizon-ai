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
import { useCreditCardTransactions } from "@/hooks/useCreditCardTransactions";
import { useCreditCardsWithCache } from "@/hooks/useCreditCardsWithCache";
import { AVAILABLE_CATEGORY_ICONS } from "@/lib/constants";
import { getCategoryById } from "@/lib/constants/categories";
import type { Transaction, FinancialInsight, InsightType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAppwriteUsers } from "@/lib/appwrite/client";
import { useUser } from "@/lib/contexts/UserContext";
import CashFlowProjection from "@/components/CashFlowProjection";
import { useProjections } from "@/hooks/useProjections";

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
                    <span className="text-xs text-on-surface-variant">Receitas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-error"></div>
                    <span className="text-xs text-on-surface-variant">Despesas</span>
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
                                        <span className="text-surface/80">Receitas:</span>
                                    </span>
                                    <span>
                                        {item.income.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-error"></div>
                                        <span className="text-surface/80">Despesas:</span>
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
    } else if (label.toLowerCase().includes("income") || label.toLowerCase().includes("receitas")) {
        colorClass = "text-secondary";
    } else {
        colorClass = "text-error";
    }

    const formattedValue = `${
        isPositive && (isNet || label.toLowerCase().includes("income")) ? "+" : ""
    }${value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;

    let percentageChange: number | null = null;
    let isImprovement = false;
    
    if (previousValue !== undefined && previousValue !== 0) {
        const change = value - previousValue;
        percentageChange = (change / Math.abs(previousValue)) * 100;
        
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
                            <span> {Math.abs(percentageChange).toFixed(1)}%</span>
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

    if (isToday) return "Hoje";
    if (isYesterday) return "Ontem";

    return new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "short",
    }).format(date);
};

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const isIncome = transaction.amount > 0;
    const amountColor = isIncome ? "text-secondary" : "text-error";
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

    const { user } = useUser();
    const { 
        transactions: apiTransactions, 
        loading: isLoadingTransactions,
        refetch 
    } = useTransactions({ userId: user.$id ?? 'default-user' });
    const { accounts, loading: loadingAccounts } = useAccounts();
    const { creditCards } = useCreditCardsWithCache();
    
    // Get current month date range for credit card transactions
    const currentMonthStart = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }, []);
    
    const currentMonthEnd = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }, []);

    const { 
        transactions: creditCardTransactions, 
        loading: loadingCreditCardTransactions 
    } = useCreditCardTransactions({
        startPurchaseDate: currentMonthStart,
        endPurchaseDate: currentMonthEnd,
        limit: 100,
    });

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    }, [accounts]);
    
    const loadingBalance = loadingAccounts;

    // Get projections for next month
    const { projectedTransactions, loading: loadingProjections } = useProjections();

    const aiInsights = useFinancialInsights(apiTransactions);

    const handleNavigateToTransactions = () => {
        router.push('/transactions');
    };

    useEffect(() => {
        if (user) {
            refetch();
        }
    }, [user, refetch]);

    const transactions: Transaction[] = useMemo(() => {
        return apiTransactions.map((apiTx) => {
            const category = getCategoryById(apiTx.category || '');
            const categoryIcon = category?.icon || AVAILABLE_CATEGORY_ICONS.find(
                (cat) => cat.name.toLowerCase() === apiTx.category?.toLowerCase()
            )?.component || SwapIcon;

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
                category: category?.name || apiTx.category || 'Uncategorized',
                type: 'expense',
                icon: categoryIcon,
                notes: apiTx.description || '',
                account_id: apiTx.account_id,
                credit_card_id: apiTx.credit_card_id,
            };
        });
    }, [apiTransactions, accounts]);

    const monthlyMetrics = useMemo(() => {
        const currentMonthKey = getCurrentMonthKey();
        const previousMonthKey = getPreviousMonthKey();

        const userAccountIds = new Set(accounts.map(acc => acc.$id));

        const userTransactions = apiTransactions.filter(tx => 
            tx.account_id && userAccountIds.has(tx.account_id)
        );

        const transactionsByMonth = userTransactions.reduce((acc, tx) => {
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

        // Calculate credit card bills by month
        const creditCardBillsByMonth = useMemo(() => {
            const billsMap = new Map<string, number>();
            
            creditCards.forEach(card => {
                const closingDay = card.closing_day || 10;
                
                creditCardTransactions
                    .filter(tx => tx.credit_card_id === card.$id)
                    .forEach(tx => {
                        const txDate = new Date(tx.date);
                        const txDay = txDate.getDate();
                        let billMonth = txDate.getMonth();
                        let billYear = txDate.getFullYear();
                        
                        // If transaction is on or after closing day, it belongs to next month's bill
                        if (txDay >= closingDay) {
                            billMonth += 1;
                            if (billMonth > 11) {
                                billMonth = 0;
                                billYear += 1;
                            }
                        }
                        
                        const billKey = `${billYear}-${String(billMonth + 1).padStart(2, '0')}`;
                        billsMap.set(billKey, (billsMap.get(billKey) || 0) + tx.amount);
                    });
            });
            
            return billsMap;
        }, [creditCardTransactions, creditCards]);
        
        const currentMonth = transactionsByMonth[currentMonthKey] || { income: 0, expenses: 0 };
        const currentIncome = currentMonth.income;
        const currentExpenses = -currentMonth.expenses;
        const currentCreditCardBill = -(creditCardBillsByMonth.get(currentMonthKey) || 0);
        const currentNet = currentIncome + currentExpenses + currentCreditCardBill;
        
        const previousMonth = transactionsByMonth[previousMonthKey] || { income: 0, expenses: 0 };
        const previousIncome = previousMonth.income;
        const previousExpenses = -previousMonth.expenses;
        const previousCreditCardBill = -(creditCardBillsByMonth.get(previousMonthKey) || 0);
        const previousNet = previousIncome + previousExpenses + previousCreditCardBill;

        return {
            currentIncome,
            currentExpenses,
            currentCreditCardBill,
            currentNet,
            previousIncome,
            previousExpenses,
            previousCreditCardBill,
            previousNet,
            transactionsByMonth,
            creditCardBillsByMonth,
        };
    }, [apiTransactions, creditCardTransactions, accounts, creditCards]);

    const chartData = useMemo(() => {
        const lastSixMonths = getLastSixMonths();
        return lastSixMonths.map((monthKey) => {
            const monthData = monthlyMetrics.transactionsByMonth[monthKey] || { income: 0, expenses: 0 };
            const creditCardBill = monthlyMetrics.creditCardBillsByMonth.get(monthKey) || 0;
            return {
                month: getMonthName(monthKey),
                income: monthData.income,
                expenses: monthData.expenses + creditCardBill,
            };
        });
    }, [monthlyMetrics]);

    const hasTransactions = apiTransactions.length > 0;

    if (isLoadingTransactions || loadingBalance) {
        return <DashboardOverviewSkeleton />;
    }

    const formattedBalance = totalBalance.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    return (
        <>
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-light text-on-surface">Olá, {user.name}!</h1>
                    <p className="text-base text-on-surface-variant mt-1">Bem-vindo ao seu painel financeiro.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Saldo Total</p>
                    <h2 className="text-3xl font-normal text-primary">{formattedBalance}</h2>
                </div>
            </header>

            <main className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                        label="Receitas do mês"
                        value={monthlyMetrics.currentIncome}
                        previousValue={monthlyMetrics.previousIncome}
                        icon={<ArrowUpCircleIcon className="text-secondary" />}
                    />
                    <StatCard
                        label="Despesas do mês"
                        value={monthlyMetrics.currentExpenses}
                        previousValue={monthlyMetrics.previousExpenses}
                        icon={<ArrowDownCircleIcon className="text-error" />}
                    />
                    <StatCard
                        label="Fatura do mês"
                        value={monthlyMetrics.currentCreditCardBill}
                        previousValue={monthlyMetrics.previousCreditCardBill}
                        icon={<TrendingUpIcon className={monthlyMetrics.currentCreditCardBill > 0 ? "text-secondary" : "text-error"} />}
                        isNet
                    />
                    <StatCard
                        label="Saldo do mês"
                        value={monthlyMetrics.currentNet}
                        previousValue={monthlyMetrics.previousNet}
                        icon={<TrendingUpIcon className={monthlyMetrics.currentNet > 0 ? "text-secondary" : "text-error"} />}
                        isNet
                    />
                </div>

                {hasTransactions && chartData.some(d => d.income > 0 || d.expenses > 0) && (
                    <Card className="p-6">
                        <h3 className="text-xl font-medium text-on-surface mb-6">Fluxo de Caixa - Últimos 6 Meses</h3>
                        <BarChart data={chartData} />
                    </Card>
                )}

                {aiInsights.length > 0 && (
                    <div>
                        <h3 className="text-xl font-medium text-on-surface mb-4">Insights de IA</h3>
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
                        <h3 className="text-xl font-medium text-on-surface">Transações Recentes</h3>
                        <Button onClick={handleNavigateToTransactions} variant="text">
                            Ver Todas
                        </Button>
                    </div>
                    <ul className="divide-y divide-outline">
                        {transactions.length > 0 ? (
                            transactions.slice(0, 5).map((tx) => (
                                <TransactionItem key={tx.$id} transaction={tx} />
                            ))
                        ) : (
                            <li className="py-8 text-center text-on-surface-variant">
                                Nenhuma transação ainda. Adicione sua primeira transação para começar!
                            </li>
                        )}
                    </ul>
                </Card>

                {/* Cash Flow Projection Section */}
                {!loadingProjections && projectedTransactions.length > 0 && (
                    <CashFlowProjection
                        currentBalance={totalBalance}
                        projectedTransactions={projectedTransactions}
                    />
                )}

                {/* Credit Card Transactions Section */}
                {creditCards.length > 0 && (
                    <>
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-medium text-on-surface">Compras no Cartão - Este Mês</h3>
                                <Button onClick={() => router.push('/credit-card-bills')} variant="text">
                                    Ver Faturas
                                </Button>
                            </div>
                            {loadingCreditCardTransactions ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-16" />
                                    <Skeleton className="h-16" />
                                    <Skeleton className="h-16" />
                                </div>
                            ) : (
                                <>
                                    {creditCardTransactions.length > 0 && (
                                        <div className="mb-4 p-4 bg-primary/10 rounded-lg">
                                            <p className="text-sm text-on-surface-variant mb-1">Total em Cartões</p>
                                            <p className="text-3xl font-bold text-primary">
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL',
                                                }).format(creditCardTransactions.reduce((sum, tx) => sum + tx.amount, 0))}
                                            </p>
                                            <p className="text-xs text-on-surface-variant mt-1">
                                                {creditCardTransactions.length} transação(ões) este mês
                                            </p>
                                        </div>
                                    )}
                                    <ul className="divide-y divide-outline">
                                        {creditCardTransactions.length > 0 ? (
                                            creditCardTransactions.slice(0, 5).map((tx) => {
                                                const card = creditCards.find(c => c.$id === tx.credit_card_id);
                                                return (
                                                    <li key={tx.$id} className="py-3 flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-on-surface">
                                                                {tx.description || tx.merchant || 'Compra no cartão'}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-on-surface-variant">
                                                                    {card?.name || 'Cartão'}
                                                                </span>
                                                                <span className="text-xs text-on-surface-variant">•</span>
                                                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                                                    {tx.category}
                                                                </span>
                                                                {tx.installments && tx.installments > 1 && (
                                                                    <>
                                                                        <span className="text-xs text-on-surface-variant">•</span>
                                                                        <span className="text-xs text-secondary">
                                                                            {tx.installment}/{tx.installments}x
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {tx.is_recurring && (
                                                                    <>
                                                                        <span className="text-xs text-on-surface-variant">•</span>
                                                                        <span className="text-xs text-tertiary">
                                                                            Recorrente
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="font-semibold text-error">
                                                            {new Intl.NumberFormat('pt-BR', {
                                                                style: 'currency',
                                                                currency: 'BRL',
                                                            }).format(tx.amount)}
                                                        </p>
                                                    </li>
                                                );
                                            })
                                        ) : (
                                            <li className="py-8 text-center text-on-surface-variant">
                                                Nenhuma compra no cartão este mês
                                            </li>
                                        )}
                                    </ul>
                                </>
                            )}
                        </Card>
                    </>
                )}
            </main>
        </>
    );
}
