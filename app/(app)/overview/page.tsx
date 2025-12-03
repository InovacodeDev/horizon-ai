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
import { useAccounts } from "@/hooks/useAccounts";
import { useCreditCardTransactions } from "@/hooks/useCreditCardTransactions";
import { useAllCreditCards } from "@/hooks/useAllCreditCards";
import { useCreditCardBills } from "@/hooks/useCreditCardBills";
import { useAccountsWithSharing } from "@/hooks/useAccountsWithSharing";
import { useTransactionsWithSharing } from "@/hooks/useTransactionsWithSharing";
import { AVAILABLE_CATEGORY_ICONS } from "@/lib/constants";
import { getCategoryById } from "@/lib/constants/categories";
import type { Transaction, FinancialInsight, InsightType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { getCategoryProjectionsAction } from "@/actions/projection.actions";
import { ProcessDueTransactions } from "@/components/ProcessDueTransactions";
import { BillingLimitBanner } from "@/components/BillingLimitBanner";

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

const getMonthsForPeriod = (period: '3m' | '6m' | '12m' | 'all', allMonthKeys: string[]): string[] => {
    if (period === 'all') {
        return allMonthKeys;
    }
    
    const monthsCount = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const now = new Date();
    const months: string[] = [];
    
    // Get previous months + current month
    for (let i = monthsCount - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(getMonthKey(date));
    }
    
    return months;
};

const getLastSixMonths = (): string[] => {
    const months: string[] = [];
    const now = new Date();
    // 4 meses anteriores + mês atual + próximo mês = 6 meses
    for (let i = 4; i >= -1; i--) {
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
        if (allValues.length === 0) return 5000;
        const max = Math.max(...allValues);
        return max > 0 ? Math.ceil(max / 5000) * 5000 : 5000;
    }, [data]);

    const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
        const value = (maxValue / 4) * i;
        return { value, label: formatCurrencyForChart(value) };
    }).reverse();

    // Calculate appropriate grid columns based on data length
    const gridCols = data.length <= 6 ? 'grid-cols-6' : 
                     data.length <= 12 ? 'grid-cols-12' : 
                     `grid-cols-${data.length}`;

    return (
        <div className="w-full">
            <div className="flex justify-end gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-secondary"></div>
                    <span className="text-sm text-on-surface-variant">Receitas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-error"></div>
                    <span className="text-sm text-on-surface-variant">Despesas</span>
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
                <div className={`flex-grow flex gap-2 border-l border-b border-outline/50 relative overflow-x-auto`}>
                    {/* Grid lines */}
                    {yAxisLabels.slice(0, -1).map(({ value }) => (
                        <div
                            key={value}
                            className="absolute w-full border-t border-dashed border-outline/50"
                            style={{ bottom: `${(value / maxValue) * 100}%` }}
                        ></div>
                    ))}

                    {data.map((item) => (
                        <div
                            key={item.month}
                            className="flex flex-col items-center justify-end h-full relative group pt-1 min-w-[40px] flex-1"
                            style={{ maxWidth: data.length > 12 ? '60px' : undefined }}
                        >
                            <div className="flex gap-1 items-end h-full w-full justify-center">
                                <div
                                    className="w-1/2 bg-secondary rounded-t hover:opacity-90 transition-all duration-200 ease-in-out"
                                    style={{ height: `${(item.income / maxValue) * 100}%` }}
                                ></div>
                                <div
                                    className="w-1/2 bg-error rounded-t hover:opacity-90 transition-all duration-200 ease-in-out"
                                    style={{ height: `${(item.expenses / maxValue) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-on-surface-variant mt-1 absolute -bottom-5">
                                {item.month}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 w-40 p-3 bg-on-surface text-surface rounded-lg text-xs shadow-soft-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <p className="font-semibold mb-2 text-center">{item.month}</p>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                        <span className="text-surface/90">Receitas:</span>
                                    </span>
                                    <span className="font-medium">
                                        {item.income.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-error"></div>
                                        <span className="text-surface/90">Despesas:</span>
                                    </span>
                                    <span className="font-medium">
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
                        variant="ghost" 
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
    let isIncrease = false;
    
    if (previousValue !== undefined && previousValue !== 0) {
        const change = value - previousValue;
        percentageChange = (change / Math.abs(previousValue)) * 100;
        isIncrease = change > 0;
        
        // Para despesas e fatura, diminuir é bom
        // Para receitas e saldo, aumentar é bom
        if (label.toLowerCase().includes("expense") || label.toLowerCase().includes("despesas") || label.toLowerCase().includes("fatura")) {
            isImprovement = change < 0;
        } else {
            isImprovement = change > 0;
        }
    }

    return (
        <Card className="p-4 flex items-center gap-3">
            <div className="flex-shrink-0 p-2 rounded-full bg-primary-container">{icon}</div>
            <div className="flex-grow min-w-0">
                <p className="text-sm text-on-surface-variant mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <p className={`text-xl font-medium ${colorClass} truncate`}>{formattedValue}</p>
                    {percentageChange !== null && (
                        <div className="relative group flex-shrink-0">
                            <div className={`flex items-center cursor-help ${
                                isImprovement ? 'text-secondary' : 'text-error'
                            }`}>
                                {isIncrease ? (
                                    <TrendingUpIcon className="w-5 h-5" />
                                ) : (
                                    <TrendingDownIcon className="w-5 h-5" />
                                )}
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-on-surface text-surface rounded-lg text-xs font-medium shadow-soft-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}% vs mês anterior
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-on-surface -mt-px"></div>
                            </div>
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
    
    // State for toggling between own data and combined data
    const [showSharedData, setShowSharedData] = React.useState(true);
    
    // State for chart period selector
    const [chartPeriod, setChartPeriod] = React.useState<'3m' | '6m' | '12m' | 'all'>('6m');
    
    // Fetch own data
    const { 
        transactions: ownTransactions, 
        loading: isLoadingOwnTransactions,
        refetch: refetchOwnTransactions,
        isLimitReached: isLimitReachedOwnTransactions
    } = useTransactions({ userId: user.$id ?? 'default-user' });
    const { accounts: ownAccounts, loading: loadingOwnAccounts, isLimitReached: isLimitReachedOwnAccounts } = useAccounts();
    
    // Fetch shared data (includes own + shared)
    const { 
        accounts: sharedAccounts, 
        loading: loadingSharedAccounts 
    } = useAccountsWithSharing({ enableRealtime: true });
    const { 
        transactions: sharedTransactions, 
        loading: loadingSharedTransactions,
        isLimitReached: isLimitReachedSharedTransactions
    } = useTransactionsWithSharing({ enableRealtime: true });
    
    // Use appropriate data based on toggle
    // When showSharedData is true, we merge own and shared data to ensure everything is visible
    const accounts = useMemo(() => {
        if (!showSharedData) return ownAccounts;
        const all = [...ownAccounts, ...sharedAccounts];
        const uniqueMap = new Map();
        all.forEach(acc => uniqueMap.set(acc.$id, acc));
        return Array.from(uniqueMap.values());
    }, [showSharedData, ownAccounts, sharedAccounts]);

    const apiTransactions = useMemo(() => {
        if (!showSharedData) return ownTransactions;
        const all = [...ownTransactions, ...sharedTransactions];
        const uniqueMap = new Map();
        all.forEach(tx => uniqueMap.set(tx.$id, tx));
        return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [showSharedData, ownTransactions, sharedTransactions]);

    const isLoadingTransactions = showSharedData ? (loadingSharedTransactions || isLoadingOwnTransactions) : isLoadingOwnTransactions;
    const loadingAccounts = showSharedData ? (loadingSharedAccounts || loadingOwnAccounts) : loadingOwnAccounts;
    const refetch = useMemo(() => 
        showSharedData ? () => {} : refetchOwnTransactions,
    [showSharedData, refetchOwnTransactions]);
    
    const { creditCards } = useAllCreditCards();
    
    // Get current month date range for credit card transactions
    const currentMonthStart = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }, []);
    
    const currentMonthEnd = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }, []);

    const startDateObj = useMemo(() => new Date(currentMonthStart), [currentMonthStart]);

    const { 
        transactions: creditCardTransactions, 
        loading: loadingCreditCardTransactions 
    } = useCreditCardTransactions({
        creditCardId: undefined,
        startDate: startDateObj,
        enableRealtime: true,
    });

    // Get open credit card bills for cash flow calculation
    const { bills: openBills, loading: loadingBills } = useCreditCardBills({
        status: 'open',
    });

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    }, [accounts]);
    
    const loadingBalance = loadingAccounts;

    // Projections State
    const [aggregatedProjections, setAggregatedProjections] = React.useState<{
        income: { currentMonth: number; nextMonth: number; monthAfter: number; history: any[] };
        expense: { currentMonth: number; nextMonth: number; monthAfter: number; history: any[] };
    }>({
        income: { currentMonth: 0, nextMonth: 0, monthAfter: 0, history: [] },
        expense: { currentMonth: 0, nextMonth: 0, monthAfter: 0, history: [] }
    });
    const [loadingProjections, setLoadingProjections] = React.useState(true);
    const [isProjectionModalOpen, setIsProjectionModalOpen] = React.useState(false);
    const [selectedProjectionType, setSelectedProjectionType] = React.useState<'income' | 'expense' | null>(null);

    useEffect(() => {
        const fetchProjections = async () => {
            setLoadingProjections(true);
            try {
                const result = await getCategoryProjectionsAction();
                if (result.success) {
                    const income = result.projections.filter(p => p.type === 'income');
                    const expense = result.projections.filter(p => p.type === 'expense');

                    const aggregate = (items: typeof result.projections) => {
                        const currentMonth = items.reduce((sum, item) => sum + item.currentMonth, 0);
                        const nextMonth = items.reduce((sum, item) => sum + item.projectionNextMonth, 0);
                        const monthAfter = items.reduce((sum, item) => sum + item.projectionMonthAfter, 0);
                        
                        // Aggregate history
                        const historyMap = new Map<string, number>();
                        items.forEach(item => {
                            item.history.forEach(h => {
                                historyMap.set(h.month, (historyMap.get(h.month) || 0) + h.amount);
                            });
                        });
                        const history = Array.from(historyMap.entries())
                            .map(([month, amount]) => ({ month, amount }))
                            .sort((a, b) => a.month.localeCompare(b.month));

                        return { currentMonth, nextMonth, monthAfter, history };
                    };

                    setAggregatedProjections({
                        income: aggregate(income),
                        expense: aggregate(expense)
                    });
                }
            } catch (error) {
                console.error("Failed to fetch projections", error);
            } finally {
                setLoadingProjections(false);
            }
        };

        fetchProjections();
    }, []);

    const handleProjectionClick = (type: 'income' | 'expense') => {
        setSelectedProjectionType(type);
        setIsProjectionModalOpen(true);
    };

    const selectedProjectionData = useMemo(() => {
        if (!selectedProjectionType) return null;
        const data = aggregatedProjections[selectedProjectionType];
        return {
            category: selectedProjectionType === 'income' ? 'Receitas Totais' : 'Despesas Totais',
            currentMonth: data.currentMonth,
            projectionNextMonth: data.nextMonth,
            projectionMonthAfter: data.monthAfter,
            history: data.history,
            reasoningNextMonth: 'Projeção consolidada de todas as categorias.',
            reasoningMonthAfter: 'Projeção consolidada de todas as categorias.',
            detectedPatterns: []
        };
    }, [selectedProjectionType, aggregatedProjections]);

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
                description: apiTx.description || (apiTx as any).merchant || 'Transaction',
                amount: apiTx.amount, // Amount is already signed based on direction
                date: apiTx.date,
                bankName: accountName,
                category: category?.name || apiTx.category || 'Uncategorized',
                type: apiTx.type,
                direction: apiTx.direction,
                icon: categoryIcon,
                notes: apiTx.description || '',
                account_id: apiTx.account_id,
                credit_card_id: apiTx.credit_card_id,
            };
        });
    }, [apiTransactions, accounts]);

    // Calculate credit card bills by month (including open bills)
    const creditCardBillsByMonth = useMemo(() => {
        const billsMap = new Map<string, number>();
        
        // Add transactions grouped by bill month
        creditCards.forEach(card => {
            const closingDay = card.closing_day || 10;
            
            creditCardTransactions
                .filter(tx => (tx as any).credit_card_id === card.$id)
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
        
        // Add open bills (faturas em aberto)
        openBills.forEach(bill => {
            const dueDate = new Date(bill.due_date);
            const billKey = getMonthKey(dueDate);
            const unpaidAmount = bill.total_amount - bill.paid_amount;
            
            if (unpaidAmount > 0) {
                billsMap.set(billKey, (billsMap.get(billKey) || 0) + unpaidAmount);
            }
        });
        
        return billsMap;
    }, [creditCardTransactions, creditCards, openBills]);

    const monthlyMetrics = useMemo(() => {
        const currentMonthKey = getCurrentMonthKey();
        const previousMonthKey = getPreviousMonthKey();

        // Use all transactions - they're already filtered by the toggle
        // When showSharedData is true, apiTransactions contains own + shared
        // When showSharedData is false, apiTransactions contains only own
        const relevantTransactions = apiTransactions;

        const transactionsByMonth = relevantTransactions.reduce((acc, tx) => {
            // Exclude transfer transactions from insights calculations
            if (tx.type === 'transfer') {
                return acc;
            }
            
            const txDate = new Date(tx.date);
            const monthKey = getMonthKey(txDate);
            
            if (!acc[monthKey]) {
                acc[monthKey] = { income: 0, expenses: 0 };
            }
            
            if (tx.type === 'income' || tx.type === 'salary') {
                acc[monthKey].income += Math.abs(tx.amount);
            } else {
                acc[monthKey].expenses += Math.abs(tx.amount);
            }
            
            return acc;
        }, {} as Record<string, { income: number; expenses: 0 }>);
        
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
    }, [apiTransactions, creditCardBillsByMonth, showSharedData]);

    const chartData = useMemo(() => {
        // Get all unique month keys from transactions
        const allMonthKeys = Array.from(
            new Set(
                apiTransactions
                    .filter(tx => tx.type !== 'transfer') // Exclude transfers
                    .map(tx => getMonthKey(new Date(tx.date)))
            )
        ).sort();
        
        // Get months to display based on selected period
        const monthsToDisplay = getMonthsForPeriod(chartPeriod, allMonthKeys);
        
        return monthsToDisplay.map((monthKey) => {
            const monthData = monthlyMetrics.transactionsByMonth[monthKey] || { income: 0, expenses: 0 };
            const creditCardBill = monthlyMetrics.creditCardBillsByMonth.get(monthKey) || 0;
            return {
                month: getMonthName(monthKey),
                income: monthData.income,
                expenses: monthData.expenses + creditCardBill,
            };
        });
    }, [monthlyMetrics, chartPeriod, apiTransactions]);

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
            <ProcessDueTransactions />
            <BillingLimitBanner isVisible={isLimitReachedOwnTransactions || isLimitReachedOwnAccounts || isLimitReachedSharedTransactions} />
            <header className="mb-8">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-4xl font-light text-on-surface">Olá, {user.name}!</h1>
                        <p className="text-base text-on-surface-variant mt-1">Bem-vindo ao seu painel financeiro.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Saldo Total</p>
                        <h2 className="text-3xl font-normal text-primary">{formattedBalance}</h2>
                    </div>
                </div>
                
                {/* Toggle for shared data */}
                <div className="flex items-center gap-3 p-3 bg-surface-variant/30 rounded-lg">
                    <span className="text-sm text-on-surface-variant">Visualização:</span>
                    <div className="flex gap-2">
                        <Button
                            variant={!showSharedData ? "primary" : "ghost"}
                            size="sm"
                            onClick={() => setShowSharedData(false)}
                            className="!h-8 !px-3 !text-sm"
                        >
                            Apenas Meus Dados
                        </Button>
                        <Button
                            variant={showSharedData ? "primary" : "ghost"}
                            size="sm"
                            onClick={() => setShowSharedData(true)}
                            className="!h-8 !px-3 !text-sm"
                        >
                            Conta Conjunta
                        </Button>
                    </div>
                    {showSharedData && (
                        <span className="text-xs text-on-surface-variant ml-2">
                            (Meus dados + dados compartilhados)
                        </span>
                    )}
                </div>
            </header>

            <main className="space-y-6">
                {/* Projections Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-medium text-on-surface">Projeções para o Próximo Mês</h3>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/projections')}
                            className="text-primary hover:text-primary-dark"
                        >
                            Ver projeções detalhadas
                        </Button>
                    </div>
                    
                    {loadingProjections ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-48 w-full rounded-2xl" />
                            <Skeleton className="h-48 w-full rounded-2xl" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Income Projection Card */}
                            <div 
                                onClick={() => handleProjectionClick('income')}
                                className="rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group bg-green-500/10 dark:bg-green-500/10 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl transition-colors bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                            <TrendingUpIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Receitas</h3>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Receita Atual ({new Date().toLocaleString('pt-BR', { month: 'short' })})
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {aggregatedProjections.income.currentMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                Projeção {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('pt-BR', { month: 'short' })}
                                            </p>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                {aggregatedProjections.income.nextMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                Projeção {new Date(new Date().setMonth(new Date().getMonth() + 2)).toLocaleString('pt-BR', { month: 'short' })}
                                            </p>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                {aggregatedProjections.income.monthAfter.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expense Projection Card */}
                            <div 
                                onClick={() => handleProjectionClick('expense')}
                                className="rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group bg-red-500/10 dark:bg-red-500/10 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl transition-colors bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                            <TrendingDownIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Despesas</h3>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Gasto Atual ({new Date().toLocaleString('pt-BR', { month: 'short' })})
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {aggregatedProjections.expense.currentMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                Projeção {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('pt-BR', { month: 'short' })}
                                            </p>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                {aggregatedProjections.expense.nextMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                Projeção {new Date(new Date().setMonth(new Date().getMonth() + 2)).toLocaleString('pt-BR', { month: 'short' })}
                                            </p>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                {aggregatedProjections.expense.monthAfter.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {aiInsights.length > 0 && (
                    <div>
                        <h3 className="text-xl font-medium text-on-surface mb-4">Insights de IA</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-medium text-on-surface">Fluxo de Caixa</h3>
                            <p className="text-sm text-on-surface-variant mt-1">
                                Despesas incluem transações e faturas de cartão em aberto
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-variant/30 rounded-lg p-1">
                            <Button
                                variant={chartPeriod === '3m' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setChartPeriod('3m')}
                                className="!h-8 !px-3 !text-sm"
                            >
                                3 meses
                            </Button>
                            <Button
                                variant={chartPeriod === '6m' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setChartPeriod('6m')}
                                className="!h-8 !px-3 !text-sm"
                            >
                                6 meses
                            </Button>
                            <Button
                                variant={chartPeriod === '12m' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setChartPeriod('12m')}
                                className="!h-8 !px-3 !text-sm"
                            >
                                12 meses
                            </Button>
                            <Button
                                variant={chartPeriod === 'all' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setChartPeriod('all')}
                                className="!h-8 !px-3 !text-sm"
                            >
                                Tudo
                            </Button>
                        </div>
                    </div>
                    <BarChart data={chartData} />
                </Card>
            </main>
        </>
    );
}
